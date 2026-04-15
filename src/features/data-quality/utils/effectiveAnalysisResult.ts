import type {
  DataQualityAnalysisResult,
  ProblemSeverity,
  QualityProblem,
} from "@/features/data-quality/types";

const SCORE_WEIGHTS: Record<ProblemSeverity, number> = {
  high: 17,
  medium: 9,
  low: 4,
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateTreatmentNeedScore(problems: QualityProblem[]) {
  const totalDeduction = problems.reduce((accumulator, problem) => {
    return accumulator + SCORE_WEIGHTS[problem.severity];
  }, 0);

  return clampScore(100 - totalDeduction);
}

function countIssueColumns(problems: QualityProblem[]) {
  return new Set(problems.flatMap((problem) => problem.affectedColumns)).size;
}

function hasDuplicateRowsProblem(problems: QualityProblem[]) {
  return problems.some((problem) => problem.code === "DUPLICATE_ROWS");
}

export function buildEffectiveAnalysisResult(
  result: DataQualityAnalysisResult | null,
  ignoredProblemIds: Set<string>,
): DataQualityAnalysisResult | null {
  if (!result) {
    return null;
  }

  if (ignoredProblemIds.size === 0) {
    return result;
  }

  const activeProblems = result.problems.filter((problem) => !ignoredProblemIds.has(problem.id));

  const issuesBySeverity = {
    high: activeProblems.filter((problem) => problem.severity === "high").length,
    medium: activeProblems.filter((problem) => problem.severity === "medium").length,
    low: activeProblems.filter((problem) => problem.severity === "low").length,
  };

  const priorities = result.priorities
    .map((priority) => ({
      ...priority,
      relatedProblemIds: priority.relatedProblemIds.filter((problemId) => !ignoredProblemIds.has(problemId)),
    }))
    .filter((priority) => priority.relatedProblemIds.length > 0);

  return {
    ...result,
    problems: activeProblems,
    priorities,
    summary: {
      ...result.summary,
      duplicateRowCount: hasDuplicateRowsProblem(activeProblems) ? result.summary.duplicateRowCount : 0,
      columnsWithIssuesCount: countIssueColumns(activeProblems),
      totalProblems: activeProblems.length,
      issuesBySeverity,
      treatmentNeedScore: calculateTreatmentNeedScore(activeProblems),
    },
  };
}

