import { useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { DataQualityAnalysisResult, ProblemSeverity } from "@/features/data-quality/types";
import { generateTechnicalChecklist } from "@/features/technical-checklist/utils/generateTechnicalChecklist";

type TechnicalChecklistSectionProps = {
  analysisResult: DataQualityAnalysisResult | null;
};

function getPriorityClass(priority: ProblemSeverity) {
  if (priority === "high") {
    return "border-rose-300/40 bg-rose-300/10 text-rose-200";
  }

  if (priority === "medium") {
    return "border-amber-300/40 bg-amber-300/10 text-amber-200";
  }

  return "border-sky-300/40 bg-sky-300/10 text-sky-200";
}

function getPriorityLabel(priority: ProblemSeverity) {
  if (priority === "high") {
    return "Alta";
  }

  if (priority === "medium") {
    return "Media";
  }

  return "Baixa";
}

export function TechnicalChecklistSection({ analysisResult }: TechnicalChecklistSectionProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const suggestion = useMemo(() => {
    if (!analysisResult) {
      return null;
    }

    return generateTechnicalChecklist({ analysis: analysisResult });
  }, [analysisResult]);

  const handleCopy = async () => {
    if (!suggestion) {
      return;
    }

    try {
      await navigator.clipboard.writeText(suggestion.text);
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
        title="Checklist tecnico"
        description="A checklist acionavel aparece quando houver diagnostico carregado."
      >
        <div className="rounded-2xl border border-dashed border-slate-500/60 bg-surface-900/60 p-6">
          <p className="font-medium text-slate-200">Checklist aguardando diagnostico</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Envie um arquivo para gerar itens tecnicos priorizados com base nos problemas
            detectados.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Checklist tecnico"
      description="Plano rapido de execucao para tratamento antes da analise final."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{suggestion.explanation}</p>

        {suggestion.items.length > 0 ? (
          <ul className="space-y-2">
            {suggestion.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-surface-600 bg-surface-900/70 p-3 transition duration-200 hover:border-surface-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${getPriorityClass(item.priority)}`}
                  >
                    {getPriorityLabel(item.priority)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.whyItMatters}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-300">
            Nenhum ponto tecnico critico foi detectado para esta amostra.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
            Checklist pronta para copiar
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            {copyState === "copied"
              ? "Checklist copiada"
              : copyState === "error"
                ? "Falha ao copiar"
                : "Copiar checklist"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
