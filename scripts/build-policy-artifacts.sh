#!/usr/bin/env bash
set -euo pipefail

JP_CALC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JP_RULESPEC_ROOT="${JP_RULESPEC_ROOT:-${JP_CALC_ROOT}/vendor/rulespec-jp}"
JP_ENGINE_ROOT="${JP_ENGINE_ROOT:-${JP_CALC_ROOT}/vendor/axiom-rules-engine}"
JP_COMPOSE_ROOT="${JP_COMPOSE_ROOT:-${JP_CALC_ROOT}/vendor/axiom-compose}"
JP_ENGINE_BIN="${JP_ENGINE_BIN:-${JP_ENGINE_ROOT}/target/release/axiom-rules-engine}"
JP_COMPOSE_BIN="${JP_COMPOSE_BIN:-${JP_COMPOSE_ROOT}/.venv/bin/axiom-compose}"
JP_WASM_PACK_BIN="${JP_WASM_PACK_BIN:-wasm-pack}"
JP_ARTIFACT_DIR="${JP_CALC_ROOT}/public/generated/artifacts"
JP_WORK_DIR="${JP_CALC_ROOT}/public/generated/work"
JP_ENGINE_PUBLIC_DIR="${JP_CALC_ROOT}/public/engine"
JP_WASM_WORK_DIR="${JP_WORK_DIR}/wasm-pkg"

for jp_required_dir in "${JP_RULESPEC_ROOT}" "${JP_ENGINE_ROOT}" "${JP_COMPOSE_ROOT}"; do
  if [[ ! -d "${jp_required_dir}" ]]; then
    echo "Missing required checkout: ${jp_required_dir}" >&2
    exit 1
  fi
done

if [[ ! -x "${JP_ENGINE_BIN}" ]]; then
  cargo build --manifest-path "${JP_ENGINE_ROOT}/Cargo.toml" --release --locked
fi

if [[ ! -x "${JP_COMPOSE_BIN}" ]]; then
  python3 -m venv "${JP_COMPOSE_ROOT}/.venv"
  "${JP_COMPOSE_ROOT}/.venv/bin/python" -m pip install "${JP_COMPOSE_ROOT}"
fi

if ! command -v "${JP_WASM_PACK_BIN}" >/dev/null 2>&1; then
  echo "wasm-pack is required to regenerate the browser engine." >&2
  exit 1
fi

mkdir -p \
  "${JP_ARTIFACT_DIR}" \
  "${JP_WORK_DIR}" \
  "${JP_ENGINE_PUBLIC_DIR}" \
  "${JP_WASM_WORK_DIR}"

"${JP_COMPOSE_BIN}" \
  "${JP_RULESPEC_ROOT}/jp/programs/national-income-tax-wave1.yaml" \
  --rulespec-root "${JP_RULESPEC_ROOT}" \
  --output "${JP_WORK_DIR}/national-income-tax.rulespec.yaml"

"${JP_ENGINE_BIN}" compile-composed \
  --program "${JP_WORK_DIR}/national-income-tax.rulespec.yaml" \
  --rulespec-root "${JP_RULESPEC_ROOT}" \
  --output "${JP_ARTIFACT_DIR}/national-income-tax.json"

compile_atomic() {
  local module_path="$1"
  local artifact_name="$2"
  "${JP_ENGINE_BIN}" compile \
    --program "${JP_RULESPEC_ROOT}/${module_path}" \
    --rulespec-root "${JP_RULESPEC_ROOT}" \
    --output "${JP_ARTIFACT_DIR}/${artifact_name}"
}

compile_atomic \
  "jp/statutes/e-gov/329ac0000000115/article/81.yaml" \
  "employees-pension.json"
compile_atomic \
  "jp/policies/jps/national-pension/exemptions-and-deferrals.yaml" \
  "national-pension.json"
compile_atomic \
  "jp/policies/mhlw/employment-insurance/fy2017-rates.yaml" \
  "employment-insurance.json"
compile_atomic \
  "jp/statutes/e-gov/346ac0000000073/article/6.yaml" \
  "child-allowance.json"
compile_atomic \
  "jp/regulations/e-gov/336co0000000405/article/2-4.yaml" \
  "child-rearing-allowance.json"
compile_atomic \
  "jp/regulations/e-gov/350co0000000207/article/5-2.yaml" \
  "special-child-rearing-allowance.json"
compile_atomic \
  "jp/regulations/e-gov/350co0000000207/article/9-2.yaml" \
  "disabled-child-welfare-allowance.json"
compile_atomic \
  "jp/regulations/e-gov/350co0000000207/article/10-2.yaml" \
  "special-disability-allowance.json"

"${JP_WASM_PACK_BIN}" build "${JP_ENGINE_ROOT}/wasm" \
  --target web \
  --release \
  --out-dir "${JP_WASM_WORK_DIR}"

cp \
  "${JP_WASM_WORK_DIR}/axiom_rules_engine_wasm.js" \
  "${JP_WASM_WORK_DIR}/axiom_rules_engine_wasm.d.ts" \
  "${JP_WASM_WORK_DIR}/axiom_rules_engine_wasm_bg.wasm" \
  "${JP_ENGINE_PUBLIC_DIR}/"

node "${JP_CALC_ROOT}/scripts/generate-manifest.mjs"
node "${JP_CALC_ROOT}/scripts/verify-generated.mjs"
