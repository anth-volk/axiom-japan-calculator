import type { ManifestInput } from "../engine/types";
import type { Language } from "../i18n/translations";

export type MoneyCadence = "annual" | "monthly";

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
