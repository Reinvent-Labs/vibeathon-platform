"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  KeyRound,
  Lightbulb,
  Lock,
  MonitorSmartphone,
  Send,
  Trophy,
} from "lucide-react";
import Link from "next/link";
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
  domain: string;
  problem: string;
  description: string;
  demoUrl: string;
  repositoryUrl: string;
  slidesUrl: string;
  testCredentials: string;
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
  const [resultsAvailable, setResultsAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/competition/status")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setResultsAvailable(payload.data.phase === "PHASE2_DONE");
      })
      .catch(() => {});
  }, []);

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
        <LogoutButton redirectTo="/jury" />
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page-shell empty-state">
        <Logo size={160} />
        <h1>Aucune équipe à évaluer</h1>
        <p>
          Seules les équipes dont tous les membres sont acceptés sont affichées ici.
          L&apos;administration doit former les équipes et confirmer les participants.
        </p>
        <Link className="btn btn-grad" href="/jury/equipes" prefetch={false}>
          <BookOpen size={17} />
          Voir les 20 équipes
        </Link>
        <LogoutButton redirectTo="/jury" />
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

        <Link className="jury-directory-link" href="/jury/equipes" prefetch={false}>
          <BookOpen size={17} />
          Voir les 20 équipes
        </Link>

        {resultsAvailable && (
          <Link className="jury-directory-link" href="/jury/resultats" prefetch={false}>
            <Trophy size={17} />
            Voir les résultats
          </Link>
        )}

        <nav className="jury-nav">
          {teams.map((item, index) => (
            <button
              key={item.id}
              className={`jury-nav-item${index === teamIndex ? " active" : ""}${completed.includes(item.id) ? " done" : ""}`}
              onClick={() => setTeamIndex(index)}
            >
              {completed.includes(item.id) && <span className="jury-nav-check">✓</span>}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <LogoutButton redirectTo="/jury" />
      </aside>

      {/* Main content */}
      <main className="jury-main">
        {/* Team header */}
        <div className="jury-team-header">
          <div>
            <h1 className="display">{team.name}</h1>
          </div>
          <span className={`status-pill ${locked ? "confirmed" : "selected"}`}>
            {locked ? <><Lock size={13} /> Verrouillé</> : `En cours · ${total}/100`}
          </span>
        </div>

        {/* Project dossier keeps the facts jurors need distinct and scannable. */}
        <section className="surface jury-team-info" aria-labelledby="project-dossier-title">
          <div className="jury-project-dossier-head">
            <div>
              <span className="eyebrow jury-project-dossier-kicker">Dossier projet</span>
              <h2 id="project-dossier-title">Éléments à examiner</h2>
            </div>
            <span className="jury-project-dossier-status">
              <Lightbulb aria-hidden="true" size={15} />
              Projet soumis
            </span>
          </div>

          <div className="jury-project-grid">
            <article className="jury-dossier-card jury-project-topic-card">
              <div className="jury-dossier-card-head">
                <span className="jury-dossier-icon" aria-hidden="true"><Lightbulb size={18} /></span>
                <div>
                  <span className="jury-dossier-label">Thématique de l&apos;équipe</span>
                  <h3>Problème adressé</h3>
                </div>
              </div>
              <p className="jury-project-topic-value">{team.domain || team.problem}</p>
            </article>

            {team.description && (
              <article className="jury-dossier-card jury-project-description-card">
                <div className="jury-dossier-card-head">
                  <span className="jury-dossier-icon" aria-hidden="true"><FileText size={18} /></span>
                  <div>
                    <span className="jury-dossier-label">Description du projet</span>
                    <h3>Ce que l&apos;équipe propose</h3>
                  </div>
                </div>
                <p className="jury-project-description">{team.description}</p>
              </article>
            )}

            {(team.demoUrl || team.repositoryUrl || team.slidesUrl) && (
              <article className="jury-dossier-card jury-project-resources-card">
                <div className="jury-dossier-card-head">
                  <span className="jury-dossier-icon" aria-hidden="true"><MonitorSmartphone size={18} /></span>
                  <div>
                    <span className="jury-dossier-label">Ressources de vérification</span>
                    <h3>Tester le projet</h3>
                  </div>
                </div>
                <div className="jury-project-resources">
                  {team.demoUrl && (
                    <a href={externalUrl(team.demoUrl)} target="_blank" rel="noreferrer" className="jury-project-resource-link">
                      <MonitorSmartphone aria-hidden="true" size={17} />
                      <span>Ouvrir la démo</span>
                      <ExternalLink aria-hidden="true" size={15} />
                    </a>
                  )}
                  {team.repositoryUrl && (
                    <a href={externalUrl(team.repositoryUrl)} target="_blank" rel="noreferrer" className="jury-project-resource-link">
                      <Code2 aria-hidden="true" size={17} />
                      <span>Voir le dépôt</span>
                      <ExternalLink aria-hidden="true" size={15} />
                    </a>
                  )}
                  {team.slidesUrl && (
                    <a href={team.slidesUrl} target="_blank" rel="noreferrer" className="jury-project-resource-link">
                      <FileText aria-hidden="true" size={17} />
                      <span>Consulter les slides</span>
                      <ExternalLink aria-hidden="true" size={15} />
                    </a>
                  )}
                </div>
              </article>
            )}

            {team.testCredentials && (
              <article className="jury-dossier-card jury-project-access-card">
                <div className="jury-dossier-card-head">
                  <span className="jury-dossier-icon" aria-hidden="true"><KeyRound size={18} /></span>
                  <div>
                    <span className="jury-dossier-label">Accès de démonstration</span>
                    <h3>Identifiants de test</h3>
                  </div>
                </div>
                <p className="jury-project-access-note">Utilisez uniquement ce compte pour vérifier le parcours proposé.</p>
                <code className="jury-project-credentials">{team.testCredentials}</code>
              </article>
            )}
          </div>
        </section>

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
