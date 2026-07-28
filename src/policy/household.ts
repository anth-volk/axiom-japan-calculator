import type {
  CalculationPersonInput,
  GeneratedManifest,
  InputValue,
} from "../engine/types";
import { calendarYearMonths } from "../engine/periods";
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

export const MONTHLY_VALUE_SLOTS = [
  "japan_employees_pension_monthly_remuneration",
  "japan_employment_insurance_covered_wages_paid",
] as const;

export type MonthlyValueSlot = (typeof MONTHLY_VALUE_SLOTS)[number];
export type MonthlyValueSource = "annual" | "manual";

export const AUTO_LINKED_SLOTS = [
  "japan_pit_total_income_amount",
  "japan_pit_taxpayer_total_income",
  "japan_pit_spouse_total_income",
  "japan_public_pension_other_income_excluding_public_pension",
  "japan_national_pension_is_category_one_insured",
  "japan_national_pension_applicant_adjusted_income",
  "japan_national_pension_income_test_dependent_count",
  "japan_national_pension_ordinary_dependent_count",
  "japan_national_pension_specified_dependent_count",
  "japan_national_pension_elderly_dependent_count",
  "japan_child_allowance_assessed_income",
  "japan_child_allowance_ordinary_dependent_count",
  "japan_child_allowance_elderly_dependent_count",
  "japan_child_rearing_allowance_adjusted_prior_year_income",
  "japan_child_rearing_allowance_highest_supporter_adjusted_income",
  "japan_child_rearing_allowance_income_limit_person_count",
  "japan_child_rearing_allowance_qualifying_child_count",
  "japan_child_rearing_allowance_specified_dependent_count",
  "japan_child_rearing_allowance_elderly_dependent_count",
  "japan_child_rearing_allowance_supporter_dependent_count",
  "japan_child_rearing_allowance_supporter_elderly_dependent_count",
  "japan_disability_allowance_supporter_dependent_count",
  "japan_disability_allowance_supporter_elderly_dependent_count",
  "japan_disabled_child_welfare_allowance_claimant_adjusted_income",
  "japan_disabled_child_welfare_allowance_highest_supporter_adjusted_income",
  "japan_individual_disability_allowance_claimant_ordinary_dependent_count",
  "japan_individual_disability_allowance_claimant_specified_dependent_count",
  "japan_individual_disability_allowance_claimant_elderly_dependent_count",
  "japan_special_child_rearing_allowance_claimant_adjusted_income",
  "japan_special_child_rearing_allowance_highest_supporter_adjusted_income",
  "japan_special_child_rearing_allowance_claimant_ordinary_dependent_count",
  "japan_special_child_rearing_allowance_claimant_specified_dependent_count",
  "japan_special_child_rearing_allowance_claimant_elderly_dependent_count",
  "japan_special_disability_allowance_claimant_adjusted_income",
  "japan_special_disability_allowance_highest_supporter_adjusted_income",
] as const;

export type AutoLinkedSlot = (typeof AUTO_LINKED_SLOTS)[number];
const AUTO_LINKED_SLOT_SET = new Set<string>(AUTO_LINKED_SLOTS);

export function isAutoLinkedSlot(slot: string): slot is AutoLinkedSlot {
  return AUTO_LINKED_SLOT_SET.has(slot);
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: MemberRole;
  birthDate: string;
  dependentCategory: DependentCategory;
  disabilityCategory: DisabilityCategory;
  childAllowanceBand: ChildAllowanceBand;
  summerBonus: string;
  winterBonus: string;
  useModeledSocialInsurance: boolean;
  manualOverrideSlots: AutoLinkedSlot[];
  monthlyValueSources: Record<MonthlyValueSlot, MonthlyValueSource>;
  monthlyValues: Record<string, Partial<Record<MonthlyValueSlot, string>>>;
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
    birthDate:
      role === "child"
        ? "2010-06-15"
        : index === 0
          ? "1978-06-15"
          : "1980-06-15",
    dependentCategory: role === "child" ? "ordinary" : "none",
    disabilityCategory: "none",
    childAllowanceBand: role === "child" ? "primary-first-second" : "none",
    summerBonus: "0",
    winterBonus: "0",
    useModeledSocialInsurance: true,
    manualOverrideSlots: [],
    monthlyValueSources: {
      japan_employees_pension_monthly_remuneration: "annual",
      japan_employment_insurance_covered_wages_paid: "annual",
    },
    monthlyValues: {},
    values,
  };
}

export function reconcileHouseholdComposition(
  manifest: GeneratedManifest,
  household: HouseholdDraft,
  maritalStatus: MaritalStatus,
  requestedChildCount: number,
  language: "en" | "ja" = "en",
): HouseholdDraft {
  const finiteChildCount = Number.isFinite(requestedChildCount)
    ? requestedChildCount
    : 0;
  const childCount = Math.max(
    0,
    Math.min(10, Math.trunc(finiteChildCount)),
  );
  const existingPrimary =
    household.members.find((member) => member.role === "primary") ??
    household.members[0] ??
    createMember(manifest, 0, "primary");
  const primary = {
    ...existingPrimary,
    role: "primary" as const,
  };

  const members: HouseholdMember[] = [primary];
  if (maritalStatus === "married") {
    const existingSpouse = household.members.find(
      (member) => member.role === "spouse",
    );
    const spouse =
      existingSpouse ??
      createMember(manifest, members.length, "spouse");
    members.push({
      ...spouse,
      name:
        existingSpouse?.name ?? (language === "ja" ? "配偶者" : "Spouse"),
      role: "spouse",
    });
  }

  const children = household.members
    .filter((member) => member.role === "child")
    .slice(0, childCount);
  while (children.length < childCount) {
    const ordinal = children.length + 1;
    const child = createMember(
      manifest,
      members.length + children.length,
      "child",
    );
    child.name = language === "ja" ? `子${ordinal}` : `Child ${ordinal}`;
    children.push(child);
  }
  members.push(
    ...children.map((child) => ({
      ...child,
      role: "child" as const,
    })),
  );

  return { ...household, maritalStatus, members };
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

export function usesAutomaticValue(
  member: HouseholdMember,
  slot: string,
): boolean {
  return (
    isAutoLinkedSlot(slot) && !member.manualOverrideSlots.includes(slot)
  );
}

function setAutomaticValue(
  member: HouseholdMember,
  values: Record<string, InputValue>,
  slot: AutoLinkedSlot,
  value: InputValue,
) {
  if (usesAutomaticValue(member, slot)) values[slot] = value;
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
  const householdDependants = household.members.filter(
    (candidate) =>
      candidate.id !== member.id &&
      candidate.role !== "spouse" &&
      candidate.dependentCategory !== "none",
  );
  const ordinaryHouseholdDependants = householdDependants.filter(
    (item) => item.dependentCategory === "ordinary",
  ).length;
  const specifiedHouseholdDependants = householdDependants.filter(
    (item) => item.dependentCategory === "specified",
  ).length;
  const elderlyHouseholdDependants = householdDependants.filter(
    (item) =>
      item.dependentCategory === "elderly" ||
      item.dependentCategory === "cohabiting-elderly",
  ).length;
  const householdDependantCount = householdDependants.length;
  const householdChildCount = household.members.filter(
    (candidate) => candidate.role === "child",
  ).length;
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

  setAutomaticValue(
    member,
    values,
    "japan_national_pension_is_category_one_insured",
    ageAtYearEnd(member.birthDate, household.calendarYear) >= 20 &&
      ageAtYearEnd(member.birthDate, household.calendarYear) < 60 &&
      values.japan_employees_pension_is_ordinary_covered_employee !== true,
  );
  setAutomaticValue(
    member,
    values,
    "japan_national_pension_income_test_dependent_count",
    String(householdDependantCount),
  );
  setAutomaticValue(
    member,
    values,
    "japan_national_pension_ordinary_dependent_count",
    String(ordinaryHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_national_pension_specified_dependent_count",
    String(specifiedHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_national_pension_elderly_dependent_count",
    String(elderlyHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_allowance_ordinary_dependent_count",
    String(ordinaryHouseholdDependants + specifiedHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_allowance_elderly_dependent_count",
    String(elderlyHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_income_limit_person_count",
    String(householdDependantCount),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_qualifying_child_count",
    String(householdChildCount),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_specified_dependent_count",
    String(specifiedHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_elderly_dependent_count",
    String(elderlyHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_supporter_dependent_count",
    String(householdDependantCount),
  );
  setAutomaticValue(
    member,
    values,
    "japan_child_rearing_allowance_supporter_elderly_dependent_count",
    String(elderlyHouseholdDependants),
  );
  setAutomaticValue(
    member,
    values,
    "japan_disability_allowance_supporter_dependent_count",
    String(householdDependantCount),
  );
  setAutomaticValue(
    member,
    values,
    "japan_disability_allowance_supporter_elderly_dependent_count",
    String(elderlyHouseholdDependants),
  );
  for (const slot of [
    "japan_individual_disability_allowance_claimant_ordinary_dependent_count",
    "japan_special_child_rearing_allowance_claimant_ordinary_dependent_count",
  ] as const) {
    setAutomaticValue(member, values, slot, String(ordinaryHouseholdDependants));
  }
  for (const slot of [
    "japan_individual_disability_allowance_claimant_specified_dependent_count",
    "japan_special_child_rearing_allowance_claimant_specified_dependent_count",
  ] as const) {
    setAutomaticValue(member, values, slot, String(specifiedHouseholdDependants));
  }
  for (const slot of [
    "japan_individual_disability_allowance_claimant_elderly_dependent_count",
    "japan_special_child_rearing_allowance_claimant_elderly_dependent_count",
  ] as const) {
    setAutomaticValue(member, values, slot, String(elderlyHouseholdDependants));
  }

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
  if (values.japan_child_allowance_meets_nonfinancial_conditions === true) {
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
  return household.members.map((member) => {
    const monthlyOverrides: Record<
      string,
      Record<string, InputValue>
    > = {};
    const monthlyEmploymentEarnings = Math.round(
      numberValue(member.values.japan_employment_gross_cash_earnings) / 12,
    );
    for (const month of calendarYearMonths(household.calendarYear)) {
      monthlyOverrides[month] = {
        japan_employees_pension_monthly_remuneration:
          member.monthlyValueSources
            .japan_employees_pension_monthly_remuneration === "manual"
            ? member.monthlyValues[month]
                ?.japan_employees_pension_monthly_remuneration ??
              String(monthlyEmploymentEarnings)
            : String(monthlyEmploymentEarnings),
        japan_employment_insurance_covered_wages_paid:
          member.monthlyValueSources
            .japan_employment_insurance_covered_wages_paid === "manual"
            ? member.monthlyValues[month]
                ?.japan_employment_insurance_covered_wages_paid ??
              String(monthlyEmploymentEarnings)
            : String(monthlyEmploymentEarnings),
      };
    }
    if (numberValue(member.summerBonus) !== 0) {
      const month = `${household.calendarYear}-06`;
      if (monthlyOverrides[month]) {
        monthlyOverrides[month].japan_employees_pension_gross_bonus =
          member.summerBonus;
      }
    }
    if (numberValue(member.winterBonus) !== 0) {
      const month = `${household.calendarYear}-12`;
      if (monthlyOverrides[month]) {
        monthlyOverrides[month].japan_employees_pension_gross_bonus =
          member.winterBonus;
      }
    }
    return {
      id: member.id,
      label: member.name,
      spouseId:
        household.maritalStatus === "married"
          ? household.members.find(
              (candidate) =>
                candidate.id !== member.id &&
                ((member.role === "primary" && candidate.role === "spouse") ||
                  (member.role === "spouse" && candidate.role === "primary")),
            )?.id ?? null
          : null,
      values: applyFamilyFacts(household, member),
      monthlyOverrides,
      useModeledSocialInsurance: member.useModeledSocialInsurance,
      autoLinkedSlots: AUTO_LINKED_SLOTS.filter((slot) =>
        usesAutomaticValue(member, slot),
      ),
    };
  });
}
