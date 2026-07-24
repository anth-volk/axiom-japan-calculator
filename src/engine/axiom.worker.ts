/// <reference lib="webworker" />

import type {
  AxiomOutputValue,
  CalculationResult,
  GeneratedManifest,
  InputValue,
  ManifestInput,
  ManifestProgram,
  ProgramResult,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { annualPeriod, isSupportedMonth, monthPeriod } from "./periods";

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

function executeProgram(
  runtime: Runtime,
  program: ManifestProgram,
  month: string,
  values: Record<string, InputValue>,
): ProgramResult {
  const period =
    program.cadence === "annual"
      ? annualPeriod(Number(month.slice(0, 4)))
      : monthPeriod(month);

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
    programId: program.id,
    requestedMode: response.metadata.requested_mode,
    actualMode: response.metadata.actual_mode,
    fallbackReason: response.metadata.fallback_reason,
    outputs: firstResult.outputs,
  };
}

async function calculate(
  runtime: Runtime,
  month: string,
  values: Record<string, InputValue>,
): Promise<CalculationResult> {
  const started = performance.now();
  const taxYear = Number(month.slice(0, 4));
  if (!Number.isInteger(taxYear) || !isSupportedMonth(month)) {
    throw new Error("Choose a calculation month between April 2017 and December 2026");
  }

  const programs = runtime.manifest.programs.map((program) =>
    executeProgram(runtime, program, month, values),
  );

  return {
    month,
    taxYear,
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
    const result = await calculate(runtime, message.month, message.values);
    respond({ type: "calculated", id: message.id, result });
  } catch (error) {
    respond({
      type: "error",
      id: message.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
