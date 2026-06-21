import { cn } from '../../lib/utils';

interface SkeletonSectionProps {
  className?: string;
}

export function SkeletonSection({ className }: SkeletonSectionProps) {
  return (
    <div className={cn('relative overflow-hidden bg-[var(--page-bg)]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="w-3/4 h-4 rounded-full bg-white/[0.04]" />
        <div className="w-1/2 h-4 rounded-full bg-white/[0.04]" />
        <div className="w-2/3 h-4 rounded-full bg-white/[0.04] mt-4" />
      </div>
    </div>
  );
}
