import type { GeneratedManifest, InputValue } from "../engine/types";
import validatedWorkingParent from "../../config/validated-working-parent.json";

export const PRESETS = [
  {
    id: "validated-working-parent",
    label: "Validated 2018 working parent",
    description:
      "The complete Wave 1 component scenario from rulespec-jp: ¥3.6m employment earnings, one primary-school child, and ordinary employee coverage.",
  },
  {
    id: "blank",
    label: "Blank household",
    description: "Every amount is zero and every statutory-status flag is off.",
  },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];

const workingParentValues = validatedWorkingParent as Record<string, InputValue>;

export function buildPreset(
  manifest: GeneratedManifest,
  preset: PresetId,
): Record<string, InputValue> {
  const values = Object.fromEntries(
    manifest.inputs.map((input) => [
      input.slot,
      input.kind === "bool" ? false : "0",
    ]),
  ) as Record<string, InputValue>;

  if (preset === "validated-working-parent") {
    for (const [slot, value] of Object.entries(workingParentValues)) {
      if (slot in values) values[slot] = value;
    }
  }
  return values;
}
