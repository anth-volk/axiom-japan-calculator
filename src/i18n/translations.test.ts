import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import {
  INPUT_PANEL_COPY,
  PRESET_COPY,
  UI_COPY,
  assertJapaneseCoverage,
  inputDescription,
  inputLabel,
  outputLabel,
  programCopy,
} from "./translations";

const manifest = rawManifest as GeneratedManifest;

describe("Japanese localization", () => {
  it("does not expose retired release terminology in interface copy", () => {
    expect(
      JSON.stringify([UI_COPY, PRESET_COPY, INPUT_PANEL_COPY]),
    ).not.toMatch(/wave[\s-]*1/i);
  });

  it("covers every generated input, program, and visible output", () => {
    expect(assertJapaneseCoverage(manifest.inputs, manifest.programs)).toEqual([]);
  });

  it("does not fall back to English for representative policy terms", () => {
    const input = manifest.inputs.find(
      (item) => item.slot === "japan_employees_pension_monthly_remuneration",
    )!;
    const program = manifest.programs.find(
      (item) => item.id === "child-allowance",
    )!;
    expect(inputLabel(input, "ja")).toBe("月額報酬");
    expect(programCopy(program, "ja").label).toBe("児童手当");
    expect(outputLabel(program.outputs.at(-1)!, "ja")).toBe("児童手当");
  });
});

describe("English input copy", () => {
  it("does not expose the internal income-tax abbreviation", () => {
    expect(
      manifest.inputs
        .map((input) => inputLabel(input, "en"))
        .filter((label) => /\bPIT\b/.test(label)),
    ).toEqual([]);
  });

  it("uses sentence case, expands income tax, and explains technical bands", () => {
    const input = manifest.inputs.find(
      (item) => item.slot === "japan_pit_specific_relative_band_6_count",
    )!;
    expect(inputLabel(input, "en")).toBe(
      "Qualifying relatives in income band 6",
    );
    expect(inputLabel(input, "en")).not.toContain("PIT");
    expect(inputDescription(input, "en")).toContain(
      "1.05 and 1.10 million yen",
    );
    expect(inputDescription(input, "en")).toContain("tax year 2025");
  });
});
