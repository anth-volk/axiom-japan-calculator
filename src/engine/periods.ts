import type { Language } from "../i18n/translations";

export interface ExecutionPeriod {
  period_kind: "month" | "tax_year";
  start: string;
  end: string;
}

export const SUPPORTED_FISCAL_YEARS = [
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
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

export function taxPeriodForFiscalYear(fiscalYear: number): ExecutionPeriod {
  return {
    period_kind: "tax_year",
    start: fiscalYear === 2017 ? "2017-04-01" : `${fiscalYear}-01-01`,
    end: `${fiscalYear}-12-31`,
  };
}

export function fiscalYearPeriod(fiscalYear: number): ExecutionPeriod {
  return {
    period_kind: "month",
    start: `${fiscalYear}-04-01`,
    end: `${fiscalYear + 1}-03-31`,
  };
}

export function fiscalYearMonths(fiscalYear: number): string[] {
  return Array.from({ length: 12 }, (_, index) => {
    const offset = index + 3;
    const year = fiscalYear + Math.floor(offset / 12);
    const month = (offset % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  });
}

export function isSupportedFiscalYear(fiscalYear: number): boolean {
  return (SUPPORTED_FISCAL_YEARS as readonly number[]).includes(fiscalYear);
}

export function fiscalYearEra(fiscalYear: number): {
  english: string;
  japanese: string;
} {
  if (fiscalYear <= 2018) {
    const year = fiscalYear - 1988;
    return { english: `Heisei ${year}`, japanese: `平成${year}年度` };
  }
  const year = fiscalYear - 2018;
  return {
    english: `Reiwa ${year}`,
    japanese: `令和${year === 1 ? "元" : year}年度`,
  };
}

export function fiscalYearLabel(
  fiscalYear: number,
  language: Language,
  includeRange = false,
): string {
  const era = fiscalYearEra(fiscalYear);
  const base =
    language === "ja"
      ? `${fiscalYear}年度（${era.japanese}）`
      : `FY ${fiscalYear} (${era.english})`;
  if (!includeRange) return base;
  return language === "ja"
    ? `${base} · ${fiscalYear}年4月〜${fiscalYear + 1}年3月`
    : `${base} · Apr ${fiscalYear}–Mar ${fiscalYear + 1}`;
}
