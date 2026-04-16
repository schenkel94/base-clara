import { useState } from "react";
import { analyzeDataQuality, type DataQualityAnalysisResult } from "@/features/data-quality";
import type { LoadedDataset } from "@/features/data-import/types";
import { LocalFileParsingError } from "@/features/data-import/utils/errors";
import { loadLocalDataFile } from "@/features/data-import/utils/loadLocalDataFile";
import {
  clearLastAnalysisSession,
  loadLastAnalysisSession,
  saveLastAnalysisSession,
} from "@/features/persistence/utils/analysisSessionStorage";

type UploadState = "idle" | "loading" | "success" | "error";

export type UseLocalDataImportResult = {
  status: UploadState;
  dataset: LoadedDataset | null;
  analysisResult: DataQualityAnalysisResult | null;
  restoredFromStorage: boolean;
  restoredAt: string | null;
  errorMessage: string | null;
  loadFile: (file: File | null) => Promise<void>;
  clearData: () => void;
};

export function useLocalDataImport(): UseLocalDataImportResult {
  const [restoredSession] = useState(() => loadLastAnalysisSession());
  const [status, setStatus] = useState<UploadState>(restoredSession ? "success" : "idle");
  const [dataset, setDataset] = useState<LoadedDataset | null>(restoredSession?.dataset ?? null);
  const [analysisResult, setAnalysisResult] = useState<DataQualityAnalysisResult | null>(
    restoredSession?.analysisResult ?? null,
  );
  const [restoredFromStorage, setRestoredFromStorage] = useState(Boolean(restoredSession));
  const [restoredAt, setRestoredAt] = useState<string | null>(restoredSession?.restoredAt ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const loadedDataset = await loadLocalDataFile(file);
      const qualityResult = analyzeDataQuality(loadedDataset);

      setDataset(loadedDataset);
      setAnalysisResult(qualityResult);
      saveLastAnalysisSession(loadedDataset, qualityResult);
      setRestoredFromStorage(false);
      setRestoredAt(null);
      setStatus("success");
    } catch (error) {
      setDataset(null);
      setAnalysisResult(null);
      setStatus("error");

      if (error instanceof LocalFileParsingError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Não foi possível carregar o arquivo. Tente novamente.");
    }
  };

  const clearData = () => {
    setDataset(null);
    setAnalysisResult(null);
    setRestoredFromStorage(false);
    setRestoredAt(null);
    setErrorMessage(null);
    setStatus("idle");
    clearLastAnalysisSession();
  };

  return {
    status,
    dataset,
    analysisResult,
    restoredFromStorage,
    restoredAt,
    errorMessage,
    loadFile,
    clearData,
  };
}
