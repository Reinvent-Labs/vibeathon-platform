import type { Metadata } from "next";
import Link from "next/link";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { EVENT } from "@/lib/constants";

export const metadata: Metadata = { title: "Candidatures closes" };

/**
 * Hackathon applications are closed (the registration window has passed). We
 * keep the route so existing links don't 404 and redirect intent toward the
 * open ticket categories (visitor / formations).
 */
export default function CandidaturePage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      <div className="lookup-wrap">
        <div className="status-card" style={{ textAlign: "center" }}>
          <span className="eyebrow">Compétition</span>
          <h1
            className="display"
            style={{ fontSize: "clamp(32px,5vw,52px)", margin: "10px 0 14px" }}
          >
            Les candidatures<br />
            <span className="grad-text-lt">sont closes.</span>
          </h1>
          <p className="body" style={{ margin: "0 auto 24px", maxWidth: 480 }}>
            Les inscriptions à la compétition vibecoding sont terminées. Mais tu
            peux toujours vivre le {EVENT.shortDate} : viens en visiteur ou
            inscris-toi à une formation.
          </p>
          <div className="cluster" style={{ justifyContent: "center" }}>
            <Link href="/billet" className="btn btn-grad">
              Voir les billets
            </Link>
            <Link href="/statut" className="btn btn-ghost">
              Mon statut
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
