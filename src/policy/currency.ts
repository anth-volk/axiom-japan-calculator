import type { ManifestInput } from "../engine/types";
import type { Language } from "../i18n/translations";

export type MoneyCadence = "annual" | "monthly";

export interface UsdConversionRate {
  yenPerUsd: number;
  kind: "annual-average" | "current-reference";
  referenceDate?: string;
}

// Annual daily-average rates, Japanese yen per U.S. dollar. Source: the
// Federal Reserve Board's G.5A series (AEXJPUS), retrieved 2026-07-29.
// 2026 intentionally uses the latest available Bank of Japan central rate,
// rather than an incomplete annual average.
const USD_CONVERSION_RATES: Record<number, UsdConversionRate> = {
  2017: { yenPerUsd: 112.0986, kind: "annual-average" },
  2018: { yenPerUsd: 110.3974, kind: "annual-average" },
  2019: { yenPerUsd: 109.0188, kind: "annual-average" },
  2020: { yenPerUsd: 106.7754, kind: "annual-average" },
  2021: { yenPerUsd: 109.8429, kind: "annual-average" },
  2022: { yenPerUsd: 131.4589, kind: "annual-average" },
  2023: { yenPerUsd: 140.5001, kind: "annual-average" },
  2024: { yenPerUsd: 151.4551, kind: "annual-average" },
  2025: { yenPerUsd: 149.5686, kind: "annual-average" },
  2026: {
    yenPerUsd: 163.68,
    kind: "current-reference",
    referenceDate: "2026-07-29",
  },
};

const MONTHLY_MONEY_SLOTS = new Set([
  "japan_employees_pension_monthly_remuneration",
  "japan_employees_pension_gross_bonus",
  "japan_employment_insurance_covered_wages_paid",
]);

export function isMoneyInput(input: ManifestInput): boolean {
  return input.kind === "decimal" && !input.integer;
}

export function moneyCadence(slot: string): MoneyCadence {
  return MONTHLY_MONEY_SLOTS.has(slot) ? "monthly" : "annual";
}

export function moneyScale(
  language: Language,
  cadence: MoneyCadence,
): number {
  if (cadence === "monthly") return 1_000;
  return language === "ja" ? 10_000 : 1_000_000;
}

export function moneyUnit(
  language: Language,
  cadence: MoneyCadence,
): string {
  if (cadence === "monthly") return language === "ja" ? "千円" : "thousand";
  return language === "ja" ? "万円" : "million";
}

export function moneyPrefix(language: Language): string {
  return language === "en" ? "¥" : "";
}

function locale(language: Language) {
  return language === "ja" ? "ja-JP" : "en-US";
}

function formatRate(value: number, language: Language): string {
  return new Intl.NumberFormat(locale(language), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function usdConversionRateForYear(
  calendarYear: number,
): UsdConversionRate | null {
  return USD_CONVERSION_RATES[calendarYear] ?? null;
}

export function formatUsdEquivalent(
  yen: number,
  language: Language,
  rate: UsdConversionRate | null,
): string | null {
  if (!rate || !Number.isFinite(yen)) return null;
  const sign = yen < 0 ? "−" : "";
  const dollars = new Intl.NumberFormat(locale(language), {
    maximumFractionDigits: 0,
  }).format(Math.abs(yen) / rate.yenPerUsd);
  return language === "ja"
    ? `約${sign}US$${dollars}`
    : `≈ ${sign}US$${dollars}`;
}

export function usdRateNote(
  calendarYear: number,
  language: Language,
  rate: UsdConversionRate | null,
): string | null {
  if (!rate) return null;
  const rateLabel = `¥${formatRate(rate.yenPerUsd, language)} / US$1`;
  if (rate.kind === "current-reference") {
    return language === "ja"
      ? `米ドル換算は概算です。${rate.referenceDate}時点の日本銀行の中心相場（${rateLabel}）を使用しています。`
      : `US dollar equivalents are approximate and use the Bank of Japan central rate on ${rate.referenceDate} (${rateLabel}).`;
  }
  return language === "ja"
    ? `米ドル換算は概算です。${calendarYear}年の日次平均為替レート（${rateLabel}）を使用しています。`
    : `US dollar equivalents are approximate and use the ${calendarYear} annual daily-average exchange rate (${rateLabel}).`;
}

export function yenToDisplay(
  rawYen: string | undefined,
  language: Language,
  cadence: MoneyCadence,
): string {
  const yen = Number(rawYen ?? "0");
  if (!Number.isFinite(yen)) return "0";
  return String(yen / moneyScale(language, cadence));
}

export function displayToYen(
  displayValue: string,
  language: Language,
  cadence: MoneyCadence,
): string {
  if (displayValue.trim() === "") return "0";
  const displayed = Number(displayValue);
  if (!Number.isFinite(displayed)) return "0";
  return String(Math.round(displayed * moneyScale(language, cadence)));
}
