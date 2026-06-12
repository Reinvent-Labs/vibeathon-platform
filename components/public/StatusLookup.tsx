"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { EVENT } from "@/lib/constants";
import type { DemoParticipantStatus } from "@/lib/demo-data";

type StatusParticipant = {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  city: string;
  profile: string;
  status: DemoParticipantStatus;
  badgeUrl: string | null;
  teamName?: string;
  fee: number;
};

const statusCopy = {
  PENDING: {
    label: "Candidature en cours d'étude",
    description: "Notre équipe étudie ton profil. Tu recevras la décision par email.",
    icon: "…",
  },
  WAITLIST: {
    label: "Liste d'attente",
    description:
      "Ta candidature est conservée en liste d'attente. Si une place se libère, l'équipe VIBEATHON te contactera directement par email.",
    icon: "≈",
  },
  SELECTED: {
    label: "Tu es accepté·e ! Paiement en attente",
    description:
      "Ton dossier est validé. Règle les frais pour devenir participant·e officiel·le et accéder au bootcamp.",
    icon: "★",
  },
  PAID: {
    label: "Accepté·e · paiement validé",
    description:
      "Tu es participant·e officiel·le. Ton badge est disponible pour le bootcamp et la compétition.",
    icon: "✓",
  },
  CONFIRMED: {
    label: "Participant·e officiel·le",
    description:
      "Paiement validé. Tout est prêt pour le bootcamp et la compétition.",
    icon: "✓",
  },
  CHECKED_IN: {
    label: "Présence enregistrée",
    description: "Ton arrivée au VIBEATHON a bien été enregistrée.",
    icon: "✓",
  },
  REJECTED: {
    label: "Candidature non retenue",
    description: "Les places sont limitées, mais les ateliers publics restent ouverts.",
    icon: "×",
  },
} as const;

export function StatusLookup() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment");
  const returnedEmail = searchParams.get("email");
  const [email, setEmail] = useState(returnedEmail ?? "");
  const [participant, setParticipant] = useState<StatusParticipant | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  async function lookup(value = email) {
    if (!value) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/participant/status?email=${encodeURIComponent(value)}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "Candidature introuvable.");
      setParticipant(payload.data);
    } catch (error) {
      setParticipant(null);
      toast.error(error instanceof Error ? error.message : "Erreur de recherche.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!paymentResult || !returnedEmail) return;
    queueMicrotask(() => void lookup(returnedEmail));
    if (paymentResult === "success") {
      toast.success("Paiement confirmé. Ton badge est prêt.");
    } else {
      toast.info(
        "Paiement en cours de vérification. Actualise ton statut dans quelques instants.",
      );
    }
    // Search params are stable for this page load; lookup must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentResult, returnedEmail]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await lookup();
  }

  async function startPayment() {
    if (!participant) return;
    setPaying(true);
    try {
      const response = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: participant.reference, channel: "" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.data.url) throw new Error(payload.error ?? "Paiement indisponible.");
      window.location.assign(payload.data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de paiement.");
      setPaying(false);
    }
  }

  const copy = participant ? statusCopy[participant.status] : null;

  return (
    <div className="lookup-wrap">
      {!participant ? (
        <div className="lookup">
          <span className="eyebrow">Suivi de candidature</span>
          <h1 className="display">Où en est<br /><span className="grad-text-lt">ton dossier ?</span></h1>
          <p className="sub">Entre l&apos;email utilisé lors de ta candidature.</p>
          <form onSubmit={handleSubmit}>
            <input className="input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="toi@email.com" />
            <button className="btn btn-grad" disabled={loading}>{loading ? "Recherche..." : "Voir"}</button>
          </form>
        </div>
      ) : (
        <div className="status-card">
          <div className="head">
            <div className="ico">{copy?.icon}</div>
            <div className="who"><b>{participant.fullName}</b><span>{participant.email}</span></div>
          </div>
          <div className="steps">
            {["Candidature", "Sélection", "Confirmé"].map((step, index) => {
              const progress = participant.status === "PENDING" || participant.status === "REJECTED" ? 1 : participant.status === "SELECTED" ? 2 : 3;
              return <div className={`step ${index < progress ? "done" : ""}`} key={step}><div className="d" /><small>{step}</small></div>;
            })}
          </div>
          <div className="body">
            <div className="stat-line grad-text-lt">{copy?.label}</div>
            <p className="desc">{copy?.description}</p>
            {participant.status === "SELECTED" ? (
              <div className="pay-box"><div><b>{participant.fee.toLocaleString("fr-FR")} {EVENT.currency}</b><br /><span>Frais de participation · paiement requis pour confirmer la place</span></div></div>
            ) : null}
            <div className="actions">
              {participant.status === "SELECTED" ? <button className="btn btn-grad" onClick={startPayment} disabled={paying}>{paying ? "Redirection..." : `Payer ${participant.fee.toLocaleString("fr-FR")} FCFA →`}</button> : null}
              {participant.badgeUrl ? <Link href={participant.badgeUrl} className="btn btn-grad">Voir mon badge →</Link> : null}
              {participant.status === "REJECTED" ? (
                <Link href="/billet" className="btn btn-ghost" style={{ borderColor: "rgba(255,122,156,.35)", color: "#ff7a9c" }}>
                  🎟 Tu veux quand même assister ? Prends un billet visiteur →
                </Link>
              ) : null}
              <button className="btn btn-ghost" onClick={() => setParticipant(null)}>Vérifier un autre email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
