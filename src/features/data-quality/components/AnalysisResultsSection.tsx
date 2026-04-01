import { useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ReadinessScorePanel } from "@/features/data-quality/components/ReadinessScorePanel";
import { ResultMetricCard } from "@/features/data-quality/components/ResultMetricCard";
import { SeverityBadge } from "@/features/data-quality/components/SeverityBadge";
import type { LoadedDataset } from "@/features/data-import/types";
import type {
  ColumnQualityMetrics,
  DataQualityAnalysisResult,
  QualityProblem,
} from "@/features/data-quality/types";
import {
  exportDiagnosticAsJson,
  exportDiagnosticAsMarkdown,
  printDiagnosticReport,
} from "@/features/exports/utils/reportExport";
import {
  calculateRiskIndex,
  countAffectedColumnsByCodes,
  getRiskLevelLabel,
  getTopProblems,
  mapProblemsByColumn,
} from "@/features/data-quality/utils/presentation";

type AnalysisResultsSectionProps = {
  dataset: LoadedDataset | null;
  result: DataQualityAnalysisResult | null;
};

type IndicatorTone = "high" | "medium" | "low";

type ColumnIndicator = {
  label: string;
  tone: IndicatorTone;
  tooltip: string;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function getSeverityMixWidth(partial: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.max(6, Math.round((partial / total) * 100))}%`;
}

function getIndicatorClass(tone: IndicatorTone) {
  if (tone === "high") {
    return "border-rose-300/40 bg-rose-300/10 text-rose-200";
  }

  if (tone === "medium") {
    return "border-amber-300/40 bg-amber-300/10 text-amber-200";
  }

  return "border-sky-300/40 bg-sky-300/10 text-sky-200";
}

function hasProblemCode(problems: QualityProblem[], code: QualityProblem["code"]) {
  return problems.some((problem) => problem.code === code);
}

function getColumnIndicators(
  columnMetric: ColumnQualityMetrics,
  columnProblems: QualityProblem[],
): ColumnIndicator[] {
  const indicators: ColumnIndicator[] = [];

  if (columnMetric.nullPercentage >= 0.3) {
    indicators.push({
      label: "Nulos",
      tone: columnMetric.nullPercentage >= 0.9 ? "high" : "medium",
      tooltip: "Percentual de valores ausentes acima do esperado.",
    });
  }

  if (columnMetric.hasMixedTypes) {
    indicators.push({
      label: "Tipos mistos",
      tone: "medium",
      tooltip: "A coluna mistura tipos e pode quebrar filtros e agregacoes.",
    });
  }

  if (hasProblemCode(columnProblems, "NUMERIC_VALUES_AS_TEXT")) {
    indicators.push({
      label: "Numero em texto",
      tone: "medium",
      tooltip: "Parte relevante dos numeros parece armazenada como texto.",
    });
  }

  if (hasProblemCode(columnProblems, "INCONSISTENT_DATE_VALUES")) {
    indicators.push({
      label: "Data suspeita",
      tone: "medium",
      tooltip: "Foram detectados formatos de data potencialmente inconsistentes.",
    });
  }

  if (columnMetric.isConstant) {
    indicators.push({
      label: "Constante",
      tone: "low",
      tooltip: "A coluna possui apenas um valor nao nulo distinto.",
    });
  }

  if (
    hasProblemCode(columnProblems, "EMPTY_COLUMN_NAME") ||
    hasProblemCode(columnProblems, "DUPLICATE_COLUMN_NAME") ||
    hasProblemCode(columnProblems, "UNNAMED_COLUMN")
  ) {
    indicators.push({
      label: "Nome estrutural",
      tone: "high",
      tooltip: "A coluna tem problema de cabecalho (vazio, duplicado ou generico).",
    });
  }

  return indicators;
}

export function AnalysisResultsSection({ dataset, result }: AnalysisResultsSectionProps) {
  const [exportFeedback, setExportFeedback] = useState<"idle" | "json" | "markdown" | "print" | "error">("idle");

  if (!result) {
    return (
      <SectionCard
        title="Resultados da qualidade"
        description="Assim que um arquivo for carregado, o painel mostra risco, prioridades e leitura por coluna."
      >
        <div className="rounded-2xl border border-dashed border-slate-500/60 bg-surface-900/65 p-6">
          <p className="font-medium text-slate-200">Painel aguardando dados</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Importe CSV, XLSX ou XLS para visualizar score, indicadores e orientacoes de tratamento.
          </p>
        </div>
      </SectionCard>
    );
  }

  const riskIndex = calculateRiskIndex(result.summary);
  const riskLevel = getRiskLevelLabel(riskIndex);
  const topProblems = getTopProblems(result.problems, 6);
  const problemsByColumn = mapProblemsByColumn(result.problems);
  const totalProblems = Math.max(result.summary.totalProblems, 1);

  const columnCountWithRelevantNulls = countAffectedColumnsByCodes(result, [
    "HIGH_NULL_PERCENTAGE",
    "NEARLY_EMPTY_COLUMN",
  ]);
  const columnCountWithTypeAmbiguity = countAffectedColumnsByCodes(result, [
    "MIXED_DATA_TYPES",
    "NUMERIC_VALUES_AS_TEXT",
  ]);
  const columnCountWithSuspiciousDates = countAffectedColumnsByCodes(result, [
    "INCONSISTENT_DATE_VALUES",
  ]);
  const constantColumnCount = countAffectedColumnsByCodes(result, ["CONSTANT_COLUMN"]);

  const canExport = Boolean(dataset);

  const withFeedback = (state: "json" | "markdown" | "print" | "error") => {
    setExportFeedback(state);
    window.setTimeout(() => setExportFeedback("idle"), 2200);
  };

  const handleExportJson = () => {
    if (!dataset) {
      return;
    }

    try {
      exportDiagnosticAsJson(dataset, result);
      withFeedback("json");
    } catch {
      withFeedback("error");
    }
  };

  const handleExportMarkdown = () => {
    if (!dataset) {
      return;
    }

    try {
      exportDiagnosticAsMarkdown(dataset, result);
      withFeedback("markdown");
    } catch {
      withFeedback("error");
    }
  };

  const handlePrint = () => {
    if (!dataset) {
      return;
    }

    const printed = printDiagnosticReport(dataset, result);
    withFeedback(printed ? "print" : "error");
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Painel de resultados"
        description="Leitura executiva da prontidao analitica da amostra enviada."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-600 bg-surface-900/65 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
              Exportacoes locais do diagnostico
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={!canExport}
                className="rounded-lg border border-surface-500 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-300 transition duration-200 hover:border-slate-400 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                disabled={!canExport}
                className="rounded-lg border border-surface-500 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-300 transition duration-200 hover:border-slate-400 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Exportar Markdown
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!canExport}
                className="rounded-lg border border-cyan-300/45 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 transition duration-200 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Imprimir relatorio
              </button>
            </div>
          </div>

          {exportFeedback !== "idle" ? (
            <p className="text-xs text-slate-300">
              {exportFeedback === "json" && "Arquivo JSON exportado localmente."}
              {exportFeedback === "markdown" && "Relatorio markdown exportado localmente."}
              {exportFeedback === "print" && "Janela de impressao aberta."}
              {exportFeedback === "error" && "Nao foi possivel concluir a exportacao."}
            </p>
          ) : null}

          <ReadinessScorePanel result={result} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResultMetricCard label="Linhas analisadas" value={result.summary.totalRows} />
            <ResultMetricCard label="Colunas analisadas" value={result.summary.totalColumns} />
            <ResultMetricCard
              label="Colunas com nulos relevantes"
              value={columnCountWithRelevantNulls}
              helper="Acima do limiar inicial de completude"
              tooltip="Considera colunas sinalizadas por nulos altos ou quase vazias."
            />
            <ResultMetricCard
              label="Duplicidades"
              value={result.summary.duplicateRowCount}
              helper="Linhas totalmente iguais"
              tooltip="Duplicatas completas aumentam risco de distorcao em contagens."
            />
            <ResultMetricCard
              label="Tipagem ambigua"
              value={columnCountWithTypeAmbiguity}
              helper="Mistura de tipos ou numero em texto"
              tooltip="Colunas que podem falhar em calculos ou agregacoes."
            />
            <ResultMetricCard
              label="Datas suspeitas"
              value={columnCountWithSuspiciousDates}
              helper="Formato potencialmente inconsistente"
              tooltip="Datas com padrao misto ou valores potencialmente invalidos."
            />
            <ResultMetricCard
              label="Colunas constantes"
              value={constantColumnCount}
              helper="Apenas um valor distinto"
              tooltip="Colunas constantes costumam adicionar pouco valor analitico."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Pontos essenciais a tratar"
        description="Principais alertas para reduzir risco antes da etapa de dashboard."
      >
        {topProblems.length > 0 ? (
          <ul className="space-y-3">
            {topProblems.map((problem) => (
              <li
                key={problem.id}
                className="rounded-xl border border-surface-600 bg-surface-900/75 p-4 transition duration-200 hover:border-surface-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-100">{problem.title}</p>
                  <SeverityBadge severity={problem.severity} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{problem.description}</p>
                <p className="mt-2 text-xs text-slate-400">Recomendacao: {problem.recommendation}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-300">
            Nenhum ponto essencial foi identificado pelas regras atuais.
          </p>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Prioridades recomendadas"
          description="Sequencia sugerida para tratamento da amostra."
        >
          {result.priorities.length > 0 ? (
            <ul className="space-y-3">
              {result.priorities.map((priority) => (
                <li
                  key={priority.level}
                  className="rounded-xl border border-surface-600 bg-surface-900/75 p-4 transition duration-200 hover:border-surface-500"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-100">{priority.title}</p>
                    <span className="text-xs uppercase tracking-[0.1em] text-slate-400">
                      {priority.relatedProblemIds.length} itens
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{priority.rationale}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">
              Sem prioridades abertas no conjunto atual de regras.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Risco para analise"
          description="Indicador sintetico de impacto potencial na confiabilidade da leitura."
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-600 bg-surface-900/75 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Indice de risco</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">{riskIndex}/100</p>
              <p className="mt-1 text-sm text-slate-300">{riskLevel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Distribuicao de criticidade</p>
              <div className="space-y-2 rounded-xl border border-surface-600 bg-surface-900/75 p-3">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-300">Critico</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-700">
                    <div
                      className="h-2 rounded-full bg-rose-300/80 transition-all duration-300"
                      style={{
                        width: getSeverityMixWidth(result.summary.issuesBySeverity.high, totalProblems),
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-300">Atencao</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-700">
                    <div
                      className="h-2 rounded-full bg-amber-300/80 transition-all duration-300"
                      style={{
                        width: getSeverityMixWidth(result.summary.issuesBySeverity.medium, totalProblems),
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-300">Baixo</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-700">
                    <div
                      className="h-2 rounded-full bg-sky-300/80 transition-all duration-300"
                      style={{
                        width: getSeverityMixWidth(result.summary.issuesBySeverity.low, totalProblems),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Resultados por coluna"
        description="Visao tabular para leitura rapida de qualidade e sinais de risco por campo."
      >
        <div className="overflow-x-auto rounded-xl border border-surface-600 bg-surface-900/55">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-surface-600 bg-surface-700/90 backdrop-blur">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
                  Coluna
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
                  Tipo inferido
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
                  Nulos
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
                  Indicadores
                </th>
              </tr>
            </thead>
            <tbody>
              {result.columnMetrics.map((columnMetric) => {
                const columnProblems = problemsByColumn.get(columnMetric.columnKey) ?? [];
                const indicators = getColumnIndicators(columnMetric, columnProblems);
                const displayColumnName =
                  columnMetric.sourceName.trim() === ""
                    ? columnMetric.columnKey
                    : columnMetric.sourceName;

                return (
                  <tr
                    key={columnMetric.columnKey}
                    className="border-b border-surface-700/70 transition duration-150 hover:bg-surface-700/35"
                  >
                    <td className="max-w-[260px] truncate whitespace-nowrap px-3 py-2 text-slate-100">
                      {displayColumnName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{columnMetric.inferredType}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                      {formatPercent(columnMetric.nullPercentage)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {indicators.length > 0 ? (
                          indicators.map((indicator) => (
                            <span
                              key={`${columnMetric.columnKey}-${indicator.label}`}
                              title={indicator.tooltip}
                              className={`inline-flex cursor-help items-center rounded-full border px-2 py-1 text-[11px] font-medium transition hover:-translate-y-px ${getIndicatorClass(indicator.tone)}`}
                            >
                              {indicator.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Sem alertas</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
