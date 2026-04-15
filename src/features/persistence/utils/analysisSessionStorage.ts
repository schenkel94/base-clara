import type { LoadedDataset } from "@/features/data-import/types";
import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import { STORAGE_KEYS } from "@/features/persistence/storageKeys";
import type {
  PersistedAnalysisSession,
  PersistedDatasetSnapshot,
  RestoredAnalysisSession,
} from "@/features/persistence/types";
import {
  readFromLocalStorage,
  removeFromLocalStorage,
  writeToLocalStorage,
} from "@/features/persistence/utils/localStorageClient";

function toDatasetSnapshot(dataset: LoadedDataset): PersistedDatasetSnapshot {
  return {
    fileName: dataset.fileName,
    mimeType: dataset.mimeType,
    fileSizeBytes: dataset.fileSizeBytes,
    fileExtension: dataset.fileExtension,
    fileType: dataset.fileType,
    columns: dataset.columns,
    sourceColumns: dataset.sourceColumns,
    columnDefinitions: dataset.columnDefinitions,
    previewRows: dataset.previewRows,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
  };
}

function toRestoredDataset(snapshot: PersistedDatasetSnapshot): LoadedDataset {
  const safeColumns = Array.isArray(snapshot.columns) ? snapshot.columns : [];
  const safeSourceColumns = Array.isArray(snapshot.sourceColumns)
    ? snapshot.sourceColumns
    : safeColumns;
  const safeColumnDefinitions = Array.isArray(snapshot.columnDefinitions)
    ? snapshot.columnDefinitions
    : safeColumns.map((column, index) => ({
        key: column,
        sourceName: safeSourceColumns[index] ?? column,
        index,
      }));
  const safePreviewRows = Array.isArray(snapshot.previewRows) ? snapshot.previewRows : [];

  return {
    fileName: snapshot.fileName,
    mimeType: snapshot.mimeType,
    fileSizeBytes: snapshot.fileSizeBytes,
    fileExtension: snapshot.fileExtension,
    fileType: snapshot.fileType,
    columns: safeColumns,
    sourceColumns: safeSourceColumns,
    columnDefinitions: safeColumnDefinitions,
    previewRows: safePreviewRows,
    rowCount: snapshot.rowCount,
    columnCount: snapshot.columnCount,
    rows: [],
  };
}

export function saveLastAnalysisSession(dataset: LoadedDataset, analysisResult: DataQualityAnalysisResult) {
  const payload: PersistedAnalysisSession = {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    dataset: toDatasetSnapshot(dataset),
    analysisResult,
  };

  writeToLocalStorage(STORAGE_KEYS.lastAnalysisSession, payload);
}

export function loadLastAnalysisSession(): RestoredAnalysisSession | null {
  const saved = readFromLocalStorage<PersistedAnalysisSession>(STORAGE_KEYS.lastAnalysisSession);

  if (!saved || saved.schemaVersion !== 1 || !saved.dataset || !saved.analysisResult) {
    return null;
  }

  if (
    typeof saved.dataset.fileName !== "string" ||
    typeof saved.dataset.fileType !== "string" ||
    typeof saved.dataset.fileExtension !== "string"
  ) {
    return null;
  }

  return {
    restoredAt: saved.savedAt,
    dataset: toRestoredDataset(saved.dataset),
    analysisResult: saved.analysisResult,
  };
}

export function clearLastAnalysisSession() {
  removeFromLocalStorage(STORAGE_KEYS.lastAnalysisSession);
}
