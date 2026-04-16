import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";
import { QUALITY_THRESHOLDS } from "@/features/data-quality/rules/config";
import { getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

export const categoricalVariationsRule: AnalysisRule = {
  id: "categorical-variations",
  description: "Detecta variações simples de capitalização e espaçamento em colunas categóricas.",
  evaluate: ({ columnProfiles }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      if (profile.nonNullCount < QUALITY_THRESHOLDS.categoricalVariantMinRows) {
        continue;
      }

      const variationGroupCount = profile.categoricalVariantGroups.length;
      if (variationGroupCount === 0) {
        continue;
      }

      const sampleVariants = profile.categoricalVariantGroups[0]?.variants.slice(0, 3).join(" | ");

      problems.push({
        code: "CATEGORICAL_FORMAT_VARIATION",
        severity: "low",
        title: "Variações de capitalização/espaçamento em categoria",
        description: `A coluna "${getColumnLabel(profile)}" possui ${variationGroupCount} grupo(s) de variação textual simples.`,
        recommendation:
          "Padronize categorias com trim, normalização de espaços e capitalização para evitar fragmentação de contagens.",
        affectedColumns: [profile.columnKey],
        metrics: {
          variationGroupCount,
          sampleVariants: sampleVariants ?? "",
        },
      });
    }

    return problems;
  },
};
