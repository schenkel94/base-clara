import type { ColumnProfile, ColumnValueType, QualityProblem } from "@/features/data-quality/types";
import type { ParsedTabularData } from "@/features/data-import/types";
import {
  detectDateFamily,
  isDateLikeString,
  isNumericLikeString,
  isValidDateLikeString,
  normalizeCategoryValue,
} from "@/features/data-quality/utils/valueDetection";

function toUniqueValueKey(value: string | number | boolean) {
  return `${typeof value}:${String(value)}`;
}

function toRatio(partial: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return partial / total;
}

function inferDominantType(semanticTypeCounts: Record<ColumnValueType, number>) {
  const entries = Object.entries(semanticTypeCounts) as Array<[ColumnValueType, number]>;
  const nonZero = entries.filter(([, count]) => count > 0);

  if (nonZero.length === 0) {
    return "unknown" as const;
  }

  if (nonZero.length > 1) {
    return "mixed" as const;
  }

  return nonZero[0][0];
}

function buildCategoricalVariantGroups(stringValues: string[]) {
  const trimmedValues = stringValues.map((value) => value.trim()).filter((value) => value !== "");
  const distinct = new Set(trimmedValues);
  const isCategorical = distinct.size > 1 && distinct.size <= Math.max(20, Math.floor(trimmedValues.length * 0.4));

  if (!isCategorical) {
    return [];
  }

  const groups = new Map<string, Set<string>>();

  for (const rawValue of trimmedValues) {
    const normalized = normalizeCategoryValue(rawValue);
    const variants = groups.get(normalized) ?? new Set<string>();
    variants.add(rawValue);
    groups.set(normalized, variants);
  }

  return Array.from(groups.entries())
    .filter(([, variants]) => variants.size > 1)
    .map(([normalizedValue, variants]) => ({
      normalizedValue,
      variants: Array.from(variants).sort(),
    }));
}

export function buildColumnProfiles(dataset: ParsedTabularData): ColumnProfile[] {
  return dataset.columnDefinitions.map((definition) => {
    const values = dataset.rows.map((row) => row[definition.key] ?? null);
    const nonNullValues = values.filter((value): value is string | number | boolean => value !== null);
    const uniqueValueKeys = new Set(nonNullValues.map((value) => toUniqueValueKey(value)));

    const semanticTypeCounts: Record<ColumnValueType, number> = {
      number: 0,
      text: 0,
      boolean: 0,
      date: 0,
      unknown: 0,
    };

    const stringValues: string[] = [];
    let numericTextCount = 0;
    let dateCandidateCount = 0;
    let invalidDateCandidateCount = 0;
    const dateFormatCounts: Record<string, number> = {};

    // Perfil semântico por coluna para que regras futuras reutilizem a mesma base.
    for (const value of nonNullValues) {
      if (typeof value === "number") {
        semanticTypeCounts.number += 1;
        continue;
      }

      if (typeof value === "boolean") {
        semanticTypeCounts.boolean += 1;
        continue;
      }

      const trimmed = value.trim();
      stringValues.push(trimmed);

      if (trimmed === "") {
        semanticTypeCounts.unknown += 1;
        continue;
      }

      if (isNumericLikeString(trimmed)) {
        numericTextCount += 1;
        semanticTypeCounts.number += 1;
        continue;
      }

      if (isDateLikeString(trimmed)) {
        dateCandidateCount += 1;
        semanticTypeCounts.date += 1;

        const family = detectDateFamily(trimmed) ?? "unknown";
        dateFormatCounts[family] = (dateFormatCounts[family] ?? 0) + 1;

        if (!isValidDateLikeString(trimmed)) {
          invalidDateCandidateCount += 1;
        }
        continue;
      }

      semanticTypeCounts.text += 1;
    }

    return {
      columnKey: definition.key,
      sourceName: definition.sourceName,
      index: definition.index,
      values,
      nonNullValues,
      stringValues,
      nullCount: values.length - nonNullValues.length,
      nonNullCount: nonNullValues.length,
      uniqueNonNullCount: uniqueValueKeys.size,
      semanticTypeCounts,
      numericTextCount,
      dateCandidateCount,
      dateFormatCounts,
      invalidDateCandidateCount,
      categoricalVariantGroups: buildCategoricalVariantGroups(stringValues),
    };
  });
}

export function buildColumnMetrics(profiles: ColumnProfile[], rowCount: number) {
  return profiles.map((profile) => {
    const inferredType = inferDominantType(profile.semanticTypeCounts);
    const nonNull = profile.nonNullCount;
    const nullPercentage = toRatio(profile.nullCount, rowCount);
    const hasMixedTypes = inferredType === "mixed";

    return {
      columnKey: profile.columnKey,
      sourceName: profile.sourceName,
      columnIndex: profile.index,
      nullCount: profile.nullCount,
      nullPercentage,
      nonNullCount: nonNull,
      uniqueNonNullCount: profile.uniqueNonNullCount,
      inferredType,
      hasMixedTypes,
      numericTextRatio: toRatio(profile.numericTextCount, nonNull),
      dateCandidateRatio: toRatio(profile.dateCandidateCount, nonNull),
      isNearlyEmpty: nullPercentage >= 0.9,
      isConstant: profile.uniqueNonNullCount <= 1 && nonNull > 0,
    };
  });
}

export function clampTreatmentNeedScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function collectIssueColumns(problems: QualityProblem[]) {
  return new Set(problems.flatMap((problem) => problem.affectedColumns));
}
