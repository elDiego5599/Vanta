export function transcribeAudio(
  arrayBuffer: ArrayBuffer,
  onProgress?: (data: { status: string; file: string; progress: number }) => void
): Promise<{ text: string; chunks: Array<{ text: string; timestamp: [number, number] }> }>;

export function formatTimestamp(seconds: number): string;

export function fileToArrayBuffer(file: File): Promise<ArrayBuffer>;
