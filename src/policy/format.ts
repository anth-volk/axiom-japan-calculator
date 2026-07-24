import type { AxiomOutputValue, ManifestOutput } from "../engine/types";

const yen = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

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

export function formatYen(value: number): string {
  return yen.format(value);
}

export function formatOutput(
  value: AxiomOutputValue | undefined,
  metadata: ManifestOutput,
): string {
  const primitive = outputPrimitive(value);
  if (primitive === null || primitive === undefined) return "—";
  if (typeof primitive === "boolean") return primitive ? "Yes" : "No";
  const numeric = typeof primitive === "number" ? primitive : Number(primitive);
  if (!Number.isFinite(numeric)) return String(primitive);
  if (metadata.role === "rate") return `${number.format(numeric * 100)}%`;
  if (metadata.unit === "JPY") return formatYen(numeric);
  return number.format(numeric);
}
