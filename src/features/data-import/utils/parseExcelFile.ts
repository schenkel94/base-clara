import type { ParsedTabularData } from "@/features/data-import/types";
import { LocalFileParsingError } from "@/features/data-import/utils/errors";
import { normalizeTabularData } from "@/features/data-import/utils/normalizeTabularData";

export async function parseExcelFile(file: File): Promise<ParsedTabularData> {
  try {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new LocalFileParsingError("A planilha não possui abas para leitura.");
    }

    const firstSheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      blankrows: false,
      defval: null,
      raw: true,
    }) as unknown[][];

    return normalizeTabularData(rows);
  } catch (error) {
    if (error instanceof LocalFileParsingError) {
      throw error;
    }

    throw new LocalFileParsingError("Falha ao ler planilha Excel. Verifique o arquivo enviado.");
  }
}
