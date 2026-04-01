import type { ReactNode } from "react";

type ResultMetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  tooltip?: string;
};

export function ResultMetricCard({
  label,
  value,
  helper,
  icon,
  tooltip,
}: ResultMetricCardProps) {
  return (
    <article className="group rounded-2xl border border-surface-600 bg-surface-900/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-surface-500">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.1em] text-slate-400">{label}</p>
        {icon ? <span className="text-slate-300 transition group-hover:text-slate-100">{icon}</span> : null}
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs text-slate-400">
          {helper}
          {tooltip ? (
            <span
              title={tooltip}
              className="ml-2 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-500 text-[10px] text-slate-300 transition hover:border-slate-300 hover:text-slate-100"
            >
              i
            </span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
