import type { CellValue, SupportedFileType } from "@/features/data-import/types";

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const sizeInKb = sizeBytes / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
}

export function formatFileType(fileType: SupportedFileType) {
  if (fileType === "csv") {
    return "CSV";
  }

  if (fileType === "xlsx") {
    return "XLSX";
  }

  return "XLS";
}

export function formatCellValue(value: CellValue) {
  if (value === null) {
    return "—";
  }

  return String(value);
}
