import type { AnalysisRule, RuleProblem } from "@/features/data-quality/types";
import { QUALITY_THRESHOLDS } from "@/features/data-quality/rules/config";
import { getColumnLabel } from "@/features/data-quality/rules/ruleUtils";

const MIN_DATE_CANDIDATE_RATIO = 0.3;

export const inconsistentDatesRule: AnalysisRule = {
  id: "inconsistent-dates",
  description: "Detecta colunas de datas potencialmente inconsistentes.",
  evaluate: ({ columnProfiles }) => {
    const problems: RuleProblem[] = [];

    for (const profile of columnProfiles) {
      if (profile.nonNullCount === 0) {
        continue;
      }

      const candidateRatio = profile.dateCandidateCount / profile.nonNullCount;
      if (
        profile.dateCandidateCount < QUALITY_THRESHOLDS.dateConsistencyMinCandidates ||
        candidateRatio < MIN_DATE_CANDIDATE_RATIO
      ) {
        continue;
      }

      const formatFamilies = Object.keys(profile.dateFormatCounts).filter(
        (family) => profile.dateFormatCounts[family] > 0,
      );
      const hasMultipleFormats = formatFamilies.length > 1;
      const hasInvalidCandidates = profile.invalidDateCandidateCount > 0;

      if (!hasMultipleFormats && !hasInvalidCandidates) {
        continue;
      }

      problems.push({
        code: "INCONSISTENT_DATE_VALUES",
        severity: "medium",
        title: "Datas potencialmente inconsistentes",
        description: `A coluna "${getColumnLabel(profile)}" apresenta possíveis inconsistências de datas.`,
        recommendation:
          "Padronize o formato de datas e trate valores inválidos antes de análises temporais.",
        affectedColumns: [profile.columnKey],
        metrics: {
          detectedFormatFamilyCount: formatFamilies.length,
          invalidDateCandidateCount: profile.invalidDateCandidateCount,
          dateCandidateCount: profile.dateCandidateCount,
        },
      });
    }

    return problems;
  },
};
