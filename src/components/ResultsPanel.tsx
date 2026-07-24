import type {
  CalculationResult,
  GeneratedManifest,
  ProgramResult,
} from "../engine/types";
import {
  RESULT_COPY,
  outputLabel,
  programCopy,
  type Language,
} from "../i18n/translations";
import { fiscalYearLabel } from "../engine/periods";
import { formatMonth, formatOutput, formatYen } from "../policy/format";

interface ResultsPanelProps {
  manifest: GeneratedManifest;
  result: CalculationResult | null;
  calculating: boolean;
  error: string | null;
  language: Language;
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
    .reduce(
      (sum, program) => sum + (results.get(program.id)?.summaryAmount ?? 0),
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

  const byProgram = resultMap(result);
  const annualTax = summaryValue(manifest, byProgram, "annualTax");
  const fiscalDeductions = summaryValue(
    manifest,
    byProgram,
    "monthlyDeduction",
  );
  const fiscalBenefits = summaryValue(manifest, byProgram, "monthlyBenefit");
  const fiscalPosition = fiscalBenefits - fiscalDeductions;
  const fiscalLabel = fiscalYearLabel(result.fiscalYear, language);

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
          <small>{copy.calendarTaxNote(result.taxCalendarYear)}</small>
        </article>
        <article className="summary-card">
          <span>{copy.fiscalDeductions}</span>
          <strong data-testid="summary-fiscal-deductions">
            {formatYen(fiscalDeductions, language)}
          </strong>
          <small>{copy.fiscalNote(fiscalLabel)}</small>
        </article>
        <article className="summary-card">
          <span>{copy.fiscalBenefits}</span>
          <strong data-testid="summary-fiscal-benefits">
            {formatYen(fiscalBenefits, language)}
          </strong>
          <small>{copy.benefitsNote}</small>
        </article>
        <article className="summary-card summary-card--accent">
          <span>{copy.fiscalPosition}</span>
          <strong data-testid="summary-fiscal-position">
            {fiscalPosition < 0 ? "−" : "+"}
            {formatYen(Math.abs(fiscalPosition), language)}
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
          {result.fiscalYear === 2017 &&
            (language === "ja"
              ? " 2017年分の所得税の実行期間は、対応開始日の4月1日から12月31日までです。年額入力は按分しません。"
              : " The 2017 income-tax execution interval begins at the April 1 support boundary and annual inputs are not prorated.")}
        </p>
      </div>

      <div className="breakdown">
        <div className="breakdown-heading">
          <h3>{copy.breakdown}</h3>
          <span>
            {manifest.programs.length} {copy.compiledPrograms}
          </span>
        </div>

        {manifest.programs.map((program) => {
          const programResult = byProgram.get(program.id);
          const localizedProgram = programCopy(program, language);
          const isAnnual = program.cadence === "annual";
          return (
            <details
              key={program.id}
              className="result-program"
              open={
                program.id === "national-income-tax" ||
                (programResult?.summaryAmount ?? 0) > 0
              }
            >
              <summary>
                <span>
                  <strong>{localizedProgram.label}</strong>
                  <small>{localizedProgram.description}</small>
                </span>
                <span className="program-amount">
                  {formatYen(programResult?.summaryAmount ?? 0, language)}
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <path d="m3 6 5 5 5-5" />
                  </svg>
                </span>
              </summary>
              <div className="program-body">
                {!isAnnual && (
                  <p className="program-period-label">{copy.fiscalTotal}</p>
                )}

                {!isAnnual && programResult?.monthlySummaries.length ? (
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
                  {program.outputs.map((output) => (
                    <div key={output.id}>
                      <dt>{outputLabel(output, language)}</dt>
                      <dd>
                        {formatOutput(
                          programResult?.outputs[output.id],
                          output,
                          language,
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="program-provenance">
                  <span>
                    {copy.execution}: {programResult?.actualMode ?? "—"}
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
