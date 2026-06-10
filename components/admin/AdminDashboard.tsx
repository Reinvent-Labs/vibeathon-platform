"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
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
  currentRole: "SUPER_ADMIN" | "ADMIN";
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
  PENDING: "Inscrit · à examiner",
  SELECTED: "Accepté · paiement en attente",
  PAID: "Accepté · paiement validé",
  CONFIRMED: "Accepté · participant officiel",
  CHECKED_IN: "Présent",
  REJECTED: "Non retenu",
};

export function AdminDashboard({
  section,
  currentRole,
}: AdminDashboardProps) {
  const [participants, setParticipants] = useState<DemoParticipant[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [focusedParticipant, setFocusedParticipant] =
    useState<DemoParticipant | null>(null);

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

  async function changeStatus(
    status: DemoParticipantStatus,
    participantIds = selected,
  ) {
    if (!participantIds.length) {
      return toast.error("Sélectionne au moins une candidature.");
    }
    const response = await fetch("/api/admin/participants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: participantIds, status }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    setParticipants((current) =>
      current.map((participant) =>
        participantIds.includes(participant.id)
          ? { ...participant, status }
          : participant,
      ),
    );
    setFocusedParticipant((current) =>
      current && participantIds.includes(current.id)
        ? { ...current, status }
        : current,
    );
    setSelected([]);
    toast.success(`${payload.data.updated} dossier(s) mis à jour.`);
  }

  const counts = {
    total: participants.length,
    pending: participants.filter((item) => item.status === "PENDING").length,
    selected: participants.filter((item) => item.status === "SELECTED").length,
    paid: participants.filter((item) => item.status === "PAID").length,
    confirmed: participants.filter((item) =>
      ["CONFIRMED", "CHECKED_IN"].includes(item.status),
    ).length,
    rejected: participants.filter((item) => item.status === "REJECTED").length,
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
            onOpen={setFocusedParticipant}
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
          currentRole === "SUPER_ADMIN" ? <UsersPanel /> : null
        ) : (
          <Overview counts={counts} participants={participants} />
        )}
      </div>
      {focusedParticipant ? (
        <ParticipantReview
          participant={focusedParticipant}
          onClose={() => setFocusedParticipant(null)}
          onStatus={(status) =>
            void changeStatus(status, [focusedParticipant.id])
          }
        />
      ) : null}
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
  counts: {
    total: number;
    pending: number;
    selected: number;
    paid: number;
    confirmed: number;
    rejected: number;
  };
  participants: DemoParticipant[];
}) {
  const workflow = [
    {
      label: "1. Inscrits à examiner",
      value: counts.pending,
      note: "Ouvrir chaque dossier puis accepter ou ne pas retenir.",
      href: "/admin/candidatures",
    },
    {
      label: "2. Acceptés · paiement attendu",
      value: counts.selected,
      note: `${Math.max(0, 100 - counts.selected - counts.paid - counts.confirmed)} place(s) encore disponible(s) sur 100. Pas encore au bootcamp.`,
      href: "/admin/candidatures",
    },
    {
      label: "3. Participants officiels",
      value: counts.paid + counts.confirmed,
      note: "Paiement validé: badge, bootcamp et compétition autorisés.",
      href: "/admin/participants",
    },
    {
      label: "4. Participants à mettre en équipe",
      value: counts.paid + counts.confirmed,
      note: "Former des équipes uniquement avec les participants ayant payé.",
      href: "/admin/equipes",
    },
  ];
  return (
    <div className="stack">
      <div className="surface workflow-help">
        <span className="eyebrow">Comment utiliser le dashboard</span>
        <h2>Le parcours d&apos;un candidat</h2>
        <p>
          Un inscrit devient accepté après validation de son dossier, mais il
          reste en attente de paiement. Il devient participant officiel
          uniquement après paiement et peut alors rejoindre le bootcamp et la
          compétition.
        </p>
        <div className="phases" aria-label="Parcours global VIBEATHON">
          {["Inscrit", "Accepté · paiement attendu", "Paiement validé", "Bootcamp", "Compétition", "Finale"].map((phase, index) => (
            <div className={index === 0 ? "done" : index === 1 ? "active" : ""} key={phase}>
              <span className="n">{index === 0 ? "✓" : index + 1}</span>{phase}
            </div>
          ))}
        </div>
      </div>
      <div className="metric-grid">
        {workflow.map((item) => (
          <Link className="metric-card workflow-card" href={item.href} key={item.label}>
            <span>{item.label}</span>
            <strong className="grad-text-lt">{item.value}</strong>
            <small>{item.note}</small>
            <b>Ouvrir <ArrowRight size={14} /></b>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel span-8">
          <div className="phead"><h3>Dernières candidatures</h3><Link href="/admin/candidatures">Tout voir</Link></div>
          <SimpleParticipantRows participants={participants.slice(0, 5)} />
        </div>
        <div className="mini-panel span-4">
          <h3>État actuel</h3>
          <div className="feed">
            <div className="ev"><span className="t" style={{ background: "#F5C842" }} /> {counts.pending} inscrit(s) à examiner</div>
            <div className="ev"><span className="t" style={{ background: "#75FF8D" }} /> {counts.selected} accepté(s), paiement attendu</div>
            <div className="ev"><span className="t" style={{ background: "#BA77FF" }} /> {counts.paid + counts.confirmed} participant(s) officiel(s)</div>
            <div className="ev"><span className="t" style={{ background: "#FF57E3" }} /> {counts.rejected} dossier(s) non retenu(s)</div>
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
  onOpen,
  confirmedOnly,
}: {
  participants: DemoParticipant[];
  selected: string[];
  query: string;
  onQuery: (value: string) => void;
  onSelected: (value: string[]) => void;
  onStatus: (status: DemoParticipantStatus) => void;
  onOpen: (participant: DemoParticipant) => void;
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
        <span className="cnt"><b>{selected.length}</b> dossier(s) coché(s)</span>
        <button className="btn btn-grad" onClick={() => void onStatus("SELECTED")}><Check size={16} /> Accepter · paiement attendu</button>
        <button className="btn btn-ghost" onClick={() => void onStatus("REJECTED")}><X size={16} /> Rejeter</button>
        <button className="btn btn-ghost"><Mail size={16} /> Notifier</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={(event) => onSelected(event.target.checked ? rows.map((row) => row.id) : [])} /></th><th>Participant</th><th>Profil</th><th>Ville</th><th>Statut</th><th>Référence</th><th>Dossier</th></tr></thead>
          <tbody>{rows.map((participant) => (
            <tr key={participant.id}>
              <td><input type="checkbox" checked={selected.includes(participant.id)} onChange={(event) => onSelected(event.target.checked ? [...selected, participant.id] : selected.filter((id) => id !== participant.id))} /></td>
              <td><b>{participant.fullName}</b><br /><small>{participant.email}</small></td>
              <td>{participant.profile}</td><td>{participant.city}</td>
              <td><span className={`status-pill ${participant.status.toLowerCase()}`}>{statusLabels[participant.status]}</span></td>
              <td>{participant.reference}</td>
              <td><button className="btn btn-ghost review-button" onClick={() => onOpen(participant)}><Eye size={16} /> Voir</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function ParticipantReview({
  participant,
  onClose,
  onStatus,
}: {
  participant: DemoParticipant;
  onClose: () => void;
  onStatus: (status: DemoParticipantStatus) => void;
}) {
  const canDecide =
    participant.status === "PENDING" || participant.status === "REJECTED";
  const canReset =
    participant.status === "SELECTED" || participant.status === "REJECTED";
  const details = [
    ["Téléphone", participant.phone],
    ["Ville", participant.city],
    ["Âge", participant.age],
    ["Genre", participant.gender],
    ["Profession", participant.profession || participant.profile],
    ["Niveau technique", participant.technicalLevel],
    ["Expérience IA", participant.aiExperience],
    ["Outils IA", [participant.aiTools, participant.otherAiTools].filter(Boolean).join(" · ")],
    ["Mode d'inscription", participant.registrationMode],
    ["Équipe proposée", participant.proposedTeamName || "Candidature individuelle"],
    ["Domaine préféré", participant.preferredDomain],
    ["Source", participant.source],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="review-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="participant-review"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-review-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">Dossier {participant.reference}</span>
            <h2 id="participant-review-title">{participant.fullName}</h2>
            <p>{participant.email}</p>
          </div>
          <button className="icon-btn" aria-label="Fermer le dossier" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="review-status">
          <span className={`status-pill ${participant.status.toLowerCase()}`}>
            {statusLabels[participant.status]}
          </span>
          <small>
            Candidature reçue le{" "}
            {new Date(participant.createdAt).toLocaleDateString("fr-FR")}
          </small>
        </div>

        <section>
          <h3>Informations du candidat</h3>
          <dl className="review-grid">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3>Motivation</h3>
          <p className="review-motivation">{participant.motivation}</p>
        </section>

        <section>
          <h3>Vérifications avant sélection</h3>
          <div className="review-checks">
            <span className={participant.conditionsAccepted ? "ok" : "warning"}>
              {participant.conditionsAccepted ? "✓" : "!"} Conditions acceptées
            </span>
            <span className={participant.declarationAccepted ? "ok" : "warning"}>
              {participant.declarationAccepted ? "✓" : "!"} Déclaration confirmée
            </span>
            <span className={participant.fullProgramAvailable ? "ok" : "warning"}>
              {participant.fullProgramAvailable ? "✓" : "!"} Disponible pour tout le programme
            </span>
            <span className={participant.incubationCommitment ? "ok" : "warning"}>
              {participant.incubationCommitment ? "✓" : "!"} Engagement incubation
            </span>
          </div>
        </section>

        <footer>
          {canDecide ? (
            <>
              <button className="btn btn-grad" onClick={() => onStatus("SELECTED")}>
                <Check size={16} /> Accepter · paiement attendu
              </button>
              <button className="btn btn-ghost" onClick={() => onStatus("REJECTED")}>
                <X size={16} /> Ne pas retenir
              </button>
            </>
          ) : null}
          {canReset ? (
            <button className="btn btn-ghost" onClick={() => onStatus("PENDING")}>
              Remettre en attente
            </button>
          ) : null}
          {participant.status === "SELECTED" ? (
            <p>
              Cette personne est acceptée, mais ne participe pas encore au
              bootcamp. Elle doit payer depuis sa page de statut. Après
              paiement, elle devient participante officielle et reçoit son
              badge.
            </p>
          ) : null}
          {["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status) ? (
            <Link className="btn btn-ghost" href={`/badge/${participant.qrCode}`}>
              Voir le badge
            </Link>
          ) : null}
        </footer>
      </aside>
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
      <p>Seuls les participants acceptés ayant payé peuvent être répartis en équipes de 1 à 5 membres pour le bootcamp et la compétition. Les candidatures individuelles peuvent rejoindre une équipe plus tard.</p>
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
  return <div className="communications-grid"><form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("Email ajouté à la file d'envoi."); }}><Mail /><h2>Campagne email</h2><select className="select"><option>Acceptés · paiement attendu</option><option>Participants officiels</option><option>Tous les inscrits</option></select><input className="input" placeholder="Objet" /><textarea className="textarea" placeholder="Message" /><button className="btn btn-grad"><Send size={16} /> Envoyer</button></form><form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("WhatsApp ajouté à la file d'envoi."); }}><Send /><h2>WhatsApp</h2><select className="select"><option>Rappel de paiement</option><option>Badge disponible</option></select><textarea className="textarea" placeholder="Message du modèle" /><button className="btn btn-grad">Préparer l&apos;envoi</button></form></div>;
}

type AdminSession = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  active: boolean;
  archivedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  scanCount: number;
};

function SessionsManager() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(true);

  function refresh(payload: { success: boolean; data?: AdminSession[]; error?: string }) {
    if (payload.success && payload.data) setSessions(payload.data);
    else if (payload.error) toast.error(payload.error);
  }

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((response) => response.json())
      .then((payload) => {
        refresh(payload);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Impossible de charger les sessions.");
        setLoading(false);
      });
  }, []);

  async function send(method: string, body: Record<string, unknown>, ok: string) {
    const response = await fetch("/api/admin/sessions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    refresh(payload);
    if (payload.success) toast.success(ok);
  }

  async function createSession(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await send(
      "POST",
      {
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        active: sessions.filter((session) => !session.archivedAt).length === 0,
      },
      "Session créée.",
    );
    setName("");
    setDescription("");
    setLocation("");
    setStartsAt("");
    setEndsAt("");
  }

  return (
    <div className="surface stack" style={{ padding: 24 }}>
      <h2>Sessions de l&apos;événement</h2>
      <p>
        Les sessions (conférences, ateliers, entrée…) créées ici alimentent
        directement le scanner de présence. Une session archivée disparaît du
        scanner, mais ses présences restent conservées.
      </p>
      <form className="stack" onSubmit={createSession}>
        <label>
          Nom de la session
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Keynotes d'ouverture"
            required
          />
        </label>
        <label>Description<textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Objectif ou contenu de la session" /></label>
        <label>Lieu<input className="input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex. Auditorium principal" /></label>
        <div className="field two">
          <label>
            Début (optionnel)
            <input
              className="input"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label>
            Fin (optionnel)
            <input
              className="input"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>
        <button className="btn btn-grad" type="submit">
          Ajouter la session
        </button>
      </form>
      {loading ? (
        <p>Chargement…</p>
      ) : sessions.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Scans</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <b>{session.name}</b>
                    {session.location ? <><br /><small>{session.location}</small></> : null}
                    {session.startsAt ? (
                      <>
                        <br />
                        <small>
                          {new Date(session.startsAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </>
                    ) : null}
                  </td>
                  <td>{session.scanCount}</td>
                  <td>
                    {session.archivedAt ? (
                      <span className="status-pill">Archivée</span>
                    ) : (
                      <button
                        className={`status-pill ${session.active ? "confirmed" : ""}`}
                        onClick={() =>
                          void send(
                            "PATCH",
                            { id: session.id, active: !session.active },
                            session.active
                              ? "Session désactivée."
                              : "Session activée.",
                          )
                        }
                      >
                        {session.active ? "En cours" : "Activer"}
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        void send(
                          "PATCH",
                          {
                            id: session.id,
                            archived: !Boolean(session.archivedAt),
                          },
                          session.archivedAt
                            ? "Session restaurée."
                            : "Session archivée sans supprimer ses présences.",
                        )
                      }
                    >
                      {session.archivedAt ? "Restaurer" : "Archiver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">Aucune session. Ajoute la première ci-dessus.</div>
      )}
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="settings-grid">
      <form className="surface stack" style={{ padding: 24 }} onSubmit={(event) => { event.preventDefault(); toast.success("Paramètres enregistrés."); }}><h2>Compétition</h2><label>Nom<input className="input" defaultValue="VIBEATHON 2026" /></label><label>Date<input className="input" type="date" defaultValue="2026-07-11" /></label><label>Frais<input className="input" type="number" defaultValue={EVENT.fee} /></label><button className="btn btn-grad">Enregistrer</button></form>
      <SessionsManager />
      <div className="surface stack" style={{ padding: 24 }}><h2>Critères du jury</h2>{JUDGING_CRITERIA.map((criterion) => <div className="cluster" style={{ justifyContent: "space-between" }} key={criterion.id}><span>{criterion.name}</span><b>{criterion.weight}%</b></div>)}<strong>Total : 100%</strong></div>
    </div>
  );
}

function UsersPanel() {
  type StaffRole = "SUPER_ADMIN" | "ADMIN" | "JURY" | "SCANNER";
  type StaffUser = {
    id: string;
    email: string;
    fullName: string;
    role: StaffRole;
    active: boolean;
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  };
  type Credentials = {
    email: string;
    temporaryPassword: string;
  };

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("JURY");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Chargement impossible.");
        }
        setUsers(payload.data);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Chargement impossible.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Création impossible.");
      }
      setUsers(payload.data.users);
      setCredentials(payload.data.credentials);
      setFullName("");
      setEmail("");
      setRole("JURY");
      toast.success("Compte staff créé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(
    body:
      | { action: "set-active"; userId: string; active: boolean }
      | { action: "set-role"; userId: string; role: StaffRole }
      | { action: "reset-password"; userId: string },
  ) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      return toast.error(payload.error ?? "Modification impossible.");
    }
    setUsers(payload.data.users);
    if (payload.data.credentials) {
      setCredentials(payload.data.credentials);
    }
    toast.success(
      body.action === "reset-password"
        ? "Mot de passe temporaire généré."
        : "Accès mis à jour.",
    );
  }

  async function copyCredentials() {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `VIBEATHON\nEmail : ${credentials.email}\nMot de passe temporaire : ${credentials.temporaryPassword}\nConnexion : ${window.location.origin}/login`,
    );
    toast.success("Identifiants copiés.");
  }

  const roleLabels: Record<StaffRole, string> = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    JURY: "Jury",
    SCANNER: "Scanner",
  };

  return (
    <div className="stack">
      <form className="surface stack staff-create" onSubmit={createUser}>
        <div>
          <span className="eyebrow">Accès staff</span>
          <h2>Créer un utilisateur</h2>
          <p>
            Le mot de passe temporaire est affiché une seule fois. Le nouvel
            utilisateur devra le remplacer lors de sa première connexion.
          </p>
        </div>
        <div className="settings-grid">
          <label>
            Nom complet
            <input
              className="input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Rôle
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn btn-grad" disabled={submitting}>
          <UserPlus size={16} />
          {submitting ? "Création…" : "Créer le compte"}
        </button>
      </form>

      {credentials ? (
        <section className="surface credential-card" aria-live="polite">
          <div>
            <span className="eyebrow">À transmettre maintenant</span>
            <h2>Identifiants temporaires</h2>
            <p>
              Email : <strong>{credentials.email}</strong>
            </p>
            <p>
              Mot de passe :{" "}
              <code>{credentials.temporaryPassword}</code>
            </p>
            <small>
              Ce mot de passe n&apos;est pas conservé en clair et ne pourra pas être
              réaffiché.
            </small>
          </div>
          <div className="cluster">
            <button
              type="button"
              className="btn btn-grad"
              onClick={() => void copyCredentials()}
            >
              <Copy size={16} /> Copier
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setCredentials(null)}
            >
              Masquer
            </button>
          </div>
        </section>
      ) : null}

      <div className="panel">
        <div className="phead">
          <h3>Utilisateurs staff</h3>
          <span>{users.filter((user) => user.active).length} actifs</span>
        </div>
        {loading ? (
          <div className="empty-state">Chargement des comptes…</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>État</th>
                  <th>Dernière connexion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <b>{user.fullName}</b>
                      <br />
                      <small>{user.email}</small>
                    </td>
                    <td>
                      <select
                        className="select compact-select"
                        value={user.role}
                        onChange={(event) =>
                          void updateUser({
                            action: "set-role",
                            userId: user.id,
                            role: event.target.value as StaffRole,
                          })
                        }
                      >
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          user.active ? "confirmed" : "rejected"
                        }`}
                      >
                        {user.active
                          ? user.mustChangePassword
                            ? "Invitation envoyée"
                            : "Actif"
                          : "Désactivé"}
                      </span>
                    </td>
                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("fr-FR")
                        : "Jamais"}
                    </td>
                    <td>
                      <div className="cluster staff-actions">
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() =>
                            void updateUser({
                              action: "reset-password",
                              userId: user.id,
                            })
                          }
                        >
                          Réinitialiser
                        </button>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() =>
                            void updateUser({
                              action: "set-active",
                              userId: user.id,
                              active: !user.active,
                            })
                          }
                        >
                          {user.active ? "Désactiver" : "Réactiver"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
