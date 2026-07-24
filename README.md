# Axiom Japan household calculator

An independent, browser-only calculator for the national tax, contribution,
and benefit rules encoded in
[`anth-volk/rulespec-jp`](https://github.com/anth-volk/rulespec-jp) Wave 1.

The app sends a household's answers to the Axiom Rules Engine compiled to
WebAssembly (WASM) inside a Web Worker. It makes no household-data network
requests. Nine compiled policy programs and their integrity hashes are shipped
as static assets.

This is experimental, unsigned work under `anth-volk`. It is not official
Axiom Foundation material, has not been reviewed or endorsed by The Axiom
Foundation or the Government of Japan, and is not tax advice.

## What it calculates

The UI exposes the complete generated input contract: **108 explicit inputs**
used by nine executable programs.

| Cadence | Wave 1 component |
|---|---|
| Annual | National income tax for the encoded employment and public-pension path |
| Selected month | Employees' Pension employee contribution |
| Selected wage payment | Employment Insurance employee contribution |
| Selected month | National Pension contribution after encoded relief |
| Selected month | Child Allowance |
| Selected month | Child Rearing Allowance |
| Selected month | Special Child Rearing Allowance |
| Selected month | Disabled Child Welfare Allowance |
| Selected month | Special Disability Allowance |

Fact-intensive determinations—such as custody, co-residence, disability grade,
agency approval, or pension coverage—remain explicit inputs. The calculator
does not infer them.

The current RuleSpec programs are person-scoped. The browser therefore
evaluates one primary `Person`, with household, dependant, child, supporter,
and status facts supplied as aggregate/count inputs where the encoded rule
requires them. There is no multi-person relationship graph in Wave 1.

## Important boundary

This app presents a **component ledger**, not take-home pay or disposable
income. It does not include individual inhabitant tax, National Health
Insurance, employee health-insurance premiums, long-term-care premiums, Public
Assistance amounts, municipal benefits, or other Wave 1 exclusions.

Monthly benefit and contribution rules and the interface have an inclusive
support boundary of `2017-04-01`. For a selected 2017 month, the annual-tax
execution interval is April 1–December 31; supplied annual values are not
prorated. Calendar Year 2018 is the first complete annual component-validation
period and remains the default preset. The underlying Japanese source
provenance preserves era dates such as `平成29年4月1日`, while execution uses
normalized Gregorian ISO dates.

## Architecture

```text
React form (main thread)
        │ 108 explicit input values
        ▼
Web Worker
  ├─ verifies SHA-256 of the WASM binary
  ├─ verifies SHA-256 of all nine policy artifacts
  ├─ executes the Axiom WASM engine
  └─ returns typed policy outputs
        ▼
Component ledger and rule-level breakdown
```

The committed generated assets let an ordinary frontend build run without a
Rust or Python toolchain. CI separately rebuilds the artifacts and WASM from
the pinned source commits and fails on any generated diff.

## Pinned provenance

| Component | Repository | Commit/version |
|---|---|---|
| Japan RuleSpec | `anth-volk/rulespec-jp` | `0113ad599d6d458b3343c23039533b1a4827121f` |
| Axiom Rules Engine fork | `anth-volk/axiom-rules-engine` | `e5e40d40353f8459da4e46a9feae7279c2fecccc` |
| Axiom Compose fork | `anth-volk/axiom-compose` | `9a514aca29c85a4a5f30a63f2275f9a362dd2b7a` |
| Rust | — | `1.94.0` |
| wasm-pack | — | `0.13.1` |

`public/generated/manifest.json` is the machine-readable source of the pins,
program catalog, input catalog, output metadata, and integrity hashes.

## Run locally

Use Node 24:

```bash
npm ci
npm run verify:generated
npm test
npm run dev
```

The production build is:

```bash
npm run build
```

## Rebuild policy artifacts and WASM

The default rebuild expects the three pinned repositories at:

```text
vendor/rulespec-jp
vendor/axiom-rules-engine
vendor/axiom-compose
```

It also requires Python 3.14, Rust 1.94.0, and wasm-pack 0.13.1:

```bash
npm run build:policy
git diff --exit-code -- public/engine public/generated
```

For adjacent checkouts, override the roots:

```bash
JP_RULESPEC_ROOT=../rulespec-jp \
JP_ENGINE_ROOT=../axiom-rules-engine \
JP_COMPOSE_ROOT=../axiom-compose \
JP_ENGINE_BIN=../axiom-rules-engine/target/release/axiom-rules-engine \
JP_COMPOSE_BIN=../axiom-compose/.venv/bin/axiom-compose \
npm run build:policy
```

The build performs the national income-tax composition, compiles all nine
program artifacts, compiles the engine's browser WASM package, regenerates the
manifest, and verifies all hashes and the 108-slot contract.

## Tests and CI

`npm test` checks the input manifest, presets, and output formatting.
`npm run verify:generated` checks the committed asset hashes and program
contract. `npm run verify:wasm` executes the validated 2018 scenario through
all nine programs using the committed WASM binary without a browser.
`npm run verify:native` runs the same ledger when `JP_ENGINE_BIN` points to the
native Axiom engine. `npm run check` performs strict TypeScript checking, and
`npm run build` produces the static application.

The GitHub Actions workflow has two independent jobs:

1. test and build the committed browser application; and
2. check out all three exact source commits, rebuild RuleSpec composition,
   native compiler, WASM runtime, and manifest, then assert a clean generated
   diff.

## License

Apache-2.0. See [LICENSE](LICENSE) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
