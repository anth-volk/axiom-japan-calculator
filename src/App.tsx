import { useEffect, useRef, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { AxiomEngineClient } from "./engine/client";
import type {
  CalculationResult,
  GeneratedManifest,
  InputValue,
} from "./engine/types";
import { buildPreset, PRESETS, type PresetId } from "./policy/presets";

export default function App() {
  const clientRef = useRef<AxiomEngineClient | null>(null);
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [values, setValues] = useState<Record<string, InputValue>>({});
  const [month, setMonth] = useState("2018-04");
  const [preset, setPreset] = useState<PresetId>("validated-working-parent");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new AxiomEngineClient();
    clientRef.current = client;
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href).href;
    let active = true;

    client
      .boot(baseUrl)
      .then(async (loadedManifest) => {
        if (!active) return;
        const initialValues = buildPreset(loadedManifest, "validated-working-parent");
        setManifest(loadedManifest);
        setValues(initialValues);
        const initialResult = await client.calculate("2018-04", initialValues);
        if (active) setResult(initialResult);
      })
      .catch((bootError: unknown) => {
        if (active) {
          setError(bootError instanceof Error ? bootError.message : String(bootError));
        }
      })
      .finally(() => {
        if (active) setCalculating(false);
      });

    return () => {
      active = false;
      client.destroy();
      clientRef.current = null;
    };
  }, []);

  function updateValue(slot: string, value: InputValue) {
    setValues((current) => ({ ...current, [slot]: value }));
  }

  function applyPreset(nextPreset: PresetId) {
    if (!manifest) return;
    setPreset(nextPreset);
    setMonth("2018-04");
    setValues(buildPreset(manifest, nextPreset));
    setResult(null);
    setError(null);
  }

  async function calculate() {
    const client = clientRef.current;
    if (!client || !manifest) return;
    setCalculating(true);
    setError(null);
    try {
      setResult(await client.calculate(month, values));
    } catch (calculationError) {
      setError(
        calculationError instanceof Error
          ? calculationError.message
          : String(calculationError),
      );
    } finally {
      setCalculating(false);
    }
  }

  return (
    <main>
      <header className="hero">
        <nav aria-label="Calculator context">
          <a className="wordmark" href="#top" id="top">
            <span>公理</span>
            <span>
              <strong>Axiom · Japan</strong>
              <small>Independent Wave 1 calculator</small>
            </span>
          </a>
          <a
            className="repo-link"
            href="https://github.com/anth-volk/axiom-japan-calculator"
            rel="noreferrer"
            target="_blank"
          >
            Source
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M6 3h7v7M13 3 5 11M3 5v8h8" />
            </svg>
          </a>
        </nav>

        <div className="hero-grid">
          <div>
            <p className="eyebrow">National policy · 2017–2026</p>
            <h1>
              See the rules
              <br />
              shape a household.
            </h1>
          </div>
          <div className="hero-intro">
            <p>
              Calculate encoded Japanese national income tax, pension and
              Employment Insurance deductions, and five national benefit paths.
            </p>
            <div className="privacy-note">
              <span className="privacy-pulse" />
              Runs locally in your browser. Household answers are not uploaded.
            </div>
          </div>
        </div>
      </header>

      <section className="control-bar" aria-label="Calculation controls">
        <label>
          <span>Scenario</span>
          <select
            data-testid="preset-select"
            disabled={!manifest || calculating}
            value={preset}
            onChange={(event) => applyPreset(event.target.value as PresetId)}
          >
            {PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Calculation month</span>
          <input
            data-testid="calculation-month"
            disabled={!manifest || calculating}
            max="2026-12"
            min="2017-04"
            type="month"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setResult(null);
            }}
          />
        </label>
        <div className="scenario-description">
          <span>Preset note</span>
          <p>{PRESETS.find((item) => item.id === preset)?.description}</p>
        </div>
        <button
          className="calculate-button"
          data-testid="calculate-button"
          disabled={!manifest || calculating}
          type="button"
          onClick={calculate}
        >
          <span>{calculating ? "Calculating…" : "Calculate with Axiom"}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M4 10h12m-4-4 4 4-4 4" />
          </svg>
        </button>
      </section>

      <section className="scope-banner">
        <span>Experimental & unsigned</span>
        <p>
          National Wave 1 only. The model does not include inhabitant tax,
          health insurance, long-term-care premiums, Public Assistance amounts,
          or municipal benefits. It is not official Japanese tax advice.
        </p>
      </section>

      <div className="workspace">
        {manifest ? (
          <InputPanel
            disabled={calculating}
            manifest={manifest}
            values={values}
            onChange={updateValue}
          />
        ) : (
          <section className="input-panel input-panel--placeholder">
            <p>Loading the complete Wave 1 input contract…</p>
          </section>
        )}
        {manifest ? (
          <ResultsPanel
            calculating={calculating}
            error={error}
            manifest={manifest}
            result={result}
          />
        ) : (
          <aside className="results-panel results-panel--loading">
            <div className="engine-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>{error ?? "Verifying the Axiom engine and policy artifacts…"}</p>
          </aside>
        )}
      </div>

      <footer>
        <p>
          Built from the independent{" "}
          <a
            href="https://github.com/anth-volk/rulespec-jp"
            rel="noreferrer"
            target="_blank"
          >
            anth-volk/rulespec-jp
          </a>{" "}
          encoding. Not reviewed or endorsed by The Axiom Foundation or the
          Government of Japan.
        </p>
      </footer>
    </main>
  );
}
