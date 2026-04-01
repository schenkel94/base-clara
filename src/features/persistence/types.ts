import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import type {
  ColumnDefinition,
  DataRow,
  LoadedDataset,
  SupportedFileExtension,
  SupportedFileType,
} from "@/features/data-import/types";

export type PersistedDatasetSnapshot = {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileExtension: SupportedFileExtension;
  fileType: SupportedFileType;
  columns: string[];
  sourceColumns: string[];
  columnDefinitions: ColumnDefinition[];
  previewRows: DataRow[];
  rowCount: number;
  columnCount: number;
};

export type PersistedAnalysisSession = {
  schemaVersion: 1;
  savedAt: string;
  dataset: PersistedDatasetSnapshot;
  analysisResult: DataQualityAnalysisResult;
};

export type RestoredAnalysisSession = {
  restoredAt: string;
  dataset: LoadedDataset;
  analysisResult: DataQualityAnalysisResult;
};

export type UiPreferences = {
  preferredCodeLanguage: "python" | "power-query" | "sql";
};
