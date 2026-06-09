"use client";

import { useEffect, useState } from "react";
import { Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { JUDGING_CRITERIA } from "@/lib/constants";

type Scores = Record<string, number>;
type JuryTeam = {
  id: string;
  name: string;
  tableNumber: string;
  problem: string;
  demoUrl: string;
  repositoryUrl: string;
  scored: boolean;
};

export function JuryPortal() {
  const [teams, setTeams] = useState<JuryTeam[]>([]);
  const [teamIndex, setTeamIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [scoresByTeam, setScoresByTeam] = useState<Record<string, Scores>>({});
  const [comment, setComment] = useState("");
  useEffect(() => {
    fetch("/api/teams?scope=jury")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) {
          setTeams(payload.data);
          setCompleted(
            payload.data
              .filter((team: JuryTeam) => team.scored)
              .map((team: JuryTeam) => team.id),
          );
        }
      })
      .catch(() => toast.error("Impossible de charger les équipes."));
  }, []);

  const team = teams[teamIndex];
  const scores = team
    ? scoresByTeam[team.id] ??
      Object.fromEntries(
        JUDGING_CRITERIA.map((criterion) => [criterion.id, 0]),
      )
    : {};
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const locked = team ? completed.includes(team.id) : false;

  if (!team) {
    return <main className="page-shell empty-state"><Logo size={160} /><p>Chargement des équipes...</p></main>;
  }

  function setScore(key: string, value: number) {
    if (locked) return;
    setScoresByTeam((current) => ({ ...current, [team.id]: { ...scores, [key]: value } }));
  }

  async function submit() {
    const response = await fetch("/api/jury/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: team.id, scores, comment }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    setCompleted((current) => [...current, team.id]);
    toast.success("Scores soumis et verrouillés.");
  }

  return (
    <div className="jury-layout">
      <aside className="jury-sidebar stack">
        <Logo size={150} />
        <span className="eyebrow">Espace jury</span>
        <div><small>Progression</small><strong style={{ float: "right" }}>{completed.length}/{teams.length}</strong><div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${(completed.length / teams.length) * 100}%` }} /></div></div>
        <nav className="stack">{teams.map((item, index) => <button className={`btn ${index === teamIndex ? "btn-grad" : "btn-ghost"}`} onClick={() => { setTeamIndex(index); setComment(""); }} key={item.id}>{completed.includes(item.id) ? "✓ " : ""}{item.name}</button>)}</nav>
      </aside>
      <main className="jury-main">
        <div className="cluster" style={{ justifyContent: "space-between" }}><div><span className="eyebrow">{team.tableNumber}</span><h1 className="display">{team.name}</h1></div><span className={`status-pill ${locked ? "confirmed" : "selected"}`}>{locked ? <><Lock size={14} /> Verrouillé</> : `En cours · ${total}/100`}</span></div>
        <div className="surface stack" style={{ padding: "clamp(1rem, 3vw, 2rem)" }}>
          <div><small>Problème adressé</small><p>{team.problem}</p></div>
          {team.demoUrl || team.repositoryUrl ? <div className="cluster">{team.demoUrl ? <a href={`https://${team.demoUrl}`} target="_blank" rel="noreferrer">{team.demoUrl}</a> : null}{team.repositoryUrl ? <a href={`https://${team.repositoryUrl}`} target="_blank" rel="noreferrer">{team.repositoryUrl}</a> : null}</div> : null}
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
          <label>Commentaire<textarea className="textarea" value={comment} disabled={locked} onChange={(event) => setComment(event.target.value)} placeholder="Points forts, axes d'amélioration..." /></label>
          <div className="cluster"><button className="btn btn-grad" disabled={locked} onClick={() => void submit()}><Send size={17} /> Soumettre les scores</button><button className="btn btn-ghost" onClick={() => setTeamIndex((teamIndex + 1) % teams.length)}>Équipe suivante</button></div>
        </div>
      </main>
    </div>
  );
}
