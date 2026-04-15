import type { LoadedDataset } from "@/features/data-import/types";
import { assertSupportedFile } from "@/features/data-import/utils/fileValidation";
import { parseCsvFile } from "@/features/data-import/utils/parseCsvFile";
import { parseExcelFile } from "@/features/data-import/utils/parseExcelFile";

export async function loadLocalDataFile(file: File): Promise<LoadedDataset> {
  const { extension, fileType } = assertSupportedFile(file);

  const parsedData =
    fileType === "csv" ? await parseCsvFile(file) : await parseExcelFile(file);

  return {
    ...parsedData,
    fileName: file.name,
    mimeType: file.type || "desconhecido",
    fileSizeBytes: file.size,
    fileExtension: extension,
    fileType,
  };
}
