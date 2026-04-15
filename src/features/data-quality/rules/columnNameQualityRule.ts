import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";

const UNNAMED_PATTERNS = [
  /^unnamed(?:\s*[:_-]?\s*\d+)?$/i,
  /^sem[\s_-]?nome(?:\s*[:_-]?\s*\d+)?$/i,
  /^coluna[\s_-]?\d+$/i,
  /^column[\s_-]?\d+$/i,
];

function isUnnamedEquivalent(value: string) {
  const normalized = value.trim();
  return UNNAMED_PATTERNS.some((pattern) => pattern.test(normalized));
}

function normalizeForDuplicateCheck(value: string) {
  return value.trim().toLowerCase();
}

export const columnNameQualityRule: AnalysisRule = {
  id: "column-name-quality",
  description: "Valida nomes vazios, duplicados e equivalentes a Unnamed.",
  evaluate: ({ dataset }) => {
    const problems: RuleProblem[] = [];
    const emptyColumns = dataset.columnDefinitions.filter(
      (definition) => definition.sourceName.trim() === "",
    );

    if (emptyColumns.length > 0) {
      problems.push({
        code: "EMPTY_COLUMN_NAME",
        severity: "high",
        title: "Nomes de colunas vazios",
        description: `Foram encontradas ${emptyColumns.length} coluna(s) sem nome no cabeçalho.`,
        recommendation:
          "Renomeie os campos vazios para nomes semânticos antes da análise para evitar ambiguidades.",
        affectedColumns: emptyColumns.map((column) => column.key),
        metrics: {
          emptyColumnNameCount: emptyColumns.length,
        },
      });
    }

    const duplicateMap = new Map<string, string[]>();
    for (const definition of dataset.columnDefinitions) {
      const normalized = normalizeForDuplicateCheck(definition.sourceName);
      if (normalized === "") {
        continue;
      }

      const existing = duplicateMap.get(normalized) ?? [];
      existing.push(definition.key);
      duplicateMap.set(normalized, existing);
    }

    const duplicateColumns = Array.from(duplicateMap.values()).filter((keys) => keys.length > 1);
    if (duplicateColumns.length > 0) {
      problems.push({
        code: "DUPLICATE_COLUMN_NAME",
        severity: "high",
        title: "Nomes de colunas duplicados",
        description:
          "Há colunas com o mesmo nome de origem, o que pode causar conflitos de interpretação.",
        recommendation:
          "Padronize os nomes de colunas para que cada atributo tenha identificação única.",
        affectedColumns: duplicateColumns.flat(),
        metrics: {
          duplicateNameGroupCount: duplicateColumns.length,
        },
      });
    }

    const unnamedColumns = dataset.columnDefinitions.filter((definition) =>
      isUnnamedEquivalent(definition.sourceName),
    );
    if (unnamedColumns.length > 0) {
      problems.push({
        code: "UNNAMED_COLUMN",
        severity: "medium",
        title: "Colunas Unnamed ou equivalentes",
        description: `Foram detectadas ${unnamedColumns.length} coluna(s) com nomes genéricos (ex.: "Unnamed").`,
        recommendation:
          "Revise o cabeçalho da fonte e substitua nomes genéricos por nomes descritivos.",
        affectedColumns: unnamedColumns.map((column) => column.key),
        metrics: {
          unnamedColumnCount: unnamedColumns.length,
        },
      });
    }

    return problems;
  },
};
