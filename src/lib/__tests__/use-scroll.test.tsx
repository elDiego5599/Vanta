import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScroll } from '../use-scroll';

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useScroll', () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  it('returns scrolled=false when scrollY is below threshold', () => {
    const { result } = renderHook(() => useScroll());
    expect(result.current.scrolled).toBe(false);
  });

  it('returns scrolled=true when scrollY exceeds threshold', () => {
    const { result } = renderHook(() => useScroll());
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(true);
  });

  it('returns scrolled=false when scrollY returns below threshold', () => {
    const { result } = renderHook(() => useScroll());
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(true);
    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(false);
  });

  it('respects custom threshold', () => {
    const { result } = renderHook(() => useScroll({ threshold: 200 }));
    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(false);
    act(() => {
      window.scrollY = 250;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.scrolled).toBe(true);
  });
});
