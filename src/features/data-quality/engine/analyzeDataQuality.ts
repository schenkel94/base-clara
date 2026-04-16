import type { DataRow, ParsedTabularData } from "@/features/data-import/types";
import { defaultAnalysisRules } from "@/features/data-quality/rules";
import type {
  AnalysisContext,
  AnalysisRule,
  DataQualityAnalysisResult,
  ProblemSeverity,
  QualityProblem,
  TreatmentPriority,
} from "@/features/data-quality/types";
import {
  buildColumnMetrics,
  buildColumnProfiles,
  clampTreatmentNeedScore,
  collectIssueColumns,
} from "@/features/data-quality/utils/columnProfiling";

const SCORE_WEIGHTS: Record<ProblemSeverity, number> = {
  high: 17,
  medium: 9,
  low: 4,
};

function buildRowSignature(row: DataRow, orderedColumns: string[]) {
  return orderedColumns.map((column) => JSON.stringify(row[column] ?? null)).join("||");
}

function countDuplicateRows(rows: DataRow[], orderedColumns: string[]) {
  const signatureCount = new Map<string, number>();

  for (const row of rows) {
    // A assinatura considera a linha inteira para detectar duplicidade total.
    const signature = buildRowSignature(row, orderedColumns);
    signatureCount.set(signature, (signatureCount.get(signature) ?? 0) + 1);
  }

  let duplicateRows = 0;
  for (const count of signatureCount.values()) {
    if (count > 1) {
      duplicateRows += count - 1;
    }
  }

  return duplicateRows;
}

function assignProblemIds(problems: Omit<QualityProblem, "id">[]): QualityProblem[] {
  return problems.map((problem, index) => ({
    ...problem,
    id: `issue-${String(index + 1).padStart(3, "0")}`,
  }));
}

function buildPriorities(problems: QualityProblem[]): TreatmentPriority[] {
  const grouped = {
    high: problems.filter((problem) => problem.severity === "high"),
    medium: problems.filter((problem) => problem.severity === "medium"),
    low: problems.filter((problem) => problem.severity === "low"),
  };

  const priorities: TreatmentPriority[] = [];

  if (grouped.high.length > 0) {
    priorities.push({
      level: "high",
      title: "Prioridade alta",
      rationale: "Problemas críticos para confiabilidade dos dados devem ser tratados primeiro.",
      relatedProblemIds: grouped.high.map((problem) => problem.id),
    });
  }

  if (grouped.medium.length > 0) {
    priorities.push({
      level: "medium",
      title: "Prioridade média",
      rationale: "Problemas que podem distorcer análise e merecem tratamento na sequência.",
      relatedProblemIds: grouped.medium.map((problem) => problem.id),
    });
  }

  if (grouped.low.length > 0) {
    priorities.push({
      level: "low",
      title: "Prioridade baixa",
      rationale: "Ajustes de padronização e limpeza fina para consolidar qualidade.",
      relatedProblemIds: grouped.low.map((problem) => problem.id),
    });
  }

  return priorities;
}

function calculateTreatmentNeedScore(problems: QualityProblem[]) {
  const totalDeduction = problems.reduce((accumulator, problem) => {
    return accumulator + SCORE_WEIGHTS[problem.severity];
  }, 0);

  return clampTreatmentNeedScore(100 - totalDeduction);
}

export function analyzeDataQuality(
  dataset: ParsedTabularData,
  options?: { rules?: AnalysisRule[] },
): DataQualityAnalysisResult {
  const columnProfiles = buildColumnProfiles(dataset);
  const duplicateRowCount = countDuplicateRows(dataset.rows, dataset.columns);

  const context: AnalysisContext = {
    dataset,
    rows: dataset.rows,
    columnProfiles,
    duplicateRowCount,
  };

  const rules = options?.rules ?? defaultAnalysisRules;
  const rawProblems = rules.flatMap((rule) => rule.evaluate(context));
  const problems = assignProblemIds(rawProblems);

  const issuesBySeverity = {
    high: problems.filter((problem) => problem.severity === "high").length,
    medium: problems.filter((problem) => problem.severity === "medium").length,
    low: problems.filter((problem) => problem.severity === "low").length,
  };

  return {
    summary: {
      totalRows: dataset.rowCount,
      totalColumns: dataset.columnCount,
      analyzedAt: new Date().toISOString(),
      duplicateRowCount,
      columnsWithIssuesCount: collectIssueColumns(problems).size,
      totalProblems: problems.length,
      issuesBySeverity,
      treatmentNeedScore: calculateTreatmentNeedScore(problems),
    },
    problems,
    columnMetrics: buildColumnMetrics(columnProfiles, dataset.rowCount),
    priorities: buildPriorities(problems),
  };
}
