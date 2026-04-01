import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";
import { getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

export const constantColumnsRule: AnalysisRule = {
  id: "constant-columns",
  description: "Detecta colunas com valor único (constantes).",
  evaluate: ({ columnProfiles }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      const isConstant = profile.nonNullCount > 0 && profile.uniqueNonNullCount <= 1;
      if (!isConstant) {
        continue;
      }

      problems.push({
        code: "CONSTANT_COLUMN",
        severity: "low",
        title: "Coluna constante",
        description: `A coluna "${getColumnLabel(profile)}" tem apenas um valor não nulo distinto.`,
        recommendation:
          "Avalie se a coluna agrega valor analítico. Em muitos casos, pode ser removida.",
        affectedColumns: [profile.columnKey],
        metrics: {
          uniqueNonNullCount: profile.uniqueNonNullCount,
          nonNullCount: profile.nonNullCount,
        },
      });
    }

    return problems;
  },
};
