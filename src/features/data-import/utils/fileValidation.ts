import {
  SUPPORTED_FILE_EXTENSIONS,
  type SupportedFileExtension,
  type SupportedFileType,
} from "@/features/data-import/types";
import { LocalFileParsingError } from "@/features/data-import/utils/errors";

const extensionToType: Record<SupportedFileExtension, SupportedFileType> = {
  ".csv": "csv",
  ".xlsx": "xlsx",
  ".xls": "xls",
};

export function getFileExtension(fileName: string): SupportedFileExtension | null {
  const lowerName = fileName.toLowerCase();
  const extension = SUPPORTED_FILE_EXTENSIONS.find((item) => lowerName.endsWith(item));
  return extension ?? null;
}

export function assertSupportedFile(file: File): {
  extension: SupportedFileExtension;
  fileType: SupportedFileType;
} {
  const extension = getFileExtension(file.name);

  if (!extension) {
    throw new LocalFileParsingError("Formato inválido. Envie um arquivo .csv, .xlsx ou .xls.");
  }

  return {
    extension,
    fileType: extensionToType[extension],
  };
}
