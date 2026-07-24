import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import { isInputApplicable, isOutputApplicable } from "./provisionPeriods";

const manifest = rawManifest as GeneratedManifest;

function outputWithLabel(label: string) {
  const output = manifest.programs
    .flatMap((program) => program.outputs)
    .find((candidate) => candidate.label === label);
  if (!output) throw new Error(`Missing test output: ${label}`);
  return output;
}

describe("period-aware provision inputs", () => {
  it("shows historical and replacement family statuses in their own years", () => {
    expect(isInputApplicable("japan_pit_is_special_widow", 2019)).toBe(true);
    expect(isInputApplicable("japan_pit_is_special_widow", 2020)).toBe(false);
    expect(isInputApplicable("japan_pit_is_single_parent", 2019)).toBe(false);
    expect(isInputApplicable("japan_pit_is_single_parent", 2020)).toBe(true);
  });

  it("shows reform-specific inputs only when a year can use them", () => {
    expect(
      isInputApplicable("japan_pit_specific_relative_band_6_count", 2024),
    ).toBe(false);
    expect(
      isInputApplicable("japan_pit_specific_relative_band_6_count", 2025),
    ).toBe(true);
    expect(
      isInputApplicable(
        "japan_child_allowance_high_school_first_or_second_count",
        2023,
      ),
    ).toBe(false);
    expect(
      isInputApplicable(
        "japan_child_allowance_high_school_first_or_second_count",
        2024,
      ),
    ).toBe(true);
  });

  it("removes the Child Allowance income test after its 2024 repeal", () => {
    expect(
      isInputApplicable("japan_child_allowance_assessed_income", 2024),
    ).toBe(true);
    expect(
      isInputApplicable("japan_child_allowance_assessed_income", 2025),
    ).toBe(false);
  });

  it("shows one-year and future result lines only in applicable years", () => {
    const fixedCredit = outputWithLabel("2024 fixed income-tax credit");
    const defenseTax = outputWithLabel("Defense special income tax");

    expect(isOutputApplicable(fixedCredit, 2024)).toBe(true);
    expect(isOutputApplicable(fixedCredit, 2025)).toBe(false);
    expect(isOutputApplicable(defenseTax, 2026)).toBe(false);
    expect(isOutputApplicable(defenseTax, 2027)).toBe(true);
  });
});
