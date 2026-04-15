import type { AnalysisRule, ColumnValueType, RuleProblem } from "@/features/data-quality/types";
import { QUALITY_THRESHOLDS } from "@/features/data-quality/rules/config";
import { getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

const RELEVANT_TYPES: ColumnValueType[] = ["number", "text", "boolean", "date"];

function getSignificantTypes(
  semanticTypeCounts: Record<ColumnValueType, number>,
  nonNullCount: number,
) {
  return RELEVANT_TYPES.filter((type) => {
    const count = semanticTypeCounts[type];
    if (count === 0) {
      return false;
    }

    return count / nonNullCount >= QUALITY_THRESHOLDS.mixedTypesMinShare;
  });
}

export const mixedDataTypesRule: AnalysisRule = {
  id: "mixed-data-types",
  description: "Detecta colunas com mistura aparente de tipos.",
  evaluate: ({ columnProfiles }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      if (profile.nonNullCount < QUALITY_THRESHOLDS.mixedTypesMinNonNull) {
        continue;
      }

      const significantTypes = getSignificantTypes(profile.semanticTypeCounts, profile.nonNullCount);
      if (significantTypes.length <= 1) {
        continue;
      }

      problems.push({
        code: "MIXED_DATA_TYPES",
        severity: "medium",
        title: "Mistura aparente de tipos na mesma coluna",
        description: `A coluna "${getColumnLabel(profile)}" apresenta múltiplos tipos relevantes: ${significantTypes.join(", ")}.`,
        recommendation:
          "Padronize o tipo da coluna (ex.: converter tudo para número, data ou texto consistente).",
        affectedColumns: [profile.columnKey],
        metrics: {
          nonNullCount: profile.nonNullCount,
          significantTypeCount: significantTypes.length,
        },
      });
    }

    return problems;
  },
};
