import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "public/generated/manifest.json"), "utf8"),
);
const preset = JSON.parse(
  await readFile(resolve(root, "config/validated-working-parent.json"), "utf8"),
);
const engine =
  process.env.JP_ENGINE_BIN ??
  resolve(root, "vendor/axiom-rules-engine/target/release/axiom-rules-engine");

const values = Object.fromEntries(
  manifest.inputs.map((input) => [
    input.slot,
    input.kind === "bool" ? false : "0",
  ]),
);
Object.assign(values, preset);

const inputBySlot = new Map(manifest.inputs.map((input) => [input.slot, input]));
const expected = {
  "national-income-tax": 82649,
  "employees-pension": 329400,
  "national-pension": 0,
  "employment-insurance": 10800,
  "child-allowance": 120000,
  "child-rearing-allowance": 0,
  "special-child-rearing-allowance": 0,
  "disabled-child-welfare-allowance": 0,
  "special-disability-allowance": 0,
};

function periodsFor(program) {
  if (program.cadence === "annual") {
    return [
      {
        period_kind: "tax_year",
        start: "2018-01-01",
        end: "2018-12-31",
      },
    ];
  }
  return Array.from({ length: 12 }, (_, index) => {
    const year = 2018;
    const month = index + 1;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return {
      period_kind: "month",
      start: `${prefix}-01`,
      end: `${prefix}-${String(lastDay).padStart(2, "0")}`,
    };
  });
}

for (const program of manifest.programs) {
  let actual = 0;
  for (const period of periodsFor(program)) {
    const inputs = program.inputs.map((programInput) => {
      const input = inputBySlot.get(programInput.slot);
      if (!input) throw new Error(`Unknown input ${programInput.slot}`);
      const value = values[input.slot];
      return {
        name: programInput.canonicalRequestName,
        entity: "Person",
        entity_id: "person:primary",
        interval: { start: period.start, end: period.end },
        value:
          input.kind === "bool"
            ? { kind: "bool", value: value === true }
            : { kind: "decimal", value: String(value) },
      };
    });

    const execution = spawnSync(
      engine,
      [
        "run-compiled",
        "--artifact",
        resolve(root, "public", program.artifact),
      ],
      {
        input: JSON.stringify({
          mode: "fast",
          dataset: { inputs, relations: [] },
          queries: [
            {
              entity_id: "person:primary",
              period,
              outputs: [program.summaryOutput],
            },
          ],
        }),
        encoding: "utf8",
      },
    );

    if (execution.status !== 0) {
      throw new Error(
        `${program.id} native execution failed: ${execution.stderr || execution.stdout}`,
      );
    }
    const response = JSON.parse(execution.stdout);
    const output = response.results[0].outputs[program.summaryOutput];
    actual +=
      output.kind === "judgment"
        ? Number(output.outcome === "holds")
        : Number(output.value.value);
  }
  if (actual !== expected[program.id]) {
    throw new Error(
      `${program.id}: expected ${expected[program.id]}, got ${actual}`,
    );
  }
  console.log(`${program.id}: ${actual}`);
}

console.log(
  "Validated the complete nine-program calendar-year 2018 native component ledger",
);
