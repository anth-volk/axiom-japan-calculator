import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exactPaths = [
  "public/generated/artifacts",
  "public/engine/axiom_rules_engine_wasm.js",
  "public/engine/axiom_rules_engine_wasm.d.ts",
];
const exactDiff = spawnSync(
  "git",
  ["diff", "--exit-code", "HEAD", "--", ...exactPaths],
  { cwd: root, encoding: "utf8" },
);
if (exactDiff.status !== 0) {
  throw new Error(
    `The rebuilt policy artifacts or WASM bindings differ:\n${exactDiff.stdout}${exactDiff.stderr}`,
  );
}

const baselineResult = spawnSync(
  "git",
  ["show", "HEAD:public/generated/manifest.json"],
  { cwd: root, encoding: "utf8" },
);
if (baselineResult.status !== 0) {
  throw new Error(`Could not read the baseline manifest: ${baselineResult.stderr}`);
}
const baseline = JSON.parse(baselineResult.stdout);
const rebuilt = JSON.parse(
  await readFile(resolve(root, "public/generated/manifest.json"), "utf8"),
);
const baselineWasmSha256 = baseline.engineAssets.wasmSha256;
const rebuiltWasmSha256 = rebuilt.engineAssets.wasmSha256;
delete baseline.engineAssets.wasmSha256;
delete rebuilt.engineAssets.wasmSha256;

if (JSON.stringify(baseline) !== JSON.stringify(rebuilt)) {
  throw new Error(
    "The rebuilt manifest differs beyond the permitted host-specific WASM hash",
  );
}

console.log(
  "Rebuilt policy artifacts, WASM JavaScript bindings, and normalized manifest match exactly",
);
if (baselineWasmSha256 === rebuiltWasmSha256) {
  console.log(`WASM binary is byte-identical: ${rebuiltWasmSha256}`);
} else {
  console.log(
    `WASM binary is host-specific (${baselineWasmSha256} -> ${rebuiltWasmSha256}); integrity and calculation execution remain required`,
  );
}
