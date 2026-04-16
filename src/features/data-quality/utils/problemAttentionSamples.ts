import type { QualityProblem } from "@/features/data-quality/types";
import type { CellValue, DataRow, LoadedDataset } from "@/features/data-import/types";
import {
  isDateLikeString,
  isNumericLikeString,
  isValidDateLikeString,
  normalizeCategoryValue,
} from "@/features/data-quality/utils/valueDetection";

export type ProblemAttentionSampleRow = {
  rowNumber: number;
  row: DataRow;
};

function isNullLike(value: CellValue) {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function getStringValue(value: CellValue) {
  return typeof value === "string" ? value : null;
}

function getFirstAffectedColumn(problem: QualityProblem) {
  return problem.affectedColumns[0] ?? null;
}

function sliceSampleRows(indices: number[], dataset: LoadedDataset, limit: number) {
  return indices.slice(0, limit).map((rowIndex) => ({
    rowNumber: rowIndex + 1,
    row: dataset.rows[rowIndex],
  }));
}

function getDuplicateRowIndices(dataset: LoadedDataset) {
  const signatureMap = new Map<string, number[]>();

  for (let index = 0; index < dataset.rows.length; index += 1) {
    const row = dataset.rows[index];
    const signature = dataset.columns.map((column) => JSON.stringify(row[column] ?? null)).join("||");
    const list = signatureMap.get(signature) ?? [];
    list.push(index);
    signatureMap.set(signature, list);
  }

  const duplicates: number[] = [];
  for (const rowIndices of signatureMap.values()) {
    if (rowIndices.length > 1) {
      duplicates.push(...rowIndices);
    }
  }

  return duplicates;
}

function detectSemanticType(value: CellValue): "number" | "boolean" | "date" | "text" | "null" {
  if (value === null) {
    return "null";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return "null";
  }

  if (isNumericLikeString(trimmed)) {
    return "number";
  }

  if (isDateLikeString(trimmed)) {
    return "date";
  }

  return "text";
}

function getMixedTypeIndices(dataset: LoadedDataset, column: string) {
  const typeCount = new Map<string, number>();
  const typedIndices: Array<{ rowIndex: number; type: string }> = [];

  for (let rowIndex = 0; rowIndex < dataset.rows.length; rowIndex += 1) {
    const type = detectSemanticType(dataset.rows[rowIndex][column]);
    if (type === "null") {
      continue;
    }

    typedIndices.push({ rowIndex, type });
    typeCount.set(type, (typeCount.get(type) ?? 0) + 1);
  }

  let dominantType: string | null = null;
  let dominantCount = -1;
  for (const [type, count] of typeCount.entries()) {
    if (count > dominantCount) {
      dominantType = type;
      dominantCount = count;
    }
  }

  if (!dominantType) {
    return [];
  }

  return typedIndices
    .filter((entry) => entry.type !== dominantType)
    .map((entry) => entry.rowIndex);
}

function getAttentionRowIndices(problem: QualityProblem, dataset: LoadedDataset) {
  const column = getFirstAffectedColumn(problem);

  if (problem.code === "DUPLICATE_ROWS") {
    return getDuplicateRowIndices(dataset);
  }

  if (!column || !dataset.columns.includes(column)) {
    return [];
  }

  if (problem.code === "HIGH_NULL_PERCENTAGE" || problem.code === "NEARLY_EMPTY_COLUMN") {
    return dataset.rows
      .map((row, rowIndex) => (isNullLike(row[column]) ? rowIndex : -1))
      .filter((value) => value >= 0);
  }

  if (problem.code === "NUMERIC_VALUES_AS_TEXT") {
    return dataset.rows
      .map((row, rowIndex) => {
        const raw = getStringValue(row[column]);
        return raw && isNumericLikeString(raw.trim()) ? rowIndex : -1;
      })
      .filter((value) => value >= 0);
  }

  if (problem.code === "INCONSISTENT_DATE_VALUES") {
    return dataset.rows
      .map((row, rowIndex) => {
        const raw = getStringValue(row[column]);
        if (!raw) {
          return -1;
        }

        const trimmed = raw.trim();
        return isDateLikeString(trimmed) && !isValidDateLikeString(trimmed) ? rowIndex : -1;
      })
      .filter((value) => value >= 0);
  }

  if (problem.code === "MIXED_DATA_TYPES") {
    return getMixedTypeIndices(dataset, column);
  }

  if (problem.code === "CATEGORICAL_FORMAT_VARIATION") {
    return dataset.rows
      .map((row, rowIndex) => {
        const raw = getStringValue(row[column]);
        if (!raw || raw.trim() === "") {
          return -1;
        }

        const normalized = normalizeCategoryValue(raw);
        return raw !== normalized ? rowIndex : -1;
      })
      .filter((value) => value >= 0);
  }

  if (problem.code === "CONSTANT_COLUMN") {
    return dataset.rows
      .map((row, rowIndex) => (!isNullLike(row[column]) ? rowIndex : -1))
      .filter((value) => value >= 0);
  }

  return dataset.rows
    .map((row, rowIndex) => (!isNullLike(row[column]) ? rowIndex : -1))
    .filter((value) => value >= 0);
}

export function getProblemAttentionSamples(
  problem: QualityProblem,
  dataset: LoadedDataset | null,
  limit = 50,
): ProblemAttentionSampleRow[] {
  if (!dataset || limit <= 0) {
    return [];
  }

  const indices = getAttentionRowIndices(problem, dataset);
  return sliceSampleRows(indices, dataset, limit);
}

