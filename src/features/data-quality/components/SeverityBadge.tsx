import type { ProblemSeverity } from "@/features/data-quality/types";
import { cn } from "@/lib/cn";

const labelBySeverity: Record<ProblemSeverity, string> = {
  high: "Critico",
  medium: "Atencao",
  low: "Baixo",
};

const classBySeverity: Record<ProblemSeverity, string> = {
  high: "border-rose-300/40 bg-rose-300/10 text-rose-200",
  medium: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  low: "border-sky-300/40 bg-sky-300/10 text-sky-200",
};

type SeverityBadgeProps = {
  severity: ProblemSeverity;
  className?: string;
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        classBySeverity[severity],
        className,
      )}
    >
      {labelBySeverity[severity]}
    </span>
  );
}
