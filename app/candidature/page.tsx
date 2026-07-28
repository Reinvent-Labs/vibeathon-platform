import type { Metadata } from "next";
import Link from "next/link";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { EVENT, REGISTRATIONS_CLOSED } from "@/lib/constants";
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
        <div className="closed-wrap">
          <div className="closed-inner">
            <span className="eyebrow">Compétition · Vibe Coding</span>
            <h1 className="display closed-title">
              Les candidatures<br />
              <span className="grad-text-lt">sont closes.</span>
            </h1>
            <p className="closed-body">
              {REGISTRATIONS_CLOSED
                ? `L'édition ${EVENT.name.split(" ").pop()} s'est tenue le ${EVENT.shortDate} et est terminée. Merci à toutes les personnes qui y ont participé.`
                : `Les inscriptions à la compétition vibecoding sont terminées. Mais l'événement reste ouvert, rejoins-nous le ${EVENT.shortDate} en tant que visiteur.`}
            </p>
            <div className="closed-actions">
              {REGISTRATIONS_CLOSED ? null : (
                <Link href="/billet" className="btn btn-grad">
                  Prendre un pass visiteur →
                </Link>
              )}
              <Link href="/statut" className="btn btn-ghost">
                Consulter mon statut
              </Link>
            </div>
            <div className="closed-divider" />
            <p className="closed-hint">
              Tu es déjà sélectionné·e ? Consulte ton statut pour confirmer ta participation et obtenir ton badge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
