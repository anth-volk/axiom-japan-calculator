import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const config = JSON.parse(
  await readFile(resolve(root, "config/programs.json"), "utf8"),
);

const labelOverrides = {
  japan_employment_gross_cash_earnings: "Annual gross employment earnings",
  japan_public_pension_gross_receipts: "Annual gross public-pension receipts",
  japan_public_pension_recipient_age_at_statutory_test_date:
    "Public-pension recipient age",
  japan_public_pension_other_income_excluding_public_pension:
    "Other income excluding public pension",
  japan_social_insurance_contributions_paid_or_withheld:
    "Annual social-insurance contributions paid or withheld",
  japan_pit_total_income_amount: "Taxpayer total income amount",
  japan_pit_taxpayer_total_income: "Taxpayer total income for family deductions",
  japan_pit_is_resident_under_article_2: "Japanese tax resident",
  japan_pit_income_is_ordinary_domestic_source:
    "Income is ordinary domestic-source income",
  japan_employees_pension_monthly_remuneration: "Monthly remuneration",
  japan_employees_pension_gross_bonus: "Bonus paid in the selected month",
  japan_employees_pension_is_ordinary_covered_employee:
    "Ordinary covered employee",
  japan_employees_pension_employee_pays_share_in_cash:
    "Employee pays contribution share in cash",
  japan_employment_insurance_covered_wages_paid:
    "Covered wages paid in the selected month",
  japan_employment_insurance_is_withheld_from_wages:
    "Employment Insurance is withheld",
  japan_child_allowance_meets_nonfinancial_conditions:
    "Meets Child Allowance nonfinancial conditions",
  japan_child_allowance_assessed_income: "Child Allowance assessed income",
  japan_child_rearing_allowance_meets_family_conditions:
    "Meets Child Rearing Allowance family conditions",
  japan_national_pension_is_category_one_insured:
    "Category 1 National Pension insured person",
};

const acronymTokens = new Map([
  ["jpy", "JPY"],
]);

function titleCaseToken(token) {
  return acronymTokens.get(token) ?? `${token.slice(0, 1).toUpperCase()}${token.slice(1)}`;
}

function humanize(slot) {
  if (labelOverrides[slot]) return labelOverrides[slot];
  const words = slot
    .replace(/^japan_/, "")
    .split("_")
    .map(titleCaseToken)
    .join(" ");
  return words.startsWith("Pit ")
    ? `Income tax ${words.slice(4).toLowerCase()}`
    : words;
}

function isBooleanSlot(slot) {
  return (
    /_(is|has|meets)_/.test(slot) ||
    /_(is|has|meets)$/.test(slot) ||
    /_(approved|condition|conditions)$/.test(slot) ||
    /_pays_/.test(slot) ||
    /_withheld_/.test(slot)
  );
}

function isIntegerSlot(slot) {
  return /_(count|age)$/.test(slot) || /_age_/.test(slot);
}

function groupFor(slot) {
  if (slot.startsWith("japan_employees_pension_")) return "employees-pension";
  if (slot.startsWith("japan_national_pension_")) return "national-pension";
  if (slot.startsWith("japan_employment_insurance_")) return "employment-insurance";
  if (slot.startsWith("japan_child_allowance_")) return "child-allowance";
  if (slot.startsWith("japan_child_rearing_allowance_")) return "child-rearing-allowance";
  if (
    slot.startsWith("japan_special_child_rearing_allowance_") ||
    slot.startsWith("japan_disabled_child_welfare_allowance_") ||
    slot.startsWith("japan_special_disability_allowance_") ||
    slot.startsWith("japan_disability_allowance_") ||
    slot.startsWith("japan_individual_disability_allowance_")
  ) {
    return "disability-allowances";
  }
  return "national-income-tax";
}

async function sha256(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

const inputMap = new Map();
const generatedPrograms = [];
const engineVersions = new Set();
const artifactFormatVersions = new Set();

for (const program of config.programs) {
  const artifactPath = resolve(root, "public/generated/artifacts", program.artifact);
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  engineVersions.add(artifact.engine_version);
  artifactFormatVersions.add(artifact.artifact_format_version);

  const derivedById = new Map(
    artifact.program.derived.map((output) => [output.id, output]),
  );

  const outputs = program.outputs.map((output) => {
    const compiled = derivedById.get(output.id);
    if (!compiled) {
      throw new Error(`${program.id} does not contain configured output ${output.id}`);
    }
    return {
      ...output,
      dtype: compiled.dtype,
      unit: compiled.unit,
      period: compiled.period,
      corpusCitationPath: compiled.corpus_citation_path,
      sourceUrl: compiled.source_url,
    };
  });

  const inputs = artifact.metadata.input_catalog.map((input) => {
    const existing = inputMap.get(input.slot) ?? {
      slot: input.slot,
      label: humanize(input.slot),
      kind: isBooleanSlot(input.slot) ? "bool" : "decimal",
      integer: isIntegerSlot(input.slot),
      step: isIntegerSlot(input.slot) ? 1 : 1000,
      group: groupFor(input.slot),
      programs: [],
    };
    existing.programs.push(program.id);
    inputMap.set(input.slot, existing);
    return {
      slot: input.slot,
      canonicalRequestName: input.canonical_request_name,
    };
  });

  generatedPrograms.push({
    id: program.id,
    label: program.label,
    description: program.description,
    artifact: `generated/artifacts/${program.artifact}`,
    artifactSha256: await sha256(artifactPath),
    cadence: program.cadence,
    summaryBucket: program.summaryBucket,
    summaryOutput: program.summaryOutput,
    inputs,
    outputs,
  });
}

if (engineVersions.size !== 1 || artifactFormatVersions.size !== 1) {
  throw new Error("Generated artifacts do not use one engine and artifact format");
}

const inputs = [...inputMap.values()]
  .map((input) => ({
    ...input,
    programs: [...new Set(input.programs)].sort(),
  }))
  .sort((left, right) => {
    const group = left.group.localeCompare(right.group);
    return group || left.label.localeCompare(right.label);
  });

const engineJavascript = resolve(root, "public/engine/axiom_rules_engine_wasm.js");
const engineWasm = resolve(root, "public/engine/axiom_rules_engine_wasm_bg.wasm");

const manifest = {
  schemaVersion: config.schemaVersion,
  supportedPeriod: config.supportedPeriod,
  pins: config.pins,
  engineVersion: [...engineVersions][0],
  artifactFormatVersion: [...artifactFormatVersions][0],
  engineAssets: {
    javascript: "engine/axiom_rules_engine_wasm.js",
    javascriptSha256: await sha256(engineJavascript),
    wasm: "engine/axiom_rules_engine_wasm_bg.wasm",
    wasmSha256: await sha256(engineWasm),
  },
  inputCount: inputs.length,
  inputs,
  programs: generatedPrograms,
};

await writeFile(
  resolve(root, "public/generated/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Generated manifest for ${generatedPrograms.length} programs and ${inputs.length} inputs`,
);
