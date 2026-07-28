import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { TicketForm } from "@/components/public/TicketForm";
import { REGISTRATIONS_CLOSED, REGISTRATIONS_CLOSED_COPY } from "@/lib/constants";

export const metadata: Metadata = {
  title: REGISTRATIONS_CLOSED ? "Inscriptions fermées" : "Inscription · Mon pass",
};

export default function BilletPage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      <div className="split">
        <aside className="aside">
          <div className="top">
            <span className="eyebrow">Inscription</span>
            <h1>
              Réserve<br />
              <span className="grad-text-lt">ta place.</span>
            </h1>
            <p className="lede">
              Renseigne tes informations et reçois ton badge d&apos;accès
              gratuitement par email et WhatsApp.
            </p>
          </div>
          <div className="facts">
            <div className="fact">
              <span className="k" style={{ background: "#43D9FF" }} />
              <div>
                <b>11 juillet 2026</b>
                <span>CSCTICAO, Abidjan</span>
              </div>
            </div>
            <div className="fact">
              <span className="k" style={{ background: "#BA77FF" }} />
              <div>
                <b>Badge immédiat</b>
                <span>Reçu par email et WhatsApp</span>
              </div>
            </div>
            <div className="fact">
              <span className="k" style={{ background: "#FF57E3" }} />
              <div>
                <b>Entrée gratuite</b>
                <span>Aucun paiement requis</span>
              </div>
            </div>
          </div>
        </aside>
        <div className="formcol">
          {REGISTRATIONS_CLOSED ? (
            <div className="form-card">
              <h2>{REGISTRATIONS_CLOSED_COPY.heading}</h2>
              <p>{REGISTRATIONS_CLOSED_COPY.body}</p>
              <Link href="/" className="btn btn-grad">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <Suspense fallback={<div className="form-card">Chargement...</div>}>
              <TicketForm />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
