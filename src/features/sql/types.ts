import type { DataQualityAnalysisResult, QualityProblemCode } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";

export type SqlGenerationInput = {
  dataset: LoadedDataset;
  analysis: DataQualityAnalysisResult;
};

export type SqlStep = {
  id: string;
  title: string;
  reason: string;
};

export type SqlSuggestion = {
  title: string;
  explanation: string;
  detectedProblemCodes: QualityProblemCode[];
  steps: SqlStep[];
  script: string;
};
