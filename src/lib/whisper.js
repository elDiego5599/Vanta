import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let transcriber = null;

async function ensureModel(onProgress) {
  if (transcriber) return transcriber;

  transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-medium',
    {
      progress_callback: onProgress,
    },
  );

  return transcriber;
}

async function decodeAudio(arrayBuffer) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
      resampled[i] = rawData[idx] * (1 - frac) + (rawData[idx + 1] || 0) * frac;
    }
    return resampled;
  } finally {
    await audioCtx.close();
  }
}

export async function transcribeAudio(arrayBuffer, onProgress) {
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

  return result;
}

export function formatTimestamp(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export async function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
