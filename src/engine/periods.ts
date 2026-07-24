import type { Language } from "../i18n/translations";

export interface ExecutionPeriod {
  period_kind: "month" | "tax_year";
  start: string;
  end: string;
}

export const SUPPORTED_CALENDAR_YEARS = [
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
] as const;

export function monthPeriod(month: string): ExecutionPeriod {
  const [year, rawMonth] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, rawMonth, 0)).getUTCDate();
  return {
    period_kind: "month",
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function calendarYearPeriod(calendarYear: number): ExecutionPeriod {
  return {
    period_kind: "tax_year",
    start: calendarYear === 2017 ? "2017-04-01" : `${calendarYear}-01-01`,
    end: `${calendarYear}-12-31`,
  };
}

export function calendarYearMonths(calendarYear: number): string[] {
  const firstMonth = calendarYear === 2017 ? 4 : 1;
  return Array.from({ length: 13 - firstMonth }, (_, index) => {
    const month = firstMonth + index;
    return `${calendarYear}-${String(month).padStart(2, "0")}`;
  });
}

export function isSupportedCalendarYear(calendarYear: number): boolean {
  return (SUPPORTED_CALENDAR_YEARS as readonly number[]).includes(calendarYear);
}

export function calendarYearEra(calendarYear: number): {
  english: string;
  japanese: string;
} {
  if (calendarYear <= 2018) {
    const year = calendarYear - 1988;
    return { english: `Heisei ${year}`, japanese: `平成${year}年` };
  }
  if (calendarYear === 2019) {
    return {
      english: "Heisei 31 / Reiwa 1",
      japanese: "平成31年・令和元年",
    };
  }
  const year = calendarYear - 2018;
  return {
    english: `Reiwa ${year}`,
    japanese: `令和${year}年`,
  };
}

export function calendarYearLabel(
  calendarYear: number,
  language: Language,
): string {
  const era = calendarYearEra(calendarYear);
  return language === "ja"
    ? `${calendarYear}年（${era.japanese}）`
    : `${calendarYear} (${era.english})`;
}
