import { useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";
import { generatePandasNotebookSuggestion } from "@/features/notebook-python/utils/generatePandasNotebook";
import { loadUiPreferences, saveUiPreferences } from "@/features/persistence/utils/uiPreferencesStorage";
import { generatePowerQuerySuggestion } from "@/features/power-query/utils/generatePowerQueryScript";
import { generateSqlSuggestion } from "@/features/sql/utils/generateSqlScript";

type LanguageTabsSectionProps = {
  dataset: LoadedDataset | null;
  analysisResult: DataQualityAnalysisResult | null;
};

type LanguageTabId = "python" | "power-query" | "sql";

type LanguageTab = {
  id: LanguageTabId;
  label: string;
  subtitle: string;
  explanation: string;
  steps: Array<{ id: string; title: string; reason: string }>;
  code: string;
  copyLabel: string;
};

function getTabButtonClass(isActive: boolean) {
  if (isActive) {
    return "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_-8px_rgba(34,211,238,0.7)]";
  }

  return "border-surface-500 bg-surface-900/65 text-slate-300 hover:border-surface-400 hover:text-slate-100";
}

export function LanguageTabsSection({ dataset, analysisResult }: LanguageTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<LanguageTabId>(() => loadUiPreferences().preferredCodeLanguage);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const tabs = useMemo<LanguageTab[] | null>(() => {
    if (!dataset || !analysisResult) {
      return null;
    }

    const python = generatePandasNotebookSuggestion({
      dataset,
      analysis: analysisResult,
    });
    const powerQuery = generatePowerQuerySuggestion({
      dataset,
      analysis: analysisResult,
    });
    const sql = generateSqlSuggestion({
      dataset,
      analysis: analysisResult,
    });

    return [
      {
        id: "python",
        label: "Notebook Python",
        subtitle: "pandas",
        explanation: python.explanation,
        steps: python.steps,
        code: python.code,
        copyLabel: "Copiar codigo",
      },
      {
        id: "power-query",
        label: "Power Query",
        subtitle: "linguagem M",
        explanation: powerQuery.explanation,
        steps: powerQuery.steps,
        code: powerQuery.script,
        copyLabel: "Copiar script",
      },
      {
        id: "sql",
        label: "SQL",
        subtitle: "dialeto generico",
        explanation: sql.explanation,
        steps: sql.steps,
        code: sql.script,
        copyLabel: "Copiar SQL",
      },
    ];
  }, [dataset, analysisResult]);

  const selectedTab = tabs?.find((tab) => tab.id === activeTab) ?? tabs?.[0] ?? null;

  const handleCopy = async () => {
    if (!selectedTab) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedTab.code);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  if (!tabs || !selectedTab) {
    return (
      <SectionCard
        title="Blocos de codigo sugeridos"
        description="As sugestoes de linguagens aparecem apos o diagnostico."
      >
        <div className="rounded-2xl border border-dashed border-slate-500/60 bg-surface-900/60 p-6">
          <p className="font-medium text-slate-200">Nenhuma linguagem disponivel ainda</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Carregue um arquivo para desbloquear os exemplos de Notebook Python, Power Query e SQL.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Blocos de codigo sugeridos"
      description="Escolha a linguagem de saida e copie o roteiro de tratamento recomendado."
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Linguagens de codigo">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                saveUiPreferences({ preferredCodeLanguage: tab.id });
                setCopyState("idle");
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`language-panel-${tab.id}`}
              className={`rounded-xl border px-3 py-2 text-left transition duration-200 ${getTabButtonClass(activeTab === tab.id)}`}
            >
              <p className="text-sm font-semibold">{tab.label}</p>
              <p className="mt-0.5 text-xs opacity-80">{tab.subtitle}</p>
            </button>
          ))}
        </div>

        <div
          id={`language-panel-${selectedTab.id}`}
          role="tabpanel"
          className="rounded-xl border border-surface-600 bg-surface-900/70 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">{selectedTab.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{selectedTab.explanation}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 transition duration-200 hover:bg-cyan-400/20"
            >
              {copyState === "copied"
                ? "Copiado"
                : copyState === "error"
                  ? "Falha ao copiar"
                  : selectedTab.copyLabel}
            </button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {selectedTab.steps.slice(0, 6).map((step) => (
              <article
                key={`${selectedTab.id}-${step.id}`}
                className="rounded-xl border border-surface-600 bg-surface-800/75 p-3"
              >
                <p className="text-sm font-medium text-slate-100">{step.title}</p>
                <p className="mt-1 text-xs text-slate-400">{step.reason}</p>
              </article>
            ))}
          </div>
        </div>

        <pre className="max-h-[560px] overflow-auto rounded-2xl border border-surface-600 bg-[#070b11] p-4 text-xs leading-relaxed text-slate-200">
          <code className="font-mono">{selectedTab.code}</code>
        </pre>
      </div>
    </SectionCard>
  );
}
