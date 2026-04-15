import type { QualityProblemCode } from "@/features/data-quality/types";
import type {
  PowerQueryGenerationInput,
  PowerQueryStep,
  PowerQuerySuggestion,
} from "@/features/power-query/types";

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
  CATEGORICAL_FORMAT_VARIATION: "texto categorico com variacao",
  CONSTANT_COLUMN: "colunas constantes",
};

function dedupe<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)) as T[];
}

function toMString(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toMList(values: string[]) {
  if (values.length === 0) {
    return "{}";
  }

  return `{${values.map((value) => toMString(value)).join(", ")}}`;
}

function toMColumnName(columnName: string) {
  const normalized = columnName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return normalized === "" ? "coluna_sem_nome" : normalized;
}

function getDetectedCodes(input: PowerQueryGenerationInput) {
  return dedupe(input.analysis.problems.map((problem) => problem.code));
}

function getColumnsByCodes(input: PowerQueryGenerationInput, codes: QualityProblemCode[]) {
  const rawColumns = input.analysis.problems
    .filter((problem) => codes.includes(problem.code))
    .flatMap((problem) => problem.affectedColumns);

  return dedupe(rawColumns.map((column) => toMColumnName(column)));
}

function buildExplanation(problemCodes: QualityProblemCode[]) {
  if (problemCodes.length === 0) {
    return "O script M segue um fluxo base de preparacao e validacao para consolidar os dados no Power Query.";
  }

  const reasons = problemCodes
    .map((code) => PROBLEM_REASON_LABEL[code])
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4);

  return `O script foi montado para tratar ${reasons.join(", ")} detectados no seu arquivo.`;
}

function buildSteps(problemCodes: QualityProblemCode[]): PowerQueryStep[] {
  const steps: PowerQueryStep[] = [
    {
      id: "source-read",
      title: "Leitura da fonte",
      reason: "Carrega o arquivo local no Power Query e promove os cabecalhos.",
    },
    {
      id: "column-normalization",
      title: "Padronizacao de colunas",
      reason: "Normaliza nomes para facilitar manutencao e reduzir ambiguidades.",
    },
    {
      id: "type-adjustment",
      title: "Correcao de tipos",
      reason: "Converte colunas candidatas para numero/data de forma explicita.",
    },
  ];

  if (problemCodes.includes("CATEGORICAL_FORMAT_VARIATION")) {
    steps.push({
      id: "text-cleaning",
      title: "Limpeza de texto",
      reason: "Padroniza caixa e espacos para reduzir fragmentacao de categorias.",
    });
  }

  if (
    problemCodes.includes("HIGH_NULL_PERCENTAGE") ||
    problemCodes.includes("NEARLY_EMPTY_COLUMN")
  ) {
    steps.push({
      id: "null-treatment",
      title: "Tratamento de nulos",
      reason: "Preenche valores nulos com regras basicas por tipo de coluna.",
    });
  }

  if (problemCodes.includes("DUPLICATE_ROWS")) {
    steps.push({
      id: "dedupe",
      title: "Remocao de duplicados",
      reason: "Remove linhas repetidas para proteger contagens e analises.",
    });
  }

  steps.push({
    id: "invalid-filter",
    title: "Filtragem de registros invalidos",
    reason: "Mantem linhas com informacao minima em colunas de validacao.",
  });

  return steps;
}

function getSourceBlock(input: PowerQueryGenerationInput) {
  const filePathLiteral = toMString(input.dataset.fileName);

  if (input.dataset.fileExtension === ".csv") {
    return `// 1) Leitura da fonte CSV
    FilePath = ${filePathLiteral},
    Source = Csv.Document(File.Contents(FilePath), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),`;
  }

  return `// 1) Leitura da fonte Excel (primeira aba)
    FilePath = ${filePathLiteral},
    Workbook = Excel.Workbook(File.Contents(FilePath), null, true),
    FirstSheetData = Workbook{0}[Data],
    PromotedHeaders = Table.PromoteHeaders(FirstSheetData, [PromoteAllScalars = true]),`;
}

export function generatePowerQuerySuggestion(
  input: PowerQueryGenerationInput,
): PowerQuerySuggestion {
  const detectedProblemCodes = getDetectedCodes(input);
  const nullColumns = getColumnsByCodes(input, ["HIGH_NULL_PERCENTAGE", "NEARLY_EMPTY_COLUMN"]);
  const numericColumns = getColumnsByCodes(input, ["NUMERIC_VALUES_AS_TEXT", "MIXED_DATA_TYPES"]);
  const dateColumns = getColumnsByCodes(input, ["INCONSISTENT_DATE_VALUES"]);
  const textColumns = getColumnsByCodes(input, ["CATEGORICAL_FORMAT_VARIATION"]);
  const validationColumns = dedupe([...nullColumns, ...numericColumns, ...dateColumns]);

  const removeDuplicates = detectedProblemCodes.includes("DUPLICATE_ROWS");
  const sourceBlock = getSourceBlock(input);

  const script = `let
    // Ajuste este caminho para a localizacao do arquivo no seu ambiente.
${sourceBlock}

    // 2) Padronizacao de nomes de colunas
    CleanColumnName = (name as text) as text =>
        let
            lower = Text.Lower(Text.Trim(name)),
            normalizedSpaces = Text.Combine(List.Select(Text.Split(lower, " "), each _ <> ""), "_"),
            safeChars = Text.Select(normalizedSpaces, {"a".."z", "0".."9", "_"}),
            fallback = if Text.Length(safeChars) = 0 then "coluna_sem_nome" else safeChars
        in
            fallback,

    StandardizedColumns = Table.TransformColumnNames(PromotedHeaders, each CleanColumnName(_), [Comparer = Comparer.OrdinalIgnoreCase]),
    ExistingColumns = Table.ColumnNames(StandardizedColumns),

    // 3) Colunas sugeridas pelo diagnostico
    NumericColumns = ${toMList(numericColumns)},
    DateColumns = ${toMList(dateColumns)},
    TextColumns = ${toMList(textColumns)},
    NullColumns = ${toMList(nullColumns)},
    ValidationColumns = ${toMList(validationColumns)},

    SafeNumericColumns = List.Select(NumericColumns, each List.Contains(ExistingColumns, _)),
    SafeDateColumns = List.Select(DateColumns, each List.Contains(ExistingColumns, _)),
    SafeTextColumns = List.Select(TextColumns, each List.Contains(ExistingColumns, _)),
    SafeNullColumns = List.Select(NullColumns, each List.Contains(ExistingColumns, _)),
    SafeValidationColumns = List.Select(ValidationColumns, each List.Contains(ExistingColumns, _)),

    // 4) Correcao de tipos
    TypedNumeric =
        if List.Count(SafeNumericColumns) > 0 then
            Table.TransformColumnTypes(
                StandardizedColumns,
                List.Transform(SafeNumericColumns, each {_, type number}),
                "pt-BR"
            )
        else
            StandardizedColumns,

    TypedDates =
        if List.Count(SafeDateColumns) > 0 then
            Table.TransformColumnTypes(
                TypedNumeric,
                List.Transform(SafeDateColumns, each {_, type date}),
                "pt-BR"
            )
        else
            TypedNumeric,

    // 5) Limpeza de texto
    NormalizeText = (value as any) as any =>
        if value is text then
            Text.Lower(
                Text.Combine(
                    List.Select(Text.Split(Text.Trim(value), " "), each _ <> ""),
                    " "
                )
            )
        else
            value,

    CleanText =
        if List.Count(SafeTextColumns) > 0 then
            Table.TransformColumns(
                TypedDates,
                List.Transform(SafeTextColumns, each {_, NormalizeText, type text})
            )
        else
            TypedDates,

    // 6) Tratamento basico de nulos
    FilledNumericNulls =
        if List.Count(SafeNumericColumns) > 0 then
            Table.TransformColumns(
                CleanText,
                List.Transform(SafeNumericColumns, each {_, each if _ = null then 0 else _, type number})
            )
        else
            CleanText,

    FilledTextNulls =
        if List.Count(SafeTextColumns) > 0 then
            Table.TransformColumns(
                FilledNumericNulls,
                List.Transform(SafeTextColumns, each {_, each if _ = null then "nao_informado" else _, type text})
            )
        else
            FilledNumericNulls,

    OtherNullColumns = List.Difference(SafeNullColumns, List.Combine({SafeNumericColumns, SafeTextColumns})),
    FilledOtherNulls =
        if List.Count(OtherNullColumns) > 0 then
            List.Accumulate(
                OtherNullColumns,
                FilledTextNulls,
                (state, col) => Table.ReplaceValue(state, null, "nao_informado", Replacer.ReplaceValue, {col})
            )
        else
            FilledTextNulls,

    // 7) Remocao de duplicados quando houver sinal no diagnostico
    WithoutDuplicates =
        if ${removeDuplicates} then
            Table.Distinct(FilledOtherNulls)
        else
            FilledOtherNulls,

    // 8) Filtragem de registros invalidos (mantem linhas com alguma informacao valida)
    FilteredInvalidRows =
        if List.Count(SafeValidationColumns) > 0 then
            Table.SelectRows(
                WithoutDuplicates,
                each List.NonNullCount(List.Transform(SafeValidationColumns, (col) => try Record.Field(_, col) otherwise null)) > 0
            )
        else
            WithoutDuplicates
in
    FilteredInvalidRows`;

  return {
    title: "Power Query",
    explanation: buildExplanation(detectedProblemCodes),
    detectedProblemCodes,
    steps: buildSteps(detectedProblemCodes),
    script,
  };
}
