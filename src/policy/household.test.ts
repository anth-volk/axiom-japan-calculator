import { describe, expect, it } from "vitest";
import rawManifest from "../../public/generated/manifest.json";
import type { GeneratedManifest } from "../engine/types";
import {
  buildCalculationPeople,
  createExampleHousehold,
  createMember,
} from "./household";

const manifest = rawManifest as GeneratedManifest;

describe("household wizard mapping", () => {
  it("maps the example to one taxpayer and one household claimant", () => {
    const household = createExampleHousehold(manifest);
    const people = buildCalculationPeople(household);
    expect(people).toHaveLength(1);
    expect(people[0].includeBenefits).toBe(true);
    expect(
      people[0].values
        .japan_child_allowance_primary_age_first_or_second_count,
    ).toBe("1");
    expect(people[0].values.japan_pit_ordinary_dependent_count).toBe("0");
  });

  it("creates separate taxpayer payloads and month-specific bonuses", () => {
    const household = createExampleHousehold(manifest);
    const spouse = createMember(manifest, 2, "spouse");
    spouse.name = "Spouse";
    spouse.summerBonus = "500000";
    household.maritalStatus = "married";
    household.members.push(spouse);
    const people = buildCalculationPeople(household);

    expect(people).toHaveLength(2);
    expect(people.filter((person) => person.includeBenefits)).toHaveLength(1);
    expect(
      people[1].monthlyOverrides["2018-06"]
        .japan_employees_pension_gross_bonus,
    ).toBe("500000");
  });
});
