import { useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";
import { generatePowerQuerySuggestion } from "@/features/power-query/utils/generatePowerQueryScript";

type PowerQuerySectionProps = {
  dataset: LoadedDataset | null;
  analysisResult: DataQualityAnalysisResult | null;
};

export function PowerQuerySection({ dataset, analysisResult }: PowerQuerySectionProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const suggestion = useMemo(() => {
    if (!dataset || !analysisResult) {
      return null;
    }

    return generatePowerQuerySuggestion({
      dataset,
      analysis: analysisResult,
    });
  }, [dataset, analysisResult]);

  const handleCopy = async () => {
    if (!suggestion) {
      return;
    }

    try {
      await navigator.clipboard.writeText(suggestion.script);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  if (!suggestion) {
    return (
      <SectionCard
        title="Power Query"
        description="Script M de exemplo sera sugerido com base no seu diagnostico."
      >
        <div className="rounded-2xl border border-dashed border-slate-500/60 bg-surface-900/60 p-6">
          <p className="font-medium text-slate-200">Sem sugestao ainda</p>
          <p className="mt-2 text-sm text-slate-400">
            Carregue um arquivo para gerar um script Power Query contextualizado com os
            problemas detectados.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Power Query"
      description="Script M comentado e sugerido a partir das caracteristicas do seu arquivo."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{suggestion.explanation}</p>

        <div className="grid gap-2 md:grid-cols-2">
          {suggestion.steps.map((step) => (
            <article
              key={step.id}
              className="rounded-xl border border-surface-600 bg-surface-900/70 p-3"
            >
              <p className="text-sm font-semibold text-slate-100">{step.title}</p>
              <p className="mt-1 text-xs text-slate-400">{step.reason}</p>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
            Script M pronto para copiar
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            {copyState === "copied"
              ? "Copiado"
              : copyState === "error"
                ? "Falha ao copiar"
                : "Copiar script"}
          </button>
        </div>

        <pre className="max-h-[520px] overflow-auto rounded-2xl border border-surface-600 bg-[#070b11] p-4 text-xs leading-relaxed text-slate-200">
          <code>{suggestion.script}</code>
        </pre>
      </div>
    </SectionCard>
  );
}
