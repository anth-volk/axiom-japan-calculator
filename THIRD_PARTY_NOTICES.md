# Third-party notices

This repository includes generated policy artifacts and a WebAssembly build
derived from the following Apache-2.0 projects:

- [`anth-volk/rulespec-jp`](https://github.com/anth-volk/rulespec-jp), pinned
  to `0113ad599d6d458b3343c23039533b1a4827121f`;
- [`anth-volk/axiom-rules-engine`](https://github.com/anth-volk/axiom-rules-engine),
  pinned to `e5e40d40353f8459da4e46a9feae7279c2fecccc`; and
- [`anth-volk/axiom-compose`](https://github.com/anth-volk/axiom-compose),
  pinned to `9a514aca29c85a4a5f30a63f2275f9a362dd2b7a`.

The original projects are associated with The Axiom Foundation. Their names do
not imply endorsement of this independent calculator. The browser engine is a
compiled form of the pinned Axiom Rules Engine fork; the files under
`public/generated/artifacts` are compiled forms of the pinned Japan RuleSpec.

React, Vite, TypeScript, Vitest, wasm-bindgen, and their transitive dependencies
retain their respective licenses. Package versions are recorded in
`package-lock.json` and Rust dependency versions in the pinned engine's
`Cargo.lock`.
