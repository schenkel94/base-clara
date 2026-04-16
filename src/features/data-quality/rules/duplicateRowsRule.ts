import type { AnalysisRule } from "@/features/data-quality/types";

export const duplicateRowsRule: AnalysisRule = {
  id: "duplicate-rows",
  description: "Identifica linhas totalmente duplicadas.",
  evaluate: ({ duplicateRowCount }) => {
    if (duplicateRowCount <= 0) {
      return [];
    }

    return [
      {
        code: "DUPLICATE_ROWS",
        severity: duplicateRowCount >= 10 ? "high" : "medium",
        title: "Linhas totalmente duplicadas",
        description: `Foram detectadas ${duplicateRowCount} linha(s) duplicada(s) considerando todas as colunas.`,
        recommendation:
          "Revise a deduplicação da amostra para evitar contagens infladas e distorções em métricas.",
        affectedColumns: [],
        affectedRowsCount: duplicateRowCount,
        metrics: {
          duplicateRowCount,
        },
      },
    ];
  },
};
