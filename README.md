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

The household wizard covers the complete generated input contract: **108
inputs** used by nine executable programs. Biographical and family answers
produce the relevant aggregate count inputs; fact-intensive legal
classifications remain explicit fields.

| Cadence | Wave 1 component |
|---|---|
| Calendar year | National income tax for the encoded employment and public-pension path |
| Monthly executions summed within the calendar year | Employees' Pension employee contribution |
| Monthly executions summed within the calendar year | Employment Insurance employee contribution |
| Monthly executions summed within the calendar year | National Pension contribution after encoded relief |
| Monthly executions summed within the calendar year | Child Allowance |
| Monthly executions summed within the calendar year | Child Rearing Allowance |
| Monthly executions summed within the calendar year | Special Child Rearing Allowance |
| Monthly executions summed within the calendar year | Disabled Child Welfare Allowance |
| Monthly executions summed within the calendar year | Special Disability Allowance |

Fact-intensive determinations—such as custody, co-residence, disability grade,
agency approval, or pension coverage—remain explicit inputs. The calculator
does not infer them.

The current RuleSpec programs are person-scoped. The browser evaluates the
complete set of tax, contribution, and benefit programs for every household
member. Household relationships are translated into each `Person` request; the
Wave 1 artifacts themselves do not yet consume a multi-person relationship
graph.

## Household wizard

The wizard is a conventional family-member builder arranged vertically above
the result:

1. **Household** selects the calendar year, marital status, number of children,
   and birthdates. The wizard creates one primary adult, a spouse when married,
   and the selected number of children. Every member is calculated.
2. **Income & insurance** collects annual tax measures and monthly social
   insurance facts for every member. June and December bonuses can
   differ from ordinary monthly remuneration.
3. **Tax facts** assigns dependant and disability categories to people. The
   wizard derives the primary taxpayer's encoded counts and retains all other
   statutory tests as explicit fields.
4. **Benefits** assigns each child an explicit Child Allowance band and
   collects claimant, eligibility, supporter, and disability-allowance facts
   separately for every household member.
5. **Results** runs the worker and shows the household estimate in the wizard
   itself.

The social-insurance deduction can either be supplied manually or linked to
the calendar-year Employees' Pension, National Pension, and Employment
Insurance amounts calculated for that member. The linked option is on by
default, and the redundant manual amount is hidden while it is active.

Currency entry is localized without changing the integer-yen values sent to
Axiom. English annual inputs use millions of yen and monthly inputs use
thousands of yen. Japanese annual inputs use `万円` and monthly inputs use
`千円`, with the unit after the value. Japanese calculated amounts likewise
place `円` after the number.

Provision-specific fields are filtered using their encoded effective periods.
For example, historical widow/widower fields are replaced from 2020, the 2025
specific-relative deduction does not appear in earlier years, and the
post-October-2024 Child Allowance expansion controls high-school bands and the
removal of its income test.

The wizard never treats a section as a rule selector. All applicable compiled
programs run. A boolean asserts a legal fact, while an off value says the fact
does not hold.

## Important boundary

This app presents a **component estimate**, not take-home pay or disposable
income. It does not include individual inhabitant tax, National Health
Insurance, employee health-insurance premiums, long-term-care premiums, Public
Assistance amounts, municipal benefits, or other Wave 1 exclusions.

Monthly and annual rules have an inclusive support boundary of `2017-04-01`.
The selector uses calendar years 2017 through 2026 because Japanese individual
income tax is assessed by calendar year. Calendar Year 2018 is the first
complete model year.

Each option also shows the Japanese era year. For example, 2018 is `2018
(Heisei 30)` / `2018年（平成30年）`. Because the era changed on May 1, 2019,
that calendar year is shown as `2019 (Heisei 31 / Reiwa 1)` /
`2019年（平成31年・令和元年）`. See the government's
[era transition information](https://www.nta.go.jp/information/other/shingengo/index.htm).

For 2017, both annual and monthly execution begin at the April 1 support
boundary and end December 31; supplied annual values are not prorated.
Japanese source provenance preserves era dates such as `平成29年4月1日`, while
execution uses normalized Gregorian ISO dates.

## Architecture

```text
React household wizard (main thread)
        │ member-scoped answers + derived household counts
        ▼
Web Worker
  ├─ verifies SHA-256 of the WASM binary
  ├─ verifies SHA-256 of all nine policy artifacts
  ├─ executes the Axiom WASM engine
  └─ returns typed policy outputs
        ▼
Household estimate and person/rule breakdown
```

The committed generated assets let an ordinary frontend build run without a
Rust or Python toolchain. CI separately rebuilds the artifacts and WASM from
the pinned source commits. Policy artifacts, JavaScript bindings, and the
normalized manifest must match exactly; the host-specific WASM binary must
pass its regenerated integrity hash and the complete nine-program calculation.

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
calculation outputs, so this exception does not bypass runtime verification.

## Tests and CI

`npm test` checks the input manifest, presets, and output formatting.
`npm run verify:generated` checks the committed asset hashes and program
contract. `npm run verify:wasm` executes the validated calendar-year 2018
scenario through
all nine programs using the committed WASM binary without a browser, including
all 12 January–December monthly executions.
`npm run verify:native` runs the same calculation when `JP_ENGINE_BIN` points
to the native Axiom engine. `npm run check` performs strict TypeScript checking,
and `npm run build` produces the static application.

The GitHub Actions workflow has two independent jobs:

1. test and build the committed browser application; and
2. check out all three exact source commits, rebuild RuleSpec composition,
   native compiler, WASM runtime, and manifest, then enforce exact policy
   artifacts and bindings plus native and WASM calculation execution.

## License

Apache-2.0. See [LICENSE](LICENSE) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
