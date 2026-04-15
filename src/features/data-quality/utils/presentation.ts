import type {
  DataQualityAnalysisResult,
  ProblemSeverity,
  QualityProblem,
  QualityProblemCode,
} from "@/features/data-quality/types";

export type ReadinessBand = {
  label: "saudavel" | "atencao" | "critico";
  title: string;
  description: string;
  toneClass: string;
};

const severityWeight: Record<ProblemSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function getReadinessBand(score: number): ReadinessBand {
  if (score >= 80) {
    return {
      label: "saudavel",
      title: "Saudavel",
      description: "A amostra esta bem estruturada para iniciar analises.",
      toneClass: "text-lime-200 border-lime-300/40 bg-lime-300/10",
    };
  }

  if (score >= 55) {
    return {
      label: "atencao",
      title: "Atencao",
      description: "Existem pontos relevantes que merecem tratamento antes de avancar.",
      toneClass: "text-amber-200 border-amber-300/40 bg-amber-300/10",
    };
  }

  return {
    label: "critico",
    title: "Critico",
    description: "A qualidade atual pode comprometer conclusoes analiticas.",
    toneClass: "text-rose-200 border-rose-300/40 bg-rose-300/10",
  };
}

export function countAffectedColumnsByCodes(
  result: DataQualityAnalysisResult,
  targetCodes: QualityProblemCode[],
) {
  const columns = new Set<string>();

  for (const problem of result.problems) {
    if (!targetCodes.includes(problem.code)) {
      continue;
    }

    for (const column of problem.affectedColumns) {
      columns.add(column);
    }
  }

  return columns.size;
}

export function getTopProblems(problems: QualityProblem[], limit = 5) {
  return [...problems]
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
    .slice(0, limit);
}

export function calculateRiskIndex(summary: DataQualityAnalysisResult["summary"]) {
  const severityPressure =
    summary.issuesBySeverity.high * 14 +
    summary.issuesBySeverity.medium * 7 +
    summary.issuesBySeverity.low * 3;
  const duplicatePressure = Math.min(20, summary.duplicateRowCount * 2);
  const baseRisk = 100 - summary.treatmentNeedScore;

  return Math.max(0, Math.min(100, Math.round(baseRisk + severityPressure * 0.35 + duplicatePressure)));
}

export function getRiskLevelLabel(riskIndex: number) {
  if (riskIndex >= 70) {
    return "Risco alto";
  }

  if (riskIndex >= 40) {
    return "Risco moderado";
  }

  return "Risco controlado";
}

export function mapProblemsByColumn(problems: QualityProblem[]) {
  const map = new Map<string, QualityProblem[]>();

  for (const problem of problems) {
    for (const column of problem.affectedColumns) {
      const list = map.get(column) ?? [];
      list.push(problem);
      map.set(column, list);
    }
  }

  return map;
}
