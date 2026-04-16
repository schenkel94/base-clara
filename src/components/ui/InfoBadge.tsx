import { cn } from "@/lib/cn";

type InfoBadgeProps = {
  children: string;
  className?: string;
};

export function InfoBadge({ children, className }: InfoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      {children}
    </span>
  );
}
