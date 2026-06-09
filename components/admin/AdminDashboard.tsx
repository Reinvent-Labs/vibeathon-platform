"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Mail,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DemoParticipant, DemoParticipantStatus } from "@/lib/demo-data";
import { demoTeams } from "@/lib/demo-data";
import { EVENT, EVENT_SESSIONS, JUDGING_CRITERIA } from "@/lib/constants";

type AdminDashboardProps = {
  section: string;
};

type AdminTeam = {
  id: string;
  name: string;
  tableNumber: string;
  problem: string;
  members: { id: string; fullName: string; email: string; status: string }[];
  averageScore: number | null;
};

type EligibleMember = {
  id: string;
  fullName: string;
  email: string;
  proposedTeamName?: string | null;
  registrationMode?: string | null;
  status: string;
};

const statusLabels: Record<DemoParticipantStatus, string> = {
  PENDING: "En attente",
  SELECTED: "Sélectionné",
  PAID: "Payé",
  CONFIRMED: "Confirmé",
  REJECTED: "Non retenu",
};

export function AdminDashboard({ section }: AdminDashboardProps) {
  const [participants, setParticipants] = useState<DemoParticipant[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/participants")
      .then((response) => response.json())
      .then((payload) => payload.success && setParticipants(payload.data))
      .catch(() => toast.error("Impossible de charger les participants."));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return participants.filter((participant) =>
      `${participant.fullName} ${participant.email} ${participant.profile}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [participants, query]);

  async function changeStatus(status: DemoParticipantStatus) {
    if (!selected.length) return toast.error("Sélectionne au moins une candidature.");
    const response = await fetch("/api/admin/participants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    setParticipants((current) =>
      current.map((participant) =>
        selected.includes(participant.id) ? { ...participant, status } : participant,
      ),
    );
    setSelected([]);
    toast.success(`${payload.data.updated} dossier(s) mis à jour.`);
  }

  const counts = {
    total: participants.length,
    selected: participants.filter((item) => item.status === "SELECTED").length,
    confirmed: participants.filter((item) => ["PAID", "CONFIRMED"].includes(item.status)).length,
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{sectionTitle(section)}</h1>
          <div className="sub">VIBEATHON 2026 · Édition 1 · Abidjan</div>
        </div>
        <div className="tb-actions">
          <Link href="/api/export/participants" className="btn btn-grad"><Download size={16} /> Exporter</Link>
        </div>
      </div>
      <div className="content">
        {section === "overview" ? (
          <Overview counts={counts} participants={participants} />
        ) : section === "candidatures" || section === "participants" ? (
          <ParticipantTable
            participants={filtered}
            selected={selected}
            query={query}
            onQuery={setQuery}
            onSelected={setSelected}
            onStatus={changeStatus}
            confirmedOnly={section === "participants"}
          />
        ) : section === "equipes" ? (
          <Teams />
        ) : section === "presence" ? (
          <Presence participants={participants} />
        ) : section === "evaluation" ? (
          <EvaluationStub />
        ) : section === "jury" ? (
          <JuryAdmin />
        ) : section === "communications" ? (
          <Communications />
        ) : section === "parametres" ? (
          <SettingsPanel />
        ) : section === "utilisateurs" ? (
          <UsersPanel />
        ) : (
          <Overview counts={counts} participants={participants} />
        )}
      </div>
    </>
  );
}

function sectionTitle(section: string) {
  const titles: Record<string, string> = {
    overview: "Vue d'ensemble",
    candidatures: "Candidatures",
    participants: "Participants confirmés",
    equipes: "Équipes",
    presence: "Présence",
    evaluation: "Évaluation IA",
    jury: "Jury & Scores",
    communications: "Communications",
    parametres: "Paramètres",
    utilisateurs: "Utilisateurs",
  };
  return titles[section] ?? titles.overview;
}

function Overview({
  counts,
  participants,
}: {
  counts: { total: number; selected: number; confirmed: number };
  participants: DemoParticipant[];
}) {
  const metrics = [
    ["Total inscrits", counts.total || 412, "+38 cette semaine"],
    ["Sélectionnés", counts.selected || 100, "objectif 100"],
    ["Payés / confirmés", counts.confirmed || 73, "+11 aujourd'hui"],
    ["Équipes formées", demoTeams.length, "objectif 20"],
  ];
  return (
    <div className="stack">
      <div className="phases">
        {["Inscriptions", "Sélection", "Paiement", "Bootcamp", "Compétition", "Finale"].map((phase, index) => <button className={index === 0 ? "done" : index === 1 ? "active" : ""} key={phase}><span className="n">{index === 0 ? "✓" : index + 1}</span>{phase}</button>)}
      </div>
      <div className="metric-grid">
        {metrics.map(([label, value, note]) => <div className="metric-card" key={label}><span>{label}</span><strong className="grad-text-lt">{value}</strong><small>{note}</small></div>)}
      </div>
      <div className="dashboard-grid">
        <div className="panel span-8">
          <div className="phead"><h3>Dernières candidatures</h3><Link href="/admin/candidatures">Tout voir</Link></div>
          <SimpleParticipantRows participants={participants.slice(0, 5)} />
        </div>
        <div className="mini-panel span-4">
          <h3>Activité récente</h3>
          <div className="feed">
            <div className="ev"><span className="t" style={{ background: "#75FF8D" }} /> 12 candidatures sélectionnées <span className="tm">il y a 14 min</span></div>
            <div className="ev"><span className="t" style={{ background: "#FF57E3" }} /> Paiement confirmé · M. Traoré <span className="tm">il y a 32 min</span></div>
            <div className="ev"><span className="t" style={{ background: "#BA77FF" }} /> Équipe EcoVibe créée <span className="tm">il y a 1 h</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantTable({
  participants,
  selected,
  query,
  onQuery,
  onSelected,
  onStatus,
  confirmedOnly,
}: {
  participants: DemoParticipant[];
  selected: string[];
  query: string;
  onQuery: (value: string) => void;
  onSelected: (value: string[]) => void;
  onStatus: (status: DemoParticipantStatus) => void;
  confirmedOnly: boolean;
}) {
  const rows = confirmedOnly
    ? participants.filter((item) => ["PAID", "CONFIRMED"].includes(item.status))
    : participants;
  return (
    <div className="panel">
      <div className="phead">
        <h3>{confirmedOnly ? "Participants confirmés" : "Tous les dossiers"}</h3>
        <label className="cluster"><Search size={16} /><input className="input" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher..." /></label>
      </div>
      <div className="bulk" style={{ display: selected.length ? "flex" : "none" }}>
        <span className="cnt"><b>{selected.length}</b> sélectionné(s)</span>
        <button className="btn btn-grad" onClick={() => void onStatus("SELECTED")}><Check size={16} /> Sélectionner</button>
        <button className="btn btn-ghost" onClick={() => void onStatus("REJECTED")}><X size={16} /> Rejeter</button>
        <button className="btn btn-ghost"><Mail size={16} /> Notifier</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={(event) => onSelected(event.target.checked ? rows.map((row) => row.id) : [])} /></th><th>Participant</th><th>Profil</th><th>Ville</th><th>Statut</th><th>Référence</th></tr></thead>
          <tbody>{rows.map((participant) => (
            <tr key={participant.id}>
              <td><input type="checkbox" checked={selected.includes(participant.id)} onChange={(event) => onSelected(event.target.checked ? [...selected, participant.id] : selected.filter((id) => id !== participant.id))} /></td>
              <td><b>{participant.fullName}</b><br /><small>{participant.email}</small></td>
              <td>{participant.profile}</td><td>{participant.city}</td>
              <td><span className={`status-pill ${participant.status.toLowerCase()}`}>{statusLabels[participant.status]}</span></td>
              <td>{participant.reference}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function SimpleParticipantRows({ participants }: { participants: DemoParticipant[] }) {
  return <div className="table-wrap"><table className="data-table"><tbody>{participants.map((participant) => <tr key={participant.id}><td><b>{participant.fullName}</b><br /><small>{participant.email}</small></td><td>{participant.profile}</td><td><span className={`status-pill ${participant.status.toLowerCase()}`}>{statusLabels[participant.status]}</span></td></tr>)}</tbody></table></div>;
}

function Teams() {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [eligible, setEligible] = useState<EligibleMember[]>([]);
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const load = () => {
    fetch("/api/teams")
      .then((response) => response.json())
      .then((payload) => payload.success && setTeams(payload.data));
    fetch("/api/admin/team-eligible")
      .then((response) => response.json())
      .then((payload) => payload.success && setEligible(payload.data));
  };
  useEffect(() => {
    load();
  }, []);

  async function createTeam(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, problem, memberIds }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    setName("");
    setProblem("");
    setMemberIds([]);
    toast.success("Équipe officielle créée.");
    load();
  }

  async function updateTeam(
    teamId: string,
    addMemberIds: string[] = [],
    removeMemberIds: string[] = [],
  ) {
    const response = await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, addMemberIds, removeMemberIds }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    toast.success("Composition de l'équipe mise à jour.");
    load();
  }

  return <div className="stack">
    <form className="surface stack" style={{ padding: 24 }} onSubmit={createTeam}>
      <span className="eyebrow">Équipe officielle</span>
      <h2>Former une équipe</h2>
      <p>Les 100 personnes sélectionnées peuvent être réparties en équipes de 1 à 5 membres. Les candidatures individuelles peuvent rejoindre une équipe plus tard.</p>
      <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom de l'équipe" required />
      <textarea className="textarea" value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Problème adressé" required />
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th></th><th>Participant</th><th>Mode / groupe proposé</th><th>Statut</th></tr></thead>
          <tbody>{eligible.map((participant) => <tr key={participant.id}><td><input type="checkbox" disabled={!memberIds.includes(participant.id) && memberIds.length >= 5} checked={memberIds.includes(participant.id)} onChange={(event) => setMemberIds(event.target.checked ? [...memberIds, participant.id] : memberIds.filter((id) => id !== participant.id))} /></td><td>{participant.fullName}<br /><small>{participant.email}</small></td><td>{participant.proposedTeamName || participant.registrationMode || "Individuel"}</td><td><span className="status-pill selected">{participant.status}</span></td></tr>)}</tbody>
        </table>
      </div>
      <button className="btn btn-grad" disabled={!memberIds.length}>Créer l&apos;équipe</button>
    </form>
    {teams.length ? <div className="team-grid">{teams.map((team) => {
      const remaining = 5 - team.members.length;
      return <article className="surface stack" style={{ padding: 24 }} key={team.id}><span className="eyebrow">{team.tableNumber}</span><h2>{team.name}</h2><p>{team.problem}</p><strong>{team.members.length}/5 membres</strong>{team.members.map((member) => <div className="cluster" style={{ justifyContent: "space-between" }} key={member.id}><span>{member.fullName}</span><button className="btn btn-ghost" onClick={() => void updateTeam(team.id, [], [member.id])}>Retirer</button></div>)}{remaining > 0 && eligible.length ? <select className="select" defaultValue="" onChange={(event) => { if (event.target.value) void updateTeam(team.id, [event.target.value]); event.target.value = ""; }}><option value="">Ajouter un membre ({remaining} place{remaining > 1 ? "s" : ""})</option>{eligible.map((participant) => <option value={participant.id} key={participant.id}>{participant.fullName} · {participant.proposedTeamName || "Individuel"}</option>)}</select> : null}<span>{team.averageScore === null ? "Pas encore notée" : `${team.averageScore}/100`}</span></article>;
    })}</div> : <div className="surface empty-state">Aucune équipe officielle. Sélectionne d&apos;abord les participants, puis forme les équipes ici. Elles ne seront visibles par le jury qu&apos;après paiement de tous leurs membres.</div>}
  </div>;
}

function Presence({ participants }: { participants: DemoParticipant[] }) {
  const present = participants.filter((item) => item.status === "CONFIRMED").length;
  return <div className="stack"><div className="metric-grid"><div className="metric-card"><span>Présents</span><strong className="grad-text-lt">{present}</strong><small>sur {EVENT.capacity}</small></div>{EVENT_SESSIONS.slice(0, 3).map((session, index) => <div className="metric-card" key={session}><span>{session}</span><strong>{Math.max(0, present - index * 7)}</strong><small>scans uniques</small></div>)}</div><Link className="btn btn-grad" href="/scan">Ouvrir le scanner QR</Link></div>;
}

function EvaluationStub() {
  return <div className="surface empty-state"><span className="eyebrow">Phase suivante</span><h2 className="display">Évaluation IA</h2><p>Le schéma de données et cet espace sont prêts. Le microservice d&apos;évaluation sera branché après l&apos;événement.</p></div>;
}

function JuryAdmin() {
  return <div className="stack"><div className="metric-grid"><div className="metric-card"><span>Jurés actifs</span><strong>6</strong></div><div className="metric-card"><span>Équipes notées</span><strong>14</strong></div><div className="metric-card"><span>Finalistes</span><strong>10</strong></div><div className="metric-card"><span>Critères</span><strong>{JUDGING_CRITERIA.length}</strong></div></div><div className="panel"><div className="phead"><h3>Classement provisoire</h3><Link href="/jury">Espace jury</Link></div>{demoTeams.map((team, index) => <div className="bar-row" key={team.id}><span className="nm">{index + 1}. {team.name}</span><span className="tk"><i style={{ width: `${88 - index * 6}%` }} /></span><span className="vv">{88 - index * 6}</span></div>)}</div></div>;
}

function Communications() {
  return <div className="communications-grid"><form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("Email ajouté à la file d'envoi."); }}><Mail /><h2>Campagne email</h2><select className="select"><option>Sélectionnés</option><option>Confirmés</option><option>Tous les candidats</option></select><input className="input" placeholder="Objet" /><textarea className="textarea" placeholder="Message" /><button className="btn btn-grad"><Send size={16} /> Envoyer</button></form><form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("WhatsApp ajouté à la file d'envoi."); }}><Send /><h2>WhatsApp</h2><select className="select"><option>Rappel de paiement</option><option>Badge disponible</option></select><textarea className="textarea" placeholder="Message du modèle" /><button className="btn btn-grad">Préparer l&apos;envoi</button></form></div>;
}

function SettingsPanel() {
  return <div className="settings-grid"><form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("Paramètres enregistrés."); }}><h2>Compétition</h2><label>Nom<input className="input" defaultValue="VIBEATHON 2026" /></label><label>Date<input className="input" type="date" defaultValue="2026-07-11" /></label><label>Frais<input className="input" type="number" defaultValue={EVENT.fee} /></label><button className="btn btn-grad">Enregistrer</button></form><div className="surface stack" style={{ padding: 24 }}><h2>Critères du jury</h2>{JUDGING_CRITERIA.map((criterion) => <div className="cluster" style={{ justifyContent: "space-between" }} key={criterion.id}><span>{criterion.name}</span><b>{criterion.weight}%</b></div>)}<strong>Total : 100%</strong></div></div>;
}

function UsersPanel() {
  return <div className="surface stack" style={{ padding: 24 }}><div className="cluster" style={{ justifyContent: "space-between" }}><h2>Utilisateurs staff</h2><button className="btn btn-grad"><UserPlus size={16} /> Inviter</button></div>{[["Nelly Ossey", "SUPER_ADMIN"], ["Ruben Ipote", "JURY"], ["Aminata K.", "SCANNER"]].map(([name, role]) => <div className="cluster" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line-2)", paddingBlock: 12 }} key={name}><span>{name}</span><span className="status-pill">{role}</span></div>)}</div>;
}
