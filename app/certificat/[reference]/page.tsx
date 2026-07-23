import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, MapPin, CalendarDays } from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { findCertificateByReference } from "@/lib/repository";

export const metadata: Metadata = { title: "Vérification de certificat" };

const CATEGORY_LABELS: Record<string, { label: string; color: string; title: string }> = {
  VISITEUR: { label: "Visiteur", color: "#43D9FF", title: "Certificat de Participation" },
  COMPETITEUR: { label: "Compétiteur", color: "#75FF8D", title: "Certificat de Participation" },
  JURY: { label: "Membre du Jury", color: "#BA77FF", title: "Certificat de Reconnaissance" },
  EQUIPE_ORGANISATRICE: { label: "Équipe Organisatrice", color: "#FF57E3", title: "Certificat de Reconnaissance" },
  FORMATION_ADULTE: { label: "Formation Adulte", color: "#FFCB47", title: "Certificat de Formation" },
  FORMATION_KIDS: { label: "Formation Enfant", color: "#FF8966", title: "Certificat de Formation" },
};

// LinkedIn Company Page "Vibeathon Côte d'Ivoire" — urn:li:organization:112328299
const LINKEDIN_ORGANIZATION_ID = "112328299";

function buildLinkedInAddUrl(params: {
  name: string;
  issueDate: Date;
  certUrl: string;
  certId: string;
}) {
  const search = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: params.name,
    organizationId: LINKEDIN_ORGANIZATION_ID,
    issueYear: String(params.issueDate.getFullYear()),
    issueMonth: String(params.issueDate.getMonth() + 1),
    certUrl: params.certUrl,
    certId: params.certId,
  });
  return `https://www.linkedin.com/profile/add?${search.toString()}`;
}

function LinkedInIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const certificate = await findCertificateByReference(reference);
  if (!certificate) notFound();

  const info = CATEGORY_LABELS[certificate.category] ?? {
    label: certificate.roleLabel,
    color: "#75FF8D",
    title: "Certificat",
  };

  const eventDate = new Date(certificate.eventDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vibeathonci.com").replace(/\/$/, "");
  const linkedInUrl = buildLinkedInAddUrl({
    name: `${info.title} — ${info.label}, VIBEATHON 2026`,
    issueDate: new Date(certificate.eventDate),
    certUrl: `${appUrl}/certificat/${certificate.reference}`,
    certId: certificate.reference,
  });

  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Accueil</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px 80px" }}>
        <div
          className="surface"
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "36px 32px",
            textAlign: "center",
          }}
        >
          {certificate.revoked ? (
            <>
              <XCircle size={40} color="#ff6b6b" style={{ margin: "0 auto 16px" }} />
              <h1 className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                Certificat révoqué
              </h1>
              <p style={{ color: "var(--ink-soft)" }}>
                Ce certificat (réf. {certificate.reference}) a été invalidé et n&apos;est plus reconnu par VIBEATHON.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 size={40} color="var(--green-lt)" style={{ margin: "0 auto 16px" }} />
              <span className="eyebrow" style={{ color: "var(--green-lt)" }}>Certificat vérifié</span>
              <h1 className="display" style={{ fontSize: 28, margin: "12px 0 6px" }}>
                {certificate.fullName}
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 14px",
                  borderRadius: 999,
                  background: info.color,
                  color: "#08110c",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 18px",
                }}
              >
                {info.label}
              </div>
              <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                {info.title}
                {certificate.teamName ? <> · Équipe {certificate.teamName}</> : null}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: "1px solid var(--line)",
                  paddingTop: 18,
                  fontSize: 13.5,
                  color: "var(--ink-soft)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <CalendarDays size={15} style={{ color: "var(--green-lt)" }} /> {eventDate}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MapPin size={15} style={{ color: "var(--green-lt)" }} /> CSCTICAO, Abidjan
                </div>
                <div style={{ marginTop: 10, fontFamily: "monospace", letterSpacing: "0.08em" }}>
                  {certificate.reference}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                  Délivré le {issuedDate}
                </div>
              </div>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  minHeight: 44,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "#0A66C2",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                <LinkedInIcon />
                Ajouter à mon profil LinkedIn
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
