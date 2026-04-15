import type { DataQualityAnalysisResult, QualityProblemCode } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";

export type NotebookGenerationInput = {
  dataset: LoadedDataset;
  analysis: DataQualityAnalysisResult;
};

export type NotebookStep = {
  id: string;
  title: string;
  reason: string;
};

export type NotebookSuggestion = {
  title: string;
  explanation: string;
  detectedProblemCodes: QualityProblemCode[];
  steps: NotebookStep[];
  code: string;
};
