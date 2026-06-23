import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  Clock, 
  Users, 
  Cpu, 
  Coffee, 
  Utensils, 
  Mic, 
  Terminal, 
  Trophy, 
  Calendar, 
  MapPin, 
  Brain, 
  Sparkles, 
  GraduationCap, 
  Layers,
  Play
} from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { 
  title: "Le Programme Officiel · VIBEATHON 2026",
  description: "Découvrez le déroulé de la journée du VIBEATHON 2026. Suivez le parcours de la compétition de vibecoding et les activités parallèles ouvertes aux visiteurs."
};

export default function ProgrammePage() {
  const passes = [
    {
      title: "Pass Visiteur",
      tagline: "Vivez l'expérience VIBEATHON",
      price: "Gratuit",
      description: "Pour les passionnés de tech, professionnels ou curieux qui souhaitent assister aux conférences, participer aux ateliers et découvrir les innovations.",
      perks: [
        "Accès aux Keynotes & Panels d'experts",
        "Accès libre aux Ateliers de formation pratique",
        "Accès aux Studios d'expérience (Photo & Musique IA)",
        "Accès à la plénière pour les pitchs finaux",
        "Opportunités de réseautage (Networking)",
        "Badge d'accès visiteur officiel",
      ],
      link: "/billet?type=visiteur",
      color: "#75FF8D", // Green accent
    },
    {
      title: "Pass Hackathon",
      tagline: "Participez en tant que compétiteur",
      price: "5 000",
      description: "Pour les créateurs, designers et porteurs de projet qui souhaitent concevoir une solution en équipe de 5 et la défendre devant le jury.",
      perks: [
        "Participation à la compétition de Vibecoding",
        "Accès complet aux outils et à la plateforme",
        "Encadrement par des mentors & coaches experts",
        "Repas & rafraîchissements inclus (jour J)",
        "Éligibilité aux prix (jusqu'à 500 000 FCFA)",
        "Certificat officiel de participation",
      ],
      link: "/billet?type=formation_adulte", // Using formation_adulte or custom type
      color: "#BA77FF", // Purple accent
    },
  ];

  const objectives = [
    {
      icon: <Users size={24} className="text-mint" />,
      title: "S'accréditer & S'installer",
      desc: "Dès 07h30, accueil des participants, contrôle des accès, distribution des badges QR sécurisés et installation des équipes à leurs tables.",
    },
    {
      icon: <Mic size={24} className="text-mint" />,
      title: "S'inspirer & Échanger",
      desc: "Assister aux keynotes d'ouverture et au panel stratégique sur l'avenir de l'IA, de l'éco-conception et de l'innovation numérique.",
    },
    {
      icon: <Cpu size={24} className="text-mint" />,
      title: "Se former & Vibecoder",
      desc: "Se former au Vibecoding en langage naturel puis concevoir une application fonctionnelle avec l'IA, sans prérequis technique.",
    },
    {
      icon: <Trophy size={24} className="text-mint" />,
      title: "Pitcher & Briller",
      desc: "Présenter son projet devant un jury d'experts et le public lors de la plénière de clôture et remporter l'un des 3 prix officiels.",
    },
  ];

  const phases = [
    {
      title: "Phase 1 : Inspiration",
      duration: "07h30 – 11h00",
      desc: "Accueil à 07h30 avec café et networking. Cérémonie d'ouverture à 09h00 suivie de keynotes inspirantes et du panel sur la souveraineté numérique et l'IA en Afrique.",
      icon: <Mic size={20} />,
    },
    {
      title: "Phase 2 : Hackathon",
      duration: "11h00 – 17h30",
      desc: "Installation des compétiteurs, puis formation initiale au Vibecoding à 11h30. De 14h00 à 17h30, hackathon intensif en équipe de 5 avec l'encadrement des coaches.",
      icon: <Terminal size={20} />,
    },
    {
      title: "Phase 3 : Délibération",
      duration: "17h30 – 19h30",
      desc: "Restitution publique et pitchs des 10 équipes finalistes devant le jury à 17h30. Remise officielle des prix (1er, 2e, 3e prix) et cérémonie de clôture à 18h30.",
      icon: <Trophy size={20} />,
    },
  ];

  const targets = [
    "Compétiteurs sélectionnés (individuels ou en équipes de 5)",
    "Visiteurs curieux de découvrir les technologies d'IA générative",
    "Professionnels et recruteurs en quête de nouveaux talents tech",
    "Partenaires, sponsors et journalistes de l'écosystème numérique"
  ];

  const timelineSlots = [
    { time: "07h30 – 09h00", title: "Accueil & Accréditation", plenary: "Distribution des badges QR et installation.", parallel: "Café d'accueil & Networking.", icon: <Users size={16} /> },
    { time: "09h00 – 11h00", title: "Ouverture & Panel IA", plenary: "Keynotes inspirantes & table ronde stratégique.", icon: <Mic size={16} /> },
    { time: "11h00 – 11h30", title: "Pause & Préparation", plenary: "Attribution des tables de travail.", parallel: "Networking dans le hall.", icon: <Coffee size={16} /> },
    { time: "11h30 – 13h00", title: "Formation Vibecoding", plenary: "Tutoriel intensif de création d'applications sans coder.", parallel: "Ouverture des Ateliers & Studios IA.", icon: <Cpu size={16} /> },
    { time: "13h00 – 14h00", title: "Pause Déjeuner", plenary: "Repas complet des équipes & coaches.", parallel: "Networking & Démonstrations.", icon: <Utensils size={16} /> },
    { time: "14h00 – 17h30", title: "Compétition de Vibecoding", plenary: "Rush de développement de 3h30 avec les mentors.", parallel: "Ateliers pratiques & Studios IA.", icon: <Terminal size={16} /> },
    { time: "17h30 – 18h30", title: "Pitchs des Finalistes", plenary: "Présentation des 10 meilleurs projets (3 min par équipe).", icon: <Play size={16} /> },
    { time: "18h30 – 19h30", title: "Remise des Prix & Clôture", plenary: "Délibérations, annonce des lauréats et clôture officielle.", icon: <Trophy size={16} /> }
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
            DÉROULÉ DE LA JOURNÉE · VIBEATHON 2026
          </span>
          <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 64px)", marginTop: "12px", lineHeight: "1.1" }}>
            Le <span className="grad-text-lt">Programme.</span>
          </h1>
          <p className="body" style={{ margin: "24px auto 0", maxWidth: "700px", color: "var(--ink-soft)", fontSize: "1.15rem", lineHeight: "1.6" }}>
            Suivez le rythme d&apos;une journée d&apos;apprentissage, d&apos;action et de réseautage. 
            Découvrez ci-dessous le déroulement heure par heure ainsi que l&apos;accès à nos activités plénières et parallèles.
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

        {/* Section 1 : Contexte du Programme */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{
            background: "rgba(16, 23, 26, 0.4)",
            border: "1px solid var(--line)",
            borderRadius: "24px",
            padding: "40px",
            backdropFilter: "blur(8px)",
          }}>
            <h2 className="display" style={{ fontSize: "2rem", marginBottom: "20px", color: "var(--ink)" }}>
              Une journée, deux parcours
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              marginTop: "30px"
            }}>
              <div>
                <h4 style={{ color: "var(--pink-lt)", fontWeight: "600", marginBottom: "8px" }}>Plénière &amp; Compétition</h4>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  Réservée aux 100 compétiteurs sélectionnés. Elle comprend l&apos;installation matérielle, la formation au Vibe Coding, le rush de développement en équipe, l&apos;encadrement par les coaches et les présentations de projets.
                </p>
              </div>
              <div>
                <h4 style={{ color: "var(--green-lt)", fontWeight: "600", marginBottom: "8px" }}>Activités Parallèles &amp; Visiteurs</h4>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  Ouvertes à tous les visiteurs. Elle propose une série d&apos;ateliers thématiques interactifs pour apprendre à utiliser l&apos;IA générative et l&apos;accès libre aux Studios immersifs (Photo &amp; Musique IA).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 : Les Grandes Phases */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Les Grandes Phases du Programme</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Une organisation fluide conçue pour maximiser l&apos;apprentissage et la création</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            maxWidth: "1000px",
            margin: "0 auto"
          }}>
            {phases.map((phase, i) => (
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
                  color: "var(--purple-lt)",
                  marginBottom: "20px"
                }}>
                  {phase.icon}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "700" }}>{phase.title}</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--purple-lt)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {phase.duration}
                  </span>
                </div>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 : Déroulé Chronologique Détaillé */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Déroulé Heure par Heure</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>La chronologie complète du Samedi 11 Juillet 2026</p>
          </div>

          <div className="surface" style={{ maxWidth: "800px", margin: "0 auto", padding: "10px 0", overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: "100%", margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "24px", width: "180px" }}>Horaire</th>
                    <th>Activité</th>
                    <th style={{ paddingRight: "24px" }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineSlots.map((slot, index) => (
                    <tr key={index} style={{ borderLeft: `3px solid ${index % 2 === 0 ? "var(--purple-lt)" : "var(--green-lt)"}` }}>
                      <td style={{ paddingLeft: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: "#fff" }}>
                          <Clock size={14} style={{ color: "var(--purple-lt)" }} />
                          <span>{slot.time}</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#fff" }}>{slot.title}</strong>
                      </td>
                      <td style={{ paddingRight: "24px", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                        <div>{slot.plenary}</div>
                        {slot.parallel && (
                          <div style={{ fontSize: "0.8rem", color: "var(--green-lt)", marginTop: "2px" }}>
                            Parallèle : {slot.parallel}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4 : Objectifs pédagogiques */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Nos Objectifs de la Journée</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Ce que nous visons à accomplir ensemble</p>
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
          margin: "0 auto 80px",
          background: "linear-gradient(135deg, rgba(131, 46, 220, 0.12) 0%, rgba(255, 87, 227, 0.04) 100%)",
          border: "1px solid rgba(186, 119, 255, 0.15)",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center"
        }}>
          <div style={{ display: "inline-flex", color: "var(--purple-lt)", marginBottom: "16px" }}>
            <Users size={32} />
          </div>
          <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Qui peut participer ?</h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: "580px", margin: "0 auto 30px", fontSize: "0.95rem" }}>
            Le VIBEATHON est un événement fédérateur accueillant divers profils selon leurs envies et statuts.
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

        {/* Section 6 : Grille des Tarifs & Offres */}
        <section style={{ marginBottom: "60px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Réservez votre pass</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Choisissez la formule adaptée à votre participation</p>
          </div>
          
          <div className="ticket-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
            gap: "30px", 
            maxWidth: "960px", 
            margin: "0 auto" 
          }}>
            {passes.map((course) => (
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
                  <span style={{ fontSize: "1rem", color: "var(--ink-faint)", marginLeft: "6px" }}>
                    FCFA
                  </span>
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  Réserver mon pass <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
