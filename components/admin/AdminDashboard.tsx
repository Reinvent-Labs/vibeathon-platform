"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
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
import { CATEGORIES, type ParticipantCategory } from "@/lib/categories";
import { ContentPanel } from "@/components/admin/ContentPanel";
import { EmailTemplatesPanel } from "@/components/admin/EmailTemplatesPanel";
import { PagesPanel } from "@/components/admin/PagesPanel";


function categoryLabel(category?: ParticipantCategory | null) {
  return CATEGORIES[category ?? "HACKATHON"].label;
}

function categoryColor(category?: ParticipantCategory | null) {
  return CATEGORIES[category ?? "HACKATHON"].color;
}

function paymentState(participant: DemoParticipant) {
  const category = participant.category ?? "HACKATHON";
  if (CATEGORIES[category].fee === 0) return "FREE" as const;
  if (["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
    return "PAID" as const;
  }
  if (participant.status === "SELECTED") return "PENDING" as const;
  return "NOT_APPLICABLE" as const;
}

function paymentDate(participant: DemoParticipant) {
  const value = participant.paidAt ?? participant.confirmedAt;
  return value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
}

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

type JuryCriterion = {
  id: string;
  key: string;
  name: string;
  weight: number;
  order: number;
};

const statusLabels: Record<DemoParticipantStatus, string> = {
  PENDING: "Inscrit · à examiner",
  WAITLIST: "Liste d'attente",
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
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ParticipantCategory>("ALL");
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
    return participants.filter((participant) => {
      const matchesCategory =
        categoryFilter === "ALL" ||
        (participant.category ?? "HACKATHON") === categoryFilter;
      const matchesQuery = `${participant.fullName} ${participant.email} ${participant.profile}`
        .toLowerCase()
        .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [participants, query, categoryFilter]);

  async function sendBadge(id: string) {
    const response = await fetch("/api/admin/participants/send-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json();
    if (!payload.success) return toast.error(payload.error);
    toast.success("Badge renvoyé par email et WhatsApp.");
  }

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
    waitlist: participants.filter((item) => item.status === "WAITLIST").length,
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
            categoryFilter={categoryFilter}
            onCategoryFilter={setCategoryFilter}
            onSelected={setSelected}
            onStatus={changeStatus}
            onOpen={setFocusedParticipant}
            onSendBadge={sendBadge}
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
        ) : section === "contenu" ? (
          <ContentPanel />
        ) : section === "pages" ? (
          <PagesPanel />
        ) : section === "emails" ? (
          <EmailTemplatesPanel />
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
          onSendBadge={() => void sendBadge(focusedParticipant.id)}
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
    contenu: "Contenu du site",
    pages: "Pages",
    emails: "Templates email",
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
    waitlist: number;
    selected: number;
    paid: number;
    confirmed: number;
    rejected: number;
  };
  participants: DemoParticipant[];
}) {
  const workflow = [
    { label: "À examiner", value: counts.pending, href: "/admin/candidatures" },
    { label: "Acceptés · paiement attendu", value: counts.selected, href: "/admin/candidatures" },
    { label: "Liste d'attente", value: counts.waitlist, href: "/admin/candidatures" },
    { label: "Participants officiels", value: counts.paid + counts.confirmed, href: "/admin/participants" },
    { label: "Non retenus", value: counts.rejected, href: "/admin/candidatures" },
  ];
  return (
    <div className="stack">
      <div className="metric-grid">
        {workflow.map((item) => (
          <Link className="metric-card" href={item.href} key={item.label}>
            <span>{item.label}</span>
            <strong className="grad-text-lt">{item.value}</strong>
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
            <div className="ev"><span className="t" style={{ background: "#F5C842" }} /> {counts.pending} à examiner</div>
            <div className="ev"><span className="t" style={{ background: "#43d9ff" }} /> {counts.waitlist} en attente</div>
            <div className="ev"><span className="t" style={{ background: "#75FF8D" }} /> {counts.selected} acceptés, paiement attendu</div>
            <div className="ev"><span className="t" style={{ background: "#BA77FF" }} /> {counts.paid + counts.confirmed} participants officiels</div>
            <div className="ev"><span className="t" style={{ background: "#FF57E3" }} /> {counts.rejected} non retenus</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BILLET_CATEGORIES: ParticipantCategory[] = ["VISITEUR", "FORMATION_ADULTE", "FORMATION_KIDS"];

function ParticipantTable({
  participants,
  selected,
  query,
  onQuery,
  categoryFilter,
  onCategoryFilter,
  onSelected,
  onStatus,
  onOpen,
  onSendBadge,
  confirmedOnly,
}: {
  participants: DemoParticipant[];
  selected: string[];
  query: string;
  onQuery: (value: string) => void;
  categoryFilter: "ALL" | ParticipantCategory;
  onCategoryFilter: (value: "ALL" | ParticipantCategory) => void;
  onSelected: (value: string[]) => void;
  onStatus: (status: DemoParticipantStatus) => void;
  onOpen: (participant: DemoParticipant) => void;
  onSendBadge: (id: string) => void;
  confirmedOnly: boolean;
}) {
  const [tab, setTab] = useState<"competiteurs" | "billets">("competiteurs");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DemoParticipantStatus>("ALL");

  const hackathon = participants.filter((p) => (p.category ?? "HACKATHON") === "HACKATHON");
  const billets = participants.filter((p) => BILLET_CATEGORIES.includes((p.category ?? "HACKATHON") as ParticipantCategory));

  const baseRows = tab === "competiteurs" ? hackathon : billets;
  const rows = confirmedOnly
    ? baseRows.filter((item) => ["PAID", "CONFIRMED", "CHECKED_IN"].includes(item.status))
    : baseRows;

  const billetFilter = tab === "billets" ? categoryFilter : "ALL";

  const filteredRows = (() => {
    let result = tab === "billets" && billetFilter !== "ALL"
      ? rows.filter((p) => (p.category ?? "HACKATHON") === billetFilter)
      : rows;
    if (tab === "competiteurs" && statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  })();

  const waitlistCount = hackathon.filter((p) => p.status === "WAITLIST").length;

  const canSendBadge = (status: string) =>
    ["PAID", "CONFIRMED", "CHECKED_IN"].includes(status);

  return (
    <div className="panel">
      <div className="phead">
        <h3>{confirmedOnly ? "Participants confirmés" : "Tous les dossiers"}</h3>
        <div className="search-box">
          <Search size={15} />
          <input className="input" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
      </div>

      {/* Main tabs */}
      <div className="tab-bar">
        <button
          type="button"
          onClick={() => { setTab("competiteurs"); onCategoryFilter("ALL"); setStatusFilter("ALL"); }}
          className={`tab-btn ${tab === "competiteurs" ? "active" : ""}`}
          style={{ ["--tab-accent" as string]: "#75FF8D" }}
        >
          Compétiteurs <span className="tab-count">{hackathon.length}</span>
        </button>
        <button
          type="button"
          onClick={() => { setTab("billets"); onCategoryFilter("ALL"); setStatusFilter("ALL"); }}
          className={`tab-btn ${tab === "billets" ? "active" : ""}`}
          style={{ ["--tab-accent" as string]: "#43D9FF" }}
        >
          Billets &amp; Visiteurs <span className="tab-count">{billets.length}</span>
        </button>
      </div>

      {/* Status filter for compétiteurs */}
      {tab === "competiteurs" ? (
        <div className="cat-filter">
          {([
            { value: "ALL" as const, label: "Tous" },
            { value: "PENDING" as const, label: "À examiner", color: "#f5d778" },
            { value: "WAITLIST" as const, label: `Liste d'attente${waitlistCount ? ` (${waitlistCount})` : ""}`, color: "#43d9ff" },
            { value: "SELECTED" as const, label: "Acceptés · paiement attendu", color: "#ba77ff" },
            { value: "CONFIRMED" as const, label: "Confirmés", color: "#75ff8d" },
            { value: "REJECTED" as const, label: "Non retenus", color: "#ff7a9c" },
          ] as const).map((f) => (
            <button
              key={f.value}
              type="button"
              className={`cat-chip ${statusFilter === f.value ? "active" : ""}`}
              style={"color" in f ? { ["--cat" as string]: f.color } : undefined}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Category filter for billets */}
      {tab === "billets" ? (
        <div className="cat-filter">
          {([{ value: "ALL" as const }, ...BILLET_CATEGORIES.map((c) => ({ value: c }))]).map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`cat-chip ${billetFilter === filter.value ? "active" : ""}`}
              style={filter.value === "ALL" ? undefined : { ["--cat" as string]: categoryColor(filter.value) }}
              onClick={() => onCategoryFilter(filter.value)}
            >
              {filter.value === "ALL" ? "Tous" : categoryLabel(filter.value)}
            </button>
          ))}
        </div>
      ) : null}

      {/* Bulk actions — hackathon decisions only */}
      {tab === "competiteurs" ? (
        <div className="bulk" style={{ display: selected.length ? "flex" : "none" }}>
          <span className="cnt"><b>{selected.length}</b> dossier(s) coché(s)</span>
          <button className="btn btn-grad" onClick={() => void onStatus("SELECTED")}><Check size={16} /> Accepter · paiement attendu</button>
          <button className="btn btn-ghost" onClick={() => void onStatus("WAITLIST")}><Mail size={16} /> Liste d&apos;attente</button>
          <button className="btn btn-ghost" onClick={() => void onStatus("REJECTED")}><X size={16} /> Rejeter</button>
        </div>
      ) : (
        <div className="bulk" style={{ display: selected.length ? "flex" : "none" }}>
          <span className="cnt"><b>{selected.length}</b> billet(s) coché(s)</span>
          <button className="btn btn-ghost" onClick={() => selected.forEach((id) => void onSendBadge(id))}><Send size={16} /> Renvoyer les badges</button>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={filteredRows.length > 0 && selected.length === filteredRows.length} onChange={(event) => onSelected(event.target.checked ? filteredRows.map((row) => row.id) : [])} /></th>
              <th>Participant</th>
              {tab === "billets" ? <th>Catégorie</th> : null}
              <th>Statut</th>
              <th>Paiement</th>
              <th>Référence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{filteredRows.map((participant) => (
            <tr key={participant.id} data-status={participant.status}>
              <td><input type="checkbox" checked={selected.includes(participant.id)} onChange={(event) => onSelected(event.target.checked ? [...selected, participant.id] : selected.filter((id) => id !== participant.id))} /></td>
              <td><b>{participant.fullName}</b><br /><small>{participant.email}</small></td>
              {tab === "billets" ? <td><span className="cat-tag" style={{ ["--cat" as string]: categoryColor(participant.category) }}>{categoryLabel(participant.category)}</span></td> : null}
              <td><span className={`status-pill ${participant.status.toLowerCase()}`}>{statusLabels[participant.status]}</span></td>
              <td>
                {paymentState(participant) === "PAID" ? (
                  <span className="payment-state paid">
                    Payé
                    {paymentDate(participant) ? <small>{paymentDate(participant)}</small> : null}
                  </span>
                ) : paymentState(participant) === "PENDING" ? (
                  <span className="payment-state pending">À payer</span>
                ) : paymentState(participant) === "FREE" ? (
                  <span className="payment-state free">Gratuit</span>
                ) : (
                  <span className="payment-state neutral">Non concerné</span>
                )}
              </td>
              <td>{participant.reference}</td>
              <td>
                <div className="cluster" style={{ gap: 8 }}>
                  <button className="btn btn-ghost review-button" onClick={() => onOpen(participant)}><Eye size={16} /> Voir</button>
                  {canSendBadge(participant.status) ? (
                    <>
                      <Link className="btn btn-ghost" href={`/badge/${participant.qrCode}`} target="_blank"><Eye size={16} /> Badge</Link>
                      <button className="btn btn-ghost" onClick={() => onSendBadge(participant.id)}><Send size={16} /> Envoyer</button>
                    </>
                  ) : null}
                </div>
              </td>
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
  onSendBadge,
}: {
  participant: DemoParticipant;
  onClose: () => void;
  onStatus: (status: DemoParticipantStatus) => void;
  onSendBadge: () => void;
}) {
  const category = participant.category ?? "HACKATHON";
  const isHackathon = category === "HACKATHON";
  const isFreePass = CATEGORIES[category as keyof typeof CATEGORIES]?.fee === 0;
  const canDecide =
    isHackathon &&
    ["PENDING", "WAITLIST", "REJECTED"].includes(participant.status);
  const canReset =
    isHackathon &&
    ["SELECTED", "WAITLIST", "REJECTED"].includes(participant.status);
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
            <span className="cat-tag" style={{ ["--cat" as string]: categoryColor(participant.category), marginTop: 8, display: "inline-block" }}>{categoryLabel(participant.category)}</span>
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

        {isHackathon && participant.motivation ? (
          <section>
            <h3>Motivation</h3>
            <p className="review-motivation">{participant.motivation}</p>
          </section>
        ) : null}

        {isHackathon ? (
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
        ) : null}

        <footer>
          {canDecide ? (
            <>
              <button className="btn btn-grad" onClick={() => onStatus("SELECTED")}>
                <Check size={16} /> {participant.status === "WAITLIST" ? "Promouvoir · accepter" : "Accepter · paiement attendu"}
              </button>
              {participant.status !== "WAITLIST" ? (
                <button className="btn btn-ghost" onClick={() => onStatus("WAITLIST")}>
                  <Mail size={16} /> Liste d&apos;attente
                </button>
              ) : null}
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
          {participant.status === "REJECTED" ? (
            <Link className="btn btn-ghost" href="/billet" target="_blank" style={{ borderColor: "rgba(255,122,156,.35)", color: "#ff7a9c" }}>
              🎟 Assister à l&apos;événement (billet visiteur)
            </Link>
          ) : null}
          {participant.status === "SELECTED" && !isFreePass ? (
            <p>
              Cette personne est acceptée, mais ne participe pas encore au
              bootcamp. Elle doit payer depuis sa page de statut. Après
              paiement, elle devient participante officielle et reçoit son
              badge.
            </p>
          ) : null}
          {participant.status === "SELECTED" && isFreePass ? (
            <>
              <p>Pass gratuit — aucun paiement requis. Confirme la place pour générer le badge.</p>
              <button className="btn btn-grad" onClick={() => onStatus("CONFIRMED")}>
                <Check size={16} /> Confirmer la place (gratuit)
              </button>
            </>
          ) : null}
          {["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status) ? (
            <>
              <Link className="btn btn-ghost" href={`/badge/${participant.qrCode}`} target="_blank">
                <Eye size={16} /> Voir / imprimer le badge
              </Link>
              <button className="btn btn-grad" onClick={onSendBadge}>
                <Send size={16} /> Renvoyer le badge
              </button>
            </>
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
  type PresenceData = {
    uniquePresent: number;
    sessions: {
      id: string;
      name: string;
      location: string | null;
      active: boolean;
      startsAt: string | null;
      scanCount: number;
      allowedCategories: ParticipantCategory[];
    }[];
    totalRecords: number;
    categoryCounts: Partial<Record<ParticipantCategory, number>>;
    presenceRows: {
      id: string;
      createdAt: string;
      participant: {
        fullName: string;
        reference: string;
        category: ParticipantCategory;
      } | null;
      session: { name: string };
    }[];
  };
  const [data, setData] = useState<PresenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [presenceCategory, setPresenceCategory] = useState<
    "ALL" | ParticipantCategory
  >("ALL");

  useEffect(() => {
    const search = new URLSearchParams();
    if (sessionFilter !== "ALL") search.set("sessionId", sessionFilter);
    if (presenceCategory !== "ALL") search.set("category", presenceCategory);
    fetch(`/api/admin/presence?${search.toString()}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Chargement impossible.");
        }
        setData(payload.data);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Chargement impossible.",
        ),
      )
      .finally(() => setLoading(false));
  }, [sessionFilter, presenceCategory]);

  if (loading) {
    return <div className="surface empty-state">Chargement des présences…</div>;
  }
  const eligible = participants.filter((participant) =>
    ["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status),
  ).length;
  return (
    <div className="stack">
      <div className="metric-grid">
        <div className="metric-card">
          <span>Personnes scannées</span>
          <strong className="grad-text-lt">{data?.uniquePresent ?? 0}</strong>
          <small>sur {eligible} accès confirmés</small>
        </div>
        {(data?.sessions ?? []).slice(0, 3).map((session) => (
          <div className="metric-card" key={session.id}>
            <span>{session.name}</span>
            <strong>{session.scanCount}</strong>
            <small>
              {session.active ? "Session active" : session.location || "Scans acceptés"}
            </small>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="phead">
          <div>
            <h3>Liste de présence</h3>
            <small>
              {data?.totalRecords ?? 0} entrée(s) selon les filtres
            </small>
          </div>
          <Link className="btn btn-grad" href="/scan">
            Ouvrir le scanner QR
          </Link>
        </div>
        <div className="filter-row">
          <select
            className="select"
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
          >
            <option value="ALL">Toutes les sessions</option>
            {data?.sessions.map((session) => (
              <option value={session.id} key={session.id}>
                {session.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={presenceCategory}
            onChange={(event) =>
              setPresenceCategory(
                event.target.value as "ALL" | ParticipantCategory,
              )
            }
          >
            <option value="ALL">Tous les types de pass</option>
            {SESSION_CATEGORY_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {(data?.presenceRows.length ?? 0) > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Type de pass</th>
                  <th>Session</th>
                  <th>Heure</th>
                </tr>
              </thead>
              <tbody>
                {data?.presenceRows.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <b>{scan.participant?.fullName ?? "QR inconnu"}</b>
                      <br />
                      <small>{scan.participant?.reference}</small>
                    </td>
                    <td>
                      {scan.participant
                        ? categoryLabel(scan.participant.category)
                        : "Inconnu"}
                    </td>
                    <td>{scan.session.name}</td>
                    <td>
                      {new Date(scan.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Aucune présence enregistrée.</div>
        )}
      </div>
    </div>
  );
}

function EvaluationStub() {
  return <div className="surface empty-state"><span className="eyebrow">Phase suivante</span><h2 className="display">Évaluation IA</h2><p>Le schéma de données et cet espace sont prêts. Le microservice d&apos;évaluation sera branché après l&apos;événement.</p></div>;
}

function JuryAdmin() {
  type JuryOverview = {
    juryCount: number;
    criteriaCount: number;
    eligibleTeams: number;
    scoredTeams: number;
    finalists: number;
    ranking: {
      id: string;
      name: string;
      memberCount: number;
      juryCount: number;
      averageScore: number | null;
      isFinalist: boolean;
      rank: number | null;
    }[];
  };
  const [data, setData] = useState<JuryOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/jury-overview")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Chargement impossible.");
        }
        setData(payload.data);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Chargement impossible.",
        ),
      )
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  async function updateResult(
    teamId: string,
    value: "none" | "finalist" | "1" | "2" | "3",
  ) {
    const response = await fetch("/api/admin/jury-overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        isFinalist: value !== "none",
        rank: ["1", "2", "3"].includes(value) ? Number(value) : null,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      return toast.error(payload.error ?? "Mise à jour impossible.");
    }
    setData(payload.data);
    toast.success("Résultat de l'équipe enregistré.");
  }

  if (loading) {
    return <div className="surface empty-state">Chargement du jury…</div>;
  }
  return (
    <div className="stack">
      <div className="metric-grid">
        <div className="metric-card">
          <span>Jurés actifs</span>
          <strong>{data?.juryCount ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Équipes admissibles</span>
          <strong>{data?.eligibleTeams ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Équipes notées</span>
          <strong>{data?.scoredTeams ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Critères</span>
          <strong>{data?.criteriaCount ?? 0}</strong>
        </div>
      </div>
      <div className="panel">
        <div className="phead">
          <h3>Classement provisoire</h3>
          <Link href="/jury">Ouvrir l&apos;espace jury</Link>
        </div>
        {(data?.ranking.length ?? 0) > 0 ? (
          <div style={{ padding: 22 }}>
            {data?.ranking.map((team, index) => (
              <div className="bar-row" key={team.id}>
                <span className="nm">
                  {team.rank ? `${team.rank}.` : `${index + 1}.`} {team.name}
                </span>
                <span className="tk">
                  <i style={{ width: `${team.averageScore ?? 0}%` }} />
                </span>
                <span className="vv">
                  {team.averageScore === null ? "—" : team.averageScore}
                </span>
                <small>{team.juryCount} juré(s)</small>
                <select
                  className="select compact-select"
                  value={
                    team.rank
                      ? String(team.rank)
                      : team.isFinalist
                        ? "finalist"
                        : "none"
                  }
                  onChange={(event) =>
                    void updateResult(
                      team.id,
                      event.target.value as
                        | "none"
                        | "finalist"
                        | "1"
                        | "2"
                        | "3",
                    )
                  }
                  aria-label={`Résultat de ${team.name}`}
                >
                  <option value="none">Non finaliste</option>
                  <option value="finalist">Finaliste</option>
                  <option value="1">1er prix</option>
                  <option value="2">2e prix</option>
                  <option value="3">3e prix</option>
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Aucune équipe entièrement payée n&apos;est encore admissible au jury.
          </div>
        )}
      </div>
    </div>
  );
}

function Communications() {
  const [emailAudience, setEmailAudience] = useState("selected");
  const [emailTemplate, setEmailTemplate] = useState("payment-reminder");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappAudience, setWhatsappAudience] = useState("selected");
  const [whatsappTemplate, setWhatsappTemplate] = useState("payment-reminder");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sending, setSending] = useState<"email" | "whatsapp" | null>(null);

  async function sendCampaign(
    event: FormEvent,
    channel: "email" | "whatsapp",
  ) {
    event.preventDefault();
    setSending(channel);
    const body =
      channel === "email"
        ? {
            audience: emailAudience,
            templateKey: emailTemplate,
            subject: emailSubject,
            message: emailMessage,
          }
        : {
            audience: whatsappAudience,
            templateKey: whatsappTemplate,
            message: whatsappMessage,
          };
    try {
      const response = await fetch(`/api/communications/${channel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error ?? "Envoi impossible.");
        return;
      }
      toast.success(
        `${payload.data.sent} envoyé(s), ${payload.data.queued} en file, ${payload.data.failed} échec(s).`,
      );
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setSending(null);
    }
  }

  const audienceOptions = [
    { value: "selected", label: "Acceptés · paiement attendu" },
    { value: "official", label: "Participants officiels" },
    { value: "pending", label: "Inscrits à examiner" },
    { value: "rejected", label: "Non retenus" },
    { value: "all", label: "Tous les inscrits" },
  ];
  const emailTemplateOptions = [
    { value: "results-available", label: "Résultats disponibles" },
    { value: "accepted-payment", label: "Accepté + paiement à faire" },
    { value: "payment-reminder", label: "Rappel paiement" },
    { value: "payment-confirmed", label: "Badge QR après paiement" },
    { value: "bootcamp-info", label: "Infos pratiques bootcamp" },
    { value: "event-reminder", label: "Rappel événement" },
    { value: "custom", label: "Message personnalisé" },
  ];
  const whatsappTemplateOptions = [
    ...emailTemplateOptions.filter((option) => option.value !== "custom"),
    { value: "team-assignment", label: "Équipe confirmée" },
    { value: "custom", label: "Message libre 24h" },
  ];

  return (
    <div className="communications-grid">
      <form
        className="surface stack"
        style={{ padding: 24 }}
        onSubmit={(event) => void sendCampaign(event, "email")}
      >
        <Mail />
        <h2>Campagne email</h2>
        <p>
          Les modèles sont déjà rédigés dans le style VIBEATHON. Utilise
          “personnalisé” seulement pour une annonce spécifique.
        </p>
        <label>
          Audience
          <select
            className="select"
            value={emailAudience}
            onChange={(event) => setEmailAudience(event.target.value)}
          >
            {audienceOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modèle
          <select
            className="select"
            value={emailTemplate}
            onChange={(event) => setEmailTemplate(event.target.value)}
          >
            {emailTemplateOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {emailTemplate === "custom" ? (
          <>
            <input
              className="input"
              value={emailSubject}
              onChange={(event) => setEmailSubject(event.target.value)}
              placeholder="Objet"
              required
            />
            <textarea
              className="textarea"
              value={emailMessage}
              onChange={(event) => setEmailMessage(event.target.value)}
              placeholder="Message"
              required
            />
          </>
        ) : null}
        <button className="btn btn-grad" disabled={sending === "email"}>
          <Send size={16} /> {sending === "email" ? "Envoi..." : "Envoyer"}
        </button>
      </form>
      <form
        className="surface stack"
        style={{ padding: 24 }}
        onSubmit={(event) => void sendCampaign(event, "whatsapp")}
      >
        <Send />
        <h2>WhatsApp</h2>
        <p>
          Les envois automatiques utilisent les templates Meta configurés dans
          l&apos;environnement. Le message libre sert uniquement aux contacts
          encore dans la fenêtre WhatsApp de 24h.
        </p>
        <label>
          Audience
          <select
            className="select"
            value={whatsappAudience}
            onChange={(event) => setWhatsappAudience(event.target.value)}
          >
            {audienceOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modèle
          <select
            className="select"
            value={whatsappTemplate}
            onChange={(event) => setWhatsappTemplate(event.target.value)}
          >
            {whatsappTemplateOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {whatsappTemplate === "custom" ? (
          <textarea
            className="textarea"
            value={whatsappMessage}
            onChange={(event) => setWhatsappMessage(event.target.value)}
            placeholder="Message libre"
            required
          />
        ) : null}
        <button className="btn btn-grad" disabled={sending === "whatsapp"}>
          {sending === "whatsapp" ? "Envoi..." : "Préparer l'envoi"}
        </button>
      </form>
    </div>
  );
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
  allowedCategories: ParticipantCategory[];
};

const SESSION_CATEGORY_OPTIONS: {
  value: ParticipantCategory;
  label: string;
}[] = [
  { value: "HACKATHON", label: "Compétiteur" },
  { value: "VISITEUR", label: "Visiteur / invité" },
  { value: "FORMATION_ADULTE", label: "Formation adulte" },
  { value: "FORMATION_KIDS", label: "Formation kids" },
];

function SessionsManager() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [allowedCategories, setAllowedCategories] = useState<
    ParticipantCategory[]
  >(SESSION_CATEGORY_OPTIONS.map((option) => option.value));
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
        allowedCategories,
      },
      "Session créée.",
    );
    setName("");
    setDescription("");
    setLocation("");
    setStartsAt("");
    setEndsAt("");
    setAllowedCategories(SESSION_CATEGORY_OPTIONS.map((option) => option.value));
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
      <div className="panel-head">
        <h2 className="panel-title">Sessions</h2>
        <p className="panel-sub">Alimentent le scanner de présence · les sessions archivées disparaissent du scanner mais leurs présences sont conservées</p>
      </div>
      {loading ? (
        <div className="cms-loading">Chargement…</div>
      ) : sessions.length ? (
        <div className="session-list">
          {sessions.map((session) => (
            <div key={session.id} className={`session-row${session.archivedAt ? " archived" : ""}`}>
              <div className="session-info">
                <b>{session.name}</b>
                <span>
                  {[session.location, session.startsAt ? new Date(session.startsAt).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null].filter(Boolean).join(" · ")}
                </span>
                <div className="cluster" style={{ gap: 4, marginTop: 4 }}>
                  {SESSION_CATEGORY_OPTIONS.filter((o) => session.allowedCategories.includes(o.value)).map((o) => (
                    <span key={o.value} className="cat-tag" style={{ fontSize: 11 }}>{o.label}</span>
                  ))}
                </div>
              </div>
              <div className="session-meta">
                <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{session.scanCount} scan{session.scanCount !== 1 ? "s" : ""}</span>
                {session.archivedAt ? (
                  <span className="status-pill" style={{ fontSize: 11 }}>Archivée</span>
                ) : (
                  <button
                    className={`status-pill ${session.active ? "confirmed" : "pending"}`}
                    style={{ fontSize: 11, cursor: "pointer" }}
                    onClick={() => void send("PATCH", { id: session.id, active: !session.active }, session.active ? "Session désactivée." : "Session activée.")}
                  >
                    {session.active ? "En cours" : "Démarrer"}
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  style={{ padding: "4px 10px", fontSize: 12, minHeight: 0 }}
                  onClick={() => void send("PATCH", { id: session.id, archived: !Boolean(session.archivedAt) }, session.archivedAt ? "Session restaurée." : "Session archivée.")}
                >
                  {session.archivedAt ? "Restaurer" : "Archiver"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <details className="session-add-form" style={{ margin: "12px 20px 20px" }}>
        <summary>Ajouter une session</summary>
        <form className="stack" style={{ paddingTop: 16 }} onSubmit={createSession}>
          <div className="field two">
            <label>
              Nom
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Keynotes d'ouverture" required />
            </label>
            <label>
              Lieu
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex. Auditorium principal" />
            </label>
          </div>
          <div className="field two">
            <label>
              Début
              <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>
            <label>
              Fin
              <input className="input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </label>
          </div>
          <div className="cluster" style={{ gap: 8 }}>
            {SESSION_CATEGORY_OPTIONS.map((option) => (
              <label className="check-row compact" key={option.value}>
                <input
                  type="checkbox"
                  checked={allowedCategories.includes(option.value)}
                  onChange={(event) =>
                    setAllowedCategories((current) =>
                      event.target.checked ? [...current, option.value] : current.filter((c) => c !== option.value),
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
          <button className="btn btn-grad" type="submit" style={{ alignSelf: "flex-start" }}>
            Créer la session
          </button>
        </form>
      </details>
    </div>
  );

}

function SettingsPanel() {
  type CompetitionSettings = {
    id: string;
    name: string;
    venue: string;
    eventDate: string;
    participationFee: number;
    capacity: number;
    competitorCapacity: number;
    registrationOpen: boolean;
    criteria: JuryCriterion[];
  };
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Chargement impossible.");
        }
        setSettings(payload.data);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Chargement impossible.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          eventDate: settings.eventDate.slice(0, 10),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Enregistrement impossible.");
      }
      setSettings(payload.data);
      toast.success("Paramètres enregistrés dans la base de données.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="surface empty-state">Chargement des paramètres…</div>;
  }
  if (!settings) {
    return (
      <div className="surface empty-state">
        Les paramètres de la compétition sont indisponibles.
      </div>
    );
  }
  const criteriaTotal = settings.criteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  return (
    <div className="settings-grid">
      <form className="panel" onSubmit={save}>
        <div className="panel-head">
          <h2 className="panel-title">Compétition</h2>
          <p className="panel-sub">Nom, lieu, date et capacités de l&apos;événement</p>
        </div>
        <div className="panel-form">
          <label>
            Nom
            <input
              className="input"
              value={settings.name}
              onChange={(event) =>
                setSettings({ ...settings, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Lieu
            <input
              className="input"
              value={settings.venue}
              onChange={(event) =>
                setSettings({ ...settings, venue: event.target.value })
              }
              required
            />
          </label>
          <label>
            Date
            <input
              className="input"
              type="date"
              value={settings.eventDate.slice(0, 10)}
              onChange={(event) =>
                setSettings({ ...settings, eventDate: event.target.value })
              }
              required
            />
          </label>
          <label>
            Frais compétiteur (FCFA)
            <input
              className="input"
              type="number"
              min={0}
              value={settings.participationFee}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  participationFee: Number(event.target.value),
                })
              }
              required
            />
          </label>
          <div className="field two">
            <label>
              Capacité totale
              <input
                className="input"
                type="number"
                min={1}
                value={settings.capacity}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    capacity: Number(event.target.value),
                  })
                }
                required
              />
            </label>
            <label>
              Places compétition
              <input
                className="input"
                type="number"
                min={1}
                value={settings.competitorCapacity}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    competitorCapacity: Number(event.target.value),
                  })
                }
                required
              />
            </label>
          </div>
          <label className="cluster" style={{ gap: 10 }}>
            <input
              type="checkbox"
              checked={settings.registrationOpen}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  registrationOpen: event.target.checked,
                })
              }
            />
            Inscriptions hackathon ouvertes
          </label>
          <div>
            <button className="btn btn-grad" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
      <SessionsManager />
      <form className="panel" onSubmit={save}>
        <div className="panel-head">
          <h2 className="panel-title">Critères du jury</h2>
          <p className="panel-sub">Les curseurs du portail jury utilisent directement ces plafonds. La somme doit être égale à 100.</p>
        </div>
        <div className="panel-form">
        {settings.criteria.map((criterion, index) => (
          <div className="field two" key={criterion.id}>
            <input
              className="input"
              value={criterion.name}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  criteria: settings.criteria.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                })
              }
              aria-label={`Nom du critère ${index + 1}`}
            />
            <input
              className="input"
              type="number"
              min={1}
              max={100}
              value={criterion.weight}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  criteria: settings.criteria.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, weight: Number(event.target.value) }
                      : item,
                  ),
                })
              }
              aria-label={`Poids du critère ${criterion.name}`}
            />
          </div>
        ))}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <strong className={criteriaTotal === 100 ? "grad-text-lt" : ""} style={{ fontSize: 14 }}>
              Total : {criteriaTotal}/100
            </strong>
            <button
              className="btn btn-grad"
              disabled={saving || criteriaTotal !== 100}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
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
  type EmailDelivery = {
    status: "SENT" | "QUEUED" | "FAILED";
    error?: string;
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
      const delivery = payload.data.emailDelivery as EmailDelivery;
      if (delivery.status === "SENT") {
        toast.success("Compte créé et invitation envoyée par email.");
      } else {
        toast.warning(
          "Compte créé, mais l'email n'a pas été envoyé. Transmets les identifiants affichés.",
        );
      }
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
    if (body.action === "reset-password") {
      const delivery = payload.data.emailDelivery as EmailDelivery;
      if (delivery.status === "SENT") {
        toast.success("Mot de passe réinitialisé et envoyé par email.");
      } else {
        toast.warning(
          "Mot de passe réinitialisé, mais l'email n'a pas été envoyé.",
        );
      }
      return;
    }
    toast.success("Accès mis à jour.");
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
            Une invitation est envoyée automatiquement par email. Le mot de
            passe temporaire reste affiché une seule fois ici comme solution
            de secours et devra être remplacé à la première connexion.
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
