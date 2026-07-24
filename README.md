# Axiom Japan household calculator

An independent, browser-only calculator for the national tax, contribution,
and benefit rules encoded in
[`anth-volk/rulespec-jp`](https://github.com/anth-volk/rulespec-jp) Wave 1.

The app sends a household's answers to the Axiom Rules Engine compiled to
WebAssembly (WASM) inside a Web Worker. It makes no household-data network
requests. Nine compiled policy programs and their integrity hashes are shipped
as static assets.

The interface is fully available in English and Japanese. Japanese is rendered
left-to-right, and the Japanese brand name is `アクシオム・ジャパン`.

This is experimental, unsigned work under `anth-volk`. It is not official
Axiom Foundation material, has not been reviewed or endorsed by The Axiom
Foundation or the Government of Japan, and is not tax advice.

## What it calculates

The UI exposes the complete generated input contract: **108 explicit inputs**
used by nine executable programs.

| Cadence | Wave 1 component |
|---|---|
| Calendar year matching the fiscal-year start | National income tax for the encoded employment and public-pension path |
| April–March fiscal-year total | Employees' Pension employee contribution |
| April–March fiscal-year total | Employment Insurance employee contribution |
| April–March fiscal-year total | National Pension contribution after encoded relief |
| April–March fiscal-year total | Child Allowance |
| April–March fiscal-year total | Child Rearing Allowance |
| April–March fiscal-year total | Special Child Rearing Allowance |
| April–March fiscal-year total | Disabled Child Welfare Allowance |
| April–March fiscal-year total | Special Disability Allowance |

Fact-intensive determinations—such as custody, co-residence, disability grade,
agency approval, or pension coverage—remain explicit inputs. The calculator
does not infer them.

The current RuleSpec programs are person-scoped. The browser therefore
evaluates one primary `Person`, with household, dependant, child, supporter,
and status facts supplied as aggregate/count inputs where the encoded rule
requires them. There is no multi-person relationship graph in Wave 1.

## Household setter and rule sections

The left side is an explicit input editor, not a conventional family-member
builder.

- The calculator always runs all nine compiled rule programs. Expanding,
  collapsing, or searching an input section does not activate or deactivate a
  program.
- A boolean switch asserts a legal or household fact. Off means that the fact
  is false; it does not mean that the corresponding program is skipped.
- Numeric fields supply statutory income measures, payment amounts, ages, and
  counts. Some measures—such as total income for a deduction—must be supplied
  explicitly because Wave 1 does not derive every legal income concept.
- The current model evaluates one primary `Person`. Spouses, children,
  dependants, and supporters are represented through counts, amounts, and
  status facts rather than separate person records.
- Monthly inputs are reused for each of the 12 months in the selected fiscal
  year. A changing salary, bonus, custody status, or child count cannot yet be
  entered month by month.
- Annual income inputs are used for national income tax in the calendar year
  matching the fiscal year's starting year. They are not constructed by adding
  the monthly contribution inputs.

The sections are grouped by the policy programs that consume their facts so a
user can find relevant inputs. They are therefore rule-oriented input groups,
not rule selectors.

## Important boundary

This app presents a **component ledger**, not take-home pay or disposable
income. It does not include individual inhabitant tax, National Health
Insurance, employee health-insurance premiums, long-term-care premiums, Public
Assistance amounts, municipal benefits, or other Wave 1 exclusions.

Monthly benefit and contribution rules and the interface have an inclusive
support boundary of `2017-04-01`. The selectable complete fiscal years are
FY2017 through FY2025. FY2018 means April 2018 through March 2019.

Each selector option also shows the Japanese era-year convention: for example,
`FY 2018 (Heisei 30)` / `2018年度（平成30年度）`. FY2019 is shown as
`FY 2019 (Reiwa 1)` / `2019年度（令和元年度）`, following the government's
post-transition convention that the whole national budget year use
`令和元年度`. See the
[Cabinet Office transition explanation](https://www.cao.go.jp/minister/1810_t_hirai/kaiken/2019/0402kaiken.html)
and the
[Ministry of Finance FY2019 accounts](https://www.mof.go.jp/policy/budget/budger_workflow/account/fy2019/index.html).

For FY2017, the national income-tax execution interval begins at the April 1
support boundary and ends December 31; supplied annual values are not
prorated. Calendar Year 2018 is the first complete annual component-validation
period and remains the default preset. Japanese source provenance preserves
era dates such as `平成29年4月1日`, while execution uses normalized Gregorian
ISO dates.

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
the pinned source commits. Policy artifacts, JavaScript bindings, and the
normalized manifest must match exactly; the host-specific WASM binary must
pass its regenerated integrity hash and the complete nine-program ledger.

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
npm run verify:rebuild
npm run verify:wasm
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

The optimized WASM binary is not assumed to be byte-identical across build
hosts. `verify:rebuild` requires exact RuleSpec artifacts, JavaScript bindings,
and every manifest field except the host-specific WASM SHA-256. The rebuilt
WASM must still match its regenerated hash and reproduce all nine expected
ledger outputs, so this exception does not bypass runtime verification.

## Tests and CI

`npm test` checks the input manifest, presets, and output formatting.
`npm run verify:generated` checks the committed asset hashes and program
contract. `npm run verify:wasm` executes the validated FY2018 scenario through
all nine programs using the committed WASM binary without a browser, including
all 12 April–March monthly executions.
`npm run verify:native` runs the same ledger when `JP_ENGINE_BIN` points to the
native Axiom engine. `npm run check` performs strict TypeScript checking, and
`npm run build` produces the static application.

The GitHub Actions workflow has two independent jobs:

1. test and build the committed browser application; and
2. check out all three exact source commits, rebuild RuleSpec composition,
   native compiler, WASM runtime, and manifest, then enforce exact policy
   artifacts and bindings plus native and WASM ledger execution.

## License

Apache-2.0. See [LICENSE](LICENSE) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
