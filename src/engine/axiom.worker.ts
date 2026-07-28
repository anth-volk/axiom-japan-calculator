/// <reference lib="webworker" />

import type {
  AxiomOutputValue,
  CalculationPersonInput,
  CalculationResult,
  GeneratedManifest,
  InputValue,
  ManifestInput,
  ManifestProgram,
  ProgramResult,
  ResolvedPersonValues,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import {
  calendarYearMonths,
  calendarYearPeriod,
  isSupportedCalendarYear,
  monthPeriod,
} from "./periods";

interface AxiomWasmModule {
  default: (options?: {
    module_or_path?: string | ArrayBuffer | Uint8Array;
  }) => Promise<unknown>;
  execute: (artifactJson: string, requestJson: string) => string;
  engine_version: () => string;
  artifact_format_version: () => number;
}

interface Runtime {
  manifest: GeneratedManifest;
  wasm: AxiomWasmModule;
  artifacts: Map<string, string>;
  inputs: Map<string, ManifestInput>;
}

interface AxiomExecutionResponse {
  metadata: {
    requested_mode: string;
    actual_mode: string;
    fallback_reason: string | null;
  };
  results: Array<{
    outputs: Record<string, AxiomOutputValue>;
  }>;
}

let runtimePromise: Promise<Runtime> | null = null;
let configuredBaseUrl: string | null = null;

function joinUrl(baseUrl: string, relative: string): string {
  return new URL(relative, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
}

async function digestHex(content: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", content);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchVerified(
  url: string,
  expectedSha256: string,
): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  }
  const content = await response.arrayBuffer();
  const actualSha256 = await digestHex(content);
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `Integrity check failed for ${url}: expected ${expectedSha256}, got ${actualSha256}`,
    );
  }
  return content;
}

async function boot(baseUrl: string): Promise<Runtime> {
  const manifestResponse = await fetch(joinUrl(baseUrl, "generated/manifest.json"), {
    cache: "no-cache",
  });
  if (!manifestResponse.ok) {
    throw new Error(`Could not load the policy manifest: HTTP ${manifestResponse.status}`);
  }
  const manifest = (await manifestResponse.json()) as GeneratedManifest;

  const [wasm, wasmBytes, artifactEntries] = await Promise.all([
    import(
      /* @vite-ignore */ joinUrl(baseUrl, manifest.engineAssets.javascript)
    ) as Promise<AxiomWasmModule>,
    fetchVerified(
      joinUrl(baseUrl, manifest.engineAssets.wasm),
      manifest.engineAssets.wasmSha256,
    ),
    Promise.all(
      manifest.programs.map(async (program) => {
        const content = await fetchVerified(
          joinUrl(baseUrl, program.artifact),
          program.artifactSha256,
        );
        return [program.id, new TextDecoder().decode(content)] as const;
      }),
    ),
  ]);

  await wasm.default({ module_or_path: new Uint8Array(wasmBytes) });

  if (wasm.engine_version() !== manifest.engineVersion) {
    throw new Error(
      `Engine version mismatch: manifest ${manifest.engineVersion}, WASM ${wasm.engine_version()}`,
    );
  }
  if (wasm.artifact_format_version() !== manifest.artifactFormatVersion) {
    throw new Error(
      `Artifact format mismatch: manifest ${manifest.artifactFormatVersion}, WASM ${wasm.artifact_format_version()}`,
    );
  }

  return {
    manifest,
    wasm,
    artifacts: new Map(artifactEntries),
    inputs: new Map(manifest.inputs.map((input) => [input.slot, input])),
  };
}

function scalarFor(input: ManifestInput, value: InputValue | undefined) {
  if (input.kind === "bool") {
    return { kind: "bool", value: value === true };
  }
  const text = typeof value === "string" && value.trim() !== "" ? value : "0";
  return { kind: "decimal", value: text };
}

function numericOutput(output: AxiomOutputValue | undefined): number {
  if (!output || output.kind === "judgment") return 0;
  const value = output.value.value;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function numericInput(values: Record<string, InputValue>, slot: string): number {
  const value = values[slot];
  const numeric = typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(numeric) ? numeric : 0;
}

function usesAutomaticValue(person: CalculationPersonInput, slot: string) {
  return person.autoLinkedSlots.includes(slot);
}

function executeProgramPeriod(
  runtime: Runtime,
  program: ManifestProgram,
  period: ReturnType<typeof monthPeriod>,
  values: Record<string, InputValue>,
) {
  const inputs = program.inputs.map((programInput) => {
    const input = runtime.inputs.get(programInput.slot);
    if (!input) throw new Error(`Unknown manifest input ${programInput.slot}`);
    return {
      name: programInput.canonicalRequestName,
      entity: "Person",
      entity_id: "person:primary",
      interval: { start: period.start, end: period.end },
      value: scalarFor(input, values[programInput.slot]),
    };
  });

  const artifact = runtime.artifacts.get(program.id);
  if (!artifact) throw new Error(`Missing compiled artifact for ${program.id}`);

  const response = JSON.parse(
    runtime.wasm.execute(
      artifact,
      JSON.stringify({
        mode: "fast",
        dataset: { inputs, relations: [] },
        queries: [
          {
            entity_id: "person:primary",
            period,
            outputs: program.outputs.map((output) => output.id),
          },
        ],
      }),
    ),
  ) as AxiomExecutionResponse;

  const firstResult = response.results[0];
  if (!firstResult) throw new Error(`${program.label} returned no result`);

  return {
    requestedMode: response.metadata.requested_mode,
    actualMode: response.metadata.actual_mode,
    fallbackReason: response.metadata.fallback_reason,
    outputs: firstResult.outputs,
  };
}

function executeProgram(
  runtime: Runtime,
  program: ManifestProgram,
  calendarYear: number,
  person: CalculationPersonInput,
  values = person.values,
): ProgramResult {
  if (program.cadence === "annual") {
    const execution = executeProgramPeriod(
      runtime,
      program,
      calendarYearPeriod(calendarYear),
      values,
    );
    return {
      programId: program.id,
      personId: person.id,
      personLabel: person.label,
      ...execution,
      summaryAmount: numericOutput(execution.outputs[program.summaryOutput]),
      monthlySummaries: [],
    };
  }

  const executions = calendarYearMonths(calendarYear).map((month) => ({
    month,
    execution: executeProgramPeriod(
      runtime,
      program,
      monthPeriod(month),
      { ...values, ...(person.monthlyOverrides[month] ?? {}) },
    ),
  }));
  const last = executions.at(-1);
  if (!last) throw new Error(`${program.label} has no calendar-year months`);
  return {
    programId: program.id,
    personId: person.id,
    personLabel: person.label,
    requestedMode: last.execution.requestedMode,
    actualMode: last.execution.actualMode,
    fallbackReason:
      executions.find(({ execution }) => execution.fallbackReason)?.execution
        .fallbackReason ?? null,
    outputs: last.execution.outputs,
    summaryAmount: executions.reduce(
      (total, { execution }) =>
        total + numericOutput(execution.outputs[program.summaryOutput]),
      0,
    ),
    monthlySummaries: executions.map(({ month, execution }) => ({
      month,
      amount: numericOutput(execution.outputs[program.summaryOutput]),
    })),
  };
}

const EMPLOYMENT_INCOME_OUTPUT =
  "jp:statutes/e-gov/340ac0000000033/article/28#japan_employment_income_article_28";
const PUBLIC_PENSION_INCOME_OUTPUT =
  "jp:statutes/e-gov/332ac0000000026/article/41-15-3#japan_public_pension_income";

function resolveAutomaticIncomeValues(
  runtime: Runtime,
  taxProgram: ManifestProgram,
  calendarYear: number,
  person: CalculationPersonInput,
): CalculationPersonInput {
  const values = { ...person.values };
  let taxPreview = executeProgram(
    runtime,
    taxProgram,
    calendarYear,
    person,
    values,
  );
  const employmentIncome = numericOutput(
    taxPreview.outputs[EMPLOYMENT_INCOME_OUTPUT],
  );
  const nonLaborIncome = numericInput(
    values,
    "japan_pit_non_labor_income_amount",
  );

  if (
    usesAutomaticValue(
      person,
      "japan_public_pension_other_income_excluding_public_pension",
    )
  ) {
    values.japan_public_pension_other_income_excluding_public_pension = String(
      employmentIncome + nonLaborIncome,
    );
    taxPreview = executeProgram(
      runtime,
      taxProgram,
      calendarYear,
      person,
      values,
    );
  }

  const publicPensionIncome = numericOutput(
    taxPreview.outputs[PUBLIC_PENSION_INCOME_OUTPUT],
  );
  const calculatedTotalIncome =
    employmentIncome + publicPensionIncome + nonLaborIncome;
  if (usesAutomaticValue(person, "japan_pit_total_income_amount")) {
    values.japan_pit_total_income_amount = String(calculatedTotalIncome);
  }
  if (usesAutomaticValue(person, "japan_pit_taxpayer_total_income")) {
    values.japan_pit_taxpayer_total_income = String(
      numericInput(values, "japan_pit_total_income_amount"),
    );
  }

  const totalIncome = numericInput(values, "japan_pit_total_income_amount");
  for (const slot of [
    "japan_national_pension_applicant_adjusted_income",
    "japan_child_allowance_assessed_income",
    "japan_child_rearing_allowance_adjusted_prior_year_income",
    "japan_disabled_child_welfare_allowance_claimant_adjusted_income",
    "japan_special_child_rearing_allowance_claimant_adjusted_income",
    "japan_special_disability_allowance_claimant_adjusted_income",
  ]) {
    if (usesAutomaticValue(person, slot)) values[slot] = String(totalIncome);
  }

  return { ...person, values };
}

function resolveAutomaticHouseholdIncomeValues(
  people: CalculationPersonInput[],
): CalculationPersonInput[] {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const highestHouseholdIncome = Math.max(
    0,
    ...people.map((person) =>
      numericInput(person.values, "japan_pit_total_income_amount"),
    ),
  );
  return people.map((person) => {
    const values = { ...person.values };
    const spouse = person.spouseId ? peopleById.get(person.spouseId) : undefined;
    if (spouse && usesAutomaticValue(person, "japan_pit_spouse_total_income")) {
      values.japan_pit_spouse_total_income = String(
        numericInput(spouse.values, "japan_pit_total_income_amount"),
      );
    }
    for (const slot of [
      "japan_child_rearing_allowance_highest_supporter_adjusted_income",
      "japan_disabled_child_welfare_allowance_highest_supporter_adjusted_income",
      "japan_special_child_rearing_allowance_highest_supporter_adjusted_income",
      "japan_special_disability_allowance_highest_supporter_adjusted_income",
    ]) {
      if (usesAutomaticValue(person, slot)) {
        values[slot] = String(highestHouseholdIncome);
      }
    }
    return { ...person, values };
  });
}

function resolvePeople(
  runtime: Runtime,
  calendarYear: number,
  people: CalculationPersonInput[],
): CalculationPersonInput[] {
  const taxProgram = runtime.manifest.programs.find(
    (program) => program.id === "national-income-tax",
  );
  if (!taxProgram) throw new Error("The national income-tax program is missing");

  return resolveAutomaticHouseholdIncomeValues(
    people.map((person) =>
      resolveAutomaticIncomeValues(runtime, taxProgram, calendarYear, person),
    ),
  );
}

function automaticValuesFor(
  people: CalculationPersonInput[],
): ResolvedPersonValues[] {
  return people.map((person) => ({
    personId: person.id,
    values: Object.fromEntries(
      person.autoLinkedSlots.map((slot) => [slot, person.values[slot]]),
    ),
  }));
}

async function previewAutomaticValues(
  runtime: Runtime,
  calendarYear: number,
  people: CalculationPersonInput[],
) {
  if (!Number.isInteger(calendarYear) || !isSupportedCalendarYear(calendarYear)) {
    throw new Error("Choose a supported calendar year between 2017 and 2026");
  }
  if (!people.length) {
    throw new Error("Choose at least one household member to calculate");
  }
  return automaticValuesFor(resolvePeople(runtime, calendarYear, people));
}

async function calculate(
  runtime: Runtime,
  calendarYear: number,
  people: CalculationPersonInput[],
): Promise<CalculationResult> {
  const started = performance.now();
  if (
    !Number.isInteger(calendarYear) ||
    !isSupportedCalendarYear(calendarYear)
  ) {
    throw new Error("Choose a supported calendar year between 2017 and 2026");
  }
  if (!people.length) {
    throw new Error("Choose at least one household member to calculate");
  }

  const contributionIds = new Set([
    "employees-pension",
    "national-pension",
    "employment-insurance",
  ]);
  const benefitPrograms = runtime.manifest.programs.filter(
    (program) => program.summaryBucket === "monthlyBenefit",
  );
  const contributionPrograms = runtime.manifest.programs.filter((program) =>
    contributionIds.has(program.id),
  );
  const taxProgram = runtime.manifest.programs.find(
    (program) => program.id === "national-income-tax",
  );
  if (!taxProgram) throw new Error("The national income-tax program is missing");
  const resolvedPeople = resolvePeople(runtime, calendarYear, people);

  const programs: ProgramResult[] = [];
  for (const person of resolvedPeople) {
    const contributions = contributionPrograms.map((program) =>
      executeProgram(runtime, program, calendarYear, person),
    );
    programs.push(...contributions);

    const modeledSocialInsurance = contributions.reduce(
      (sum, result) => sum + result.summaryAmount,
      0,
    );
    const taxValues = person.useModeledSocialInsurance
      ? {
          ...person.values,
          japan_social_insurance_contributions_paid_or_withheld: String(
            modeledSocialInsurance,
          ),
        }
      : person.values;
    programs.push(
      executeProgram(runtime, taxProgram, calendarYear, person, taxValues),
    );

    programs.push(
      ...benefitPrograms.map((program) =>
        executeProgram(runtime, program, calendarYear, person),
      ),
    );
  }
  const period = calendarYearPeriod(calendarYear);
  return {
    calendarYear,
    calendarYearStart: period.start,
    calendarYearEnd: period.end,
    resolvedPeople: automaticValuesFor(resolvedPeople),
    programs,
    elapsedMs: performance.now() - started,
  };
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  const respond = (response: WorkerResponse) => self.postMessage(response);

  try {
    if (message.type === "boot") {
      if (configuredBaseUrl && configuredBaseUrl !== message.baseUrl) {
        throw new Error("The Axiom worker was already configured for another asset root");
      }
      configuredBaseUrl = message.baseUrl;
      runtimePromise ??= boot(message.baseUrl);
      const runtime = await runtimePromise;
      respond({ type: "booted", id: message.id, manifest: runtime.manifest });
      return;
    }

    if (!runtimePromise) {
      throw new Error("The Axiom worker has not been initialized");
    }
    const runtime = await runtimePromise;
    if (message.type === "preview") {
      const values = await previewAutomaticValues(
        runtime,
        message.calendarYear,
        message.people,
      );
      respond({ type: "previewed", id: message.id, values });
      return;
    }
    const result = await calculate(
      runtime,
      message.calendarYear,
      message.people,
    );
    respond({ type: "calculated", id: message.id, result });
  } catch (error) {
    respond({
      type: "error",
      id: message.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
