import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import { buildPreset } from "./presets";

const manifest = rawManifest as GeneratedManifest;

describe("generated Wave 1 input contract", () => {
  it("exposes all nine programs and 108 unique inputs", () => {
    expect(manifest.programs).toHaveLength(9);
    expect(manifest.inputs).toHaveLength(108);
    expect(new Set(manifest.inputs.map((input) => input.slot)).size).toBe(108);
  });

  it("builds a type-correct blank value for every generated input", () => {
    const values = buildPreset(manifest, "blank");
    expect(Object.keys(values)).toHaveLength(108);

    for (const input of manifest.inputs) {
      expect(values[input.slot]).toBe(input.kind === "bool" ? false : "0");
    }
  });

  it("keeps the validated scenario values inside the generated contract", () => {
    const values = buildPreset(manifest, "validated-working-parent");
    expect(Object.keys(values)).toHaveLength(108);
    expect(values.japan_employment_gross_cash_earnings).toBe("3600000");
    expect(values.japan_employees_pension_monthly_remuneration).toBe("300000");
    expect(values.japan_child_allowance_primary_age_first_or_second_count).toBe("1");
    expect(values.japan_child_allowance_meets_nonfinancial_conditions).toBe(true);
  });
});
