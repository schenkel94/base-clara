export const QUALITY_THRESHOLDS = {
  highNullPercentage: 0.3,
  nearlyEmptyColumn: 0.9,
  mixedTypesMinNonNull: 8,
  mixedTypesMinShare: 0.15,
  numericAsTextMinNonNull: 6,
  numericAsTextRatio: 0.8,
  dateConsistencyMinCandidates: 5,
  categoricalVariantMinRows: 8,
} as const;
