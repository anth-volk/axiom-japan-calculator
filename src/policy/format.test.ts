import { describe, expect, it } from "vitest";
import type { AxiomOutputValue, ManifestOutput } from "../engine/types";
import { formatOutput, formatYen, numericOutput, outputPrimitive } from "./format";

const decimal: AxiomOutputValue = {
  kind: "scalar",
  name: "example",
  dtype: "decimal",
  unit: "JPY",
  value: { kind: "decimal", value: "82649" },
};

const metadata: ManifestOutput = {
  id: "example",
  label: "Example",
  role: "summary",
  dtype: "decimal",
  unit: "JPY",
  period: "tax_year",
  corpusCitationPath: null,
  sourceUrl: null,
};

describe("policy output formatting", () => {
  it("preserves the primitive and parses numeric decimal values", () => {
    expect(outputPrimitive(decimal)).toBe("82649");
    expect(numericOutput(decimal)).toBe(82649);
  });

  it("formats Japanese yen without fractional minor units", () => {
    expect(formatYen(82649)).toBe("¥82,649");
    expect(formatOutput(decimal, metadata)).toBe("¥82,649");
    expect(formatYen(82649, "ja")).toBe("82,649円");
    expect(formatOutput(decimal, metadata, "ja")).toBe("82,649円");
  });

  it("treats missing and nonnumeric outputs safely", () => {
    expect(numericOutput(undefined)).toBe(0);
    expect(formatOutput(undefined, metadata)).toBe("—");
  });
});
