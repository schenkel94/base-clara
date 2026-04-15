import type {
  CellValue,
  ColumnDefinition,
  DataRow,
  ParsedTabularData,
} from "@/features/data-import/types";
import { LocalFileParsingError } from "@/features/data-import/utils/errors";

const PREVIEW_ROW_LIMIT = 8;

function isEmptyCell(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function normalizeColumnName(value: unknown, index: number) {
  const baseName = String(value ?? "").trim();
  return baseName === "" ? `coluna_${index + 1}` : baseName;
}

function makeColumnsUnique(columns: string[]) {
  const nameCount = new Map<string, number>();

  return columns.map((columnName) => {
    const previousCount = nameCount.get(columnName) ?? 0;
    const nextCount = previousCount + 1;
    nameCount.set(columnName, nextCount);

    if (previousCount === 0) {
      return columnName;
    }

    return `${columnName}_${nextCount}`;
  });
}

function normalizeCellValue(value: unknown): CellValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  const normalized = String(value);
  return normalized.trim() === "" ? null : normalized;
}

export function normalizeTabularData(rawRows: unknown[][]): ParsedTabularData {
  const nonEmptyRows = rawRows.filter((row) => row.some((cell) => !isEmptyCell(cell)));

  if (nonEmptyRows.length === 0) {
    throw new LocalFileParsingError("O arquivo não contém dados utilizáveis.");
  }

  const headerRow = nonEmptyRows[0];
  const maxColumnCount = Math.max(...nonEmptyRows.map((row) => row.length), 1);
  const sourceColumns = Array.from({ length: maxColumnCount }, (_, index) =>
    String(headerRow[index] ?? "").trim(),
  );

  const normalizedColumns = makeColumnsUnique(
    Array.from({ length: maxColumnCount }, (_, index) => normalizeColumnName(headerRow[index], index)),
  );
  const columnDefinitions: ColumnDefinition[] = normalizedColumns.map((columnName, index) => ({
    key: columnName,
    sourceName: sourceColumns[index],
    index,
  }));

  const rows: DataRow[] = nonEmptyRows.slice(1).map((row) => {
    return normalizedColumns.reduce<DataRow>((accumulator, columnName, columnIndex) => {
      accumulator[columnName] = normalizeCellValue(row[columnIndex]);
      return accumulator;
    }, {});
  });

  return {
    columns: normalizedColumns,
    sourceColumns,
    columnDefinitions,
    rows,
    previewRows: rows.slice(0, PREVIEW_ROW_LIMIT),
    rowCount: rows.length,
    columnCount: normalizedColumns.length,
  };
}
