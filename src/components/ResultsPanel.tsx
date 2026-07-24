import type {
  CalculationResult,
  GeneratedManifest,
  ProgramResult,
} from "../engine/types";
import { formatOutput, formatYen, numericOutput } from "../policy/format";

interface ResultsPanelProps {
  manifest: GeneratedManifest;
  result: CalculationResult | null;
  calculating: boolean;
  error: string | null;
}

function resultMap(result: CalculationResult) {
  return new Map(result.programs.map((program) => [program.programId, program]));
}

function summaryValue(
  manifest: GeneratedManifest,
  results: Map<string, ProgramResult>,
  bucket: "annualTax" | "monthlyDeduction" | "monthlyBenefit",
) {
  return manifest.programs
    .filter((program) => program.summaryBucket === bucket)
    .reduce((sum, program) => {
      const output = results.get(program.id)?.outputs[program.summaryOutput];
      return sum + numericOutput(output);
    }, 0);
}

export function ResultsPanel({
  manifest,
  result,
  calculating,
  error,
}: ResultsPanelProps) {
  if (error) {
    return (
      <aside className="results-panel">
        <div className="result-error" role="alert">
          <span>Calculation stopped</span>
          <strong>{error}</strong>
          <p>
            Review the selected period and the explicit statutory inputs, then run the
            calculator again.
          </p>
        </div>
      </aside>
    );
  }

  if (!result) {
    return (
      <aside className="results-panel results-panel--loading" aria-live="polite">
        <div className="engine-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>{calculating ? "Running the Axiom engine…" : "Preparing the policy engine…"}</p>
      </aside>
    );
  }

  const byProgram = resultMap(result);
  const annualTax = summaryValue(manifest, byProgram, "annualTax");
  const monthlyDeductions = summaryValue(manifest, byProgram, "monthlyDeduction");
  const monthlyBenefits = summaryValue(manifest, byProgram, "monthlyBenefit");
  const monthlyPosition = monthlyBenefits - monthlyDeductions;

  return (
    <aside className="results-panel" aria-busy={calculating} aria-live="polite">
      <div className="results-heading">
        <div>
          <p className="eyebrow">Axiom result</p>
          <h2>Your modeled ledger</h2>
        </div>
        <span className={`status-dot ${calculating ? "status-dot--busy" : ""}`}>
          {calculating ? "Updating" : `${result.elapsedMs.toFixed(0)} ms`}
        </span>
      </div>

      <div className="summary-grid">
        <article className="summary-card summary-card--ink">
          <span>Annual national income tax</span>
          <strong data-testid="summary-annual-tax">{formatYen(annualTax)}</strong>
          <small>
            {result.taxYear === 2017
              ? "2017 execution begins at the April 1 support boundary"
              : `Tax year ${result.taxYear}, including encoded national surtaxes`}
          </small>
        </article>
        <article className="summary-card">
          <span>Monthly modeled deductions</span>
          <strong data-testid="summary-monthly-deductions">
            {formatYen(monthlyDeductions)}
          </strong>
          <small>Pension and Employment Insurance for {result.month}</small>
        </article>
        <article className="summary-card">
          <span>Monthly modeled benefits</span>
          <strong data-testid="summary-monthly-benefits">
            {formatYen(monthlyBenefits)}
          </strong>
          <small>National benefits with supplied eligibility facts</small>
        </article>
        <article className="summary-card summary-card--accent">
          <span>Benefits minus contributions</span>
          <strong data-testid="summary-monthly-position">
            {monthlyPosition < 0 ? "−" : "+"}
            {formatYen(Math.abs(monthlyPosition))}
          </strong>
          <small>Selected month only; annual income tax is separate</small>
        </article>
      </div>

      <div className="scope-warning">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3 2.8 20h18.4L12 3Zm0 6v5m0 3.5v.1" />
        </svg>
        <p>
          This is a component ledger, not take-home pay or disposable income.
          Inhabitant tax and health and long-term-care premiums are not encoded.
          {result.taxYear === 2017 &&
            " The 2017 annual execution interval is April 1–December 31; annual inputs are not prorated."}
        </p>
      </div>

      <div className="breakdown">
        <div className="breakdown-heading">
          <h3>Rule-by-rule breakdown</h3>
          <span>{manifest.programs.length} compiled programs</span>
        </div>

        {manifest.programs.map((program) => {
          const programResult = byProgram.get(program.id);
          const summary = programResult?.outputs[program.summaryOutput];
          return (
            <details
              key={program.id}
              className="result-program"
              open={program.id === "national-income-tax" || numericOutput(summary) > 0}
            >
              <summary>
                <span>
                  <strong>{program.label}</strong>
                  <small>{program.description}</small>
                </span>
                <span className="program-amount">
                  {formatOutput(
                    summary,
                    program.outputs.find((output) => output.id === program.summaryOutput)!,
                  )}
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <path d="m3 6 5 5 5-5" />
                  </svg>
                </span>
              </summary>
              <div className="program-body">
                <dl>
                  {program.outputs.map((output) => (
                    <div key={output.id}>
                      <dt>{output.label}</dt>
                      <dd>{formatOutput(programResult?.outputs[output.id], output)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="program-provenance">
                  <span>
                    Execution: {programResult?.actualMode ?? "—"}
                    {programResult?.fallbackReason
                      ? ` (${programResult.fallbackReason})`
                      : ""}
                  </span>
                  <code>
                    {program.outputs.find((output) => output.corpusCitationPath)
                      ?.corpusCitationPath ?? program.summaryOutput}
                  </code>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="provenance-card">
        <p className="eyebrow">Reproducibility</p>
        <div>
          <span>Rules</span>
          <code>{manifest.pins.rulespec.commit.slice(0, 12)}</code>
        </div>
        <div>
          <span>Engine</span>
          <code>
            {manifest.engineVersion} · artifact v{manifest.artifactFormatVersion}
          </code>
        </div>
        <div>
          <span>Runtime</span>
          <code>Web Worker · verified WASM + artifacts</code>
        </div>
      </div>
    </aside>
  );
}
