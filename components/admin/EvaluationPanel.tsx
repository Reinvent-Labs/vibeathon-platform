"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type CompPhase = "SUBMISSIONS_OPEN" | "PHASE1_RUNNING" | "PHASE1_DONE" | "PHASE2_RUNNING" | "PHASE2_DONE";

type CriterionScore = { key: string; name: string; weight: number; score: number; reasoning: string };

type Team = {
  id: string;
  name: string;
  hasSubmission: boolean;
  aiScore: number | null;
  aiSummary: string | null;
  aiEvaluatedAt: string | null;
  aiScores: CriterionScore[] | null;
  browserReport: string | null;
  promptInjectionDetected: boolean;
  promptInjectionEvidence: string | null;
  penalty: number;
  rawTotal: number | null;
  isFinalist: boolean;
  rank: number | null;
  position: number;
};

/** Renders inline **bold** segments within a line of text. */
function renderInline(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

/**
 * Lightweight markdown renderer for AI-generated reports (headings, bold,
 * bullet lists, paragraphs) — good enough for the browser-test / repo-audit
 * text the model writes, without pulling in a full markdown library.
 */
function Report({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: { type: "heading" | "bullet" | "paragraph"; content: string }[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length) {
      blocks.push({ type: "bullet", content: bulletBuffer.join("\n") });
      bulletBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushBullets(); continue; }
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    const headingMatch = line.match(/^#{1,4}\s+(.*)/) ?? line.match(/^\*\*([^*]+)\*\*:?$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
    } else if (headingMatch) {
      flushBullets();
      blocks.push({ type: "heading", content: headingMatch[1] });
    } else {
      flushBullets();
      blocks.push({ type: "paragraph", content: line });
    }
  }
  flushBullets();

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <p key={i} style={{ margin: "6px 0 0", fontWeight: 700, fontSize: 13 }}>
              {renderInline(block.content, `h${i}`)}
            </p>
          );
        }
        if (block.type === "bullet") {
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: 18 }}>
              {block.content.split("\n").map((item, j) => (
                <li key={j} style={{ fontSize: 13, color: "var(--ink-faint)" }}>
                  {renderInline(item, `b${i}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ margin: 0, fontSize: 13, color: "var(--ink-faint)" }}>
            {renderInline(block.content, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}

type Phase1State = {
  phase: CompPhase;
  teams: Team[];
};

export function EvaluationPanel() {
  const [state, setState] = useState<Phase1State | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [finalistCount, setFinalistCount] = useState(10);
  const [qualifying, setQualifying] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const abortRef = useRef(false);

  const load = async () => {
    const res = await fetch("/api/admin/phase1");
    const payload = await res.json();
    if (payload.success) setState(payload.data);
    else toast.error(payload.error ?? "Chargement impossible.");
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function startPhase1() {
    if (!confirm("Lancer la Phase 1 ? Les soumissions seront définitivement fermées.")) return;
    const res = await fetch("/api/admin/phase1", { method: "POST" });
    const payload = await res.json();
    if (!payload.success) { toast.error(payload.error ?? "Impossible de démarrer."); return; }
    setState(payload.data);
    toast.success("Phase 1 démarrée — soumissions fermées.");
    // Auto-start evaluation loop
    void runEvaluations(payload.data.teams);
  }

  async function runEvaluations(teams: Team[]) {
    const toEvaluate = teams.filter((t) => t.aiScore === null);
    if (toEvaluate.length === 0) { toast.success("Tous les projets ont déjà été évalués."); return; }
    setRunning(true);
    abortRef.current = false;
    for (const team of toEvaluate) {
      if (abortRef.current) break;
      try {
        const res = await fetch("/api/admin/phase1/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: team.id }),
        });
        const payload = await res.json();
        if (payload.success) {
          setState((prev) => {
            if (!prev) return prev;
            const updated = prev.teams.map((t) =>
              t.id === team.id
                ? {
                    ...t,
                    aiScore: payload.data.score,
                    aiSummary: payload.data.summary,
                    aiScores: payload.data.scores,
                    browserReport: payload.data.browserReport,
                    promptInjectionDetected: payload.data.promptInjectionDetected,
                    promptInjectionEvidence: payload.data.promptInjectionEvidence,
                    penalty: payload.data.penalty,
                    aiEvaluatedAt: new Date().toISOString(),
                  }
                : t,
            );
            return { ...prev, teams: [...updated].sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)) };
          });
        } else {
          toast.error(`${team.name}: ${payload.error ?? "Échec d'évaluation."}`);
        }
      } catch {
        toast.error(`${team.name}: erreur réseau.`);
      }
    }
    setRunning(false);
    await load();
    toast.success("Évaluation IA terminée.");
  }

  async function retryTeam(teamId: string) {
    const res = await fetch("/api/admin/phase1/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    const payload = await res.json();
    if (!payload.success) { toast.error(payload.error ?? "Impossible de re-évaluer."); return; }
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        teams: prev.teams
          .map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  aiScore: payload.data.score,
                  aiSummary: payload.data.summary,
                  aiScores: payload.data.scores,
                  browserReport: payload.data.browserReport,
                  promptInjectionDetected: payload.data.promptInjectionDetected,
                  promptInjectionEvidence: payload.data.promptInjectionEvidence,
                  penalty: payload.data.penalty,
                  aiEvaluatedAt: new Date().toISOString(),
                }
              : t,
          )
          .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)),
      };
    });
    toast.success("Ré-évaluation terminée.");
  }

  async function qualify() {
    if (!confirm(`Qualifier les ${finalistCount} premières équipes et clôturer la Phase 1 ?`)) return;
    setQualifying(true);
    const res = await fetch("/api/admin/phase1/qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalistCount }),
    });
    const payload = await res.json();
    setQualifying(false);
    if (!payload.success) { toast.error(payload.error ?? "Qualification impossible."); return; }
    toast.success(`${finalistCount} équipes qualifiées. E-mails envoyés au jury.`);
    await load();
  }

  if (loading) return <div className="surface empty-state">Chargement…</div>;
  if (!state) return <div className="surface empty-state">Impossible de charger la Phase 1.</div>;

  const { phase, teams } = state;
  const evaluated = teams.filter((t) => t.aiScore !== null).length;
  const total = teams.length;
  const pct = total > 0 ? Math.round((evaluated / total) * 100) : 0;

  return (
    <div className="stack">
      {/* Phase header */}
      <div className="panel">
        <div className="phead">
          <div>
            <h3>Phase 1 — Évaluation IA</h3>
            <p className="panel-sub">L'IA évalue chaque équipe sur 5 critères (100 pts). Les meilleures équipes sont qualifiées pour la Phase 2.</p>
          </div>
          <span className={`status-pill ${phase === "SUBMISSIONS_OPEN" ? "pending" : phase === "PHASE1_RUNNING" ? "selected" : "confirmed"}`}>
            {phase === "SUBMISSIONS_OPEN" ? "Soumissions ouvertes" : phase === "PHASE1_RUNNING" ? "Phase 1 en cours" : "Phase 1 terminée"}
          </span>
        </div>

        <div className="panel-form" style={{ paddingTop: 0 }}>
          {/* Stats row */}
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="metric-card"><span>Équipes</span><strong>{total}</strong></div>
            <div className="metric-card"><span>Avec soumission</span><strong>{teams.filter((t) => t.hasSubmission).length}</strong></div>
            <div className="metric-card"><span>Évaluées</span><strong className={evaluated === total ? "grad-text-lt" : ""}>{evaluated}/{total}</strong></div>
          </div>

          {/* Progress bar when running */}
          {phase === "PHASE1_RUNNING" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <small>Progression de l'évaluation</small>
                <small>{pct}%</small>
              </div>
              <div className="jury-progress-bar">
                <div className="jury-progress-fill" style={{ width: `${pct}%`, transition: "width 0.5s" }} />
              </div>
            </div>
          )}

          {/* Actions */}
          {phase === "SUBMISSIONS_OPEN" && (
            <div className="cluster">
              <button className="btn btn-grad" onClick={() => void startPhase1()}>
                Lancer la Phase 1 → Clôturer & Évaluer
              </button>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", margin: 0 }}>
                {teams.filter((t) => !t.hasSubmission).length > 0
                  ? `⚠ ${teams.filter((t) => !t.hasSubmission).length} équipe(s) sans soumission seront évaluées sur leur problème uniquement.`
                  : "Toutes les équipes ont soumis leur projet."}
              </p>
            </div>
          )}

          {phase === "PHASE1_RUNNING" && !running && evaluated < total && (
            <button className="btn btn-grad" onClick={() => void runEvaluations(teams)}>
              Reprendre l'évaluation ({total - evaluated} restant(s))
            </button>
          )}

          {running && (
            <div className="cluster">
              <div className="submit-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              <span style={{ fontSize: 14 }}>Évaluation en cours… ({evaluated}/{total})</span>
              <button className="btn btn-ghost" onClick={() => { abortRef.current = true; }}>Pause</button>
            </div>
          )}

          {(phase === "PHASE1_RUNNING" || phase === "PHASE1_DONE") && evaluated === total && (
            <div className="cluster" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div className="field" style={{ flex: "0 0 auto", marginBottom: 0 }}>
                <label htmlFor="finalist-count" style={{ fontSize: 13 }}>Nombre de finalistes</label>
                <input
                  id="finalist-count"
                  type="number"
                  min={1}
                  max={total}
                  className="input"
                  style={{ width: 80 }}
                  value={finalistCount}
                  onChange={(e) => setFinalistCount(Math.max(1, Math.min(total, Number(e.target.value))))}
                />
              </div>
              <button
                className="btn btn-grad"
                disabled={qualifying}
                onClick={() => void qualify()}
              >
                {qualifying ? "Qualification…" : `Qualifier le Top ${finalistCount} & Démarrer la Phase 2`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ranked list */}
      {teams.length > 0 && (
        <div className="panel">
          <div className="phead">
            <h3>Classement IA</h3>
            {phase === "PHASE1_DONE" && (
              <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>
                Top {teams.filter((t) => t.isFinalist).length} qualifié(s)
              </span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Équipe</th>
                  <th>Score IA</th>
                  <th>Soumission</th>
                  <th>Statut</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, i) => {
                  const isTopN = i < finalistCount;
                  const qualifier = phase === "PHASE1_DONE" ? team.isFinalist : (phase === "PHASE1_RUNNING" && isTopN);
                  const expanded = expandedTeamId === team.id;
                  return (
                    <Fragment key={team.id}>
                      <tr style={qualifier ? { background: "color-mix(in srgb, var(--green) 6%, transparent)" } : undefined}>
                        <td>
                          <strong style={{ color: i < 3 ? "var(--green)" : undefined }}>
                            {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}
                          </strong>
                        </td>
                        <td>
                          <b>{team.name}</b>
                          {team.aiSummary && (
                            <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: "2px 0 0", maxWidth: 360 }}>
                              {team.aiSummary.slice(0, 120)}{team.aiSummary.length > 120 ? "…" : ""}
                            </p>
                          )}
                        </td>
                        <td>
                          {team.aiScore !== null ? (
                            <strong className="grad-text-lt">{team.aiScore}<small style={{ opacity: 0.5 }}>/100</small></strong>
                          ) : running ? (
                            <span style={{ color: "var(--ink-faint)" }}>En cours…</span>
                          ) : (
                            <span style={{ color: "var(--ink-faint)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${team.hasSubmission ? "confirmed" : "pending"}`}>
                            {team.hasSubmission ? "Soumis" : "Non soumis"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {qualifier && (
                              <span className="status-pill selected">Finaliste</span>
                            )}
                            {team.promptInjectionDetected && (
                              <span
                                className="status-pill"
                                style={{ background: "color-mix(in srgb, #ff4d4f 18%, transparent)", color: "#ff4d4f", borderColor: "color-mix(in srgb, #ff4d4f 40%, transparent)" }}
                                title="Tentative d'injection de prompt détectée"
                              >
                                ⚠ Injection
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {team.aiScores && team.aiScores.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: "4px 10px" }}
                              onClick={() => setExpandedTeamId(expanded ? null : team.id)}
                            >
                              {expanded ? "Masquer le détail ▲" : "Voir le détail ▼"}
                            </button>
                          )}
                        </td>
                        <td>
                          {(phase === "PHASE1_RUNNING" || phase === "PHASE1_DONE") && !running && (
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: "4px 10px" }}
                              onClick={() => void retryTeam(team.id)}
                            >
                              {team.aiScore !== null ? "↺ Re-évaluer" : "Évaluer"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded && team.aiScores && (
                        <tr>
                          <td colSpan={7} style={{ background: "var(--surface-2, rgba(255,255,255,0.02))", padding: "16px 20px" }}>
                            <div style={{ display: "grid", gap: 16 }}>
                              {team.promptInjectionDetected && (
                                <div style={{
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  background: "color-mix(in srgb, #ff4d4f 12%, transparent)",
                                  border: "1px solid color-mix(in srgb, #ff4d4f 40%, transparent)",
                                }}>
                                  <strong style={{ color: "#ff4d4f" }}>⚠ Tentative d&apos;injection de prompt détectée</strong>
                                  <p style={{ fontSize: 13, margin: "4px 0 0", color: "var(--ink-faint)" }}>
                                    Pénalité appliquée : -{team.penalty} pts (score brut {team.rawTotal} → {team.aiScore})
                                  </p>
                                  {team.promptInjectionEvidence && (
                                    <p style={{ fontSize: 12, margin: "6px 0 0", fontFamily: "monospace", color: "var(--ink-faint)" }}>
                                      {team.promptInjectionEvidence}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div>
                                <small className="eyebrow" style={{ fontSize: 11 }}>Note par critère</small>
                                <div style={{ overflowX: "auto", marginTop: 8 }}>
                                  <table className="data-table" style={{ minWidth: 480 }}>
                                    <thead>
                                      <tr>
                                        <th>Critère</th>
                                        <th>Note</th>
                                        <th>Justification</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {team.aiScores.map((s) => (
                                        <tr key={s.key}>
                                          <td><b>{s.name}</b></td>
                                          <td>
                                            <span className="grad-text-lt" style={{ fontWeight: 700 }}>
                                              {s.score}<small style={{ opacity: 0.5 }}>/{s.weight}</small>
                                            </span>
                                          </td>
                                          <td style={{ fontSize: 13, color: "var(--ink-faint)" }}>{s.reasoning}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {team.browserReport && (
                                <div style={{ paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                                  <small className="eyebrow" style={{ fontSize: 11 }}>Rapport du test navigateur</small>
                                  <div style={{ marginTop: 8 }}>
                                    <Report text={team.browserReport} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
