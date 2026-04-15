const DATE_FAMILY_PATTERNS: Array<{ family: string; regex: RegExp }> = [
  { family: "iso", regex: /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/ },
  { family: "dmy_or_mdy", regex: /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/ },
];

const NUMBER_PATTERN = /^[+-]?\d+(?:[.,]\d+)?$/;

function isValidDateParts(day: number, month: number, year: number) {
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return false;
  }

  if (year < 100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function isValidIsoDate(raw: string) {
  const [dateSection] = raw.split(/[ T]/);
  const [yearPart, monthPart, dayPart] = dateSection.split(/[-/]/);
  return isValidDateParts(Number(dayPart), Number(monthPart), Number(yearPart));
}

function isValidDmyOrMdyDate(raw: string) {
  const [part1, part2, yearPart] = raw.split(/[-/]/).map((part) => Number(part));
  return isValidDateParts(part1, part2, yearPart) || isValidDateParts(part2, part1, yearPart);
}

export function isNumericLikeString(value: string) {
  return NUMBER_PATTERN.test(value.trim());
}

export function detectDateFamily(value: string): string | null {
  const trimmed = value.trim();

  for (const pattern of DATE_FAMILY_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      return pattern.family;
    }
  }

  return null;
}

export function isDateLikeString(value: string) {
  return detectDateFamily(value) !== null;
}

export function isValidDateLikeString(value: string) {
  const trimmed = value.trim();
  const family = detectDateFamily(trimmed);

  if (!family) {
    return false;
  }

  if (family === "iso") {
    return isValidIsoDate(trimmed);
  }

  return isValidDmyOrMdyDate(trimmed);
}

export function normalizeCategoryValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
