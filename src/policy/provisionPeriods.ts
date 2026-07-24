import type { ManifestOutput } from "../engine/types";

const SPECIFIC_RELATIVE_PREFIX = "japan_pit_specific_relative_";

export function isInputApplicable(
  slot: string,
  calendarYear: number,
): boolean {
  if (slot.startsWith(SPECIFIC_RELATIVE_PREFIX)) return calendarYear >= 2025;
  if (
    slot === "japan_pit_is_special_widow" ||
    slot === "japan_pit_is_widow_or_widower"
  ) {
    return calendarYear <= 2019;
  }
  if (
    slot === "japan_pit_is_single_parent" ||
    slot === "japan_pit_is_widow"
  ) {
    return calendarYear >= 2020;
  }
  if (
    slot === "japan_child_allowance_high_school_first_or_second_count" ||
    slot === "japan_child_allowance_high_school_third_or_later_count"
  ) {
    return calendarYear >= 2024;
  }
  if (
    slot === "japan_child_allowance_assessed_income" ||
    slot === "japan_child_allowance_ordinary_dependent_count" ||
    slot === "japan_child_allowance_elderly_dependent_count"
  ) {
    return calendarYear <= 2024;
  }
  if (slot === "japan_2024_fixed_credit_qualifying_family_member_count") {
    return calendarYear === 2024;
  }
  return true;
}

export function isOutputApplicable(
  output: ManifestOutput,
  calendarYear: number,
): boolean {
  if (output.label === "2024 fixed income-tax credit") {
    return calendarYear === 2024;
  }
  if (output.label === "Defense special income tax") {
    return calendarYear >= 2027;
  }
  return true;
}
