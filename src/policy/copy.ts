import type { InputGroupId } from "../engine/types";

export const GROUP_ORDER: InputGroupId[] = [
  "national-income-tax",
  "employees-pension",
  "employment-insurance",
  "national-pension",
  "child-allowance",
  "child-rearing-allowance",
  "disability-allowances",
];

export const GROUP_COPY: Record<
  InputGroupId,
  { title: string; eyebrow: string; description: string; open: boolean }
> = {
  "national-income-tax": {
    title: "Income & national tax",
    eyebrow: "Annual",
    description:
      "Employment, public pension, taxpayer status, and the encoded personal and family deductions.",
    open: true,
  },
  "employees-pension": {
    title: "Employees’ Pension",
    eyebrow: "Selected month",
    description:
      "Ordinary employee coverage, remuneration band, and any bonus paid in the selected month.",
    open: true,
  },
  "employment-insurance": {
    title: "Employment Insurance",
    eyebrow: "Selected wage payment",
    description:
      "Covered wages, withholding status, and the encoded national industry categories.",
    open: true,
  },
  "national-pension": {
    title: "National Pension",
    eyebrow: "Selected month",
    description:
      "Category 1 coverage and the explicit approval and household-income-test facts used for exemption or deferral.",
    open: false,
  },
  "child-allowance": {
    title: "Child Allowance",
    eyebrow: "Selected month",
    description:
      "Assessed income and counts of children in the age and birth-order bands encoded by Wave 1.",
    open: true,
  },
  "child-rearing-allowance": {
    title: "Child Rearing Allowance",
    eyebrow: "Selected month",
    description:
      "Family conditions, prior-year income, child support, dependants, and highest supporter income.",
    open: false,
  },
  "disability-allowances": {
    title: "Disability-related allowances",
    eyebrow: "Selected month",
    description:
      "Medical or statutory classification is not inferred. Supply the explicit eligibility, grade, income, and supporter facts.",
    open: false,
  },
};

export const INPUT_HELP: Record<string, string> = {
  japan_social_insurance_contributions_paid_or_withheld:
    "Annual amount used by the national PIT social-insurance deduction. Include the actual qualifying amount; this field is not automatically replaced by the selected month’s modeled contributions.",
  japan_pit_total_income_amount:
    "A statutory total-income input used by several deductions and credits. The current RuleSpec does not infer it from all income classes.",
  japan_pit_taxpayer_total_income:
    "Total income used for spouse and family-deduction limits. Keep this aligned with the legally relevant income measure.",
  japan_public_pension_other_income_excluding_public_pension:
    "Other income used by the modern public-pension deduction schedule. For an employment-only case, this is generally employment income after its deduction.",
  japan_child_allowance_meets_nonfinancial_conditions:
    "Turn this on only when custody, residence, support, and other nonfinancial statutory conditions have been established.",
  japan_child_rearing_allowance_meets_family_conditions:
    "Represents the fact-intensive family-status conditions in the governing Act; the calculator does not infer them.",
  japan_special_child_rearing_allowance_meets_nonfinancial_conditions:
    "Requires the legally relevant disability grade and other nonfinancial conditions to have been established.",
  japan_disabled_child_welfare_allowance_meets_nonfinancial_conditions:
    "Requires the legally relevant medical and nonfinancial conditions to have been established.",
  japan_special_disability_allowance_meets_nonfinancial_conditions:
    "Requires the legally relevant medical and nonfinancial conditions to have been established.",
};
