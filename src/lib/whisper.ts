import { pipeline, env } from '@xenova/transformers';

(env as Record<string, unknown>).allowLocalModels = false;
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = '/';
}

type Transcriber = Awaited<ReturnType<typeof pipeline>>;

let transcriber: Transcriber | null = null;

interface ProgressData {
  status: string;
  file: string;
  progress: number;
}

type ProgressCallback = (data: ProgressData) => void;

interface Chunk {
  text: string;
  timestamp: [number, number];
}

interface TranscriptionResult {
  text: string;
  chunks: Chunk[];
}

async function ensureModel(onProgress?: ProgressCallback): Promise<Transcriber> {
  if (transcriber) return transcriber;

  transcriber = (await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-medium',
    onProgress ? { progress_callback: onProgress } : undefined,
  )) as unknown as Transcriber;

  return transcriber;
}

async function decodeAudio(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const targetRate = 16000;

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

export async function transcribeAudio(
  arrayBuffer: ArrayBuffer,
  onProgress?: ProgressCallback,
): Promise<TranscriptionResult> {
  const model = await ensureModel(onProgress);
  const audioData = await decodeAudio(arrayBuffer);

  const result = await model(audioData, {
    language: 'es',
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
    progress_callback: onProgress,
  });

  return result as unknown as TranscriptionResult;
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
