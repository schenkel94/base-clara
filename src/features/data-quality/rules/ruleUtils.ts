import type { ColumnProfile } from "@/features/data-quality/types";

export function getColumnLabel(profile: Pick<ColumnProfile, "sourceName" | "columnKey">) {
  const trimmed = profile.sourceName.trim();
  return trimmed === "" ? profile.columnKey : trimmed;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
