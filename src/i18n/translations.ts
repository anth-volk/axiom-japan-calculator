import type {
  InputGroupId,
  ManifestInput,
  ManifestOutput,
  ManifestProgram,
} from "../engine/types";

export type Language = "en" | "ja";

export const LANGUAGES: Array<{ id: Language; label: string }> = [
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
];

export const UI_COPY = {
  en: {
    brand: "Axiom · Japan",
    brandNote: "Independent Wave 1 calculator",
    language: "Language",
    source: "Source",
    heroEyebrow: "National policy · calendar years 2017–2026",
    heroTitle: "See the rules shape a household.",
    heroIntro:
      "Calculate encoded Japanese national income tax, pension and Employment Insurance deductions, and five national benefit paths.",
    privacy: "Runs locally in your browser. Household answers are not uploaded.",
    calculate: "Calculate with Axiom",
    calculating: "Calculating…",
    experimental: "Experimental & unsigned",
    scope:
      "National Wave 1 only. The model does not include inhabitant tax, health insurance, long-term-care premiums, Public Assistance amounts, or municipal benefits. It is not official Japanese tax advice.",
    loadingInputs: "Loading the complete Wave 1 input contract…",
    verifying: "Verifying the Axiom engine and policy artifacts…",
    footerLead: "Built from the independent",
    footerTail:
      "encoding. Not reviewed or endorsed by The Axiom Foundation or the Government of Japan.",
  },
  ja: {
    brand: "アクシオム・ジャパン",
    brandNote: "独立版 Wave 1 計算機",
    language: "言語",
    source: "ソース",
    heroEyebrow: "国の制度 · 2017年〜2026年",
    heroTitle: "制度が世帯に与える影響を見る。",
    heroIntro:
      "日本の国の所得税、年金・雇用保険の控除、および5つの給付経路について、エンコード済みの規則を計算します。",
    privacy:
      "ブラウザー内で実行されます。入力した世帯情報は送信されません。",
    calculate: "Axiomで計算",
    calculating: "計算中…",
    experimental: "実験版・未署名",
    scope:
      "国のWave 1制度のみです。住民税、医療保険料、介護保険料、生活保護費、市区町村の給付は含みません。日本の公的な税務助言ではありません。",
    loadingInputs: "Wave 1の入力項目を読み込んでいます…",
    verifying: "Axiomエンジンと制度アーティファクトを検証しています…",
    footerLead: "独立版",
    footerTail:
      "のエンコードを使用しています。Axiom Foundationおよび日本政府による審査・推奨を受けたものではありません。",
  },
} as const;

export const PRESET_COPY = {
  en: {
    "validated-working-parent": {
      label: "Validated 2018 working parent",
      description:
        "The complete Wave 1 component scenario: ¥3.6m employment earnings, one primary-school child, and ordinary employee coverage.",
    },
    blank: {
      label: "Blank household",
      description:
        "Every amount is zero and every statutory-status flag is off.",
    },
  },
  ja: {
    "validated-working-parent": {
      label: "検証済み：2018年の就労親",
      description:
        "Wave 1の完全な構成要素シナリオです。給与収入360万円、小学生の子1人、一般の被用者として設定します。",
    },
    blank: {
      label: "空の世帯",
      description: "すべての金額を0、すべての法的状態をオフにします。",
    },
  },
} as const;

export const INPUT_PANEL_COPY = {
  en: {
    eyebrow: "Household facts",
    heading: "Set one modeled household",
    available: "inputs available",
    explainerTitle: "How the household setter works",
    explainerBody:
      "These sections are input groups, not switches for choosing rules. All nine rule programs run every time.",
    explainerPoints: [
      "A switch asserts a legal or household fact; off means that fact is false.",
      "The current model has one primary person. Spouses, children, dependants, and supporters are represented by amounts, counts, and status facts—not separate people.",
      "Monthly facts are reused for every month of the selected calendar year. Annual income facts feed that calendar year's national income-tax calculation.",
    ],
    search: "Find an income, deduction, status, or allowance…",
    clear: "Clear",
    noMatch: "No Wave 1 inputs match",
  },
  ja: {
    eyebrow: "世帯の事実",
    heading: "モデル化する世帯を設定",
    available: "個の入力項目",
    explainerTitle: "世帯設定の仕組み",
    explainerBody:
      "各セクションは入力項目の分類であり、適用する規則を選ぶスイッチではありません。計算のたびに9つの規則プログラムをすべて実行します。",
    explainerPoints: [
      "スイッチをオンにすると法的・世帯上の事実が成立すると指定します。オフはその事実が成立しないという意味です。",
      "現在のモデルは1人の主たる本人を計算します。配偶者、子、扶養親族、扶養義務者は、個別の人物ではなく金額・人数・状態として入力します。",
      "月次の事実は選択した暦年の各月に同じ値を使用します。年額の所得情報は同じ暦年の国の所得税計算に使用します。",
    ],
    search: "所得、控除、状態、手当を検索…",
    clear: "消去",
    noMatch: "一致するWave 1の入力項目はありません：",
  },
} as const;

export const RESULT_COPY = {
  en: {
    stopped: "Calculation stopped",
    review:
      "Review the calendar year and explicit statutory inputs, then run the calculator again.",
    running: "Running the Axiom engine…",
    preparing: "Preparing the policy engine…",
    eyebrow: "Axiom result",
    heading: "Your modeled ledger",
    updating: "Updating",
    calendarTax: "Calendar-year national income tax",
    calendarTaxNote: (year: number) =>
      `Tax year ${year}, including encoded national surtaxes`,
    annualDeductions: "Calendar-year modeled contributions",
    annualBenefits: "Calendar-year modeled benefits",
    annualPosition: "Benefits minus contributions",
    annualNote: (label: string) => `${label} total`,
    benefitsNote: "National benefits with supplied eligibility facts",
    positionNote: "National income tax is shown separately",
    warning:
      "This is a component ledger, not take-home pay or disposable income. Inhabitant tax and health and long-term-care premiums are not encoded.",
    breakdown: "Rule-by-rule breakdown",
    executions: "person-program executions",
    annualTotal: "calendar-year total",
    calendarTotal: "calendar-year amount",
    endSnapshot: "End-of-year rule snapshot",
    monthlySchedule: "Monthly schedule",
    execution: "Execution",
    reproducibility: "Reproducibility",
    rules: "Rules",
    engine: "Engine",
    runtime: "Runtime",
    workerRuntime: "Web Worker · verified WASM + artifacts",
    yes: "Yes",
    no: "No",
  },
  ja: {
    stopped: "計算を停止しました",
    review:
      "暦年と明示的な法定入力を確認してから、もう一度計算してください。",
    running: "Axiomエンジンで計算しています…",
    preparing: "制度エンジンを準備しています…",
    eyebrow: "Axiomの計算結果",
    heading: "モデル上の収支項目",
    updating: "更新中",
    calendarTax: "暦年の国の所得税",
    calendarTaxNote: (year: number) =>
      `${year}年分（エンコード済みの国税の付加税を含む）`,
    annualDeductions: "暦年内のモデル保険料",
    annualBenefits: "暦年内のモデル給付額",
    annualPosition: "給付額－拠出額",
    annualNote: (label: string) => `${label}の合計`,
    benefitsNote: "入力された受給要件に基づく国の給付",
    positionNote: "国の所得税は別に表示しています",
    warning:
      "これは構成要素ごとの収支であり、手取り額や可処分所得ではありません。住民税、医療保険料、介護保険料はエンコードされていません。",
    breakdown: "規則別の内訳",
    executions: "件の個人・制度別実行",
    annualTotal: "暦年合計",
    calendarTotal: "暦年額",
    endSnapshot: "年末時点の規則スナップショット",
    monthlySchedule: "月別推移",
    execution: "実行方式",
    reproducibility: "再現性",
    rules: "規則",
    engine: "エンジン",
    runtime: "実行環境",
    workerRuntime: "Web Worker · 検証済みWASM・アーティファクト",
    yes: "はい",
    no: "いいえ",
  },
} as const;

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
  Language,
  Record<
    InputGroupId,
    { title: string; eyebrow: string; description: string; open: boolean }
  >
> = {
  en: {
    "national-income-tax": {
      title: "Income & national tax",
      eyebrow: "Annual input · calendar-year result",
      description:
        "Employment, public pension, taxpayer status, and encoded personal and family deductions.",
      open: true,
    },
    "employees-pension": {
      title: "Employees’ Pension",
      eyebrow: "Repeated monthly",
      description:
        "Ordinary employee coverage, remuneration band, and monthly bonus amount.",
      open: true,
    },
    "employment-insurance": {
      title: "Employment Insurance",
      eyebrow: "Repeated monthly",
      description:
        "Covered wages, withholding status, and encoded national industry categories.",
      open: true,
    },
    "national-pension": {
      title: "National Pension",
      eyebrow: "Repeated monthly",
      description:
        "Category 1 coverage and explicit approval and household-income-test facts for exemption or deferral.",
      open: false,
    },
    "child-allowance": {
      title: "Child Allowance",
      eyebrow: "Repeated monthly",
      description:
        "Assessed income and counts of children in the encoded age and birth-order bands.",
      open: true,
    },
    "child-rearing-allowance": {
      title: "Child Rearing Allowance",
      eyebrow: "Repeated monthly",
      description:
        "Family conditions, prior-year income, child support, dependants, and supporter income.",
      open: false,
    },
    "disability-allowances": {
      title: "Disability-related allowances",
      eyebrow: "Repeated monthly",
      description:
        "Medical or statutory classification is not inferred; eligibility, grade, income, and supporter facts are explicit.",
      open: false,
    },
  },
  ja: {
    "national-income-tax": {
      title: "所得・国の所得税",
      eyebrow: "年額入力・暦年結果",
      description:
        "給与、公的年金、納税者の状態、およびエンコード済みの人的・家族控除。",
      open: true,
    },
    "employees-pension": {
      title: "厚生年金保険",
      eyebrow: "各月に同じ値を使用",
      description: "一般の被保険者区分、標準報酬月額の等級、各月の賞与額。",
      open: true,
    },
    "employment-insurance": {
      title: "雇用保険",
      eyebrow: "各月に同じ値を使用",
      description: "被保険者負担の対象賃金、源泉控除の状態、国の事業区分。",
      open: true,
    },
    "national-pension": {
      title: "国民年金",
      eyebrow: "各月に同じ値を使用",
      description:
        "第1号被保険者の状態、および免除・猶予に必要な承認と世帯所得審査の事実。",
      open: false,
    },
    "child-allowance": {
      title: "児童手当",
      eyebrow: "各月に同じ値を使用",
      description: "判定所得、および年齢・出生順位別の児童数。",
      open: true,
    },
    "child-rearing-allowance": {
      title: "児童扶養手当",
      eyebrow: "各月に同じ値を使用",
      description:
        "家族要件、前年所得、養育費、扶養親族、扶養義務者の所得。",
      open: false,
    },
    "disability-allowances": {
      title: "障害関連手当",
      eyebrow: "各月に同じ値を使用",
      description:
        "医学的・法的区分は推定しません。受給要件、等級、所得、扶養義務者の事実を明示します。",
      open: false,
    },
  },
};

const JA_INPUT_LABELS: Record<string, string> = {
  japan_child_allowance_assessed_income: "児童手当の判定所得",
  japan_child_allowance_elderly_dependent_count: "児童手当：老人扶養親族数",
  japan_child_allowance_high_school_first_or_second_count:
    "高校生年代：第1子・第2子の人数",
  japan_child_allowance_high_school_third_or_later_count:
    "高校生年代：第3子以降の人数",
  japan_child_allowance_junior_high_first_or_second_count:
    "中学生：第1子・第2子の人数",
  japan_child_allowance_junior_high_third_or_later_count:
    "中学生：第3子以降の人数",
  japan_child_allowance_ordinary_dependent_count: "児童手当：一般扶養親族数",
  japan_child_allowance_primary_age_first_or_second_count:
    "小学生年代：第1子・第2子の人数",
  japan_child_allowance_primary_age_third_or_later_count:
    "小学生年代：第3子以降の人数",
  japan_child_allowance_under_three_first_or_second_count:
    "3歳未満：第1子・第2子の人数",
  japan_child_allowance_under_three_third_or_later_count:
    "3歳未満：第3子以降の人数",
  japan_child_allowance_meets_nonfinancial_conditions:
    "児童手当の所得以外の要件を満たす",
  japan_child_rearing_allowance_adjusted_prior_year_income:
    "児童扶養手当：調整後の前年所得",
  japan_child_rearing_allowance_child_support_received:
    "児童扶養手当：受領した養育費",
  japan_child_rearing_allowance_elderly_dependent_count:
    "児童扶養手当：老人扶養親族数",
  japan_child_rearing_allowance_highest_supporter_adjusted_income:
    "児童扶養手当：最も所得の高い扶養義務者の調整後所得",
  japan_child_rearing_allowance_income_limit_person_count:
    "児童扶養手当：所得制限上の世帯人数",
  japan_child_rearing_allowance_qualifying_child_count:
    "児童扶養手当：対象児童数",
  japan_child_rearing_allowance_specified_dependent_count:
    "児童扶養手当：特定扶養親族数",
  japan_child_rearing_allowance_supporter_dependent_count:
    "児童扶養手当：扶養義務者の扶養親族数",
  japan_child_rearing_allowance_supporter_elderly_dependent_count:
    "児童扶養手当：扶養義務者の老人扶養親族数",
  japan_child_rearing_allowance_meets_family_conditions:
    "児童扶養手当の家族要件を満たす",
  japan_disability_allowance_supporter_dependent_count:
    "障害関連手当：扶養義務者の扶養親族数",
  japan_disability_allowance_supporter_elderly_dependent_count:
    "障害関連手当：扶養義務者の老人扶養親族数",
  japan_disabled_child_welfare_allowance_claimant_adjusted_income:
    "障害児福祉手当：受給資格者の調整後所得",
  japan_disabled_child_welfare_allowance_highest_supporter_adjusted_income:
    "障害児福祉手当：最も所得の高い扶養義務者の調整後所得",
  japan_disabled_child_welfare_allowance_meets_nonfinancial_conditions:
    "障害児福祉手当の所得以外の要件を満たす",
  japan_individual_disability_allowance_claimant_elderly_dependent_count:
    "個人向け障害手当：受給資格者の老人扶養親族数",
  japan_individual_disability_allowance_claimant_ordinary_dependent_count:
    "個人向け障害手当：受給資格者の一般扶養親族数",
  japan_individual_disability_allowance_claimant_specified_dependent_count:
    "個人向け障害手当：受給資格者の特定扶養親族数",
  japan_special_child_rearing_allowance_claimant_adjusted_income:
    "特別児童扶養手当：受給資格者の調整後所得",
  japan_special_child_rearing_allowance_claimant_elderly_dependent_count:
    "特別児童扶養手当：受給資格者の老人扶養親族数",
  japan_special_child_rearing_allowance_claimant_ordinary_dependent_count:
    "特別児童扶養手当：受給資格者の一般扶養親族数",
  japan_special_child_rearing_allowance_claimant_specified_dependent_count:
    "特別児童扶養手当：受給資格者の特定扶養親族数",
  japan_special_child_rearing_allowance_grade_one_child_count:
    "特別児童扶養手当：1級の対象児童数",
  japan_special_child_rearing_allowance_grade_two_child_count:
    "特別児童扶養手当：2級の対象児童数",
  japan_special_child_rearing_allowance_highest_supporter_adjusted_income:
    "特別児童扶養手当：最も所得の高い扶養義務者の調整後所得",
  japan_special_child_rearing_allowance_meets_nonfinancial_conditions:
    "特別児童扶養手当の所得以外の要件を満たす",
  japan_special_disability_allowance_claimant_adjusted_income:
    "特別障害者手当：受給資格者の調整後所得",
  japan_special_disability_allowance_highest_supporter_adjusted_income:
    "特別障害者手当：最も所得の高い扶養義務者の調整後所得",
  japan_special_disability_allowance_meets_nonfinancial_conditions:
    "特別障害者手当の所得以外の要件を満たす",
  japan_employees_pension_gross_bonus: "各月に支払われる賞与総額",
  japan_employees_pension_employee_pays_share_in_cash:
    "本人が被保険者負担分を現金で支払う",
  japan_employees_pension_monthly_remuneration: "月額報酬",
  japan_employees_pension_is_ordinary_covered_employee:
    "一般の厚生年金被保険者である",
  japan_employment_insurance_covered_wages_paid: "各月の雇用保険対象賃金",
  japan_employment_insurance_is_agriculture_fisheries_or_sake_business:
    "農林水産・清酒製造事業に該当する",
  japan_employment_insurance_is_construction_business: "建設事業に該当する",
  japan_employment_insurance_is_withheld_from_wages:
    "雇用保険料を賃金から控除する",
  japan_2024_fixed_credit_qualifying_family_member_count:
    "2024年定額減税の対象家族人数",
  japan_employment_gross_cash_earnings: "年間の給与収入総額",
  japan_public_pension_gross_receipts: "年間の公的年金等収入総額",
  japan_social_insurance_contributions_paid_or_withheld:
    "年間に支払・控除された社会保険料",
  japan_pit_income_is_ordinary_domestic_source: "通常の国内源泉所得である",
  japan_pit_is_resident_under_article_2: "所得税法上の居住者である",
  japan_public_pension_other_income_excluding_public_pension:
    "公的年金等以外の所得",
  japan_pit_candidate_dependent_total_income: "扶養親族候補者の合計所得",
  japan_pit_cohabiting_elderly_dependent_count: "同居老親等の人数",
  japan_pit_cohabiting_special_disabled_person_count:
    "同居特別障害者の人数",
  japan_pit_elderly_dependent_count: "老人扶養親族数",
  japan_pit_income_adjustment_has_qualifying_child_or_disability_condition:
    "所得金額調整控除の子・障害要件を満たす",
  japan_pit_is_single_parent: "ひとり親である",
  japan_pit_is_special_widow: "特別寡婦である",
  japan_pit_is_widow: "寡婦である",
  japan_pit_is_widow_or_widower: "寡婦または寡夫である",
  japan_pit_meets_working_student_nonincome_conditions:
    "勤労学生控除の所得以外の要件を満たす",
  japan_pit_non_labor_income_amount: "勤労以外の所得金額",
  japan_pit_ordinary_dependent_count: "一般扶養親族数",
  japan_pit_ordinary_disabled_person_count: "一般障害者の人数",
  japan_pit_special_disabled_person_count: "特別障害者の人数",
  japan_pit_specific_relative_age: "特定親族候補者の年齢",
  japan_pit_specific_relative_band_1_count: "特定親族特別控除：所得帯1の人数",
  japan_pit_specific_relative_band_2_count: "特定親族特別控除：所得帯2の人数",
  japan_pit_specific_relative_band_3_count: "特定親族特別控除：所得帯3の人数",
  japan_pit_specific_relative_band_4_count: "特定親族特別控除：所得帯4の人数",
  japan_pit_specific_relative_band_5_count: "特定親族特別控除：所得帯5の人数",
  japan_pit_specific_relative_band_6_count: "特定親族特別控除：所得帯6の人数",
  japan_pit_specific_relative_band_7_count: "特定親族特別控除：所得帯7の人数",
  japan_pit_specific_relative_band_8_count: "特定親族特別控除：所得帯8の人数",
  japan_pit_specific_relative_band_9_count: "特定親族特別控除：所得帯9の人数",
  japan_pit_specific_relative_meets_non_income_conditions:
    "特定親族の所得以外の要件を満たす",
  japan_pit_specific_relative_total_income: "特定親族の合計所得",
  japan_pit_specified_dependent_count: "特定扶養親族数",
  japan_pit_spouse_is_elderly: "配偶者が老人控除対象配偶者である",
  japan_pit_spouse_meets_non_income_conditions:
    "配偶者控除の所得以外の要件を満たす",
  japan_pit_spouse_meets_special_deduction_non_income_conditions:
    "配偶者特別控除の所得以外の要件を満たす",
  japan_pit_spouse_total_income: "配偶者の合計所得",
  japan_public_pension_recipient_age_at_statutory_test_date:
    "法定判定日時点の公的年金受給者年齢",
  japan_pit_total_income_amount: "納税者の合計所得金額",
  japan_pit_taxpayer_total_income: "家族控除判定用の納税者合計所得",
  japan_national_pension_is_category_one_insured:
    "国民年金第1号被保険者である",
  japan_national_pension_applicant_adjusted_income:
    "国民年金：申請者の調整後所得",
  japan_national_pension_applicant_non_income_exemption_condition:
    "国民年金：申請者が所得以外の免除要件を満たす",
  japan_national_pension_elderly_dependent_count:
    "国民年金所得審査：老人扶養親族数",
  japan_national_pension_exemption_application_approved:
    "国民年金の免除申請が承認済み",
  japan_national_pension_has_statutory_full_exemption:
    "国民年金の法定免除に該当する",
  japan_national_pension_income_test_dependent_count:
    "国民年金所得審査：扶養親族数",
  japan_national_pension_is_student: "学生である",
  japan_national_pension_ordinary_dependent_count:
    "国民年金所得審査：一般扶養親族数",
  japan_national_pension_specified_dependent_count:
    "国民年金所得審査：特定扶養親族数",
  japan_national_pension_spouse_and_household_head_meet_full_exemption_conditions:
    "配偶者・世帯主が全額免除要件を満たす",
  japan_national_pension_spouse_and_household_head_meet_half_exemption_conditions:
    "配偶者・世帯主が半額免除要件を満たす",
  japan_national_pension_spouse_and_household_head_meet_one_quarter_exemption_conditions:
    "配偶者・世帯主が4分の1免除要件を満たす",
  japan_national_pension_spouse_and_household_head_meet_three_quarter_exemption_conditions:
    "配偶者・世帯主が4分の3免除要件を満たす",
  japan_national_pension_spouse_meets_payment_deferral_conditions:
    "配偶者が納付猶予要件を満たす",
  japan_national_pension_student_deferral_approved:
    "学生納付特例が承認済み",
  japan_national_pension_student_or_deferral_non_income_condition:
    "学生納付特例・納付猶予の所得以外の要件を満たす",
  japan_national_pension_under_50_deferral_approved:
    "50歳未満の納付猶予が承認済み",
};

const EN_INPUT_LABELS: Record<string, string> = {
  japan_employees_pension_gross_bonus:
    "Bonus amount applied to every modeled month",
  japan_employment_insurance_covered_wages_paid:
    "Covered wages applied to every modeled month",
};

const EN_PROGRAMS: Record<
  string,
  { label: string; description: string }
> = {
  "national-income-tax": {
    label: "National income tax",
    description:
      "Calendar-year national personal income tax for the encoded employment and public-pension path.",
  },
  "employees-pension": {
    label: "Employees’ Pension",
    description:
      "Calendar-year employee contribution total using the supplied monthly remuneration and bonus facts.",
  },
  "national-pension": {
    label: "National Pension",
    description:
      "Calendar-year Category 1 contribution total after encoded exemptions and deferrals.",
  },
  "employment-insurance": {
    label: "Employment Insurance",
    description:
      "Calendar-year employee deduction total using the supplied monthly covered wages.",
  },
  "child-allowance": {
    label: "Child Allowance",
    description:
      "Calendar-year national Child Allowance total for the encoded child bands and income limits.",
  },
  "child-rearing-allowance": {
    label: "Child Rearing Allowance",
    description:
      "Calendar-year full or partial allowance total using claimant, supporter, and child-support inputs.",
  },
  "special-child-rearing-allowance": {
    label: "Special Child Rearing Allowance",
    description:
      "Calendar-year grade-one and grade-two disability-related child allowance total.",
  },
  "disabled-child-welfare-allowance": {
    label: "Disabled Child Welfare Allowance",
    description: "Calendar-year national cash allowance total after income tests.",
  },
  "special-disability-allowance": {
    label: "Special Disability Allowance",
    description: "Calendar-year national cash allowance total after income tests.",
  },
};

const JA_PROGRAMS: Record<
  string,
  { label: string; description: string }
> = {
  "national-income-tax": {
    label: "国の所得税",
    description: "給与所得・公的年金等所得の対応範囲における暦年の所得税。",
  },
  "employees-pension": {
    label: "厚生年金保険",
    description: "一般の被保険者について暦年内に本人が負担する保険料。",
  },
  "national-pension": {
    label: "国民年金",
    description: "免除・猶予を反映した第1号被保険者の暦年内保険料。",
  },
  "employment-insurance": {
    label: "雇用保険",
    description: "各月の賃金から控除される被保険者負担の暦年合計。",
  },
  "child-allowance": {
    label: "児童手当",
    description: "年齢・出生順位・所得制限に基づく国の暦年内手当額。",
  },
  "child-rearing-allowance": {
    label: "児童扶養手当",
    description:
      "受給資格者・扶養義務者・養育費の入力に基づく全部または一部支給額。",
  },
  "special-child-rearing-allowance": {
    label: "特別児童扶養手当",
    description: "1級・2級の障害区分に基づく暦年内の児童手当。",
  },
  "disabled-child-welfare-allowance": {
    label: "障害児福祉手当",
    description: "所得審査後の国の暦年内現金給付。",
  },
  "special-disability-allowance": {
    label: "特別障害者手当",
    description: "所得審査後の国の暦年内現金給付。",
  },
};

const JA_OUTPUT_LABELS: Record<string, string> = {
  "Employment income after deduction": "給与所得控除後の給与所得",
  "Employment-income deduction": "給与所得控除",
  "Public-pension income after deduction": "公的年金等控除後の所得",
  "Public-pension deduction": "公的年金等控除",
  "Encoded personal deductions": "エンコード済みの所得控除",
  "Taxable general income": "課税総所得金額",
  "Base national income tax": "国の所得税の基礎税額",
  "2024 fixed income-tax credit": "2024年定額減税",
  "Reconstruction special income tax": "復興特別所得税",
  "Defense special income tax": "防衛特別所得税",
  "National income tax including surtaxes": "付加税を含む国の所得税",
  "Standard monthly remuneration": "標準報酬月額",
  "Employee monthly contribution": "本人負担の月額保険料",
  "Employee bonus contribution": "本人負担の賞与保険料",
  "Employees’ Pension deduction": "厚生年金保険料本人負担額",
  "Standard National Pension contribution": "国民年金の標準月額保険料",
  "National Pension deduction after relief": "免除・猶予後の国民年金保険料",
  "Employee contribution rate": "被保険者負担率",
  "Employment Insurance deduction": "雇用保険料本人負担額",
  "Ordinary income limit": "通常の所得制限額",
  "Child Allowance": "児童手当",
  "Assessed allowance income": "手当の判定所得",
  "Full-payment income limit": "全部支給の所得制限額",
  "Partial-payment income limit": "一部支給の所得制限額",
  "Child Rearing Allowance": "児童扶養手当",
  "Special Child Rearing Allowance": "特別児童扶養手当",
  "Disabled Child Welfare Allowance": "障害児福祉手当",
  "Special Disability Allowance": "特別障害者手当",
};

export function inputLabel(input: ManifestInput, language: Language): string {
  return language === "ja"
    ? JA_INPUT_LABELS[input.slot] ?? input.label
    : EN_INPUT_LABELS[input.slot] ?? input.label;
}

export function programCopy(
  program: ManifestProgram,
  language: Language,
): { label: string; description: string } {
  return language === "ja"
    ? JA_PROGRAMS[program.id] ?? {
        label: program.label,
        description: program.description,
      }
    : EN_PROGRAMS[program.id] ?? {
        label: program.label,
        description: program.description,
      };
}

export function outputLabel(
  output: ManifestOutput,
  language: Language,
): string {
  return language === "ja"
    ? JA_OUTPUT_LABELS[output.label] ?? output.label
    : output.label;
}

export const INPUT_HELP: Record<string, Record<Language, string>> = {
  japan_social_insurance_contributions_paid_or_withheld: {
    en: "Manual annual amount used only when the modeled-contributions option below is off.",
    ja: "下の「計算した保険料を使用」をオフにした場合のみ使われる手入力の年額です。",
  },
  japan_pit_total_income_amount: {
    en: "A statutory total-income input used by several deductions and credits. The current RuleSpec does not infer it from every income class.",
    ja: "複数の控除・減税に使用する法定の合計所得金額です。現在のRuleSpecはすべての所得区分から自動算出しません。",
  },
  japan_pit_taxpayer_total_income: {
    en: "Total income used for spouse and family-deduction limits. Keep it aligned with the legally relevant income measure.",
    ja: "配偶者・家族控除の制限判定に使用する合計所得です。法的に該当する所得指標と一致させてください。",
  },
  japan_public_pension_other_income_excluding_public_pension: {
    en: "Other income used by the modern public-pension deduction schedule. For an employment-only case, this is generally employment income after its deduction.",
    ja: "現行の公的年金等控除表で使用する、公的年金等以外の所得です。給与のみの場合は通常、給与所得控除後の給与所得です。",
  },
  japan_child_allowance_meets_nonfinancial_conditions: {
    en: "Turn this on only when custody, residence, support, and other nonfinancial statutory conditions have been established.",
    ja: "監護、居住、生計維持など、所得以外の法定要件が確認できる場合のみオンにしてください。",
  },
  japan_child_rearing_allowance_meets_family_conditions: {
    en: "Represents the fact-intensive family-status conditions in the governing Act; the calculator does not infer them.",
    ja: "根拠法の家族状態に関する事実認定を表します。計算機はこれを推定しません。",
  },
  japan_special_child_rearing_allowance_meets_nonfinancial_conditions: {
    en: "Requires the legally relevant disability grade and other nonfinancial conditions to have been established.",
    ja: "法的に該当する障害等級など、所得以外の要件が確認されている必要があります。",
  },
  japan_disabled_child_welfare_allowance_meets_nonfinancial_conditions: {
    en: "Requires the legally relevant medical and nonfinancial conditions to have been established.",
    ja: "法的に該当する医学的要件など、所得以外の要件が確認されている必要があります。",
  },
  japan_special_disability_allowance_meets_nonfinancial_conditions: {
    en: "Requires the legally relevant medical and nonfinancial conditions to have been established.",
    ja: "法的に該当する医学的要件など、所得以外の要件が確認されている必要があります。",
  },
};

export function assertJapaneseCoverage(
  inputs: ManifestInput[],
  programs: ManifestProgram[],
): string[] {
  const missing = inputs
    .filter((input) => !JA_INPUT_LABELS[input.slot])
    .map((input) => `input:${input.slot}`);
  for (const program of programs) {
    if (!JA_PROGRAMS[program.id]) missing.push(`program:${program.id}`);
    for (const output of program.outputs) {
      if (!JA_OUTPUT_LABELS[output.label]) {
        missing.push(`output:${output.id}`);
      }
    }
  }
  return missing;
}
