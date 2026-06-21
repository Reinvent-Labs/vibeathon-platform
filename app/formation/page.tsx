import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Nos Formations" };

export default function FormationPage() {
  const courses = [
    {
      title: "Formation Adulte",
      tagline: "Maîtrisez le Vibe Coding & l'IA",
      price: "10 000",
      description: "Pour les adultes qui veulent suivre le bootcamp intensif de formation et concevoir des applications.",
      perks: [
        "Accès complet au bootcamp de formation",
        "Accès à toutes les sessions de la journée",
        "Un atelier pratique au choix",
        "Certificat de participation nominatif (optionnel)",
      ],
      link: "/billet?type=formation_adulte",
      color: "#BA77FF",
    },
    {
      title: "Formation Kids",
      tagline: "L'initiation à l'IA pour les plus jeunes",
      price: "5 000",
      description: "Le bootcamp d'apprentissage ludique spécialement pensé et adapté pour les enfants.",
      perks: [
        "Accès au bootcamp de formation enfants",
        "Un atelier pratique adapté",
        "Goûter et rafraîchissements inclus",
        "Encadrement personnalisé par des formateurs",
      ],
      link: "/billet?type=formation_kids",
      color: "#FF57E3",
    },
  ];

  return (
    <div className="page-shell">
      <AuroraMesh />
      
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>

      <main className="wrap" style={{ padding: "40px 20px 80px", position: "relative", zIndex: 2 }}>
        <header style={{ textAlign: "center", marginBottom: "60px" }}>
          <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--purple-lt)" }}>
            Bootcamps VIBEATHON 2026
          </span>
          <h1 className="display" style={{ fontSize: "clamp(40px, 6vw, 64px)", marginTop: "10px" }}>
            Nos <span className="grad-text-lt">Formations.</span>
          </h1>
          <p className="body" style={{ margin: "20px auto 0", maxWidth: "600px", color: "var(--ink-soft)", fontSize: "1.1rem" }}>
            Découvrez nos programmes de formation accélérés pour maîtriser les outils d&apos;intelligence artificielle et le Vibe Coding, ou initiez vos enfants aux technologies de demain.
          </p>
        </header>

        <div className="ticket-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "30px", 
          maxWidth: "960px", 
          margin: "0 auto" 
        }}>
          {courses.map((course) => (
            <article
              key={course.title}
              className="ticket-card"
              style={{
                background: "rgba(16, 23, 26, 0.75)",
                border: "1px solid var(--line)",
                borderRadius: "20px",
                padding: "40px 30px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(12px)",
                ["--cat" as string]: course.color,
              }}
            >
              <div className="ticket-bar" style={{ backgroundColor: course.color, position: "absolute", top: 0, left: 0, right: 0, height: "4px" }} />
              
              <h3 style={{ color: course.color, fontSize: "1.5rem", fontWeight: "700", marginBottom: "10px" }}>
                {course.title}
              </h3>
              
              <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", minHeight: "40px", marginBottom: "20px" }}>
                {course.tagline}
              </p>
              
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: "20px" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: "900", fontFamily: "Outfit, sans-serif" }}>
                  {course.price}
                </span>
                <span style={{ fontSize: "1rem", color: "var(--ink-faint)", marginLeft: "6px" }}>
                  FCFA
                </span>
              </div>
              
              <p className="body" style={{ fontSize: "0.95rem", color: "var(--ink)", marginBottom: "30px", minHeight: "60px" }}>
                {course.description}
              </p>
              
              <ul className="ticket-list" style={{ listStyle: "none", padding: 0, margin: "0 0 40px", flex: 1 }}>
                {course.perks.map((perk, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", margin: "12px 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                    <Check size={16} style={{ color: course.color, marginTop: "3px", flexShrink: 0 }} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={course.link}
                className="btn btn-grad btn-block"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                }}
              >
                Réserver ma place <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
