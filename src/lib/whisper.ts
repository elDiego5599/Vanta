import { pipeline, env } from '@xenova/transformers';

(env as Record<string, unknown>).allowLocalModels = false;
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/';
}

async function patchFetchForHuggingFace() {
  try {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    const originalFetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = (typeof input === 'string' ? input : input instanceof URL ? input.href : input.url) ?? '';
      if (url.includes('huggingface.co') || url.includes('hf.co')) {
        try {
          const response = await tauriFetch(url, init as Record<string, unknown>);
          return response as unknown as Response;
        } catch (e) {
          console.warn('Tauri HTTP fetch failed, falling back:', e);
        }
      }
      return originalFetch(input, init);
    };
  } catch {
    // Not running in Tauri, use browser fetch (CORS may block some requests)
  }
}

await patchFetchForHuggingFace();

type Transcriber = Awaited<ReturnType<typeof pipeline>>;

let transcriber: Transcriber | null = null;

interface ProgressData {
  status: string;
  file: string;
  progress: number;
}

type ProgressCallback = (data: ProgressData) => void;

export interface ChunkResult {
  text: string;
  timestamp: [number, number];
}

export async function loadModel(onProgress?: ProgressCallback): Promise<Transcriber> {
  if (transcriber) return transcriber;

  transcriber = (await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-small',
    onProgress ? { progress_callback: onProgress } : undefined,
  )) as unknown as Transcriber;

  return transcriber;
}

export async function decodeAudioToF32(arrayBuffer: ArrayBuffer, targetRate = 16000): Promise<Float32Array> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    if (sampleRate === targetRate) return rawData;

    const ratio = sampleRate / targetRate;
    const newLength = Math.round(rawData.length / ratio);
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;
      resampled[i] = (rawData[idx] ?? 0) * (1 - frac) + (rawData[idx + 1] ?? 0) * frac;
    }
    return resampled;
  } finally {
    if (audioCtx) await audioCtx.close();
  }
}

function extractChunks(raw: Record<string, unknown>, offsetSeconds: number): ChunkResult[] {
  if (Array.isArray(raw.chunks)) {
    return raw.chunks.map((c: Record<string, unknown>) => {
      const ts = (c.timestamp ?? c.timestamps ?? [0, 0]) as number[];
      return {
        text: typeof c.text === 'string' ? c.text.trim() : '',
        timestamp: [offsetSeconds + (ts[0] ?? 0), offsetSeconds + (ts[1] ?? 0)] as [number, number],
      };
    });
  }
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  if (text) {
    return [{ text, timestamp: [offsetSeconds, offsetSeconds + 30] }];
  }
  return [];
}

export interface TranscribeOptions {
  onChunk?: (chunk: ChunkResult) => void;
  chunkLengthSec?: number;
}

export async function transcribeProgressive(
  model: Transcriber,
  audio: Float32Array,
  options: TranscribeOptions = {},
): Promise<ChunkResult[]> {
  const { onChunk, chunkLengthSec = 30 } = options;
  const sampleRate = 16000;
  const chunkSize = sampleRate * chunkLengthSec;
  const allChunks: ChunkResult[] = [];

  for (let offset = 0; offset < audio.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, audio.length);
    const segment = audio.slice(offset, end);
    const offsetSeconds = offset / sampleRate;

    let raw: Record<string, unknown>;
    try {
      raw = (await model(segment, {
        language: 'es',
        task: 'transcribe',
        return_timestamps: true,
      })) as Record<string, unknown>;
    } catch (err) {
      console.error('Error en segmento', offsetSeconds, err);
      throw err;
    }

    const chunks = extractChunks(raw, offsetSeconds);
    for (const c of chunks) {
      allChunks.push(c);
      onChunk?.(c);
    }
  }

  return allChunks;
}

export async function transcribeAudio(
  arrayBuffer: ArrayBuffer,
  onProgress?: ProgressCallback,
): Promise<{ text: string; chunks: ChunkResult[] }> {
  const model = await loadModel(onProgress);
  const audio = await decodeAudioToF32(arrayBuffer);
  const chunks = await transcribeProgressive(model, audio);
  const text = chunks.map((c) => c.text).join(' ');
  return { text, chunks };
}

export function formatTimestamp(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
