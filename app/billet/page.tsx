import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { TicketForm } from "@/components/public/TicketForm";
export const metadata: Metadata = { title: "Inscription · Mon pass" };

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
          <Suspense fallback={<div className="form-card">Chargement...</div>}>
            <TicketForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
