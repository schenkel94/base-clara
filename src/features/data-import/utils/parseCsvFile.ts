import Papa from "papaparse";
import type { ParseError, ParseResult } from "papaparse";
import type { ParsedTabularData } from "@/features/data-import/types";
import { LocalFileParsingError } from "@/features/data-import/utils/errors";
import { normalizeTabularData } from "@/features/data-import/utils/normalizeTabularData";

export function parseCsvFile(file: File): Promise<ParsedTabularData> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: (results: ParseResult<string[]>) => {
        if (results.errors.length > 0) {
          const firstError = results.errors[0];
          reject(new LocalFileParsingError(`Falha ao ler CSV: ${firstError.message}`));
          return;
        }

        try {
          resolve(normalizeTabularData(results.data as unknown[][]));
        } catch (error: unknown) {
          reject(error);
        }
      },
      error: (error: Error | ParseError) => {
        reject(new LocalFileParsingError(`Falha ao ler CSV: ${error.message}`));
      },
    });
  });
}
