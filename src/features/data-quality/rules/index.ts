import type { AnalysisRule } from "@/features/data-quality/types";
import { categoricalVariationsRule } from "@/features/data-quality/rules/categoricalVariationsRule";
import { columnNameQualityRule } from "@/features/data-quality/rules/columnNameQualityRule";
import { constantColumnsRule } from "@/features/data-quality/rules/constantColumnsRule";
import { duplicateRowsRule } from "@/features/data-quality/rules/duplicateRowsRule";
import { inconsistentDatesRule } from "@/features/data-quality/rules/inconsistentDatesRule";
import { mixedDataTypesRule } from "@/features/data-quality/rules/mixedDataTypesRule";
import { nullAndSparseColumnsRule } from "@/features/data-quality/rules/nullAndSparseColumnsRule";
import { numericAsTextRule } from "@/features/data-quality/rules/numericAsTextRule";

export const defaultAnalysisRules: AnalysisRule[] = [
  nullAndSparseColumnsRule,
  duplicateRowsRule,
  columnNameQualityRule,
  mixedDataTypesRule,
  numericAsTextRule,
  inconsistentDatesRule,
  categoricalVariationsRule,
  constantColumnsRule,
];
