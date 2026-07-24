import type {
  CalculationResult,
  GeneratedManifest,
} from "../engine/types";
import {
  RESULT_COPY,
  outputLabel,
  programCopy,
  type Language,
} from "../i18n/translations";
import { calendarYearLabel } from "../engine/periods";
import { formatMonth, formatOutput, formatYen } from "../policy/format";
import { isOutputApplicable } from "../policy/provisionPeriods";

interface ResultsPanelProps {
  manifest: GeneratedManifest;
  result: CalculationResult | null;
  calculating: boolean;
  error: string | null;
  language: Language;
}

function summaryValue(
  manifest: GeneratedManifest,
  result: CalculationResult,
  bucket: "annualTax" | "monthlyDeduction" | "monthlyBenefit",
) {
  const ids = new Set(
    manifest.programs
      .filter((program) => program.summaryBucket === bucket)
      .map((program) => program.id),
  );
  return result.programs.reduce(
    (sum, program) =>
      sum + (ids.has(program.programId) ? program.summaryAmount : 0),
    0,
  );
}

export function ResultsPanel({
  manifest,
  result,
  calculating,
  error,
  language,
}: ResultsPanelProps) {
  const copy = RESULT_COPY[language];

  if (error) {
    return (
      <aside className="results-panel">
        <div className="result-error" role="alert">
          <span>{copy.stopped}</span>
          <strong>{error}</strong>
          <p>{copy.review}</p>
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
        <p>{calculating ? copy.running : copy.preparing}</p>
      </aside>
    );
  }

  const annualTax = summaryValue(manifest, result, "annualTax");
  const annualDeductions = summaryValue(manifest, result, "monthlyDeduction");
  const annualBenefits = summaryValue(manifest, result, "monthlyBenefit");
  const annualPosition = annualBenefits - annualDeductions;
  const yearLabel = calendarYearLabel(result.calendarYear, language);

  return (
    <aside className="results-panel" aria-busy={calculating} aria-live="polite">
      <div className="results-heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.heading}</h2>
        </div>
        <span className={`status-dot ${calculating ? "status-dot--busy" : ""}`}>
          {calculating ? copy.updating : `${result.elapsedMs.toFixed(0)} ms`}
        </span>
      </div>

      <div className="summary-grid">
        <article className="summary-card summary-card--ink">
          <span>{copy.calendarTax}</span>
          <strong data-testid="summary-annual-tax">
            {formatYen(annualTax, language)}
          </strong>
          <small>{copy.calendarTaxNote(result.calendarYear)}</small>
        </article>
        <article className="summary-card">
          <span>{copy.annualDeductions}</span>
          <strong data-testid="summary-annual-deductions">
            {formatYen(annualDeductions, language)}
          </strong>
          <small>{copy.annualNote(yearLabel)}</small>
        </article>
        <article className="summary-card">
          <span>{copy.annualBenefits}</span>
          <strong data-testid="summary-annual-benefits">
            {formatYen(annualBenefits, language)}
          </strong>
          <small>{copy.benefitsNote}</small>
        </article>
        <article className="summary-card summary-card--accent">
          <span>{copy.annualPosition}</span>
          <strong data-testid="summary-annual-position">
            {annualPosition < 0 ? "−" : "+"}
            {formatYen(Math.abs(annualPosition), language)}
          </strong>
          <small>{copy.positionNote}</small>
        </article>
      </div>

      <div className="scope-warning">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3 2.8 20h18.4L12 3Zm0 6v5m0 3.5v.1" />
        </svg>
        <p>
          {copy.warning}
          {result.calendarYear === 2017 &&
            (language === "ja"
              ? " 2017年のすべての月次・年次実行期間は、対応開始日の4月1日から12月31日までです。年額入力は按分しません。"
              : " Every 2017 execution begins at the April 1 support boundary; annual inputs are not prorated.")}
        </p>
      </div>

      <div className="breakdown">
        <div className="breakdown-heading">
          <h3>{copy.breakdown}</h3>
          <span>
            {result.programs.length} {copy.executions}
          </span>
        </div>

        {result.programs.map((programResult) => {
          const program = manifest.programs.find(
            (candidate) => candidate.id === programResult.programId,
          );
          if (!program) return null;
          const localizedProgram = programCopy(program, language);
          const isAnnual = program.cadence === "annual";
          const applicableOutputs = program.outputs.filter((output) =>
            isOutputApplicable(output, result.calendarYear),
          );
          return (
              <details
                key={`${programResult.personId}-${program.id}`}
                className="result-program"
                open={
                  program.id === "national-income-tax" ||
                  programResult.summaryAmount > 0
                }
              >
                <summary>
                  <span>
                    <strong>
                      {localizedProgram.label} · {programResult.personLabel}
                    </strong>
                    <small>{localizedProgram.description}</small>
                  </span>
                  <span className="program-amount">
                    {formatYen(programResult.summaryAmount, language)}
                    <svg aria-hidden="true" viewBox="0 0 16 16">
                      <path d="m3 6 5 5 5-5" />
                    </svg>
                  </span>
                </summary>
                <div className="program-body">
                  {!isAnnual && (
                    <p className="program-period-label">{copy.annualTotal}</p>
                  )}

                  {!isAnnual && programResult.monthlySummaries.length ? (
                    <div className="monthly-schedule">
                      <strong>{copy.monthlySchedule}</strong>
                      <dl>
                        {programResult.monthlySummaries.map((month) => (
                          <div key={month.month}>
                            <dt>{formatMonth(month.month, language)}</dt>
                            <dd>{formatYen(month.amount, language)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}

                  <p className="program-period-label">
                    {isAnnual ? copy.calendarTotal : copy.endSnapshot}
                  </p>
                  <dl>
                    {applicableOutputs.map((output) => (
                      <div key={output.id}>
                        <dt>{outputLabel(output, language)}</dt>
                        <dd>
                          {formatOutput(
                            programResult.outputs[output.id],
                            output,
                            language,
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="program-provenance">
                    <span>
                      {copy.execution}: {programResult.actualMode}
                      {programResult.fallbackReason
                        ? ` (${programResult.fallbackReason})`
                        : ""}
                    </span>
                    <code>
                      {applicableOutputs.find(
                        (output) => output.corpusCitationPath,
                      )?.corpusCitationPath ?? program.summaryOutput}
                    </code>
                  </div>
                </div>
              </details>
          );
        })}
      </div>

      <div className="provenance-card">
        <p className="eyebrow">{copy.reproducibility}</p>
        <div>
          <span>{copy.rules}</span>
          <code>{manifest.pins.rulespec.commit.slice(0, 12)}</code>
        </div>
        <div>
          <span>{copy.engine}</span>
          <code>
            {manifest.engineVersion} · artifact v{manifest.artifactFormatVersion}
          </code>
        </div>
        <div>
          <span>{copy.runtime}</span>
          <code>{copy.workerRuntime}</code>
        </div>
      </div>
    </aside>
  );
}
