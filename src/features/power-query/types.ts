import type { DataQualityAnalysisResult, QualityProblemCode } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";

export type PowerQueryGenerationInput = {
  dataset: LoadedDataset;
  analysis: DataQualityAnalysisResult;
};

export type PowerQueryStep = {
  id: string;
  title: string;
  reason: string;
};

export type PowerQuerySuggestion = {
  title: string;
  explanation: string;
  detectedProblemCodes: QualityProblemCode[];
  steps: PowerQueryStep[];
  script: string;
};
