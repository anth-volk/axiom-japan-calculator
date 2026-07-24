export type InputValue = string | boolean;

export interface ManifestInput {
  slot: string;
  label: string;
  kind: "bool" | "decimal";
  integer: boolean;
  step: number;
  group: InputGroupId;
  programs: string[];
}

export type InputGroupId =
  | "national-income-tax"
  | "employees-pension"
  | "national-pension"
  | "employment-insurance"
  | "child-allowance"
  | "child-rearing-allowance"
  | "disability-allowances";

export interface ProgramInput {
  slot: string;
  canonicalRequestName: string;
}

export type OutputRole = "summary" | "detail" | "credit" | "rate";
export type SummaryBucket = "annualTax" | "monthlyDeduction" | "monthlyBenefit";

export interface ManifestOutput {
  id: string;
  label: string;
  role: OutputRole;
  dtype: string;
  unit: string | null;
  period: string;
  corpusCitationPath: string | null;
  sourceUrl: string | null;
}

export interface ManifestProgram {
  id: string;
  label: string;
  description: string;
  artifact: string;
  artifactSha256: string;
  cadence: "annual" | "monthly";
  summaryBucket: SummaryBucket;
  summaryOutput: string;
  inputs: ProgramInput[];
  outputs: ManifestOutput[];
}

export interface GeneratedManifest {
  schemaVersion: number;
  supportedPeriod: {
    inclusiveStart: string;
    calculatorFullYearStart: string;
    inclusiveEnd: string;
  };
  pins: {
    rulespec: { repository: string; commit: string };
    engine: { repository: string; commit: string };
    compose: { repository: string; commit: string };
    rust: string;
    wasmPack: string;
  };
  engineVersion: string;
  artifactFormatVersion: number;
  engineAssets: {
    javascript: string;
    javascriptSha256: string;
    wasm: string;
    wasmSha256: string;
  };
  inputCount: number;
  inputs: ManifestInput[];
  programs: ManifestProgram[];
}

export type AxiomScalarValue =
  | { kind: "bool"; value: boolean }
  | { kind: "integer"; value: number }
  | { kind: "decimal"; value: string }
  | { kind: "date"; value: string }
  | { kind: "text"; value: string };

export type AxiomOutputValue =
  | {
      kind: "scalar";
      name: string;
      id?: string;
      dtype: string;
      unit?: string | null;
      value: AxiomScalarValue;
    }
  | {
      kind: "judgment";
      name: string;
      id?: string;
      unit?: string | null;
      outcome: "holds" | "not_holds";
    };

export interface ProgramResult {
  programId: string;
  personId: string;
  personLabel: string;
  requestedMode: string;
  actualMode: string;
  fallbackReason: string | null;
  outputs: Record<string, AxiomOutputValue>;
  summaryAmount: number;
  monthlySummaries: Array<{
    month: string;
    amount: number;
  }>;
}

export interface CalculationResult {
  calendarYear: number;
  calendarYearStart: string;
  calendarYearEnd: string;
  programs: ProgramResult[];
  elapsedMs: number;
}

export interface CalculationPersonInput {
  id: string;
  label: string;
  values: Record<string, InputValue>;
  monthlyOverrides: Record<string, Record<string, InputValue>>;
  useModeledSocialInsurance: boolean;
}

export type WorkerRequest =
  | { type: "boot"; id: number; baseUrl: string }
  | {
      type: "calculate";
      id: number;
      calendarYear: number;
      people: CalculationPersonInput[];
    };

export type WorkerResponse =
  | { type: "booted"; id: number; manifest: GeneratedManifest }
  | { type: "calculated"; id: number; result: CalculationResult }
  | { type: "error"; id: number; message: string };
