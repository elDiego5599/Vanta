import { useEffect, useRef, forwardRef, memo, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';

export interface WaveSurferHandle {
  playPause: () => void;
  seekTo: (time: number) => void;
  play: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface WaveSurferWaveformProps {
  url: string | null;
  onReady?: (duration: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

const WaveSurferWaveform = memo(forwardRef<WaveSurferHandle, WaveSurferWaveformProps>(
  function WaveSurferWaveform({ url, onReady, onTimeUpdate, onPlayStateChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
      if (!containerRef.current || !url) return;

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#1a1e2e',
        progressColor: '#3b82f6',
        barWidth: 3,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
        height: 56,
        normalize: true,
      });

      ws.load(url);

      ws.on('ready', () => {
        onReady?.(ws.getDuration());
      });

      ws.on('timeupdate', (currentTime: number) => {
        onTimeUpdate?.(currentTime);
      });

      ws.on('play', () => {
        onPlayStateChange?.(true);
      });

      ws.on('pause', () => {
        onPlayStateChange?.(false);
      });

      ws.on('finish', () => {
        onPlayStateChange?.(false);
        onTimeUpdate?.(ws.getDuration());
      });

      wsRef.current = ws;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            // Force WaveSurfer to recalculate layout if it was initially hidden
            // In v7 this is mostly handled, but setting height or options can trigger it
            if (wsRef.current) {
              const currentWs = wsRef.current;
              // A trick to force redraw in some versions if it failed initially
              const w = currentWs.getWrapper();
              if (w && w.offsetWidth > 0 && !w.querySelector('canvas')?.width) {
                 // Try to reload or redraw if needed, but normally v7 handles it.
              }
            }
          }
        }
      });
      
      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        ws.pause();
        ws.destroy();
        wsRef.current = null;
      };
    }, [url, onReady, onTimeUpdate, onPlayStateChange]);

    useImperativeHandle(ref, () => ({
      playPause() {
        wsRef.current?.playPause();
      },
      seekTo(time: number) {
        const ws = wsRef.current;
        if (!ws) return;
        const duration = ws.getDuration();
        if (duration > 0) {
          ws.seekTo(time / duration);
        }
      },
      play() {
        wsRef.current?.play();
      },
      getCurrentTime() {
        return wsRef.current?.getCurrentTime() ?? 0;
      },
      getDuration() {
        return wsRef.current?.getDuration() ?? 0;
      },
    }));

    return (
      <div ref={containerRef} className="w-full min-h-[56px]" />
    );
  }
));

export default WaveSurferWaveform;
