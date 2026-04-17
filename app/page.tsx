"use client";

import { useMemo, useState } from "react";
import { buildPossibilityExplorerResult, createDefaultInput } from "../lib/possibility-explorer/engine";
import type { PossibilityExplorerInput } from "../lib/possibility-explorer/types";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    color: "#0f172a",
    padding: "32px 20px 56px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  hero: {
    background: "#ffffff",
    border: "1px solid #dbe4ff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
  },
  headline: { margin: "0 0 8px", fontSize: 34, lineHeight: 1.1 },
  subcopy: { margin: 0, color: "#475569", maxWidth: 900, lineHeight: 1.5 },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 0.85fr)",
    gap: 20,
    alignItems: "start",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dbe4ff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
  },
  sectionTitle: { margin: "0 0 14px", fontSize: 20 },
  field: { display: "grid", gap: 8, marginBottom: 14 },
  label: { fontWeight: 600, fontSize: 14 },
  textarea: {
    width: "100%",
    minHeight: 94,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    resize: "vertical" as const,
    font: "inherit",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    font: "inherit",
  },
  optionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    background: "#f8fafc",
  },
  optionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    alignItems: "center",
  },
  secondaryButton: {
    background: "#eef2ff",
    color: "#312e81",
    border: "1px solid #c7d2fe",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  subtleButton: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  gridTwo: { display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  badge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#e0e7ff",
    color: "#312e81",
    fontWeight: 700,
    fontSize: 12,
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
  },
  statusTitle: { margin: "0 0 8px", fontSize: 18 },
  statusText: { margin: 0, color: "#475569", lineHeight: 1.5 },
  criteriaCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
    marginBottom: 12,
  },
  weightRow: { display: "grid", gap: 6, marginTop: 10 },
  slider: { width: "100%" },
  assessmentCard: {
    border: "1px solid #dbeafe",
    borderRadius: 18,
    padding: 14,
    background: "#f8fbff",
    marginBottom: 12,
  },
  visualCard: {
    border: "1px dashed #93c5fd",
    borderRadius: 18,
    padding: 14,
    background: "#eff6ff",
    marginTop: 14,
  },
  barTrack: {
    width: "100%",
    height: 10,
    background: "#dbeafe",
    borderRadius: 999,
    overflow: "hidden" as const,
    marginTop: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
  },
  miniText: { margin: "6px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.45 },
  list: { margin: 0, paddingLeft: 18, color: "#475569", lineHeight: 1.5 },
  checkboxRow: { display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10 },
} as const;

function cloneDefaults(): PossibilityExplorerInput {
  const defaults = createDefaultInput();
  return {
    ...defaults,
    criteriaWeights: { ...defaults.criteriaWeights },
    options: defaults.options.map((option) => ({ ...option })),
  };
}

export default function Home() {
  const [input, setInput] = useState<PossibilityExplorerInput>(() => cloneDefaults());
  const result = useMemo(() => buildPossibilityExplorerResult(input), [input]);

  const updateOption = (index: number, key: "label" | "details", value: string) => {
    setInput((current) => {
      const options = current.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              id:
                key === "label" && value.trim()
                  ? value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                      .slice(0, 24) || option.id
                  : option.id,
              [key]: value,
            }
          : option,
      );
      return { ...current, options };
    });
  };

  const addOption = () => {
    setInput((current) => {
      if (current.options.length >= 5) return current;
      return {
        ...current,
        options: [...current.options, { id: `option-${current.options.length + 1}`, label: "", details: "" }],
        weightsConfirmed: false,
      };
    });
  };

  const removeOption = (index: number) => {
    setInput((current) => {
      if (current.options.length <= 2) return current;
      return {
        ...current,
        options: current.options.filter((_, optionIndex) => optionIndex !== index),
        weightsConfirmed: false,
      };
    });
  };

  const updateWeight = (criterionId: string, value: number) => {
    setInput((current) => ({
      ...current,
      criteriaWeights: { ...current.criteriaWeights, [criterionId]: value },
      weightsConfirmed: false,
    }));
  };

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <span style={styles.badge}>Possibility Explorer Codex · personal daily choice MVP</span>
          <h1 style={styles.headline}>Choose with evidence, not fake certainty.</h1>
          <p style={styles.subcopy}>
            This workspace compares 2–5 everyday options, drafts explainable criteria, and only produces a final ranking after you explicitly confirm the active weights.
            It never auto-acts, refuses high-stakes domains, and blocks visuals whenever the run is downgraded or unconfirmed.
          </p>
        </section>

        <div style={styles.layout}>
          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>Decision workspace</h2>
            <div style={styles.field}>
              <label style={styles.label}>Question</label>
              <textarea style={styles.textarea} value={input.question} onChange={(event) => setInput((current) => ({ ...current, question: event.target.value }))} />
            </div>
            <div style={styles.gridTwo}>
              <div style={styles.field}>
                <label style={styles.label}>Preferred outcomes</label>
                <textarea
                  style={styles.textarea}
                  value={input.preferredOutcomes}
                  onChange={(event) => setInput((current) => ({ ...current, preferredOutcomes: event.target.value, weightsConfirmed: false }))}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Constraints / context</label>
                <textarea
                  style={styles.textarea}
                  value={input.constraints}
                  onChange={(event) => setInput((current) => ({ ...current, constraints: event.target.value, weightsConfirmed: false }))}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Options ({input.options.length}/5)</label>
              {input.options.map((option, index) => (
                <div key={`${option.id}-${index}`} style={styles.optionCard}>
                  <div style={styles.optionHeader}>
                    <strong>Option {index + 1}</strong>
                    <button type="button" style={styles.subtleButton} onClick={() => removeOption(index)} disabled={input.options.length <= 2}>
                      Remove
                    </button>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Label</label>
                    <input style={styles.input} value={option.label} onChange={(event) => updateOption(index, "label", event.target.value)} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Details</label>
                    <textarea style={styles.textarea} value={option.details} onChange={(event) => updateOption(index, "details", event.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondaryButton} onClick={addOption} disabled={input.options.length >= 5}>
                Add option
              </button>
              <button type="button" style={styles.subtleButton} onClick={() => setInput(cloneDefaults())}>
                Reset example
              </button>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.statusCard}>
              <h2 style={styles.statusTitle}>{result.statusTitle}</h2>
              <p style={styles.statusText}>{result.summary}</p>
              {result.recommendationSummary ? <p style={{ ...styles.miniText, marginTop: 10 }}>Recommendation: {result.recommendationSummary}</p> : null}
              {result.refusalReason ? <p style={{ ...styles.miniText, marginTop: 10 }}>Boundary: {result.refusalReason}</p> : null}
              <p style={{ ...styles.miniText, marginTop: 10 }}>
                State: <strong>{result.runState}</strong> · Visual gate: <strong>{result.visualGate.allowed ? "open" : "blocked"}</strong>
              </p>
            </div>

            <h3 style={styles.sectionTitle}>Criteria + weight confirmation</h3>
            {result.criteria.map((criterion) => (
              <div key={criterion.id} style={styles.criteriaCard}>
                <strong>{criterion.label}</strong>
                <p style={styles.miniText}>{criterion.description}</p>
                <div style={styles.weightRow}>
                  <label style={styles.label}>Weight: {input.criteriaWeights[criterion.id] ?? criterion.weight}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={input.criteriaWeights[criterion.id] ?? criterion.weight}
                    style={styles.slider}
                    onChange={(event) => updateWeight(criterion.id, Number(event.target.value))}
                  />
                </div>
                <p style={styles.miniText}>
                  Evidence refs: {criterion.evidenceRefs.join(", ")} · Assumption refs: {criterion.assumptionRefs.join(", ")}
                </p>
              </div>
            ))}

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={input.weightsConfirmed}
                onChange={(event) => setInput((current) => ({ ...current, weightsConfirmed: event.target.checked }))}
              />
              <span style={styles.miniText}>
                I confirm these weights reflect what matters most right now. Until this is checked, the app will not show a final ranked recommendation.
              </span>
            </label>

            <div style={{ ...styles.statusCard, marginTop: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Recommendation contract</h3>
              <ul style={styles.list}>
                <li>{result.whyThisConclusion}</li>
                <li>{result.whatChangesTheResult}</li>
                <li>{result.whatToDoNow}</li>
                <li>{result.uncertaintyNote}</li>
              </ul>
            </div>

            <h3 style={styles.sectionTitle}>Option assessments</h3>
            {result.assessments.map((assessment) => {
              const option = input.options.find((item) => item.id === assessment.optionId);
              const numericScore = assessment.score ?? 0;
              return (
                <div key={assessment.optionId} style={styles.assessmentCard}>
                  <div style={styles.optionHeader}>
                    <strong>{option?.label || assessment.optionId}</strong>
                    <span style={styles.badge}>{assessment.fitBand} fit</span>
                  </div>
                  <p style={styles.miniText}>{assessment.whyItFits}</p>
                  <p style={styles.miniText}>What could change: {assessment.whatCouldChange}</p>
                  <p style={styles.miniText}>Next step: {assessment.nextStep}</p>
                  <p style={styles.miniText}>
                    Traceability → evidence: {assessment.evidenceRefs.join(", ")} · assumptions: {assessment.assumptionRefs.join(", ")}
                  </p>
                  {result.visualGate.allowed && assessment.score !== null ? (
                    <div style={styles.visualCard}>
                      <strong>Visual summary</strong>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${Math.max(8, Math.min(100, numericScore * 10))}%` }} />
                      </div>
                      <p style={styles.miniText}>Rounded score: {numericScore.toFixed(1)} / 10</p>
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div style={{ ...styles.statusCard, marginTop: 18 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Provenance register</h3>
              <ul style={styles.list}>
                {result.provenance.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.kind}</strong> · {entry.label}: {entry.detail}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
