"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

type Scores = Record<string, number>;
type JuryCriterion = {
  id: string;
  key: string;
  name: string;
  weight: number;
  order: number;
  description?: string | null;
};
type JuryTeam = {
  id: string;
  name: string;
  tableNumber: string;
  problem: string;
  demoUrl: string;
  repositoryUrl: string;
  scored: boolean;
  scores: Scores;
  comment: string;
};

function externalUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function CriterionRow({
  criterion,
  value,
  locked,
  onChange,
}: {
  criterion: JuryCriterion;
  value: number;
  locked: boolean;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((value / criterion.weight) * 100);

  return (
    <div className="criterion-row">
      <div className="criterion-header">
        <div className="criterion-meta">
          <span className="criterion-name">{criterion.name}</span>
          <span className="criterion-weight">/ {criterion.weight} pts</span>
          {criterion.description && (
            <button
              type="button"
              className={`criterion-toggle${open ? " open" : ""}`}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
        <strong className="criterion-score grad-text-lt">{value}</strong>
      </div>

      {criterion.description && open && (
        <p className="criterion-desc">{criterion.description}</p>
      )}

      <div className="criterion-slider-wrap">
        <input
          type="range"
          min={0}
          max={criterion.weight}
          value={value}
          disabled={locked}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div
          className="criterion-track"
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export function JuryPortal({
  user,
}: {
  user: SessionPayload & { fullName: string };
}) {
  const router = useRouter();
  const [teams, setTeams] = useState<JuryTeam[]>([]);
  const [criteria, setCriteria] = useState<JuryCriterion[]>([]);
  const [teamIndex, setTeamIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [scoresByTeam, setScoresByTeam] = useState<Record<string, Scores>>({});
  const [commentsByTeam, setCommentsByTeam] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/teams?scope=jury"), fetch("/api/jury/config")])
      .then(async ([teamsRes, criteriaRes]) => {
        if (teamsRes.status === 401 || criteriaRes.status === 401) {
          router.replace("/jury");
          return;
        }
        const [teamsPayload, criteriaPayload] = await Promise.all([
          teamsRes.json(),
          criteriaRes.json(),
        ]);
        if (teamsPayload.success && criteriaPayload.success) {
          setTeams(teamsPayload.data);
          setCriteria(criteriaPayload.data);
          setCompleted(
            teamsPayload.data
              .filter((t: JuryTeam) => t.scored)
              .map((t: JuryTeam) => t.id),
          );
          setScoresByTeam(
            Object.fromEntries(
              teamsPayload.data.map((t: JuryTeam) => [
                t.id,
                Object.fromEntries(
                  criteriaPayload.data.map((c: JuryCriterion) => [
                    c.key,
                    t.scores[c.key] ?? 0,
                  ]),
                ),
              ]),
            ),
          );
          setCommentsByTeam(
            Object.fromEntries(teamsPayload.data.map((t: JuryTeam) => [t.id, t.comment])),
          );
        } else {
          setLoadError(
            teamsPayload.error ?? criteriaPayload.error ?? "Impossible de charger la configuration du jury.",
          );
        }
      })
      .catch(() => setLoadError("Impossible de charger la configuration du jury."))
      .finally(() => setLoading(false));
  }, [router]);

  const team = teams[teamIndex];
  const scores = team
    ? (scoresByTeam[team.id] ?? Object.fromEntries(criteria.map((c) => [c.key, 0])))
    : {};
  const comment = team ? (commentsByTeam[team.id] ?? "") : "";
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const locked = team ? completed.includes(team.id) : false;
  const progress = teams.length > 0 ? Math.round((completed.length / teams.length) * 100) : 0;

  function setScore(key: string, value: number) {
    if (!team || locked) return;
    setScoresByTeam((cur) => ({ ...cur, [team.id]: { ...scores, [key]: value } }));
  }

  async function submit() {
    if (!team) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/jury/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, scores, comment }),
      });
      const payload = await res.json();
      if (res.status === 401) { router.replace("/jury"); return; }
      if (!payload.success) { toast.error(payload.error ?? "Impossible d'enregistrer les scores."); return; }
      setCompleted((cur) => cur.includes(team.id) ? cur : [...cur, team.id]);
      toast.success("Scores soumis et verrouillés.");
    } catch {
      toast.error("Connexion au serveur impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell empty-state">
        <Logo size={160} />
        <p>Chargement des équipes…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="page-shell empty-state">
        <Logo size={160} />
        <AlertCircle size={38} />
        <h1>Portail jury indisponible</h1>
        <p>{loadError}</p>
        <LogoutButton />
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page-shell empty-state">
        <Logo size={160} />
        <h1>Aucune équipe à évaluer</h1>
        <p>
          Seules les équipes dont tous les membres ont payé sont affichées ici.
          L&apos;administration doit former les équipes et confirmer leurs paiements.
        </p>
        <LogoutButton />
      </main>
    );
  }

  return (
    <div className="jury-layout">
      {/* Sidebar */}
      <aside className="jury-sidebar">
        <Logo size={140} />

        <div className="jury-user">
          <strong>{user.fullName}</strong>
          <span>{user.email}</span>
        </div>

        <div className="jury-progress">
          <div className="jury-progress-label">
            <small>Progression</small>
            <small>{completed.length}/{teams.length} équipes</small>
          </div>
          <div className="jury-progress-bar">
            <div className="jury-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <nav className="jury-nav">
          {teams.map((item, index) => (
            <button
              key={item.id}
              className={`jury-nav-item${index === teamIndex ? " active" : ""}${completed.includes(item.id) ? " done" : ""}`}
              onClick={() => setTeamIndex(index)}
            >
              {completed.includes(item.id) && <span className="jury-nav-check">✓</span>}
              <span>{item.name}</span>
              {item.tableNumber && <small>Table {item.tableNumber}</small>}
            </button>
          ))}
        </nav>

        <LogoutButton />
      </aside>

      {/* Main content */}
      <main className="jury-main">
        {/* Team header */}
        <div className="jury-team-header">
          <div>
            {team.tableNumber && <span className="eyebrow">Table {team.tableNumber}</span>}
            <h1 className="display">{team.name}</h1>
          </div>
          <span className={`status-pill ${locked ? "confirmed" : "selected"}`}>
            {locked ? <><Lock size={13} /> Verrouillé</> : `En cours · ${total}/100`}
          </span>
        </div>

        {/* Team info */}
        <div className="surface jury-team-info">
          <div>
            <small className="eyebrow" style={{ fontSize: 11 }}>Problème adressé</small>
            <p style={{ marginTop: 6 }}>{team.problem}</p>
          </div>
          {(team.demoUrl || team.repositoryUrl) && (
            <div className="cluster" style={{ gap: 12 }}>
              {team.demoUrl && (
                <a href={externalUrl(team.demoUrl)} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  Voir la démo →
                </a>
              )}
              {team.repositoryUrl && (
                <a href={externalUrl(team.repositoryUrl)} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  GitHub →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Scoring */}
        <div className="surface jury-scoring">
          <h2 className="jury-scoring-title">Évaluation</h2>

          <div className="jury-criteria">
            {criteria.map((criterion) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                value={scores[criterion.key] ?? 0}
                locked={locked}
                onChange={(v) => setScore(criterion.key, v)}
              />
            ))}
          </div>

          <div className="jury-total">
            <span>Score total</span>
            <strong className="grad-text-lt">{total}<small>/100</small></strong>
          </div>

          <div className="field">
            <label htmlFor="jury-comment">Commentaire <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optionnel)</span></label>
            <textarea
              id="jury-comment"
              className="input"
              rows={3}
              disabled={locked}
              value={comment}
              onChange={(e) => setCommentsByTeam((cur) => ({ ...cur, [team.id]: e.target.value }))}
              placeholder="Points forts, axes d'amélioration…"
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="cluster">
            <button
              className="btn btn-grad"
              disabled={locked || submitting}
              onClick={() => void submit()}
            >
              <Send size={16} />
              {submitting ? "Enregistrement…" : "Soumettre les scores"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setTeamIndex((teamIndex + 1) % teams.length)}
            >
              Équipe suivante →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
