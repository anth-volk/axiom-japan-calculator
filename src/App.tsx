import { useEffect, useRef, useState } from "react";
import { HouseholdWizard } from "./components/HouseholdWizard";
import { AxiomEngineClient } from "./engine/client";
import type {
  CalculationResult,
  GeneratedManifest,
} from "./engine/types";
import {
  LANGUAGES,
  UI_COPY,
  type Language,
} from "./i18n/translations";
import {
  buildCalculationPeople,
  createExampleHousehold,
  type HouseholdDraft,
} from "./policy/household";

function initialLanguage(): Language {
  const stored = window.localStorage.getItem("axiom-japan-language");
  if (stored === "en" || stored === "ja") return stored;
  return window.navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export default function App() {
  const clientRef = useRef<AxiomEngineClient | null>(null);
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [household, setHousehold] = useState<HouseholdDraft | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const copy = UI_COPY[language];

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
        const initialHousehold = createExampleHousehold(loadedManifest, language);
        setManifest(loadedManifest);
        setHousehold(initialHousehold);
        const initialResult = await client.calculate(
          initialHousehold.calendarYear,
          buildCalculationPeople(initialHousehold),
        );
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

  function updateHousehold(nextHousehold: HouseholdDraft) {
    setHousehold(nextHousehold);
    setResult(null);
    setError(null);
  }

  async function calculate() {
    const client = clientRef.current;
    if (!client || !manifest || !household) return;
    setCalculating(true);
    setError(null);
    try {
      setResult(
        await client.calculate(
          household.calendarYear,
          buildCalculationPeople(household),
        ),
      );
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

      <section className="scope-banner">
        <span>{copy.experimental}</span>
        <p>{copy.scope}</p>
      </section>

      <div className="workspace">
        {manifest && household ? (
          <HouseholdWizard
            disabled={calculating}
            error={error}
            household={household}
            language={language}
            manifest={manifest}
            result={result}
            onCalculate={calculate}
            onChange={updateHousehold}
          />
        ) : (
          <section className="wizard input-panel--placeholder">
            <p>{error ?? copy.verifying}</p>
          </section>
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
