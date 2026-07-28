import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import {
  buildCalculationPeople,
  createExampleHousehold,
  createMember,
  reconcileHouseholdComposition,
} from "./household";

const manifest = rawManifest as GeneratedManifest;

describe("household wizard mapping", () => {
  it("maps every household member into a complete calculation", () => {
    const household = createExampleHousehold(manifest);
    const people = buildCalculationPeople(household);
    expect(people).toHaveLength(2);
    expect(
      people[0].values
        .japan_child_allowance_primary_age_first_or_second_count,
    ).toBe("1");
    expect(
      people[1].values
        .japan_child_allowance_primary_age_first_or_second_count,
    ).toBe("0");
    expect(people[0].values.japan_pit_ordinary_dependent_count).toBe("1");
  });

  it("creates separate taxpayer payloads and month-specific bonuses", () => {
    const household = createExampleHousehold(manifest);
    const spouse = createMember(manifest, 2, "spouse");
    spouse.name = "Spouse";
    spouse.summerBonus = "500000";
    household.maritalStatus = "married";
    household.members.push(spouse);
    const people = buildCalculationPeople(household);
    const spouseCalculation = people.find(
      (person) => person.id === spouse.id,
    )!;

    expect(people).toHaveLength(3);
    expect(
      spouseCalculation.monthlyOverrides["2018-06"]
        .japan_employees_pension_gross_bonus,
    ).toBe("500000");
  });

  it("derives adults and children from marital status and child count", () => {
    const initial = createExampleHousehold(manifest);
    const existingChildId = initial.members[1].id;
    const married = reconcileHouseholdComposition(
      manifest,
      initial,
      "married",
      3,
    );

    expect(married.members.map((member) => member.role)).toEqual([
      "primary",
      "spouse",
      "child",
      "child",
      "child",
    ]);
    expect(married.members[2].id).toBe(existingChildId);
    expect(married.members[1].birthDate).toBe("1980-06-15");

    const divorced = reconcileHouseholdComposition(
      manifest,
      married,
      "divorced",
      3,
    );
    expect(divorced.members.map((member) => member.role)).toEqual([
      "primary",
      "child",
      "child",
      "child",
    ]);
    expect(divorced.members[1].id).toBe(existingChildId);
  });
});
