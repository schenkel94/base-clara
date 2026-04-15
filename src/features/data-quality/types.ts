import type { DataRow, ParsedTabularData } from "@/features/data-import/types";

export type ProblemSeverity = "high" | "medium" | "low";
export type TreatmentPriorityLevel = "high" | "medium" | "low";

export type QualityProblemCode =
  | "HIGH_NULL_PERCENTAGE"
  | "NEARLY_EMPTY_COLUMN"
  | "DUPLICATE_ROWS"
  | "EMPTY_COLUMN_NAME"
  | "DUPLICATE_COLUMN_NAME"
  | "UNNAMED_COLUMN"
  | "MIXED_DATA_TYPES"
  | "NUMERIC_VALUES_AS_TEXT"
  | "INCONSISTENT_DATE_VALUES"
  | "CATEGORICAL_FORMAT_VARIATION"
  | "CONSTANT_COLUMN";

export type ColumnValueType = "number" | "text" | "boolean" | "date" | "unknown";

export type ColumnQualityMetrics = {
  columnKey: string;
  sourceName: string;
  columnIndex: number;
  nullCount: number;
  nullPercentage: number;
  nonNullCount: number;
  uniqueNonNullCount: number;
  inferredType: ColumnValueType | "mixed";
  hasMixedTypes: boolean;
  numericTextRatio: number;
  dateCandidateRatio: number;
  isNearlyEmpty: boolean;
  isConstant: boolean;
};

export type QualityProblem = {
  id: string;
  code: QualityProblemCode;
  severity: ProblemSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedColumns: string[];
  affectedRowsCount?: number;
  metrics?: Record<string, number | string | boolean>;
};

export type RuleProblem = Omit<QualityProblem, "id">;

export type AnalysisSummary = {
  totalRows: number;
  totalColumns: number;
  analyzedAt: string;
  duplicateRowCount: number;
  columnsWithIssuesCount: number;
  totalProblems: number;
  issuesBySeverity: Record<ProblemSeverity, number>;
  treatmentNeedScore: number;
};

export type TreatmentPriority = {
  level: TreatmentPriorityLevel;
  title: string;
  rationale: string;
  relatedProblemIds: string[];
};

export type DataQualityAnalysisResult = {
  summary: AnalysisSummary;
  problems: QualityProblem[];
  columnMetrics: ColumnQualityMetrics[];
  priorities: TreatmentPriority[];
};

export type ColumnProfile = {
  columnKey: string;
  sourceName: string;
  index: number;
  values: Array<string | number | boolean | null>;
  nonNullValues: Array<string | number | boolean>;
  stringValues: string[];
  nullCount: number;
  nonNullCount: number;
  uniqueNonNullCount: number;
  semanticTypeCounts: Record<ColumnValueType, number>;
  numericTextCount: number;
  dateCandidateCount: number;
  dateFormatCounts: Record<string, number>;
  invalidDateCandidateCount: number;
  categoricalVariantGroups: Array<{
    normalizedValue: string;
    variants: string[];
  }>;
};

export type AnalysisContext = {
  dataset: ParsedTabularData;
  rows: DataRow[];
  columnProfiles: ColumnProfile[];
  duplicateRowCount: number;
};

export type AnalysisRule = {
  id: string;
  description: string;
  evaluate: (context: AnalysisContext) => RuleProblem[];
};
