import type { ProblemSeverity, QualityProblemCode } from "@/features/data-quality/types";
import type { SqlGenerationInput, SqlStep, SqlSuggestion } from "@/features/sql/types";

const PROBLEM_REASON_LABEL: Record<QualityProblemCode, string> = {
  HIGH_NULL_PERCENTAGE: "nulos relevantes",
  NEARLY_EMPTY_COLUMN: "colunas quase vazias",
  DUPLICATE_ROWS: "linhas duplicadas",
  EMPTY_COLUMN_NAME: "nomes de coluna vazios",
  DUPLICATE_COLUMN_NAME: "nomes de coluna duplicados",
  UNNAMED_COLUMN: "colunas genericas (unnamed)",
  MIXED_DATA_TYPES: "mistura de tipos",
  NUMERIC_VALUES_AS_TEXT: "numeros como texto",
  INCONSISTENT_DATE_VALUES: "datas inconsistentes",
  CATEGORICAL_FORMAT_VARIATION: "variacao de texto em categorias",
  CONSTANT_COLUMN: "colunas constantes",
};

const SEVERITY_WEIGHT: Record<ProblemSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function dedupe<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)) as T[];
}

function toSqlIdentifier(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  if (normalized === "") {
    return "coluna_sem_nome";
  }

  if (/^[0-9]/.test(normalized)) {
    return `col_${normalized}`;
  }

  return normalized;
}

function getDetectedCodes(input: SqlGenerationInput) {
  return dedupe(input.analysis.problems.map((problem) => problem.code));
}

function getColumnsByCodes(input: SqlGenerationInput, codes: QualityProblemCode[]) {
  const columns = input.analysis.problems
    .filter((problem) => codes.includes(problem.code))
    .flatMap((problem) => problem.affectedColumns);

  return dedupe(columns.map((column) => toSqlIdentifier(column)));
}

function buildExplanation(problemCodes: QualityProblemCode[]) {
  if (problemCodes.length === 0) {
    return "O SQL segue um fluxo base de preparacao com limpeza, tipagem e validacao de registros.";
  }

  const reasons = problemCodes
    .map((code) => PROBLEM_REASON_LABEL[code])
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4);

  return `O SQL foi montado para tratar ${reasons.join(", ")} detectados no seu arquivo.`;
}

function buildSteps(problemCodes: QualityProblemCode[]): SqlStep[] {
  const steps: SqlStep[] = [
    {
      id: "read-base",
      title: "Leitura base",
      reason: "Parte de uma tabela bruta unica para iniciar a preparacao.",
    },
    {
      id: "text-cleaning",
      title: "Trim e padronizacao de texto",
      reason: "Aplica trim e normalizacao de caixa em colunas candidatas.",
    },
    {
      id: "type-casting",
      title: "Conversao de tipos",
      reason: "Converte numero/data para formato consistente via CAST.",
    },
    {
      id: "null-handling",
      title: "Tratamento simples de nulos",
      reason: "Usa COALESCE e NULLIF para reduzir falhas em agregacoes.",
    },
  ];

  if (problemCodes.includes("DUPLICATE_ROWS")) {
    steps.push({
      id: "dedup-concept",
      title: "Deduplicacao conceitual",
      reason: "Mostra um padrao com ROW_NUMBER para manter um registro por chave.",
    });
  }

  steps.push({
    id: "invalid-filter",
    title: "Filtragem de registros invalidos",
    reason: "Remove linhas totalmente vazias nas colunas de validacao principais.",
  });

  return steps;
}

function getUppercaseColumns(textColumns: string[]) {
  return textColumns.filter((column) => /(uf|sigla|codigo|cod|id)$/.test(column));
}

function getLowercaseColumns(textColumns: string[]) {
  const upper = new Set(getUppercaseColumns(textColumns));
  return textColumns.filter((column) => !upper.has(column));
}

function getDedupPartitionColumns(input: SqlGenerationInput) {
  return input.analysis.columnMetrics
    .filter((metric) => metric.nullPercentage <= 0.2 && !metric.isConstant)
    .sort((a, b) => a.nullPercentage - b.nullPercentage)
    .slice(0, 4)
    .map((metric) => toSqlIdentifier(metric.columnKey));
}

function getChecklistValidationColumns(
  nullColumns: string[],
  numericColumns: string[],
  dateColumns: string[],
  fallbackColumns: string[],
) {
  const combined = dedupe([...nullColumns, ...numericColumns, ...dateColumns]).slice(0, 6);
  if (combined.length > 0) {
    return combined;
  }

  return fallbackColumns.slice(0, 4);
}

function findMaxSeverity(
  input: SqlGenerationInput,
  code: QualityProblemCode,
): ProblemSeverity | null {
  const severities = input.analysis.problems
    .filter((problem) => problem.code === code)
    .map((problem) => problem.severity);

  if (severities.length === 0) {
    return null;
  }

  return severities.sort((a, b) => SEVERITY_WEIGHT[b] - SEVERITY_WEIGHT[a])[0];
}

function getDateCastExpression(column: string, severity: ProblemSeverity | null) {
  if (severity === "high" || severity === "medium") {
    return `CAST(NULLIF(TRIM(${column}), '') AS DATE) AS ${column}`;
  }

  return `CAST(${column} AS DATE) AS ${column}`;
}

export function generateSqlSuggestion(input: SqlGenerationInput): SqlSuggestion {
  const detectedProblemCodes = getDetectedCodes(input);
  const fallbackColumns = input.dataset.columns.map((column) => toSqlIdentifier(column));

  const nullColumns = getColumnsByCodes(input, ["HIGH_NULL_PERCENTAGE", "NEARLY_EMPTY_COLUMN"]);
  const numericColumns = getColumnsByCodes(input, ["NUMERIC_VALUES_AS_TEXT", "MIXED_DATA_TYPES"]);
  const dateColumns = getColumnsByCodes(input, ["INCONSISTENT_DATE_VALUES"]);
  const textColumns = getColumnsByCodes(input, ["CATEGORICAL_FORMAT_VARIATION"]);

  const lowerTextColumns = getLowercaseColumns(textColumns);
  const upperTextColumns = getUppercaseColumns(textColumns);
  const dedupColumns = getDedupPartitionColumns(input);
  const validationColumns = getChecklistValidationColumns(
    nullColumns,
    numericColumns,
    dateColumns,
    fallbackColumns,
  );
  const duplicateDetected = detectedProblemCodes.includes("DUPLICATE_ROWS");

  const textSelectLines = fallbackColumns.map((column) => {
    if (upperTextColumns.includes(column)) {
      return `        UPPER(TRIM(${column})) AS ${column}`;
    }

    if (lowerTextColumns.includes(column)) {
      return `        LOWER(TRIM(${column})) AS ${column}`;
    }

    if (textColumns.includes(column)) {
      return `        TRIM(${column}) AS ${column}`;
    }

    return `        ${column}`;
  });

  const typedSelectLines = fallbackColumns.map((column) => {
    if (numericColumns.includes(column)) {
      return `        CAST(NULLIF(${column}, '') AS DECIMAL(18, 4)) AS ${column}`;
    }

    if (dateColumns.includes(column)) {
      return `        ${getDateCastExpression(
        column,
        findMaxSeverity(input, "INCONSISTENT_DATE_VALUES"),
      )}`;
    }

    return `        ${column}`;
  });

  const nullSelectLines = fallbackColumns.map((column) => {
    if (numericColumns.includes(column)) {
      return `        COALESCE(${column}, 0) AS ${column}`;
    }

    if (textColumns.includes(column) || nullColumns.includes(column)) {
      return `        COALESCE(NULLIF(${column}, ''), 'nao_informado') AS ${column}`;
    }

    return `        ${column}`;
  });

  const validationCondition =
    validationColumns.length > 0
      ? validationColumns
          .map((column) => `(${column} IS NOT NULL)`)
          .join("\n           OR ")
      : "1 = 1";

  const dedupPartitionClause =
    dedupColumns.length > 0 ? dedupColumns.join(", ") : fallbackColumns.slice(0, 1).join(", ");

  const dedupBlock = duplicateDetected
    ? `,
deduped AS (
    -- Ajuste a chave de particionamento para refletir a chave natural do seu dominio.
    SELECT *
    FROM (
        SELECT
            nulls_handled.*,
            ROW_NUMBER() OVER (
                PARTITION BY ${dedupPartitionClause}
                ORDER BY ${dedupPartitionClause}
            ) AS rn
        FROM nulls_handled
    ) ranked
    WHERE rn = 1
)`
    : `,
deduped AS (
    -- Nao foram detectadas duplicidades relevantes na amostra.
    SELECT *
    FROM nulls_handled
)`;

  const script = `-- SQL generico de preparacao de dados
-- Ajuste nomes de tabela/colunas conforme seu banco.
WITH source_data AS (
    SELECT *
    FROM raw_source_table
),
text_normalized AS (
    -- Trim + padronizacao de caixa em colunas textuais candidatas
    SELECT
${textSelectLines.join(",\n")}
    FROM source_data
),
typed_data AS (
    -- Conversao de tipos numericos e datas
    SELECT
${typedSelectLines.join(",\n")}
    FROM text_normalized
),
nulls_handled AS (
    -- Tratamento basico de nulos
    SELECT
${nullSelectLines.join(",\n")}
    FROM typed_data
)
${dedupBlock},
filtered_rows AS (
    -- Remove linhas sem informacao util nas colunas de validacao
    SELECT *
    FROM deduped
    WHERE ${validationCondition}
)
SELECT *
FROM filtered_rows;`;

  return {
    title: "SQL",
    explanation: buildExplanation(detectedProblemCodes),
    detectedProblemCodes,
    steps: buildSteps(detectedProblemCodes),
    script,
  };
}
