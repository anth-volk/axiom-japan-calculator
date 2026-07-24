import type { AxiomOutputValue, ManifestOutput } from "../engine/types";
import type { Language } from "../i18n/translations";

function locale(language: Language) {
  return language === "ja" ? "ja-JP" : "en-US";
}

export function outputPrimitive(output: AxiomOutputValue | undefined) {
  if (!output) return null;
  if (output.kind === "judgment") return output.outcome === "holds";
  return output.value.value;
}

export function numericOutput(output: AxiomOutputValue | undefined): number {
  const primitive = outputPrimitive(output);
  if (typeof primitive === "number") return primitive;
  if (typeof primitive === "string") {
    const parsed = Number(primitive);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function formatYen(value: number, language: Language = "en"): string {
  if (language === "ja") {
    return `${new Intl.NumberFormat("ja-JP", {
      maximumFractionDigits: 0,
    }).format(value)}円`;
  }
  return new Intl.NumberFormat(locale(language), {
    style: "currency",
    currency: "JPY",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOutput(
  value: AxiomOutputValue | undefined,
  metadata: ManifestOutput,
  language: Language = "en",
): string {
  const primitive = outputPrimitive(value);
  if (primitive === null || primitive === undefined) return "—";
  if (typeof primitive === "boolean") {
    if (language === "ja") return primitive ? "はい" : "いいえ";
    return primitive ? "Yes" : "No";
  }
  const numeric = typeof primitive === "number" ? primitive : Number(primitive);
  if (!Number.isFinite(numeric)) return String(primitive);
  const number = new Intl.NumberFormat(locale(language), {
    maximumFractionDigits: 2,
  });
  if (metadata.role === "rate") return `${number.format(numeric * 100)}%`;
  if (metadata.unit === "JPY") return formatYen(numeric, language);
  return number.format(numeric);
}

export function formatMonth(month: string, language: Language): string {
  const [year, rawMonth] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(language), {
    year: "numeric",
    month: language === "ja" ? "long" : "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, rawMonth - 1, 1)));
}
