import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatTimestamp } from '../whisper';

describe('formatTimestamp', () => {
  it('formats zero seconds', () => {
    expect(formatTimestamp(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(formatTimestamp(45)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimestamp(125)).toBe('00:02:05');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatTimestamp(3661)).toBe('01:01:01');
  });

  it('formats large values', () => {
    expect(formatTimestamp(7384)).toBe('02:03:04');
  });

  it('returns fallback for null', () => {
    expect(formatTimestamp(null as unknown as number)).toBe('00:00:00');
  });

  it('returns fallback for NaN', () => {
    expect(formatTimestamp(NaN)).toBe('00:00:00');
  });

  it('returns fallback for undefined', () => {
    expect(formatTimestamp(undefined as unknown as number)).toBe('00:00:00');
  });
});

describe('fileToArrayBuffer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with ArrayBuffer for a valid file', async () => {
    const content = 'test audio content';
    const blob = new Blob([content], { type: 'audio/wav' });
    const file = new File([blob], 'test.wav', { type: 'audio/wav' });

    const result = await import('../whisper').then(m => m.fileToArrayBuffer(file));
    expect(result).toBeInstanceOf(ArrayBuffer);
    const decoder = new TextDecoder();
    expect(decoder.decode(result as ArrayBuffer)).toBe(content);
  });

  it('rejects on FileReader error', async () => {
    const { fileToArrayBuffer } = await import('../whisper');
    const badFile = {
      size: 10,
      type: 'audio/wav',
      name: 'bad.wav',
      arrayBuffer: () => Promise.reject(new Error('fail')),
    } as unknown as File;

    await expect(fileToArrayBuffer(badFile)).rejects.toThrow();
  });
});
