import { useEffect, useRef, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { AxiomEngineClient } from "./engine/client";
import {
  SUPPORTED_FISCAL_YEARS,
  fiscalYearLabel,
} from "./engine/periods";
import type {
  CalculationResult,
  GeneratedManifest,
  InputValue,
} from "./engine/types";
import {
  LANGUAGES,
  PRESET_COPY,
  UI_COPY,
  type Language,
} from "./i18n/translations";
import { buildPreset, PRESETS, type PresetId } from "./policy/presets";

function initialLanguage(): Language {
  const stored = window.localStorage.getItem("axiom-japan-language");
  if (stored === "en" || stored === "ja") return stored;
  return window.navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export default function App() {
  const clientRef = useRef<AxiomEngineClient | null>(null);
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [values, setValues] = useState<Record<string, InputValue>>({});
  const [fiscalYear, setFiscalYear] = useState(2018);
  const [preset, setPreset] = useState<PresetId>("validated-working-parent");
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const copy = UI_COPY[language];
  const presetCopy = PRESET_COPY[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    window.localStorage.setItem("axiom-japan-language", language);
  }, [language]);

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
        const initialResult = await client.calculate(2018, initialValues);
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
    setFiscalYear(2018);
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
      setResult(await client.calculate(fiscalYear, values));
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
        <nav aria-label={copy.brand}>
          <a className="wordmark wordmark--plain" href="#top" id="top">
            <strong>{copy.brand}</strong>
            <small>{copy.brandNote}</small>
          </a>
          <div className="nav-actions">
            <a
              className="repo-link"
              href="https://github.com/anth-volk/axiom-japan-calculator"
              rel="noreferrer"
              target="_blank"
            >
              {copy.source}
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M6 3h7v7M13 3 5 11M3 5v8h8" />
              </svg>
            </a>
            <label className="language-selector">
              <span className="sr-only">{copy.language}</span>
              <select
                aria-label={copy.language}
                data-testid="language-selector"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as Language)
                }
              >
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </nav>

        <div className="hero-grid">
          <div>
            <p className="eyebrow">{copy.heroEyebrow}</p>
            <h1>{copy.heroTitle}</h1>
          </div>
          <div className="hero-intro">
            <p>{copy.heroIntro}</p>
            <div className="privacy-note">
              <span className="privacy-pulse" />
              {copy.privacy}
            </div>
          </div>
        </div>
      </header>

      <section className="control-bar" aria-label={copy.calculate}>
        <label>
          <span>{copy.scenario}</span>
          <select
            data-testid="preset-select"
            disabled={!manifest || calculating}
            value={preset}
            onChange={(event) => applyPreset(event.target.value as PresetId)}
          >
            {PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {presetCopy[item.id].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.fiscalYear}</span>
          <select
            data-testid="fiscal-year-select"
            disabled={!manifest || calculating}
            value={fiscalYear}
            onChange={(event) => {
              setFiscalYear(Number(event.target.value));
              setResult(null);
            }}
          >
            {SUPPORTED_FISCAL_YEARS.map((year) => (
              <option key={year} value={year}>
                {fiscalYearLabel(year, language, true)}
              </option>
            ))}
          </select>
        </label>
        <div className="scenario-description">
          <span>{copy.presetNote}</span>
          <p>{presetCopy[preset].description}</p>
        </div>
        <button
          className="calculate-button"
          data-testid="calculate-button"
          disabled={!manifest || calculating}
          type="button"
          onClick={calculate}
        >
          <span>{calculating ? copy.calculating : copy.calculate}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M4 10h12m-4-4 4 4-4 4" />
          </svg>
        </button>
      </section>

      <section className="scope-banner">
        <span>{copy.experimental}</span>
        <p>{copy.scope}</p>
      </section>

      <div className="workspace">
        {manifest ? (
          <InputPanel
            disabled={calculating}
            language={language}
            manifest={manifest}
            values={values}
            onChange={updateValue}
          />
        ) : (
          <section className="input-panel input-panel--placeholder">
            <p>{copy.loadingInputs}</p>
          </section>
        )}
        {manifest ? (
          <ResultsPanel
            calculating={calculating}
            error={error}
            language={language}
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
            <p>{error ?? copy.verifying}</p>
          </aside>
        )}
      </div>

      <footer>
        <p>
          {copy.footerLead}{" "}
          <a
            href="https://github.com/anth-volk/rulespec-jp"
            rel="noreferrer"
            target="_blank"
          >
            anth-volk/rulespec-jp
          </a>{" "}
          {copy.footerTail}
        </p>
      </footer>
    </main>
  );
}
