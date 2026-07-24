import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import {
  assertJapaneseCoverage,
  inputLabel,
  outputLabel,
  programCopy,
} from "./translations";

const manifest = rawManifest as GeneratedManifest;

describe("Japanese localization", () => {
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
