import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  SUPPORTED_CALENDAR_YEARS,
  calendarYearLabel,
} from "../engine/periods";
import type {
  CalculationResult,
  GeneratedManifest,
  InputValue,
  ManifestInput,
} from "../engine/types";
import { ResultsPanel } from "./ResultsPanel";
import {
  inputDescription,
  inputLabel,
  type Language,
} from "../i18n/translations";
import {
  ageAtYearEnd,
  createMember,
  type ChildAllowanceBand,
  type DependentCategory,
  type DisabilityCategory,
  type HouseholdDraft,
  type HouseholdMember,
  type MaritalStatus,
  type MemberRole,
} from "../policy/household";
import {
  displayToYen,
  isMoneyInput,
  moneyCadence,
  moneyUnit,
  yenToDisplay,
} from "../policy/currency";
import { isInputApplicable } from "../policy/provisionPeriods";

interface HouseholdWizardProps {
  manifest: GeneratedManifest;
  household: HouseholdDraft;
  language: Language;
  disabled: boolean;
  error: string | null;
  result: CalculationResult | null;
  onChange: (household: HouseholdDraft) => void;
  onCalculate: () => void;
}

const ANNUAL_INCOME_SLOTS = [
  "japan_employment_gross_cash_earnings",
  "japan_public_pension_gross_receipts",
  "japan_pit_total_income_amount",
  "japan_pit_taxpayer_total_income",
  "japan_public_pension_other_income_excluding_public_pension",
  "japan_pit_non_labor_income_amount",
];

const MANUAL_SOCIAL_INSURANCE_SLOT =
  "japan_social_insurance_contributions_paid_or_withheld";

const EMPLOYEES_PENSION_SLOTS = [
  "japan_employees_pension_monthly_remuneration",
  "japan_employees_pension_is_ordinary_covered_employee",
  "japan_employees_pension_employee_pays_share_in_cash",
];

const EMPLOYMENT_INSURANCE_SLOTS = [
  "japan_employment_insurance_covered_wages_paid",
  "japan_employment_insurance_is_withheld_from_wages",
  "japan_employment_insurance_is_agriculture_fisheries_or_sake_business",
  "japan_employment_insurance_is_construction_business",
];

const NATIONAL_PENSION_COVERAGE_SLOTS = [
  "japan_national_pension_is_category_one_insured",
];

const INCOME_TAX_STATUS_SLOTS = [
  "japan_pit_is_resident_under_article_2",
  "japan_pit_income_is_ordinary_domestic_source",
];

const INCOME_TAX_FAMILY_SLOTS = [
  "japan_pit_candidate_dependent_total_income",
  "japan_pit_spouse_meets_non_income_conditions",
  "japan_pit_spouse_meets_special_deduction_non_income_conditions",
];

const INCOME_TAX_PERSONAL_SLOTS = [
  "japan_pit_is_special_widow",
  "japan_pit_is_widow_or_widower",
  "japan_pit_is_single_parent",
  "japan_pit_is_widow",
  "japan_pit_meets_working_student_nonincome_conditions",
];

const DERIVED_SLOTS = new Set([
  "japan_2024_fixed_credit_qualifying_family_member_count",
  "japan_public_pension_recipient_age_at_statutory_test_date",
  "japan_pit_spouse_total_income",
  "japan_pit_spouse_is_elderly",
  "japan_pit_ordinary_dependent_count",
  "japan_pit_specified_dependent_count",
  "japan_pit_elderly_dependent_count",
  "japan_pit_cohabiting_elderly_dependent_count",
  "japan_pit_ordinary_disabled_person_count",
  "japan_pit_special_disabled_person_count",
  "japan_pit_cohabiting_special_disabled_person_count",
  "japan_pit_income_adjustment_has_qualifying_child_or_disability_condition",
  "japan_child_allowance_under_three_first_or_second_count",
  "japan_child_allowance_under_three_third_or_later_count",
  "japan_child_allowance_primary_age_first_or_second_count",
  "japan_child_allowance_primary_age_third_or_later_count",
  "japan_child_allowance_junior_high_first_or_second_count",
  "japan_child_allowance_junior_high_third_or_later_count",
  "japan_child_allowance_high_school_first_or_second_count",
  "japan_child_allowance_high_school_third_or_later_count",
]);

const COPY = {
  en: {
    eyebrow: "Household wizard",
    title: "Build the modeled household",
    intro:
      "Enter people first, then each person’s income, insurance, tax facts, and household benefits. All nine Wave 1 programs run when relevant.",
    steps: ["Household", "Income & insurance", "Tax facts", "Benefits", "Results"],
    calendarYear: "Calendar year",
    calendarNote:
      "Individual income tax is assessed by calendar year. 2017 begins at the model’s April 1 support boundary.",
    size: "Household size",
    marital: "Marital status",
    maritalOptions: {
      single: "Single",
      married: "Married",
      divorced: "Divorced",
      widowed: "Widowed",
    },
    name: "Name or label",
    role: "Household role",
    roles: {
      primary: "Primary taxpayer / claimant",
      spouse: "Spouse",
      child: "Child",
      other: "Other member",
    },
    birthDate: "Date of birth",
    age: "Age at year end",
    include: "Calculate this member’s tax and contributions",
    incomeIntro:
      "Annual income and monthly coverage facts are entered separately for each calculated member.",
    income: "Annual income and tax measures",
    employeesPension: "Employees’ pension",
    employeesPensionDescription:
      "Monthly covered remuneration, employee status, and separately paid bonuses.",
    employmentInsurance: "Employment insurance",
    employmentInsuranceDescription:
      "Monthly covered wages and the industry facts that determine the employee rate.",
    nationalPensionCoverage: "National pension coverage",
    nationalPensionCoverageDescription:
      "Whether this member is insured as a Category 1 National Pension member.",
    summerBonus: "Employees’ pension bonus paid in June",
    winterBonus: "Employees’ pension bonus paid in December",
    bonusDescription:
      "Gross bonus payment subject to the encoded Employees’ Pension contribution for that month.",
    autoInsurance: "Use calculated contributions for the income-tax deduction",
    autoInsuranceNote:
      "When on, the calculated Employees’ Pension, National Pension, and Employment Insurance totals replace the manual annual social-insurance amount for income tax.",
    taxIntro:
      "Family categories below are converted into the encoded dependant and disability counts for the primary taxpayer. Other legal tests remain explicit.",
    dependant: "Primary taxpayer’s dependant category",
    disability: "Disability category used by income tax",
    dependentOptions: {
      none: "Not a dependant",
      ordinary: "Ordinary dependant",
      specified: "Specified dependant",
      elderly: "Elderly dependant",
      "cohabiting-elderly": "Cohabiting elderly dependant",
    },
    disabilityOptions: {
      none: "None",
      ordinary: "Ordinary disabled person",
      special: "Special disabled person",
      "cohabiting-special": "Cohabiting special disabled person",
    },
    residenceModule: "Residence and taxable-source status",
    residenceDescription:
      "These facts determine whether the encoded national income-tax path applies.",
    familyModule: "Spouse and dependant deductions",
    familyDescription:
      "Legal tests that cannot be inferred solely from household role or birthdate.",
    personalModule: "Widow, single-parent, and working-student deductions",
    personalDescription:
      "Only the status fields applicable to the selected calendar year are shown.",
    specificRelativeModule: "Specific-relative special deduction",
    specificRelativeDescription:
      "From 2025, relatives aged 19–22 can qualify for a graduated deduction based on their total income.",
    explicitPension: "National pension exemptions and deferrals",
    pensionApplicationModule: "Exemption application and income test",
    pensionHouseholdModule: "Spouse and household-head tests",
    pensionDeferralModule: "Student and under-50 payment deferrals",
    explicitNote:
      "These are legal classifications or statutory income measures that the model cannot infer safely from biography or gross pay.",
    benefitsIntro:
      "Benefits are calculated once for the primary claimant. Assign each child’s statutory Child Allowance band, then supply the remaining claimant and eligibility facts.",
    childBand: "Child allowance band",
    childBands: {
      none: "Not counted",
      "under-three-first-second": "Under 3 · first or second child",
      "under-three-third-plus": "Under 3 · third or later child",
      "primary-first-second": "Primary-school age · first or second",
      "primary-third-plus": "Primary-school age · third or later",
      "junior-high-first-second": "Junior-high age · first or second",
      "junior-high-third-plus": "Junior-high age · third or later",
      "high-school-first-second": "High-school age · first or second",
      "high-school-third-plus": "High-school age · third or later",
    },
    childBenefitsModule: "Children and family benefits",
    childBenefitsDescription:
      "Child Allowance, Child Rearing Allowance, Special Child Rearing Allowance, and Disabled Child Welfare Allowance are kept together here.",
    childAllowanceSubsection: "Child allowance",
    childRearingSubsection: "Child rearing allowance",
    specialChildSubsection: "Special child rearing allowance",
    disabledChildSubsection: "Disabled child welfare allowance",
    sharedDisabilitySubsection: "Shared disability-allowance household facts",
    adultDisabilityModule: "Special disability allowance",
    adultDisabilityDescription:
      "Claimant and supporter tests for the national adult disability allowance.",
    back: "Back",
    next: "Continue",
    calculate: "Calculate household",
    calculating: "Calculating…",
    recalculate: "Recalculate",
  },
  ja: {
    eyebrow: "世帯入力ウィザード",
    title: "モデル化する世帯を作成",
    intro:
      "最初に世帯員を登録し、次に各人の所得、保険、税務上の事実、世帯給付を入力します。該当するWave 1の9制度を実行します。",
    steps: ["世帯", "所得・保険", "税務上の事実", "給付", "結果"],
    calendarYear: "暦年",
    calendarNote:
      "個人所得税は暦年単位です。2017年はモデルの対応開始日である4月1日から計算します。",
    size: "世帯人数",
    marital: "婚姻状況",
    maritalOptions: {
      single: "未婚",
      married: "既婚",
      divorced: "離婚",
      widowed: "死別",
    },
    name: "氏名または表示名",
    role: "世帯での役割",
    roles: {
      primary: "主たる納税者・受給者",
      spouse: "配偶者",
      child: "子",
      other: "その他の世帯員",
    },
    birthDate: "生年月日",
    age: "年末時点の年齢",
    include: "この人の税・保険料を計算する",
    incomeIntro:
      "年額の所得と月次の加入・賃金情報を、計算対象者ごとに入力します。",
    income: "年額所得・税務上の金額",
    employeesPension: "厚生年金保険",
    employeesPensionDescription:
      "月額報酬、被保険者区分、および別途支給される賞与を入力します。",
    employmentInsurance: "雇用保険",
    employmentInsuranceDescription:
      "月額の対象賃金と、本人負担率を決める事業区分を入力します。",
    nationalPensionCoverage: "国民年金の加入区分",
    nationalPensionCoverageDescription:
      "この人が国民年金第1号被保険者であるかを指定します。",
    summerBonus: "6月支給の厚生年金対象賞与",
    winterBonus: "12月支給の厚生年金対象賞与",
    bonusDescription:
      "その月の厚生年金保険料の対象となる総支給賞与額です。",
    autoInsurance: "計算した保険料を所得税の社会保険料控除に使用",
    autoInsuranceNote:
      "オンの場合、厚生年金、国民年金、雇用保険の計算合計を、所得税用の手入力年額に代えて使用します。",
    taxIntro:
      "以下の家族区分は、主たる納税者についてエンコード済みの扶養・障害人数に変換されます。その他の法的要件は明示入力です。",
    dependant: "主たる納税者の扶養親族区分",
    disability: "所得税上の障害区分",
    dependentOptions: {
      none: "扶養親族ではない",
      ordinary: "一般扶養親族",
      specified: "特定扶養親族",
      elderly: "老人扶養親族",
      "cohabiting-elderly": "同居老親等",
    },
    disabilityOptions: {
      none: "該当なし",
      ordinary: "障害者",
      special: "特別障害者",
      "cohabiting-special": "同居特別障害者",
    },
    residenceModule: "居住者・国内源泉所得の区分",
    residenceDescription:
      "エンコード済みの国の所得税計算が適用されるかを決める事実です。",
    familyModule: "配偶者・扶養親族の控除",
    familyDescription:
      "世帯での役割や生年月日だけでは判断できない法的要件です。",
    personalModule: "寡婦・ひとり親・勤労学生の控除",
    personalDescription:
      "選択した暦年に適用される状態項目だけを表示します。",
    specificRelativeModule: "特定親族特別控除",
    specificRelativeDescription:
      "2025年分から、19歳以上23歳未満の親族について合計所得に応じた控除を計算します。",
    explicitPension: "国民年金の免除・猶予事項",
    pensionApplicationModule: "免除申請・所得審査",
    pensionHouseholdModule: "配偶者・世帯主の審査",
    pensionDeferralModule: "学生・50歳未満の納付猶予",
    explicitNote:
      "経歴や総収入だけでは安全に推定できない法的区分・法定所得指標です。",
    benefitsIntro:
      "給付は主たる受給者について世帯単位で1回計算します。各児童の法定区分を選び、残りの受給者・受給要件を入力してください。",
    childBand: "児童手当の区分",
    childBands: {
      none: "人数に含めない",
      "under-three-first-second": "3歳未満・第1子または第2子",
      "under-three-third-plus": "3歳未満・第3子以降",
      "primary-first-second": "小学生年代・第1子または第2子",
      "primary-third-plus": "小学生年代・第3子以降",
      "junior-high-first-second": "中学生年代・第1子または第2子",
      "junior-high-third-plus": "中学生年代・第3子以降",
      "high-school-first-second": "高校生年代・第1子または第2子",
      "high-school-third-plus": "高校生年代・第3子以降",
    },
    childBenefitsModule: "子ども・家族に関する給付",
    childBenefitsDescription:
      "児童手当、児童扶養手当、特別児童扶養手当、障害児福祉手当をここにまとめています。",
    childAllowanceSubsection: "児童手当",
    childRearingSubsection: "児童扶養手当",
    specialChildSubsection: "特別児童扶養手当",
    disabledChildSubsection: "障害児福祉手当",
    sharedDisabilitySubsection: "障害関連手当に共通する世帯事項",
    adultDisabilityModule: "特別障害者手当",
    adultDisabilityDescription:
      "成人向けの国の障害手当に関する本人・扶養義務者の審査項目です。",
    back: "戻る",
    next: "次へ",
    calculate: "世帯を計算",
    calculating: "計算中…",
    recalculate: "再計算",
  },
} as const;

function FactField({
  input,
  value,
  language,
  disabled,
  onChange,
}: {
  input: ManifestInput;
  value: InputValue | undefined;
  language: Language;
  disabled: boolean;
  onChange: (value: InputValue) => void;
}) {
  const help = inputDescription(input, language);
  if (input.kind === "bool") {
    return (
      <label className="wizard-fact wizard-fact--boolean">
        <span>
          <strong>{inputLabel(input, language)}</strong>
          <small>{help}</small>
        </span>
        <span className="switch">
          <input
            checked={value === true}
            disabled={disabled}
            type="checkbox"
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="switch-track">
            <span className="switch-thumb" />
          </span>
        </span>
      </label>
    );
  }
  const isMoney = isMoneyInput(input);
  const cadence = moneyCadence(input.slot);
  const suffix = isMoney
    ? moneyUnit(language, cadence)
    : input.slot.includes("age")
    ? language === "ja"
      ? "歳"
      : "years"
    : input.integer
      ? language === "ja"
        ? "人"
        : "people"
      : "";
  const displayValue =
    isMoney && typeof value === "string"
      ? yenToDisplay(value, language, cadence)
      : typeof value === "string"
        ? value
        : "0";
  return (
    <label className="wizard-fact">
      <span>
        <strong>{inputLabel(input, language)}</strong>
        <small>{help}</small>
      </span>
      <span className="wizard-number">
        <input
          disabled={disabled}
          inputMode={input.integer ? "numeric" : "decimal"}
          min="0"
          step={isMoney ? "any" : input.step}
          type="number"
          value={displayValue}
          onChange={(event) =>
            onChange(
              isMoney
                ? displayToYen(event.target.value, language, cadence)
                : event.target.value,
            )
          }
        />
        {suffix && <span className="wizard-number__unit">{suffix}</span>}
      </span>
    </label>
  );
}

function MemberHeading({
  member,
  language,
}: {
  member: HouseholdMember;
  language: Language;
}) {
  const copy = COPY[language];
  return (
    <div className="member-heading">
      <span>{copy.roles[member.role]}</span>
      <strong>{member.name}</strong>
    </div>
  );
}

function FormModule({
  title,
  description,
  children,
  open = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="form-module" open={open}>
      <summary>
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="m3 6 5 5 5-5" />
        </svg>
      </summary>
      <div className="form-module__body">{children}</div>
    </details>
  );
}

export function HouseholdWizard({
  manifest,
  household,
  language,
  disabled,
  error,
  result,
  onChange,
  onCalculate,
}: HouseholdWizardProps) {
  const [step, setStep] = useState(0);
  const copy = COPY[language];
  const inputMap = useMemo(
    () => new Map(manifest.inputs.map((input) => [input.slot, input])),
    [manifest],
  );
  const calculatedMembers = household.members.filter(
    (member) => member.calculateTaxAndContributions,
  );
  const primary = household.members.find((member) => member.role === "primary")!;

  const inputsFor = (slots: string[]) =>
    slots
      .map((slot) => inputMap.get(slot))
      .filter(
        (input): input is ManifestInput =>
          Boolean(input) &&
          isInputApplicable(input!.slot, household.calendarYear),
      );

  const commonSlots = new Set([
    ...ANNUAL_INCOME_SLOTS,
    MANUAL_SOCIAL_INSURANCE_SLOT,
    ...EMPLOYEES_PENSION_SLOTS,
    ...EMPLOYMENT_INSURANCE_SLOTS,
    ...NATIONAL_PENSION_COVERAGE_SLOTS,
  ]);
  const explicitTaxInputs = manifest.inputs.filter(
    (input) =>
      input.programs.includes("national-income-tax") &&
      !commonSlots.has(input.slot) &&
      !DERIVED_SLOTS.has(input.slot) &&
      isInputApplicable(input.slot, household.calendarYear),
  );
  const explicitPensionInputs = manifest.inputs.filter(
    (input) =>
      input.programs.includes("national-pension") &&
      !commonSlots.has(input.slot) &&
      isInputApplicable(input.slot, household.calendarYear),
  );
  const benefitInputs = manifest.inputs
    .filter(
      (input) =>
        input.group === "child-allowance" ||
        input.group === "child-rearing-allowance" ||
        input.group === "disability-allowances",
    )
    .filter(
      (input) =>
        !DERIVED_SLOTS.has(input.slot) &&
        isInputApplicable(input.slot, household.calendarYear),
    );

  const taxStatusInputs = inputsFor(INCOME_TAX_STATUS_SLOTS);
  const taxFamilyInputs = inputsFor(INCOME_TAX_FAMILY_SLOTS);
  const taxPersonalInputs = inputsFor(INCOME_TAX_PERSONAL_SLOTS);
  const specificRelativeInputs = explicitTaxInputs.filter((input) =>
    input.slot.startsWith("japan_pit_specific_relative_"),
  );
  const remainingTaxInputs = explicitTaxInputs.filter(
    (input) =>
      !new Set([
        ...INCOME_TAX_STATUS_SLOTS,
        ...INCOME_TAX_FAMILY_SLOTS,
        ...INCOME_TAX_PERSONAL_SLOTS,
      ]).has(input.slot) &&
      !input.slot.startsWith("japan_pit_specific_relative_"),
  );

  const pensionHouseholdInputs = explicitPensionInputs.filter(
    (input) =>
      input.slot.includes("spouse_and_household_head") ||
      input.slot.includes("spouse_meets_payment"),
  );
  const pensionDeferralInputs = explicitPensionInputs.filter(
    (input) =>
      input.slot.includes("student") || input.slot.includes("under_50"),
  );
  const pensionApplicationInputs = explicitPensionInputs.filter(
    (input) =>
      !pensionHouseholdInputs.includes(input) &&
      !pensionDeferralInputs.includes(input),
  );

  const childAndFamilyBenefitInputs = benefitInputs.filter(
    (input) =>
      !input.slot.startsWith("japan_special_disability_allowance_"),
  );
  const adultDisabilityInputs = benefitInputs.filter((input) =>
    input.slot.startsWith("japan_special_disability_allowance_"),
  );
  const childAllowanceInputs = childAndFamilyBenefitInputs.filter(
    (input) => input.group === "child-allowance",
  );
  const childRearingInputs = childAndFamilyBenefitInputs.filter(
    (input) => input.group === "child-rearing-allowance",
  );
  const specialChildInputs = childAndFamilyBenefitInputs.filter((input) =>
    input.slot.startsWith("japan_special_child_rearing_allowance_"),
  );
  const disabledChildInputs = childAndFamilyBenefitInputs.filter(
    (input) =>
      input.slot.startsWith("japan_disabled_child_welfare_allowance_") ||
      input.slot.startsWith("japan_individual_disability_allowance_"),
  );
  const sharedDisabilityInputs = childAndFamilyBenefitInputs.filter((input) =>
    input.slot.startsWith("japan_disability_allowance_supporter_"),
  );

  function updateMember(
    id: string,
    updater: (member: HouseholdMember) => HouseholdMember,
  ) {
    onChange({
      ...household,
      members: household.members.map((member) =>
        member.id === id ? updater(member) : member,
      ),
    });
  }

  function updateMemberValue(
    id: string,
    slot: string,
    value: InputValue,
  ) {
    updateMember(id, (member) => ({
      ...member,
      values: { ...member.values, [slot]: value },
    }));
  }

  function setHouseholdSize(size: number) {
    const nextSize = Math.max(1, Math.min(10, size));
    const members = household.members.slice(0, nextSize);
    while (members.length < nextSize) {
      const role: MemberRole =
        household.maritalStatus === "married" &&
        !members.some((member) => member.role === "spouse")
          ? "spouse"
          : "child";
      const member = createMember(manifest, members.length, role);
      member.name =
        language === "ja"
          ? role === "spouse"
            ? "配偶者"
            : role === "child"
              ? `子${members.length}`
              : `世帯員${members.length + 1}`
          : role === "spouse"
            ? "Spouse"
            : role === "child"
              ? `Child ${members.length}`
              : `Member ${members.length + 1}`;
      members.push(member);
    }
    onChange({ ...household, members });
  }

  function setCalendarYear(calendarYear: number) {
    const members = household.members.map((member) => ({
      ...member,
      childAllowanceBand:
        calendarYear < 2024 &&
        member.childAllowanceBand.startsWith("high-school")
          ? ("none" as ChildAllowanceBand)
          : member.childAllowanceBand,
    }));
    onChange({ ...household, calendarYear, members });
  }

  function setMaritalStatus(maritalStatus: MaritalStatus) {
    const members = household.members.map((member) => ({ ...member }));
    if (maritalStatus === "married" && members.length > 1) {
      const existingSpouse = members.find((member) => member.role === "spouse");
      if (!existingSpouse) {
        members[1] = {
          ...members[1],
          role: "spouse",
          calculateTaxAndContributions: true,
          dependentCategory: "none",
          childAllowanceBand: "none",
        };
      }
    } else if (maritalStatus !== "married") {
      for (let index = 1; index < members.length; index += 1) {
        if (members[index].role === "spouse") {
          members[index] = { ...members[index], role: "other" };
        }
      }
    }
    onChange({ ...household, maritalStatus, members });
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    if (nextStep === copy.steps.length - 1 && !result) {
      onCalculate();
    }
  }

  function renderFields(member: HouseholdMember, inputs: ManifestInput[]) {
    return (
      <div className="wizard-facts">
        {inputs.map((input) => (
          <FactField
            key={input.slot}
            disabled={disabled}
            input={input}
            language={language}
            value={member.values[input.slot]}
            onChange={(value) => updateMemberValue(member.id, input.slot, value)}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="wizard-title">{copy.title}</h2>
          <p className="wizard-intro">{copy.intro}</p>
        </div>
        <span className="count-pill">108 Wave 1 inputs</span>
      </div>

      <ol className="wizard-progress">
        {copy.steps.map((label, index) => (
          <li
            className={
              index === step
                ? "wizard-progress__current"
                : index < step
                  ? "wizard-progress__complete"
                  : ""
            }
            key={label}
          >
            <button
              disabled={disabled}
              type="button"
              onClick={() => goToStep(index)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="wizard-page">
        {step === 0 && (
          <>
            <div className="wizard-lead-grid">
              <label>
                <span>{copy.calendarYear}</span>
                <select
                  data-testid="calendar-year-select"
                  disabled={disabled}
                  value={household.calendarYear}
                  onChange={(event) =>
                    setCalendarYear(Number(event.target.value))
                  }
                >
                  {SUPPORTED_CALENDAR_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {calendarYearLabel(year, language)}
                    </option>
                  ))}
                </select>
                <small>{copy.calendarNote}</small>
              </label>
              <label>
                <span>{copy.size}</span>
                <input
                  disabled={disabled}
                  max="10"
                  min="1"
                  type="number"
                  value={household.members.length}
                  onChange={(event) => setHouseholdSize(Number(event.target.value))}
                />
              </label>
              <label>
                <span>{copy.marital}</span>
                <select
                  disabled={disabled}
                  value={household.maritalStatus}
                  onChange={(event) =>
                    setMaritalStatus(event.target.value as MaritalStatus)
                  }
                >
                  {(
                    Object.keys(copy.maritalOptions) as MaritalStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {copy.maritalOptions[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="member-cards">
              {household.members.map((member, index) => (
                <article className="member-card" key={member.id}>
                  <MemberHeading language={language} member={member} />
                  <div className="member-biography">
                    <label>
                      <span>{copy.name}</span>
                      <input
                        disabled={disabled}
                        type="text"
                        value={member.name}
                        onChange={(event) =>
                          updateMember(member.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>{copy.role}</span>
                      <select
                        disabled={disabled || index === 0}
                        value={member.role}
                        onChange={(event) =>
                          updateMember(member.id, (current) => ({
                            ...current,
                            role: event.target.value as MemberRole,
                          }))
                        }
                      >
                        {(
                          Object.keys(copy.roles) as MemberRole[]
                        ).map((role) => (
                          <option
                            disabled={role === "primary" && index !== 0}
                            key={role}
                            value={role}
                          >
                            {copy.roles[role]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>{copy.birthDate}</span>
                      <input
                        disabled={disabled}
                        type="date"
                        value={member.birthDate}
                        onChange={(event) =>
                          updateMember(member.id, (current) => ({
                            ...current,
                            birthDate: event.target.value,
                          }))
                        }
                      />
                      <small>
                        {copy.age}:{" "}
                        {ageAtYearEnd(
                          member.birthDate,
                          household.calendarYear,
                        )}
                      </small>
                    </label>
                  </div>
                  <label className="member-calculate">
                    <input
                      checked={member.calculateTaxAndContributions}
                      disabled={disabled || member.role === "primary"}
                      type="checkbox"
                      onChange={(event) =>
                        updateMember(member.id, (current) => ({
                          ...current,
                          calculateTaxAndContributions: event.target.checked,
                        }))
                      }
                    />
                    <span>{copy.include}</span>
                  </label>
                </article>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="wizard-page-intro">{copy.incomeIntro}</p>
            {calculatedMembers.map((member) => (
              <article className="wizard-member-section" key={member.id}>
                <MemberHeading language={language} member={member} />
                <h3>{copy.income}</h3>
                {renderFields(member, inputsFor(ANNUAL_INCOME_SLOTS))}
                <label className="auto-deduction">
                  <input
                    checked={member.useModeledSocialInsurance}
                    disabled={disabled}
                    type="checkbox"
                    onChange={(event) =>
                      updateMember(member.id, (current) => ({
                        ...current,
                        useModeledSocialInsurance: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    <strong>{copy.autoInsurance}</strong>
                    <small>{copy.autoInsuranceNote}</small>
                  </span>
                </label>
                {!member.useModeledSocialInsurance &&
                  renderFields(
                    member,
                    inputsFor([MANUAL_SOCIAL_INSURANCE_SLOT]),
                  )}
                <div className="form-module-list">
                  <FormModule
                    description={copy.employeesPensionDescription}
                    open
                    title={copy.employeesPension}
                  >
                    {renderFields(member, inputsFor(EMPLOYEES_PENSION_SLOTS))}
                    <div className="bonus-grid">
                      {[
                        ["summerBonus", copy.summerBonus],
                        ["winterBonus", copy.winterBonus],
                      ].map(([key, label]) => (
                        <label key={key}>
                          <span>{label}</span>
                          <small>{copy.bonusDescription}</small>
                          <span className="wizard-number">
                            <input
                              disabled={disabled}
                              min="0"
                              step="any"
                              type="number"
                              value={yenToDisplay(
                                member[
                                  key as "summerBonus" | "winterBonus"
                                ],
                                language,
                                "monthly",
                              )}
                              onChange={(event) =>
                                updateMember(member.id, (current) => ({
                                  ...current,
                                  [key]: displayToYen(
                                    event.target.value,
                                    language,
                                    "monthly",
                                  ),
                                }))
                              }
                            />
                            <span className="wizard-number__unit">
                              {moneyUnit(language, "monthly")}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </FormModule>
                  <FormModule
                    description={copy.employmentInsuranceDescription}
                    title={copy.employmentInsurance}
                  >
                    {renderFields(member, inputsFor(EMPLOYMENT_INSURANCE_SLOTS))}
                  </FormModule>
                  <FormModule
                    description={copy.nationalPensionCoverageDescription}
                    title={copy.nationalPensionCoverage}
                  >
                    {renderFields(
                      member,
                      inputsFor(NATIONAL_PENSION_COVERAGE_SLOTS),
                    )}
                  </FormModule>
                </div>
              </article>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <p className="wizard-page-intro">{copy.taxIntro}</p>
            <div className="classification-grid">
              {household.members.map((member) => (
                <article key={member.id}>
                  <MemberHeading language={language} member={member} />
                  {member.role !== "primary" && member.role !== "spouse" && (
                    <label>
                      <span>{copy.dependant}</span>
                      <select
                        disabled={disabled}
                        value={member.dependentCategory}
                        onChange={(event) =>
                          updateMember(member.id, (current) => ({
                            ...current,
                            dependentCategory: event.target
                              .value as DependentCategory,
                          }))
                        }
                      >
                        {(
                          Object.keys(
                            copy.dependentOptions,
                          ) as DependentCategory[]
                        ).map((category) => (
                          <option key={category} value={category}>
                            {copy.dependentOptions[category]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    <span>{copy.disability}</span>
                    <select
                      disabled={disabled}
                      value={member.disabilityCategory}
                      onChange={(event) =>
                        updateMember(member.id, (current) => ({
                          ...current,
                          disabilityCategory: event.target
                            .value as DisabilityCategory,
                        }))
                      }
                    >
                      {(
                        Object.keys(
                          copy.disabilityOptions,
                        ) as DisabilityCategory[]
                      ).map((category) => (
                        <option key={category} value={category}>
                          {copy.disabilityOptions[category]}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </div>
            <p className="explicit-note">{copy.explicitNote}</p>
            {calculatedMembers.map((member) => (
              <article className="wizard-member-section" key={member.id}>
                <MemberHeading language={language} member={member} />
                <div className="form-module-list">
                  <FormModule
                    description={copy.residenceDescription}
                    open
                    title={copy.residenceModule}
                  >
                    {renderFields(member, taxStatusInputs)}
                  </FormModule>
                  <FormModule
                    description={copy.familyDescription}
                    title={copy.familyModule}
                  >
                    {renderFields(member, taxFamilyInputs)}
                  </FormModule>
                  <FormModule
                    description={copy.personalDescription}
                    title={copy.personalModule}
                  >
                    {renderFields(member, taxPersonalInputs)}
                  </FormModule>
                  {specificRelativeInputs.length > 0 && (
                    <FormModule
                      description={copy.specificRelativeDescription}
                      title={copy.specificRelativeModule}
                    >
                      {renderFields(member, specificRelativeInputs)}
                    </FormModule>
                  )}
                  {remainingTaxInputs.length > 0 && (
                    <FormModule
                      description={copy.explicitNote}
                      title={copy.income}
                    >
                      {renderFields(member, remainingTaxInputs)}
                    </FormModule>
                  )}
                  <FormModule
                    description={copy.explicitNote}
                    title={copy.explicitPension}
                  >
                    <div className="form-subsection">
                      <h4>{copy.pensionApplicationModule}</h4>
                      {renderFields(member, pensionApplicationInputs)}
                    </div>
                    <div className="form-subsection">
                      <h4>{copy.pensionHouseholdModule}</h4>
                      {renderFields(member, pensionHouseholdInputs)}
                    </div>
                    <div className="form-subsection">
                      <h4>{copy.pensionDeferralModule}</h4>
                      {renderFields(member, pensionDeferralInputs)}
                    </div>
                  </FormModule>
                </div>
              </article>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <p className="wizard-page-intro">{copy.benefitsIntro}</p>
            <article className="wizard-member-section">
              <MemberHeading language={language} member={primary} />
              <div className="form-module-list">
                <FormModule
                  description={copy.childBenefitsDescription}
                  open
                  title={copy.childBenefitsModule}
                >
                  <div className="classification-grid classification-grid--inside">
                    {household.members
                      .filter((member) => member.role === "child")
                      .map((member) => (
                        <article key={member.id}>
                          <MemberHeading language={language} member={member} />
                          <label>
                            <span>{copy.childBand}</span>
                            <select
                              disabled={disabled}
                              value={member.childAllowanceBand}
                              onChange={(event) =>
                                updateMember(member.id, (current) => ({
                                  ...current,
                                  childAllowanceBand: event.target
                                    .value as ChildAllowanceBand,
                                }))
                              }
                            >
                              {(
                                Object.keys(
                                  copy.childBands,
                                ) as ChildAllowanceBand[]
                              )
                                .filter(
                                  (band) =>
                                    household.calendarYear >= 2024 ||
                                    !band.startsWith("high-school"),
                                )
                                .map((band) => (
                                  <option key={band} value={band}>
                                    {copy.childBands[band]}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </article>
                      ))}
                  </div>
                  <div className="form-subsection">
                    <h4>{copy.childAllowanceSubsection}</h4>
                    {renderFields(primary, childAllowanceInputs)}
                  </div>
                  <div className="form-subsection">
                    <h4>{copy.childRearingSubsection}</h4>
                    {renderFields(primary, childRearingInputs)}
                  </div>
                  <div className="form-subsection">
                    <h4>{copy.specialChildSubsection}</h4>
                    {renderFields(primary, specialChildInputs)}
                  </div>
                  <div className="form-subsection">
                    <h4>{copy.disabledChildSubsection}</h4>
                    {renderFields(primary, disabledChildInputs)}
                  </div>
                  <div className="form-subsection">
                    <h4>{copy.sharedDisabilitySubsection}</h4>
                    {renderFields(primary, sharedDisabilityInputs)}
                  </div>
                </FormModule>
                {adultDisabilityInputs.length > 0 && (
                  <FormModule
                    description={copy.adultDisabilityDescription}
                    title={copy.adultDisabilityModule}
                  >
                    {renderFields(primary, adultDisabilityInputs)}
                  </FormModule>
                )}
              </div>
            </article>
          </>
        )}

        {step === 4 && (
          <ResultsPanel
            calculating={disabled}
            error={error}
            language={language}
            manifest={manifest}
            result={result}
          />
        )}
      </div>

      <div className="wizard-actions">
        <button
          className="secondary-button"
          disabled={disabled || step === 0}
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          {copy.back}
        </button>
        {step < copy.steps.length - 2 ? (
          <button
            className="primary-button"
            disabled={disabled}
            type="button"
            onClick={() => goToStep(step + 1)}
          >
            {copy.next}
          </button>
        ) : step === copy.steps.length - 2 ? (
          <button
            className="calculate-button"
            data-testid="calculate-button"
            disabled={disabled || calculatedMembers.length === 0}
            type="button"
            onClick={() => goToStep(copy.steps.length - 1)}
          >
            {disabled ? copy.calculating : copy.calculate}
          </button>
        ) : (
          <button
            className="primary-button"
            data-testid="recalculate-button"
            disabled={disabled || calculatedMembers.length === 0}
            type="button"
            onClick={onCalculate}
          >
            {disabled ? copy.calculating : copy.recalculate}
          </button>
        )}
      </div>
    </section>
  );
}
