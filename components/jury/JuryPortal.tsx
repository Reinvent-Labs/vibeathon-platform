"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { JUDGING_CRITERIA } from "@/lib/constants";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

type Scores = Record<string, number>;
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

export function JuryPortal({
  user,
}: {
  user: SessionPayload & { fullName: string };
}) {
  const router = useRouter();
  const [teams, setTeams] = useState<JuryTeam[]>([]);
  const [teamIndex, setTeamIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [scoresByTeam, setScoresByTeam] = useState<Record<string, Scores>>({});
  const [commentsByTeam, setCommentsByTeam] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    fetch("/api/teams?scope=jury")
      .then(async (response) => {
        const payload = await response.json();
        if (response.status === 401) {
          router.replace("/login?next=%2Fjury");
          return;
        }
        if (payload.success) {
          setTeams(payload.data);
          setCompleted(
            payload.data
              .filter((team: JuryTeam) => team.scored)
              .map((team: JuryTeam) => team.id),
          );
          setScoresByTeam(
            Object.fromEntries(
              payload.data.map((team: JuryTeam) => [team.id, team.scores]),
            ),
          );
          setCommentsByTeam(
            Object.fromEntries(
              payload.data.map((team: JuryTeam) => [team.id, team.comment]),
            ),
          );
        } else {
          setLoadError(payload.error ?? "Impossible de charger les équipes.");
        }
      })
      .catch(() => setLoadError("Impossible de charger les équipes."))
      .finally(() => setLoading(false));
  }, [router]);

  const team = teams[teamIndex];
  const scores = team
    ? scoresByTeam[team.id] ??
      Object.fromEntries(
        JUDGING_CRITERIA.map((criterion) => [criterion.id, 0]),
      )
    : {};
  const comment = team ? commentsByTeam[team.id] ?? "" : "";
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const locked = team ? completed.includes(team.id) : false;

  if (loading) {
    return <main className="page-shell empty-state"><Logo size={160} /><p>Chargement des équipes admissibles…</p></main>;
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
          Seules les équipes officielles dont tous les membres ont payé sont
          affichées ici. L&apos;administration doit d&apos;abord former les équipes
          et confirmer leurs paiements.
        </p>
        <LogoutButton />
      </main>
    );
  }

  function setScore(key: string, value: number) {
    if (locked) return;
    setScoresByTeam((current) => ({ ...current, [team.id]: { ...scores, [key]: value } }));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/jury/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, scores, comment }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        router.replace("/login?next=%2Fjury");
        return;
      }
      if (!payload.success) {
        toast.error(payload.error ?? "Impossible d'enregistrer les scores.");
        return;
      }
      setCompleted((current) =>
        current.includes(team.id) ? current : [...current, team.id],
      );
      toast.success("Scores soumis et verrouillés.");
    } catch {
      toast.error("Connexion au serveur impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="jury-layout">
      <aside className="jury-sidebar stack">
        <Logo size={150} />
        <span className="eyebrow">Espace jury</span>
        <p className="staff-context">
          <strong>{user.fullName}</strong>
          <span>{user.email}</span>
        </p>
        <div><small>Progression</small><strong style={{ float: "right" }}>{completed.length}/{teams.length}</strong><div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${(completed.length / teams.length) * 100}%` }} /></div></div>
        <nav className="stack">{teams.map((item, index) => <button className={`btn ${index === teamIndex ? "btn-grad" : "btn-ghost"}`} onClick={() => setTeamIndex(index)} key={item.id}>{completed.includes(item.id) ? "✓ " : ""}{item.name}</button>)}</nav>
        <LogoutButton />
      </aside>
      <main className="jury-main">
        <div className="cluster" style={{ justifyContent: "space-between" }}><div><span className="eyebrow">{team.tableNumber}</span><h1 className="display">{team.name}</h1></div><span className={`status-pill ${locked ? "confirmed" : "selected"}`}>{locked ? <><Lock size={14} /> Verrouillé</> : `En cours · ${total}/100`}</span></div>
        <div className="surface stack" style={{ padding: "clamp(1rem, 3vw, 2rem)" }}>
          <div><small>Problème adressé</small><p>{team.problem}</p></div>
          {team.demoUrl || team.repositoryUrl ? <div className="cluster">{team.demoUrl ? <a href={externalUrl(team.demoUrl)} target="_blank" rel="noreferrer">{team.demoUrl}</a> : null}{team.repositoryUrl ? <a href={externalUrl(team.repositoryUrl)} target="_blank" rel="noreferrer">{team.repositoryUrl}</a> : null}</div> : null}
          <div>
            {JUDGING_CRITERIA.map((criterion) => (
              <label className="score-row" key={criterion.id}>
                <span>{criterion.name} <small>/ {criterion.weight}</small></span>
                <input type="range" min={0} max={criterion.weight} value={scores[criterion.id]} disabled={locked} onChange={(event) => setScore(criterion.id, Number(event.target.value))} />
                <strong>{scores[criterion.id]}</strong>
              </label>
            ))}
          </div>
          <div className="metric-card"><span>Total attribué</span><strong className="grad-text-lt">{total}<small>/100</small></strong></div>
          <label>Commentaire<textarea className="textarea" value={comment} disabled={locked} onChange={(event) => setCommentsByTeam((current) => ({ ...current, [team.id]: event.target.value }))} placeholder="Points forts, axes d'amélioration..." /></label>
          <div className="cluster"><button className="btn btn-grad" disabled={locked || submitting} onClick={() => void submit()}><Send size={17} /> {submitting ? "Enregistrement…" : "Soumettre les scores"}</button><button className="btn btn-ghost" onClick={() => setTeamIndex((teamIndex + 1) % teams.length)}>Équipe suivante</button></div>
        </div>
      </main>
    </div>
  );
}
