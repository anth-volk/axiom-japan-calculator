import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "public/generated/manifest.json"), "utf8"),
);

async function verify(path, expected) {
  const content = await readFile(resolve(root, "public", path));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== expected) {
    throw new Error(`SHA-256 mismatch for ${path}: expected ${expected}, got ${actual}`);
  }
}

if (manifest.programs.length !== 9) {
  throw new Error(`Expected 9 executable programs, got ${manifest.programs.length}`);
}

if (manifest.inputs.length !== manifest.inputCount || manifest.inputCount !== 108) {
  throw new Error(
    `Expected the pinned input contract to contain 108 slots, got ${manifest.inputs.length}`,
  );
}

const slots = new Set(manifest.inputs.map((input) => input.slot));
if (slots.size !== manifest.inputs.length) {
  throw new Error("The generated input catalog contains duplicate slots");
}

for (const program of manifest.programs) {
  await verify(program.artifact, program.artifactSha256);
  for (const input of program.inputs) {
    if (!slots.has(input.slot)) {
      throw new Error(`${program.id} references unknown input slot ${input.slot}`);
    }
  }
  if (!program.outputs.some((output) => output.id === program.summaryOutput)) {
    throw new Error(`${program.id} summary output is not in its output catalog`);
  }
}

await verify(
  manifest.engineAssets.javascript,
  manifest.engineAssets.javascriptSha256,
);
await verify(manifest.engineAssets.wasm, manifest.engineAssets.wasmSha256);

console.log(
  `Verified ${manifest.programs.length} artifacts, ${manifest.inputCount} inputs, and the WASM package`,
);
