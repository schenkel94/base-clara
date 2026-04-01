import type { DataQualityAnalysisResult, ProblemSeverity, QualityProblemCode } from "@/features/data-quality/types";

export type TechnicalChecklistInput = {
  analysis: DataQualityAnalysisResult;
};

export type ChecklistItem = {
  id: string;
  title: string;
  whyItMatters: string;
  priority: ProblemSeverity;
  relatedCodes: QualityProblemCode[];
};

export type TechnicalChecklistSuggestion = {
  explanation: string;
  items: ChecklistItem[];
  text: string;
};
