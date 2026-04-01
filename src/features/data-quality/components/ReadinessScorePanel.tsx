import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import { getReadinessBand } from "@/features/data-quality/utils/presentation";
import { cn } from "@/lib/cn";

type ReadinessScorePanelProps = {
  result: DataQualityAnalysisResult;
};

export function ReadinessScorePanel({ result }: ReadinessScorePanelProps) {
  const score = result.summary.treatmentNeedScore;
  const band = getReadinessBand(score);
  const angle = Math.round((score / 100) * 360);

  return (
    <div className="rounded-2xl border border-surface-600 bg-gradient-to-b from-surface-700/80 to-surface-900/75 p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Prontidao analitica</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(rgba(34,211,238,0.9) ${angle}deg, rgba(51,65,85,0.7) ${angle}deg)`,
          }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-900 text-xl font-bold text-slate-100">
            {score}
          </div>
        </div>

        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]",
              band.toneClass,
            )}
          >
            {band.title}
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-slate-300">{band.description}</p>
        </div>
      </div>
    </div>
  );
}
