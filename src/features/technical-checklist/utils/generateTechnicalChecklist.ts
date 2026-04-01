import type { ProblemSeverity, QualityProblemCode } from "@/features/data-quality/types";
import type {
  ChecklistItem,
  TechnicalChecklistInput,
  TechnicalChecklistSuggestion,
} from "@/features/technical-checklist/types";

const SEVERITY_WEIGHT: Record<ProblemSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

type ChecklistRule = {
  id: string;
  title: string;
  whyItMatters: string;
  codes: QualityProblemCode[];
};

const CHECKLIST_RULES: ChecklistRule[] = [
  {
    id: "column-structure",
    title: "Revisar estrutura de colunas (nomes vazios, duplicados e unnamed)",
    whyItMatters:
      "Nomes ambíguos causam erro de mapeamento e confundem transformacoes em todas as camadas.",
    codes: ["EMPTY_COLUMN_NAME", "DUPLICATE_COLUMN_NAME", "UNNAMED_COLUMN"],
  },
  {
    id: "null-completeness",
    title: "Tratar colunas com nulos altos ou quase vazias",
    whyItMatters:
      "Ausencia de dados pode distorcer metricas e reduzir a confiabilidade de segmentacoes.",
    codes: ["HIGH_NULL_PERCENTAGE", "NEARLY_EMPTY_COLUMN"],
  },
  {
    id: "type-normalization",
    title: "Normalizar tipagem para numero/data/texto de forma explicita",
    whyItMatters:
      "Tipos inconsistentes quebram filtros, agregacoes e validacoes de qualidade.",
    codes: ["MIXED_DATA_TYPES", "NUMERIC_VALUES_AS_TEXT", "INCONSISTENT_DATE_VALUES"],
  },
  {
    id: "text-standardization",
    title: "Padronizar texto categórico (trim + caixa + espacos)",
    whyItMatters:
      "Sem padronizacao, a mesma categoria aparece em variantes e gera contagens fragmentadas.",
    codes: ["CATEGORICAL_FORMAT_VARIATION"],
  },
  {
    id: "dedupe-review",
    title: "Definir e aplicar regra de deduplicacao por chave de negocio",
    whyItMatters:
      "Duplicidades inflacionam totais e podem alterar conclusoes analiticas.",
    codes: ["DUPLICATE_ROWS"],
  },
  {
    id: "constant-columns",
    title: "Avaliar remocao de colunas constantes",
    whyItMatters:
      "Campos constantes ocupam espaco e quase nunca agregam sinal analitico relevante.",
    codes: ["CONSTANT_COLUMN"],
  },
];

function dedupe<T>(values: T[]) {
  return Array.from(new Set(values));
}

function getMaxSeverity(
  input: TechnicalChecklistInput,
  codes: QualityProblemCode[],
): ProblemSeverity | null {
  const severities = input.analysis.problems
    .filter((problem) => codes.includes(problem.code))
    .map((problem) => problem.severity);

  if (severities.length === 0) {
    return null;
  }

  return severities.sort((a, b) => SEVERITY_WEIGHT[b] - SEVERITY_WEIGHT[a])[0];
}

function buildChecklistText(items: ChecklistItem[]) {
  if (items.length === 0) {
    return [
      "Checklist tecnico",
      "",
      "[ ] Executar validacao final de completude, tipagem e duplicidade antes da analise.",
    ].join("\n");
  }

  return [
    "Checklist tecnico",
    "",
    ...items.map(
      (item) =>
        `[ ] ${item.title} (prioridade: ${item.priority})\n    Importancia: ${item.whyItMatters}`,
    ),
  ].join("\n");
}

export function generateTechnicalChecklist(
  input: TechnicalChecklistInput,
): TechnicalChecklistSuggestion {
  const items: ChecklistItem[] = [];

  for (const rule of CHECKLIST_RULES) {
    const severity = getMaxSeverity(input, rule.codes);
    if (!severity) {
      continue;
    }

    items.push({
      id: rule.id,
      title: rule.title,
      whyItMatters: rule.whyItMatters,
      priority: severity,
      relatedCodes: dedupe(rule.codes),
    });
  }

  const sortedItems = [...items].sort(
    (a, b) => SEVERITY_WEIGHT[b.priority] - SEVERITY_WEIGHT[a.priority],
  );

  const explanation =
    sortedItems.length > 0
      ? "Checklist acionavel priorizada pelos problemas detectados no diagnostico."
      : "Sem pendencias criticas abertas no diagnostico atual; checklist minima de validacao mantida.";

  return {
    explanation,
    items: sortedItems,
    text: buildChecklistText(sortedItems),
  };
}
