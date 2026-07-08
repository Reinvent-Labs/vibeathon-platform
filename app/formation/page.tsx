import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  BookOpen, 
  Target, 
  Sparkles, 
  Users, 
  Calendar, 
  MapPin, 
  Brain, 
  Cpu, 
  GraduationCap, 
  Layers 
} from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { 
  title: "Nos Formations & Bootcamps · VIBEATHON 2026",
  description: "Découvrez nos programmes de formation accélérés pour maîtriser les outils d'intelligence artificielle et le Vibe Coding lors de la 1ère édition du VIBEATHON 2026."
};

export default function FormationPage() {
  const courses = [
    {
      title: "Formation Adulte",
      tagline: "Maîtrisez le Vibe Coding & l'IA",
      price: "Gratuit",
      description: "Pour les étudiants, entrepreneurs et professionnels qui souhaitent suivre le bootcamp intensif de formation et concevoir des applications réelles sans coder.",
      perks: [
        "Accès au Panel",
      ],
      link: "https://forms.gle/mSpiMRyrmmBxXdq29",
      color: "#BA77FF", // Purple accent
    },
    {
      title: "Formation Kids",
      tagline: "L'initiation à l'IA pour les plus jeunes",
      price: "Gratuit",
      description: "Un parcours d'apprentissage ludique spécialement pensé pour initier les enfants aux technologies d'intelligence artificielle et stimuler leur créativité.",
      perks: [
        "Accès au Panel",
      ],
      link: "https://forms.gle/RYk9d6mH3MWn63rg9",
      color: "#FF57E3", // Pink accent
    },
  ];

  const objectives = [
    {
      icon: <Brain size={24} className="text-mint" />,
      title: "Former & Sensibiliser",
      desc: "Comprendre de manière pratique les outils de l'intelligence artificielle, les concepts clés, ainsi que les opportunités et les risques associés.",
    },
    {
      icon: <Cpu size={24} className="text-mint" />,
      title: "Démocratiser l'Innovation",
      desc: "Rendre la création numérique accessible à tous sans barrière technique en utilisant le Vibe Coding pour programmer en langage naturel.",
    },
    {
      icon: <Target size={24} className="text-mint" />,
      title: "Stimuler les Solutions Locales",
      desc: "Encourager la conception de réponses concrètes et adaptées aux problématiques réelles du contexte ivoirien et africain.",
    },
    {
      icon: <Sparkles size={24} className="text-mint" />,
      title: "Détecter les Talents",
      desc: "Valoriser la créativité des profils non techniques, des jeunes et des femmes pour construire un écosystème IA plus inclusif.",
    },
  ];

  const features = [
    {
      title: "Bootcamp Intensif",
      duration: "3 jours",
      desc: "Un parcours en deux étapes clés : d'abord la prise en main des technologies de Vibe Coding pour matérialiser vos idées en solutions réelles sans écrire de code, suivie d'une formation structurée au pitch pour convaincre jury et partenaires.",
      icon: <BookOpen size={20} />,
    },
    {
      title: "Ateliers de Formation",
      duration: "06 Sessions Interactives",
      desc: "Des sessions pratiques axées sur l'usage quotidien et professionnel des meilleurs outils d'IA générative. Chaque session est animée et encadrée par des formateurs experts du domaine.",
      icon: <GraduationCap size={20} />,
    },
    {
      title: "Studios d'Expérience IA",
      duration: "Espaces Immersifs",
      desc: "Des laboratoires créatifs pour expérimenter en direct : le Studio Photo IA pour concevoir des visuels et avatars professionnels, et le Studio Musique IA pour s'essayer à la génération et composition sonore.",
      icon: <Layers size={20} />,
    },
  ];

  const targets = [
    "Étudiants & Jeunes diplômés en quête de compétences d'avenir",
    "Entrepreneurs désirant accélérer leur business avec l'IA",
    "Professionnels & Porteurs de projets sans compétences techniques en code",
    "Kids & Juniors curieux de découvrir l'informatique de demain"
  ];

  return (
    <div className="page-shell">
      <AuroraMesh />
      
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>

      <main className="wrap" style={{ padding: "40px 20px 100px", position: "relative", zIndex: 2 }}>
        
        {/* En-tête principal */}
        <header style={{ textAlign: "center", marginBottom: "60px" }}>
          <span className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--purple-lt)" }}>
            1ÈRE ÉDITION · VIBEATHON 2026
          </span>
          <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 64px)", marginTop: "12px", lineHeight: "1.1" }}>
            Nos <span className="grad-text-lt">Formations.</span>
          </h1>
          <p className="body" style={{ margin: "24px auto 0", maxWidth: "700px", color: "var(--ink-soft)", fontSize: "1.15rem", lineHeight: "1.6" }}>
            Démocratiser l’IA et révéler une nouvelle génération de créateurs.
            Des parcours immersifs conçus pour vous apprendre à créer des solutions concrètes grâce au Vibe Coding et à l&apos;IA générative, sans aucun prérequis en programmation.
          </p>
          <div className="cluster" style={{ justifyContent: "center", marginTop: "24px", gap: "16px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
              <Calendar size={16} style={{ color: "var(--green-lt)" }} /> Samedi 11 Juillet 2026
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
              <MapPin size={16} style={{ color: "var(--green-lt)" }} /> CSCTICAO, Abidjan
            </span>
          </div>
        </header>

        {/* Section 1 : Contexte & Enjeux */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{
            background: "rgba(16, 23, 26, 0.4)",
            border: "1px solid var(--line)",
            borderRadius: "24px",
            padding: "40px",
            backdropFilter: "blur(8px)",
          }}>
            <h2 className="display" style={{ fontSize: "2rem", marginBottom: "20px", color: "var(--ink)" }}>
              Pourquoi se former ?
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              marginTop: "30px"
            }}>
              <div>
                <h4 style={{ color: "var(--pink-lt)", fontWeight: "600", marginBottom: "8px" }}>Les Défis à relever</h4>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  L&apos;accès à la formation pratique en IA reste souvent limité. Beaucoup perçoivent encore l&apos;intelligence artificielle comme une technologie complexe réservée aux seuls experts, ce qui freine l&apos;appropriation des outils numériques.
                </p>
              </div>
              <div>
                <h4 style={{ color: "var(--green-lt)", fontWeight: "600", marginBottom: "8px" }}>La Méthode Vibe Coding</h4>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  Nous levons cette barrière. Le Vibe Coding permet de concevoir des applications entières en décrivant simplement vos idées en langage naturel. Vous n&apos;apprenez pas la syntaxe du code, vous apprenez à guider l&apos;IA pour créer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 : Le Programme en détail */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Le Programme d&apos;Immersion</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Une alternance rythmée entre apprentissage théorique et ateliers pratiques</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            maxWidth: "1000px",
            margin: "0 auto"
          }}>
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="surface" 
                style={{ 
                  padding: "30px", 
                  borderRadius: "20px", 
                  background: "rgba(16, 23, 26, 0.6)",
                  border: "1px solid var(--line)"
                }}
              >
                <div style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "var(--grad-1d)", 
                  color: "var(--green-lt)",
                  marginBottom: "20px"
                }}>
                  {feature.icon}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "700" }}>{feature.title}</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--purple-lt)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {feature.duration}
                  </span>
                </div>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 : Objectifs pédagogiques */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Nos Objectifs</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Ce que vous saurez accomplir à l&apos;issue de la formation</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "30px",
            maxWidth: "1000px",
            margin: "0 auto"
          }}>
            {objectives.map((obj, i) => (
              <div key={i} style={{ textAlign: "center", padding: "10px" }}>
                <div style={{ 
                  margin: "0 auto 16px",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  background: "rgba(7, 133, 29, 0.08)",
                  border: "1px solid rgba(117, 255, 141, 0.15)"
                }}>
                  {obj.icon}
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "8px", color: "var(--ink)" }}>{obj.title}</h4>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", lineHeight: "1.5" }}>{obj.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 : Public Cible */}
        <section style={{ 
          maxWidth: "800px", 
          margin: "0 auto 40px",
          background: "linear-gradient(135deg, rgba(131, 46, 220, 0.12) 0%, rgba(255, 87, 227, 0.04) 100%)",
          border: "1px solid rgba(186, 119, 255, 0.15)",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center"
        }}>
          <div style={{ display: "inline-flex", color: "var(--purple-lt)", marginBottom: "16px" }}>
            <Users size={32} />
          </div>
          <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Qui peut s&apos;inscrire ?</h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: "580px", margin: "0 auto 30px", fontSize: "0.95rem" }}>
            Cette journée de formation est ouverte à toute personne curieuse et motivée, sans distinction de niveau technique.
          </p>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
            gap: "16px",
            textAlign: "left"
          }}>
            {targets.map((target, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ 
                  width: "6px", 
                  height: "6px", 
                  borderRadius: "50%", 
                  background: "var(--pink-lt)", 
                  marginTop: "8px", 
                  flexShrink: 0 
                }} />
                <span style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: "1.4" }}>{target}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 : Grille des Tarifs & Offres */}
        <section style={{ marginBottom: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Réservez votre pass formation</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Choisissez la formule adaptée à votre profil</p>
          </div>
          
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
                  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                  ["--cat" as string]: course.color,
                }}
              >
                <div className="ticket-bar" style={{ backgroundColor: course.color, position: "absolute", top: 0, left: 0, right: 0, height: "4px" }} />
                
                <h3 style={{ color: course.color, fontSize: "1.6rem", fontWeight: "700", marginBottom: "10px" }}>
                  {course.title}
                </h3>
                
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", minHeight: "40px", marginBottom: "20px" }}>
                  {course.tagline}
                </p>
                
                <div style={{ display: "flex", alignItems: "baseline", marginBottom: "20px" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: "900", fontFamily: "Outfit, sans-serif" }}>
                    {course.price}
                  </span>
                  {course.price !== "Gratuit" && (
                    <span style={{ fontSize: "1rem", color: "var(--ink-faint)", marginLeft: "6px" }}>
                      FCFA
                    </span>
                  )}
                </div>
                
                <p className="body" style={{ fontSize: "0.95rem", color: "var(--ink)", marginBottom: "30px", minHeight: "60px", lineHeight: "1.5" }}>
                  {course.description}
                </p>
                
                <ul className="ticket-list" style={{ listStyle: "none", padding: 0, margin: "0 0 40px", flex: 1 }}>
                  {course.perks.map((perk, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", margin: "14px 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                      <Check size={16} style={{ color: course.color, marginTop: "3px", flexShrink: 0 }} />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={course.link}
                  className="btn btn-grad btn-block"
                  target={course.link.startsWith("http") ? "_blank" : undefined}
                  rel={course.link.startsWith("http") ? "noopener noreferrer" : undefined}
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
        </section>

      </main>
    </div>
  );
}
