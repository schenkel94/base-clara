export const SUPPORTED_FILE_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

export type SupportedFileExtension = (typeof SUPPORTED_FILE_EXTENSIONS)[number];
export type SupportedFileType = "csv" | "xlsx" | "xls";

export type CellValue = string | number | boolean | null;
export type DataRow = Record<string, CellValue>;

export type ColumnDefinition = {
  key: string;
  sourceName: string;
  index: number;
};

export type ParsedTabularData = {
  columns: string[];
  sourceColumns: string[];
  columnDefinitions: ColumnDefinition[];
  rows: DataRow[];
  previewRows: DataRow[];
  rowCount: number;
  columnCount: number;
};

export type LoadedDataset = ParsedTabularData & {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileExtension: SupportedFileExtension;
  fileType: SupportedFileType;
};
