import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, User, Award, Shield } from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { JuryCard } from "@/components/public/JuryCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Le Jury | VIBEATHON 2026",
  description: "Découvrez les experts et professionnels de la tech, du climat et de l'innovation qui composent le jury de VIBEATHON 2026.",
};

interface FeaturedJury {
  name: string;
  title: string;
  company: string;
  bio: string;
  tag: string;
  color: string;
  initials: string;
  photoUrl: string;
}

const FEATURED_JURY: FeaturedJury[] = [
  {
    name: "Stephane Kounandi COULIBALY",
    title: "Directeur de l'Innovation, des Startups et du Secteur Privé",
    company: "Ministère de la Transition Numérique et de l'Innovation Technologique",
    bio: "Pilote les initiatives de transition numérique, de soutien aux startups et de développement de l'écosystème technologique national.",
    tag: "Innovation & Public",
    color: "#00E5FF",
    initials: "SC",
    photoUrl: "/images/jury/stephane-coulibaly.jpg",
  },
  {
    name: "Richard Ahoutou DJE",
    title: "Directeur de l'Informatique, des Statistiques, des Archives et de la Documentation (DISAD)",
    company: "Ministère des Eaux et Forêts",
    bio: "Supervise la transformation numérique, la collecte statistique et la modélisation des données environnementales et forestières.",
    tag: "Environnement & Data",
    color: "#75FF8D",
    initials: "RD",
    photoUrl: "/images/jury/richard-dje.jpg",
  },
  {
    name: "Dr. Isaac BAYOH, Ph.D",
    title: "Fondateur & Chief IA Officer",
    company: "FuturAfric Intelligence Artificielle",
    bio: "Expert chevronné en Deep Learning et applications d'IA générative pour le continent africain, avec un fort accent sur l'éco-conception.",
    tag: "Intelligence Artificielle",
    color: "#BA77FF",
    initials: "IB",
    photoUrl: "/images/jury/isaac-bayoh.jpg",
  },
  {
    name: "Christ LOKONDA",
    title: "Director of Technical Assistance",
    company: "Barka FUND",
    bio: "Accompagne la structuration technique et financière des startups africaines à fort potentiel d'impact social et environnemental.",
    tag: "Financement & Tech",
    color: "#FF57E3",
    initials: "CL",
    photoUrl: "/images/jury/christ-lokonda.jpg",
  },
  {
    name: "Inssata RICOURT",
    title: "CEO | Expert Cybersécurité & DPO",
    company: "INSSATADCONSULTING / BLACK ISETHICAL",
    bio: "Spécialiste de la protection des données et de la sécurité des systèmes d'information, avec un fort engagement dans l'éthique technologique.",
    tag: "Sécurité & Éthique",
    color: "#43D9FF",
    initials: "IR",
    photoUrl: "/images/jury/inssata-ricourt.jpg",
  },
  {
    name: "Cédric MANOUAN",
    title: "Ingénieur & Consultant Spécialiste IA",
    company: "Consultant Indépendant / Associé",
    bio: "Conçoit et intègre des solutions d'intelligence artificielle sur mesure pour optimiser la prise de décision et automatiser les processus complexes.",
    tag: "Ingénierie IA",
    color: "#F5C842",
    initials: "CM",
    photoUrl: "/images/jury/cedric-manouan.jpg",
  },
  {
    name: "Amina EL TMALI",
    title: "Fondatrice & Journaliste Tech & IA",
    company: "Mind AI",
    bio: "Journaliste et observatrice active des avancées de l'intelligence artificielle en Afrique, mettant en lumière l'impact sociétal de la tech.",
    tag: "Média & Tech",
    color: "#FF7A9C",
    initials: "AE",
    photoUrl: "/images/jury/amina-el-tmali.jpg",
  },
  {
    name: "Mame Sokhna Sarr",
    title: "Regional Senior Manager & Deputy Country Director",
    company: "Tony Blair Institute for Global Change",
    bio: "Spécialiste des politiques de transition verte et de l'intégration des technologies émergentes au sein des gouvernements africains.",
    tag: "Climat & Gouvernance",
    color: "#FF8C42",
    initials: "MS",
    photoUrl: "/images/jury/mame-sarr.jpg",
  },
];

export default async function JuryMembersPage() {
  let dbJuryMembers: { id: string; fullName: string; email: string }[] = [];

  try {
    if (prisma) {
      dbJuryMembers = await prisma.adminUser.findMany({
        where: {
          role: "JURY",
          active: true,
        },
        orderBy: {
          fullName: "asc",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des jurés de la base de données :", error);
  }

  return (
    <div className="page-shell">
      <AuroraMesh />

      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">
          ← Retour à l&apos;accueil
        </Link>
      </div>

      <main className="wrap" style={{ padding: "40px 20px 80px", position: "relative", zIndex: 2 }}>
        {/* Header Section */}
        <header style={{ textAlign: "center", marginBottom: "60px" }}>
          <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--purple-lt)" }}>
            Évaluation &amp; Expertise · VIBEATHON 2026
          </span>
          <h1 className="display" style={{ fontSize: "clamp(40px, 6vw, 64px)", marginTop: "10px" }}>
            Le <span className="grad-text-lt">Jury.</span>
          </h1>
          <p className="body" style={{ margin: "20px auto 0", maxWidth: "600px", color: "var(--ink-soft)", fontSize: "1.1rem" }}>
            Découvrez l&apos;équipe pluridisciplinaire d&apos;experts du numérique, de la cybersécurité, de l&apos;intelligence artificielle et du climat réunie pour évaluer les solutions durables conçues pendant la compétition.
          </p>
        </header>

        {/* Featured Jury Grid */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>
              Membres d&apos;honneur du jury
            </h2>
            <div style={{ width: "60px", height: "3px", background: "var(--grad-lt)", margin: "12px auto 0", borderRadius: "2px" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            {FEATURED_JURY.map((member) => (
              <JuryCard
                key={member.name}
                name={member.name}
                title={member.title}
                company={member.company}
                bio={member.bio}
                tag={member.tag}
                color={member.color}
                initials={member.initials}
                photoUrl={member.photoUrl}
              />
            ))}
          </div>
        </section>

        {/* Dynamic Registered Jury Members Section */}
        <section style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>
              Jurés enregistrés
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: "8px" }}>
              Comptes actifs configurés sur la plateforme pour l&apos;évaluation et la notation en direct des équipes.
            </p>
            <div style={{ width: "60px", height: "3px", background: "var(--grad-1)", margin: "12px auto 0", borderRadius: "2px" }} />
          </div>

          {dbJuryMembers.length > 0 ? (
            <div className="surface" style={{ padding: "8px 0", overflow: "hidden" }}>
              <div className="table-wrap">
                <table className="data-table" style={{ minWidth: "100%", margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: "24px" }}>Nom</th>
                      <th>Statut</th>
                      <th style={{ paddingRight: "24px", textAlign: "right" }}>Rôle système</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbJuryMembers.map((jury) => (
                      <tr key={jury.id} style={{ borderLeft: "3px solid var(--purple-lt)" }}>
                        <td style={{ paddingLeft: "24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.05)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--purple-lt)"
                            }}>
                              <User size={16} />
                            </div>
                            <div>
                              <strong style={{ color: "#fff" }}>{jury.fullName}</strong>
                              <br />
                              <small style={{ color: "var(--ink-soft)" }}>{jury.email.replace(/(?<=.{2}).(?=[^@]*?@)/g, "*")}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-pill confirmed" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                            Actif
                          </span>
                        </td>
                        <td style={{ paddingRight: "24px", textAlign: "right", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Shield size={14} style={{ color: "var(--purple-lt)" }} />
                            <span>Juré officiel</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="surface" style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)" }}>
              <Award size={36} style={{ color: "var(--purple-lt)", margin: "0 auto 16px", opacity: 0.6 }} />
              <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "8px", fontWeight: "600" }}>
                Comptes de notation
              </h3>
              <p style={{ maxWidth: "450px", margin: "0 auto", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Les jurés inscrits par l&apos;administration apparaîtront dans cette liste dès que leurs comptes d&apos;évaluation système seront créés.
              </p>
            </div>
          )}
        </section>

        {/* Footer Link back */}
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <Link href="/billet" className="btn btn-grad" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            Rejoindre l&apos;événement en tant que visiteur <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </div>
  );
}
