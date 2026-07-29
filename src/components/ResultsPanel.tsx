import type {
  CalculationResult,
  GeneratedManifest,
  ManifestProgram,
  ProgramResult,
  SummaryBucket,
} from "../engine/types";
import {
  RESULT_COPY,
  outputLabel,
  programCopy,
  type Language,
} from "../i18n/translations";
import { calendarYearLabel } from "../engine/periods";
import { formatMonth, formatOutput, numericOutput } from "../policy/format";
import type { UsdConversionRate } from "../policy/currency";
import type { HouseholdDraft } from "../policy/household";
import { isOutputApplicable } from "../policy/provisionPeriods";
import { CurrencyValue } from "./CurrencyValue";

interface ResultsPanelProps {
  manifest: GeneratedManifest;
  result: CalculationResult | null;
  calculating: boolean;
  error: string | null;
  language: Language;
  household: HouseholdDraft;
  usdRate: UsdConversionRate | null;
  onEditHousehold: () => void;
}

interface ProgramSummary {
  program: ManifestProgram;
  results: ProgramResult[];
  total: number;
}

const NET_INCOME_SLOTS = [
  "japan_employment_gross_cash_earnings",
  "japan_public_pension_gross_receipts",
  "japan_pit_non_labor_income_amount",
] as const;

function householdEnteredIncome(household: HouseholdDraft): number {
  return household.members.reduce(
    (householdTotal, member) =>
      householdTotal +
      NET_INCOME_SLOTS.reduce((memberTotal, slot) => {
        const value = Number(member.values[slot]);
        return memberTotal + (Number.isFinite(value) ? value : 0);
      }, 0),
    0,
  );
}

function summaryValue(
  manifest: GeneratedManifest,
  result: CalculationResult,
  bucket: SummaryBucket,
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

function programsInBuckets(
  manifest: GeneratedManifest,
  result: CalculationResult,
  buckets: SummaryBucket[],
): ProgramSummary[] {
  return manifest.programs
    .filter((program) => buckets.includes(program.summaryBucket))
    .map((program) => {
      const results = result.programs.filter(
        (candidate) => candidate.programId === program.id,
      );
      return {
        program,
        results,
        total: results.reduce(
          (sum, programResult) => sum + programResult.summaryAmount,
          0,
        ),
      };
    });
}

function ProgramDetails({
  program,
  results,
  total,
  calendarYear,
  language,
  usdRate,
}: ProgramSummary & {
  calendarYear: number;
  language: Language;
  usdRate: UsdConversionRate | null;
}) {
  const copy = RESULT_COPY[language];
  const localizedProgram = programCopy(program, language);
  const isAnnual = program.cadence === "annual";
  const applicableOutputs = program.outputs.filter((output) =>
    isOutputApplicable(output, calendarYear),
  );
  const showPersonLabels = results.length > 1;

  return (
    <details className="result-program">
      <summary>
        <span>
          <strong>{localizedProgram.label}</strong>
          <small>{localizedProgram.description}</small>
        </span>
        <span className="program-amount">
          <CurrencyValue language={language} usdRate={usdRate} yen={total} />
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="m3 6 5 5 5-5" />
          </svg>
        </span>
      </summary>
      <div className="program-body">
        {results.map((programResult) => (
          <section
            className="program-person"
            key={`${programResult.personId}-${program.id}`}
          >
            {showPersonLabels && <h4>{programResult.personLabel}</h4>}

            {!isAnnual && programResult.monthlySummaries.length ? (
              <div className="monthly-schedule">
                <strong>
                  {showPersonLabels
                    ? copy.monthlySchedule
                    : copy.monthlyScheduleFor(programResult.personLabel)}
                </strong>
                <dl>
                  {programResult.monthlySummaries.map((month) => (
                    <div key={month.month}>
                      <dt>{formatMonth(month.month, language)}</dt>
                      <dd>
                        <CurrencyValue
                          language={language}
                          usdRate={usdRate}
                          yen={month.amount}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <p className="program-period-label">
              {isAnnual ? copy.calendarTotal : copy.calculationOutputs}
            </p>
            <dl>
              {applicableOutputs.map((output) => (
                <div key={output.id}>
                  <dt>{outputLabel(output, language)}</dt>
                  <dd>
                    {output.unit === "JPY" && programResult.outputs[output.id] ? (
                      <CurrencyValue
                        language={language}
                        usdRate={usdRate}
                        yen={numericOutput(programResult.outputs[output.id])}
                      />
                    ) : (
                      formatOutput(
                        programResult.outputs[output.id],
                        output,
                        language,
                      )
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </details>
  );
}

export function ResultsPanel({
  manifest,
  result,
  calculating,
  error,
  language,
  household,
  usdRate,
  onEditHousehold,
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
  const annualContributions = summaryValue(
    manifest,
    result,
    "monthlyDeduction",
  );
  const annualBenefits = summaryValue(manifest, result, "monthlyBenefit");
  const taxesAndContributions = annualTax + annualContributions;
  const finalNetIncome =
    householdEnteredIncome(household) + annualBenefits - taxesAndContributions;
  const yearLabel = calendarYearLabel(result.calendarYear, language);
  const paymentPrograms = programsInBuckets(manifest, result, [
    "annualTax",
    "monthlyDeduction",
  ]);
  const benefitPrograms = programsInBuckets(manifest, result, ["monthlyBenefit"]);

  return (
    <aside className="results-panel" aria-busy={calculating} aria-live="polite">
      <div className="results-heading results-heading--summary">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.heading}</h2>
          <p className="results-period">{yearLabel}</p>
        </div>
        <button className="results-edit-link" type="button" onClick={onEditHousehold}>
          {copy.editHousehold}
        </button>
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

      <section className="result-calculation" aria-label={copy.overview}>
        <article className="result-calculation__term result-calculation__term--income">
          <span>{copy.enteredIncome}</span>
          <strong data-testid="summary-entered-income">
            <CurrencyValue
              language={language}
              usdRate={usdRate}
              yen={householdEnteredIncome(household)}
            />
          </strong>
          <small>{copy.enteredIncomeNote}</small>
        </article>
        <span
          aria-label={copy.added}
          className="result-calculation__operator"
          role="img"
        >
          +
        </span>
        <article className="result-calculation__term result-calculation__term--benefits">
          <span>{copy.receivedBenefits}</span>
          <strong data-testid="summary-annual-benefits">
            <CurrencyValue
              language={language}
              usdRate={usdRate}
              yen={annualBenefits}
            />
          </strong>
          <small>{copy.receivedBenefitsNote}</small>
        </article>
        <span
          aria-label={copy.deducted}
          className="result-calculation__operator"
          role="img"
        >
          −
        </span>
        <article className="result-calculation__term result-calculation__term--payments">
          <span>{copy.paidTaxesAndContributions}</span>
          <strong data-testid="summary-taxes-and-contributions">
            <CurrencyValue
              language={language}
              usdRate={usdRate}
              yen={taxesAndContributions}
            />
          </strong>
          <small>{copy.paidTaxesAndContributionsNote}</small>
        </article>
        <span
          aria-label={copy.equals}
          className="result-calculation__operator"
          role="img"
        >
          =
        </span>
        <article className="result-calculation__term result-calculation__term--net-income">
          <span>{copy.finalNetIncome}</span>
          <strong data-testid="summary-final-net-income">
            <CurrencyValue
              language={language}
              usdRate={usdRate}
              yen={finalNetIncome}
            />
          </strong>
          <small>{copy.finalNetIncomeNote}</small>
        </article>
      </section>

      <section className="result-category" aria-labelledby="payments-heading">
        <div className="breakdown-heading">
          <h3 id="payments-heading">{copy.taxesAndContributions}</h3>
          <span>{copy.amountsByProgram}</span>
        </div>
        <div className="breakdown">
          {paymentPrograms.map((program) => (
            <ProgramDetails
              calendarYear={result.calendarYear}
              key={program.program.id}
              language={language}
              usdRate={usdRate}
              {...program}
            />
          ))}
        </div>
      </section>

      <section className="result-category" aria-labelledby="benefits-heading">
        <div className="breakdown-heading">
          <h3 id="benefits-heading">{copy.benefits}</h3>
          <span>{copy.amountsByProgram}</span>
        </div>
        <div className="breakdown">
          {benefitPrograms.map((program) => (
            <ProgramDetails
              calendarYear={result.calendarYear}
              key={program.program.id}
              language={language}
              usdRate={usdRate}
              {...program}
            />
          ))}
        </div>
      </section>

    </aside>
  );
}
