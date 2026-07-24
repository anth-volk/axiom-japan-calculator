import { useMemo, useState } from "react";
import type {
  GeneratedManifest,
  InputGroupId,
  InputValue,
  ManifestInput,
} from "../engine/types";
import { GROUP_COPY, GROUP_ORDER, INPUT_HELP } from "../policy/copy";

interface InputPanelProps {
  manifest: GeneratedManifest;
  values: Record<string, InputValue>;
  disabled: boolean;
  onChange: (slot: string, value: InputValue) => void;
}

function InputControl({
  input,
  value,
  disabled,
  onChange,
}: {
  input: ManifestInput;
  value: InputValue;
  disabled: boolean;
  onChange: (slot: string, value: InputValue) => void;
}) {
  const help = INPUT_HELP[input.slot];

  if (input.kind === "bool") {
    return (
      <label className="input-row input-row--boolean" data-testid={`row-${input.slot}`}>
        <span className="input-copy">
          <span className="input-label">{input.label}</span>
          {help && <span className="input-help">{help}</span>}
          <code className="input-code">{input.slot}</code>
        </span>
        <span className="switch">
          <input
            checked={value === true}
            data-testid={`input-${input.slot}`}
            disabled={disabled}
            type="checkbox"
            onChange={(event) => onChange(input.slot, event.target.checked)}
          />
          <span aria-hidden="true" className="switch-track">
            <span className="switch-thumb" />
          </span>
        </span>
      </label>
    );
  }

  return (
    <label className="input-row" data-testid={`row-${input.slot}`}>
      <span className="input-copy">
        <span className="input-label">{input.label}</span>
        {help && <span className="input-help">{help}</span>}
        <code className="input-code">{input.slot}</code>
      </span>
      <span className="number-shell">
        <span className="number-prefix">
          {input.slot.includes("age") ? "yr" : input.integer ? "#" : "¥"}
        </span>
        <input
          data-testid={`input-${input.slot}`}
          disabled={disabled}
          inputMode={input.integer ? "numeric" : "decimal"}
          min="0"
          step={input.step}
          type="number"
          value={typeof value === "string" ? value : "0"}
          onChange={(event) => onChange(input.slot, event.target.value)}
        />
      </span>
    </label>
  );
}

export function InputPanel({
  manifest,
  values,
  disabled,
  onChange,
}: InputPanelProps) {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<InputGroupId>>(
    () =>
      new Set(
        GROUP_ORDER.filter((group) => GROUP_COPY[group].open),
      ),
  );

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GROUP_ORDER.map((group) => {
      const inputs = manifest.inputs.filter(
        (input) =>
          input.group === group &&
          (!query ||
            input.label.toLowerCase().includes(query) ||
            input.slot.toLowerCase().includes(query)),
      );
      return { group, inputs };
    }).filter(({ inputs }) => inputs.length > 0);
  }, [manifest.inputs, search]);

  function handleToggle(group: InputGroupId, open: boolean) {
    if (search) return;
    setOpenGroups((current) => {
      const next = new Set(current);
      if (open) next.add(group);
      else next.delete(group);
      return next;
    });
  }

  return (
    <section aria-labelledby="inputs-heading" className="input-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Household facts</p>
          <h2 id="inputs-heading">Tell the rules what is true</h2>
        </div>
        <span className="count-pill">{manifest.inputCount} inputs available</span>
      </div>

      <label className="search-box">
        <span className="sr-only">Search policy inputs</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m21 21-4.35-4.35m2.35-5.4a7.75 7.75 0 1 1-15.5 0 7.75 7.75 0 0 1 15.5 0Z" />
        </svg>
        <input
          placeholder="Find an income, deduction, status, or allowance…"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button aria-label="Clear input search" type="button" onClick={() => setSearch("")}>
            Clear
          </button>
        )}
      </label>

      <div className="input-groups">
        {grouped.map(({ group, inputs }) => {
          const copy = GROUP_COPY[group];
          const open = Boolean(search) || openGroups.has(group);
          return (
            <details
              key={group}
              className="input-group"
              open={open}
              onToggle={(event) =>
                handleToggle(group, event.currentTarget.open)
              }
            >
              <summary>
                <span>
                  <span className="group-eyebrow">{copy.eyebrow}</span>
                  <strong>{copy.title}</strong>
                  <small>{copy.description}</small>
                </span>
                <span className="group-meta">
                  {inputs.length}
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <path d="m3 6 5 5 5-5" />
                  </svg>
                </span>
              </summary>
              <div className="input-list">
                {inputs.map((input) => (
                  <InputControl
                    key={input.slot}
                    disabled={disabled}
                    input={input}
                    value={values[input.slot] ?? (input.kind === "bool" ? false : "0")}
                    onChange={onChange}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {grouped.length === 0 && (
        <p className="empty-search">No Wave 1 inputs match “{search}”.</p>
      )}
    </section>
  );
}
