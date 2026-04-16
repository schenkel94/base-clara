import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";
import { QUALITY_THRESHOLDS } from "@/features/data-quality/rules/config";
import { formatPercent, getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

export const numericAsTextRule: AnalysisRule = {
  id: "numeric-as-text",
  description: "Identifica colunas potencialmente numéricas armazenadas como texto.",
  evaluate: ({ columnProfiles }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      if (profile.nonNullCount < QUALITY_THRESHOLDS.numericAsTextMinNonNull) {
        continue;
      }

      const numericTextRatio = profile.numericTextCount / profile.nonNullCount;
      const hasTypedNumbers = profile.nonNullValues.some((value) => typeof value === "number");

      if (numericTextRatio < QUALITY_THRESHOLDS.numericAsTextRatio || hasTypedNumbers) {
        continue;
      }

      problems.push({
        code: "NUMERIC_VALUES_AS_TEXT",
        severity: "medium",
        title: "Coluna numérica armazenada como texto",
        description: `A coluna "${getColumnLabel(profile)}" possui ${formatPercent(numericTextRatio)} de valores numéricos em formato textual.`,
        recommendation:
          "Converta a coluna para tipo numérico antes de aplicar agregações, filtros e cálculos estatísticos.",
        affectedColumns: [profile.columnKey],
        metrics: {
          numericTextRatio: Number(numericTextRatio.toFixed(4)),
          numericTextCount: profile.numericTextCount,
        },
      });
    }

    return problems;
  },
};
