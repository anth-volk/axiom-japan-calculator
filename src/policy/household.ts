import type {
  CalculationPersonInput,
  GeneratedManifest,
  InputValue,
} from "../engine/types";
import { buildPreset } from "./presets";

export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export type MemberRole = "primary" | "spouse" | "child" | "other";
export type DependentCategory =
  | "none"
  | "ordinary"
  | "specified"
  | "elderly"
  | "cohabiting-elderly";
export type DisabilityCategory =
  | "none"
  | "ordinary"
  | "special"
  | "cohabiting-special";
export type ChildAllowanceBand =
  | "none"
  | "under-three-first-second"
  | "under-three-third-plus"
  | "primary-first-second"
  | "primary-third-plus"
  | "junior-high-first-second"
  | "junior-high-third-plus"
  | "high-school-first-second"
  | "high-school-third-plus";

export interface HouseholdMember {
  id: string;
  name: string;
  role: MemberRole;
  birthDate: string;
  calculateTaxAndContributions: boolean;
  dependentCategory: DependentCategory;
  disabilityCategory: DisabilityCategory;
  childAllowanceBand: ChildAllowanceBand;
  summerBonus: string;
  winterBonus: string;
  useModeledSocialInsurance: boolean;
  values: Record<string, InputValue>;
}

export interface HouseholdDraft {
  calendarYear: number;
  maritalStatus: MaritalStatus;
  members: HouseholdMember[];
}

export function blankValues(
  manifest: GeneratedManifest,
): Record<string, InputValue> {
  return buildPreset(manifest, "blank");
}

export function createMember(
  manifest: GeneratedManifest,
  index: number,
  role: MemberRole = "other",
): HouseholdMember {
  const values = blankValues(manifest);
  values.japan_pit_is_resident_under_article_2 = true;
  values.japan_pit_income_is_ordinary_domestic_source = true;
  return {
    id: `member-${crypto.randomUUID()}`,
    name: index === 0 ? "Primary taxpayer" : `Member ${index + 1}`,
    role,
    birthDate: index === 0 ? "1978-06-15" : "2010-06-15",
    calculateTaxAndContributions: role === "primary" || role === "spouse",
    dependentCategory: "none",
    disabilityCategory: "none",
    childAllowanceBand: role === "child" ? "primary-first-second" : "none",
    summerBonus: "0",
    winterBonus: "0",
    useModeledSocialInsurance: true,
    values,
  };
}

export function createExampleHousehold(
  manifest: GeneratedManifest,
  language: "en" | "ja" = "en",
): HouseholdDraft {
  const primary = createMember(manifest, 0, "primary");
  primary.name = language === "ja" ? "就労する親" : "Working parent";
  primary.values = buildPreset(manifest, "validated-working-parent");
  primary.birthDate = "1978-06-15";

  const child = createMember(manifest, 1, "child");
  child.name = language === "ja" ? "子" : "Child";
  child.birthDate = "2010-06-15";

  return {
    calendarYear: 2018,
    maritalStatus: "single",
    members: [primary, child],
  };
}

export function ageAtYearEnd(birthDate: string, calendarYear: number): number {
  const year = Number(birthDate.slice(0, 4));
  if (!Number.isInteger(year)) return 0;
  return Math.max(0, calendarYear - year);
}

function numberValue(value: InputValue | undefined): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function setCount(
  values: Record<string, InputValue>,
  slot: string,
  count: number,
) {
  values[slot] = String(count);
}

function applyFamilyFacts(
  household: HouseholdDraft,
  member: HouseholdMember,
): Record<string, InputValue> {
  const values = { ...member.values };
  const spouse =
    household.maritalStatus === "married"
      ? household.members.find(
          (candidate) =>
            candidate.id !== member.id &&
            (candidate.role === "spouse" || member.role === "spouse"),
        )
      : undefined;
  if (spouse) {
    values.japan_pit_spouse_total_income =
      spouse.values.japan_pit_total_income_amount ?? "0";
    values.japan_pit_spouse_is_elderly =
      ageAtYearEnd(spouse.birthDate, household.calendarYear) >= 70;
  }

  const dependants =
    member.role === "primary"
      ? household.members.filter(
          (candidate) =>
            candidate.id !== member.id &&
            candidate.role !== "spouse" &&
            candidate.dependentCategory !== "none",
        )
      : [];
  setCount(
    values,
    "japan_pit_ordinary_dependent_count",
    dependants.filter((item) => item.dependentCategory === "ordinary").length,
  );
  setCount(
    values,
    "japan_pit_specified_dependent_count",
    dependants.filter((item) => item.dependentCategory === "specified").length,
  );
  setCount(
    values,
    "japan_pit_elderly_dependent_count",
    dependants.filter((item) => item.dependentCategory === "elderly").length,
  );
  setCount(
    values,
    "japan_pit_cohabiting_elderly_dependent_count",
    dependants.filter(
      (item) => item.dependentCategory === "cohabiting-elderly",
    ).length,
  );

  const familyForDisability =
    member.role === "primary" ? [member, ...dependants] : [member];
  setCount(
    values,
    "japan_pit_ordinary_disabled_person_count",
    familyForDisability.filter(
      (item) => item.disabilityCategory === "ordinary",
    ).length,
  );
  setCount(
    values,
    "japan_pit_special_disabled_person_count",
    familyForDisability.filter(
      (item) => item.disabilityCategory === "special",
    ).length,
  );
  setCount(
    values,
    "japan_pit_cohabiting_special_disabled_person_count",
    familyForDisability.filter(
      (item) => item.disabilityCategory === "cohabiting-special",
    ).length,
  );

  const qualifyingFamily = dependants.length + (spouse ? 1 : 0);
  setCount(
    values,
    "japan_2024_fixed_credit_qualifying_family_member_count",
    qualifyingFamily,
  );
  values.japan_pit_income_adjustment_has_qualifying_child_or_disability_condition =
    dependants.some(
      (item) => ageAtYearEnd(item.birthDate, household.calendarYear) < 23,
    ) ||
    familyForDisability.some(
      (item) => item.disabilityCategory !== "none",
    );
  values.japan_public_pension_recipient_age_at_statutory_test_date = String(
    ageAtYearEnd(member.birthDate, household.calendarYear),
  );

  if (member.role === "primary") {
    const bandSlots: Record<Exclude<ChildAllowanceBand, "none">, string> = {
      "under-three-first-second":
        "japan_child_allowance_under_three_first_or_second_count",
      "under-three-third-plus":
        "japan_child_allowance_under_three_third_or_later_count",
      "primary-first-second":
        "japan_child_allowance_primary_age_first_or_second_count",
      "primary-third-plus":
        "japan_child_allowance_primary_age_third_or_later_count",
      "junior-high-first-second":
        "japan_child_allowance_junior_high_first_or_second_count",
      "junior-high-third-plus":
        "japan_child_allowance_junior_high_third_or_later_count",
      "high-school-first-second":
        "japan_child_allowance_high_school_first_or_second_count",
      "high-school-third-plus":
        "japan_child_allowance_high_school_third_or_later_count",
    };
    for (const slot of Object.values(bandSlots)) setCount(values, slot, 0);
    for (const candidate of household.members) {
      if (candidate.childAllowanceBand === "none") continue;
      const slot = bandSlots[candidate.childAllowanceBand];
      setCount(values, slot, numberValue(values[slot]) + 1);
    }
  }
  return values;
}

export function buildCalculationPeople(
  household: HouseholdDraft,
): CalculationPersonInput[] {
  return household.members
    .filter((member) => member.calculateTaxAndContributions)
    .map((member) => {
      const monthlyOverrides: Record<
        string,
        Record<string, InputValue>
      > = {};
      if (numberValue(member.summerBonus) !== 0) {
        monthlyOverrides[`${household.calendarYear}-06`] = {
          japan_employees_pension_gross_bonus: member.summerBonus,
        };
      }
      if (numberValue(member.winterBonus) !== 0) {
        monthlyOverrides[`${household.calendarYear}-12`] = {
          japan_employees_pension_gross_bonus: member.winterBonus,
        };
      }
      return {
        id: member.id,
        label: member.name,
        values: applyFamilyFacts(household, member),
        monthlyOverrides,
        includeBenefits: member.role === "primary",
        useModeledSocialInsurance: member.useModeledSocialInsurance,
      };
    });
}
