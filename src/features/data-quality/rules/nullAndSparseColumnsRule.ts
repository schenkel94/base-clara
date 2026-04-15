import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";
import { QUALITY_THRESHOLDS } from "@/features/data-quality/rules/config";
import { formatPercent, getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

export const nullAndSparseColumnsRule: AnalysisRule = {
  id: "null-and-sparse-columns",
  description: "Avalia percentual de nulos e colunas quase vazias.",
  evaluate: ({ columnProfiles, dataset }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      const nullPercentage = dataset.rowCount === 0 ? 0 : profile.nullCount / dataset.rowCount;
      const columnLabel = getColumnLabel(profile);

      if (nullPercentage >= QUALITY_THRESHOLDS.highNullPercentage) {
        problems.push({
          code: "HIGH_NULL_PERCENTAGE",
          severity: nullPercentage >= QUALITY_THRESHOLDS.nearlyEmptyColumn ? "high" : "medium",
          title: "Coluna com alto percentual de nulos",
          description: `A coluna "${columnLabel}" possui ${formatPercent(nullPercentage)} de valores nulos.`,
          recommendation:
            "Avalie preenchimento, remoção, imputação ou revisão da origem para reduzir perda de informação.",
          affectedColumns: [profile.columnKey],
          metrics: {
            nullPercentage: Number(nullPercentage.toFixed(4)),
            nullCount: profile.nullCount,
          },
        });
      }

      if (nullPercentage >= QUALITY_THRESHOLDS.nearlyEmptyColumn) {
        problems.push({
          code: "NEARLY_EMPTY_COLUMN",
          severity: "high",
          title: "Coluna quase vazia",
          description: `A coluna "${columnLabel}" está quase vazia (${formatPercent(nullPercentage)} de nulos).`,
          recommendation:
            "Confirme se a coluna é necessária para análise. Caso não seja, considere removê-la do dataset.",
          affectedColumns: [profile.columnKey],
          metrics: {
            nullPercentage: Number(nullPercentage.toFixed(4)),
            nullCount: profile.nullCount,
          },
        });
      }
    }

    return problems;
  },
};
