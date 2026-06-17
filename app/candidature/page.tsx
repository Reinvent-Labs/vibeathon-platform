import type { Metadata } from "next";
import Link from "next/link";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { EVENT } from "@/lib/constants";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Candidature" };
export const dynamic = "force-dynamic";

/**
 * Hackathon applications are closed (the registration window has passed). We
 * keep the route so existing links don't 404 and redirect intent toward the
 * open ticket categories (visitor / formations).
 */
export default async function CandidaturePage() {
  let registrationOpen = false;
  try {
    const competition = prisma
      ? await prisma.competition.findUnique({
          where: { slug: "vibeathon-2026" },
          select: { registrationOpen: true },
        })
      : null;
    registrationOpen = competition?.registrationOpen ?? false;
  } catch {
    // Fail closed if the database is temporarily unavailable.
  }
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      {registrationOpen ? (
        <div className="form-wrap">
          <div className="form-intro">
            <span className="eyebrow">Compétition Vibe Coding</span>
            <h1 className="display">
              Dépose ta
              <br />
              <span className="grad-text-lt">candidature.</span>
            </h1>
            <p>
              Complète ton dossier pour rejoindre la sélection VIBEATHON 2026.
            </p>
          </div>
          <RegistrationForm />
        </div>
      ) : (
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
              Mon pass
            </Link>
            <Link href="/statut" className="btn btn-ghost">
              Mon statut
            </Link>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
