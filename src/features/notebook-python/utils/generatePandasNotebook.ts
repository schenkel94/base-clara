import type { QualityProblemCode } from "@/features/data-quality/types";
import type { NotebookGenerationInput, NotebookStep, NotebookSuggestion } from "@/features/notebook-python/types";

const PROBLEM_REASON_LABEL: Record<QualityProblemCode, string> = {
  HIGH_NULL_PERCENTAGE: "nulos relevantes em colunas",
  NEARLY_EMPTY_COLUMN: "colunas quase vazias",
  DUPLICATE_ROWS: "linhas duplicadas",
  EMPTY_COLUMN_NAME: "nomes de coluna vazios",
  DUPLICATE_COLUMN_NAME: "nomes de coluna duplicados",
  UNNAMED_COLUMN: "colunas genericas (Unnamed)",
  MIXED_DATA_TYPES: "mistura aparente de tipos",
  NUMERIC_VALUES_AS_TEXT: "numeros armazenados como texto",
  INCONSISTENT_DATE_VALUES: "datas potencialmente inconsistentes",
  CATEGORICAL_FORMAT_VARIATION: "variacoes de capitalizacao e espacos",
  CONSTANT_COLUMN: "colunas constantes",
};

function toPythonString(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function toPythonStringList(values: string[]) {
  if (values.length === 0) {
    return "[]";
  }

  return `[${values.map((value) => toPythonString(value)).join(", ")}]`;
}

function dedupe<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)) as T[];
}

function toNotebookColumnName(columnName: string) {
  const normalized = columnName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return normalized === "" ? "coluna_sem_nome" : normalized;
}

function getColumnsByCodes(input: NotebookGenerationInput, codes: QualityProblemCode[]) {
  const columns = input.analysis.problems
    .filter((problem) => codes.includes(problem.code))
    .flatMap((problem) => problem.affectedColumns);

  return dedupe(columns.map((column) => toNotebookColumnName(column)));
}

function getDetectedCodes(input: NotebookGenerationInput) {
  const codes = input.analysis.problems.map((problem) => problem.code);
  return dedupe(codes);
}

function getReadExpression(fileName: string, fileExtension: string) {
  const escapedFileName = toPythonString(fileName);

  if (fileExtension === ".csv") {
    return `file_path = Path(${escapedFileName})
df = pd.read_csv(file_path)`;
  }

  return `file_path = Path(${escapedFileName})
df = pd.read_excel(file_path)`;
}

function buildExplanation(problemCodes: QualityProblemCode[]) {
  if (problemCodes.length === 0) {
    return "O notebook sugere um fluxo base de limpeza para validar e preparar os dados antes da analise.";
  }

  const reasons = problemCodes
    .map((code) => PROBLEM_REASON_LABEL[code])
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4);

  return `As celulas foram sugeridas para tratar ${reasons.join(", ")} detectados no seu arquivo.`;
}

function buildSteps(problemCodes: QualityProblemCode[]): NotebookStep[] {
  const steps: NotebookStep[] = [
    {
      id: "imports-and-read",
      title: "Imports e leitura",
      reason: "Abre o arquivo do usuario e prepara o DataFrame para tratamento.",
    },
    {
      id: "initial-inspection",
      title: "Inspecao inicial",
      reason: "Confere estrutura, tipos e amostra de dados antes de transformar.",
    },
    {
      id: "column-standardization",
      title: "Padronizacao de colunas",
      reason: "Evita erros com nomes de campo inconsistentes em etapas seguintes.",
    },
  ];

  if (
    problemCodes.includes("HIGH_NULL_PERCENTAGE") ||
    problemCodes.includes("NEARLY_EMPTY_COLUMN")
  ) {
    steps.push({
      id: "null-handling",
      title: "Tratamento de nulos",
      reason: "Preenche ausencias com estrategia simples baseada no tipo de dado.",
    });
  }

  if (
    problemCodes.includes("NUMERIC_VALUES_AS_TEXT") ||
    problemCodes.includes("MIXED_DATA_TYPES")
  ) {
    steps.push({
      id: "type-conversion",
      title: "Conversao de tipos",
      reason: "Converte colunas numericas textuais para permitir calculos consistentes.",
    });
  }

  if (problemCodes.includes("INCONSISTENT_DATE_VALUES")) {
    steps.push({
      id: "date-parsing",
      title: "Parsing de datas",
      reason: "Padroniza datas para evitar erros em analises temporais.",
    });
  }

  if (problemCodes.includes("CATEGORICAL_FORMAT_VARIATION")) {
    steps.push({
      id: "text-standardization",
      title: "Padronizacao de texto",
      reason: "Normaliza espacos e caixa para reduzir fragmentacao de categorias.",
    });
  }

  if (problemCodes.includes("DUPLICATE_ROWS")) {
    steps.push({
      id: "duplicate-removal",
      title: "Remocao de duplicados",
      reason: "Remove linhas repetidas para proteger contagens e agregacoes.",
    });
  }

  steps.push({
    id: "post-validation",
    title: "Validacao pos-tratamento",
    reason: "Mede o impacto da limpeza e confirma estado final da tabela.",
  });

  return steps;
}

export function generatePandasNotebookSuggestion(input: NotebookGenerationInput): NotebookSuggestion {
  const problemCodes = getDetectedCodes(input);
  const nullColumns = getColumnsByCodes(input, ["HIGH_NULL_PERCENTAGE", "NEARLY_EMPTY_COLUMN"]);
  const numericColumns = getColumnsByCodes(input, ["NUMERIC_VALUES_AS_TEXT"]);
  const mixedColumns = getColumnsByCodes(input, ["MIXED_DATA_TYPES"]);
  const dateColumns = getColumnsByCodes(input, ["INCONSISTENT_DATE_VALUES"]);
  const textColumns = getColumnsByCodes(input, ["CATEGORICAL_FORMAT_VARIATION"]);
  const duplicatedRowsDetected = input.analysis.summary.duplicateRowCount > 0;

  const conversionColumns = dedupe([...numericColumns, ...mixedColumns]);
  const readExpression = getReadExpression(input.dataset.fileName, input.dataset.fileExtension);

  const sections: string[] = [];

  sections.push(`# %%
# Imports e leitura do arquivo
import pandas as pd
import numpy as np
from pathlib import Path
import re

${readExpression}
print(f"Shape inicial: {df.shape}")`);

  sections.push(`# %%
# Inspecao inicial
display(df.head(10))
print("\\nTipos iniciais:")
print(df.dtypes)
print("\\nNulos por coluna (%):")
print((df.isna().mean() * 100).round(2).sort_values(ascending=False))`);

  sections.push(`# %%
# Padronizacao de nomes de colunas
new_columns = []
name_counter = {}

for index, col in enumerate(df.columns, start=1):
    base_name = re.sub(r"[^a-z0-9_]", "", re.sub(r"\\s+", "_", str(col).strip().lower()))
    if base_name == "":
        base_name = f"coluna_{index}"

    count = name_counter.get(base_name, 0) + 1
    name_counter[base_name] = count
    final_name = base_name if count == 1 else f"{base_name}_{count}"
    new_columns.append(final_name)

df.columns = new_columns
print("Colunas padronizadas:")
print(df.columns.tolist())`);

  if (nullColumns.length > 0) {
    sections.push(`# %%
# Tratamento de nulos em colunas criticas detectadas
suggested_null_columns = ${toPythonStringList(nullColumns)}
null_columns = [col for col in suggested_null_columns if col in df.columns]

if not null_columns:
    null_columns = (
        df.isna().mean()
        .loc[lambda series: series >= 0.30]
        .index.tolist()
    )

for col in null_columns:
    if pd.api.types.is_numeric_dtype(df[col]):
        df[col] = df[col].fillna(df[col].median())
    else:
        mode = df[col].mode(dropna=True)
        fill_value = mode.iloc[0] if not mode.empty else "nao_informado"
        df[col] = df[col].fillna(fill_value)`);
  }

  if (conversionColumns.length > 0) {
    sections.push(`# %%
# Conversao de tipos (colunas numericas em texto ou mistas)
suggested_numeric_columns = ${toPythonStringList(conversionColumns)}
numeric_candidate_columns = [col for col in suggested_numeric_columns if col in df.columns]

if not numeric_candidate_columns:
    numeric_candidate_columns = [
        col for col in df.columns
        if df[col].dtype == "object"
    ]

for col in numeric_candidate_columns:
    cleaned = (
        df[col]
        .astype("string")
        .str.replace(".", "", regex=False)
        .str.replace(",", ".", regex=False)
        .str.replace(r"[^0-9.\\-]", "", regex=True)
    )
    df[col] = pd.to_numeric(cleaned, errors="coerce")`);
  }

  if (dateColumns.length > 0) {
    sections.push(`# %%
# Parsing de datas com fallback de interpretacao
suggested_date_columns = ${toPythonStringList(dateColumns)}
date_columns = [col for col in suggested_date_columns if col in df.columns]

if not date_columns:
    date_columns = [col for col in df.columns if "data" in col or "date" in col]

for col in date_columns:
    dayfirst_parse = pd.to_datetime(df[col], errors="coerce", dayfirst=True)
    monthfirst_parse = pd.to_datetime(df[col], errors="coerce", dayfirst=False)

    if dayfirst_parse.notna().sum() >= monthfirst_parse.notna().sum():
        df[col] = dayfirst_parse
    else:
        df[col] = monthfirst_parse`);
  }

  if (textColumns.length > 0) {
    sections.push(`# %%
# Padronizacao de texto para colunas categoricas com variacao
suggested_text_columns = ${toPythonStringList(textColumns)}
text_columns = [col for col in suggested_text_columns if col in df.columns]

if not text_columns:
    text_columns = [
        col for col in df.columns
        if df[col].dtype == "object" and df[col].nunique(dropna=True) <= 50
    ]

for col in text_columns:
    df[col] = (
        df[col]
        .astype("string")
        .str.strip()
        .str.replace(r"\\s+", " ", regex=True)
        .str.lower()
    )`);
  }

  if (duplicatedRowsDetected) {
    sections.push(`# %%
# Remocao de duplicados
rows_before = len(df)
df = df.drop_duplicates().reset_index(drop=True)
rows_removed = rows_before - len(df)
print(f"Linhas removidas por duplicidade: {rows_removed}")`);
  }

  sections.push(`# %%
# Validacao pos-tratamento
validation = pd.DataFrame({
    "nulos_percentual": (df.isna().mean() * 100).round(2),
    "valores_unicos": df.nunique(dropna=True),
    "tipo_final": df.dtypes.astype(str),
}).sort_values("nulos_percentual", ascending=False)

display(validation.head(20))
print(f"Shape final: {df.shape}")
display(df.head(10))`);

  return {
    title: "Notebook Python",
    explanation: buildExplanation(problemCodes),
    detectedProblemCodes: problemCodes,
    steps: buildSteps(problemCodes),
    code: sections.join("\n\n"),
  };
}
