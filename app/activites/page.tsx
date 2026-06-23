import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  Users, 
  Cpu, 
  Mic, 
  Terminal, 
  Trophy, 
  Calendar, 
  MapPin, 
  Brain, 
  Sparkles, 
  BookOpen,
  Target,
  ArrowUpRight
} from "lucide-react";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { getSiteContent, get } from "@/lib/site-content";

export const metadata: Metadata = { 
  title: "Nos Activités · VIBEATHON 2026",
  description: "Découvrez l'ensemble des activités de VIBEATHON 2026 : keynotes inspirantes, panels d'experts, ateliers pratiques de formation, studios immersifs et compétition de vibecoding."
};

export default async function ActivitiesPage() {
  const c = await getSiteContent();

  const getIcon = (index: number) => {
    switch (index) {
      case 1: return <Mic size={20} />;
      case 2: return <Terminal size={20} />;
      case 3: return <BookOpen size={20} />;
      case 4: return <Sparkles size={20} />;
      case 5: return <Users size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const getBgColor = (index: number) => {
    switch (index) {
      case 1: return "rgba(0, 229, 255, 0.1)";
      case 2: return "rgba(255, 87, 227, 0.1)";
      case 3: return "rgba(186, 119, 255, 0.1)";
      case 4: return "rgba(245, 200, 66, 0.1)";
      case 5: return "rgba(117, 255, 141, 0.1)";
      default: return "rgba(255, 255, 255, 0.05)";
    }
  };

  const getTextColor = (index: number) => {
    switch (index) {
      case 1: return "#00E5FF";
      case 2: return "#FF57E3";
      case 3: return "#BA77FF";
      case 4: return "#F5C842";
      case 5: return "#75FF8D";
      default: return "#fff";
    }
  };

  const activities = [1, 2, 3, 4, 5].map((n) => ({
    number: String(n).padStart(2, "0"),
    title: get(c, `activities.${n}.title`),
    desc: get(c, `activities.${n}.desc`),
    icon: getIcon(n),
    textColor: getTextColor(n)
  })).filter((a) => a.title);

  const objectives = [
    {
      icon: <Brain size={24} className="text-mint" />,
      title: "Sensibiliser & Former",
      desc: "Comprendre de façon pratique les outils de l'intelligence artificielle générative et son potentiel d'innovation.",
    },
    {
      icon: <Cpu size={24} className="text-mint" />,
      title: "Expérimenter l'IA",
      desc: "Toucher du doigt l'IA créative dans des espaces immersifs de génération d'images et de composition musicale.",
    },
    {
      icon: <Target size={24} className="text-mint" />,
      title: "Résoudre & Co-créer",
      desc: "Concevoir collectivement des solutions environnementales concrètes adaptées aux problématiques locales.",
    },
    {
      icon: <Sparkles size={24} className="text-mint" />,
      title: "Valoriser les Talents",
      desc: "Donner la parole aux esprits créatifs, aux profils non-techniques, aux femmes et aux jeunes de l'écosystème.",
    },
  ];

  const targets = [
    "Étudiants et jeunes diplômés désireux de s'initier aux outils d'IA",
    "Professionnels et décideurs souhaitant comprendre l'impact de l'IA",
    "Créateurs de contenus, artistes et curieux d'expérimentation sensorielle",
    "Compétiteurs engagés dans la création de prototypes écologiques"
  ];

  const passes = [
    {
      title: "Pass Visiteur",
      tagline: "Vivez l'événement en spectateur",
      price: "Gratuit",
      description: "Pour assister aux conférences, participer aux ateliers pratiques et découvrir les démonstrations dans les studios IA.",
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
      description: "Pour intégrer une équipe de 5, concevoir un prototype d'application avec l'IA et concourir devant le jury d'honneur.",
      perks: [
        "Participation à la compétition de Vibecoding",
        "Accès complet aux outils et à la plateforme",
        "Encadrement par des mentors & coaches experts",
        "Repas & rafraîchissements inclus (jour J)",
        "Éligibilité aux prix (jusqu'à 500 000 FCFA)",
        "Certificat officiel de participation",
      ],
      link: "/billet?type=formation_adulte",
      color: "#BA77FF", // Purple accent
    },
  ];

  const quantitativeResults = [
    { value: "300", label: "Participants Mobilisés" },
    { value: "100", label: "Compétiteurs Formés" },
    { value: "20", label: "Solutions Développées" },
    { value: "03", label: "Projets Primés" },
    { value: "200+", label: "Personnes Sensibilisées" }
  ];

  const qualitativeResults = [
    "Montée en compétences : compréhension pratique de l'IA et de ses usages.",
    "Changement de perception : une IA perçue comme accessible à tous sans barrière technique.",
    "Inclusion numérique : ouverture de la création digitale aux profils non-techniciens.",
    "Innovation locale : émergence de solutions concrètes adaptées au contexte ivoirien.",
    "Dynamique écosystémique : nouvelles connexions entre talents, entreprises et institutions."
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
            NOTRE PROGRAMME D&apos;ACTIVITÉS · VIBEATHON 2026
          </span>
          <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 64px)", marginTop: "12px", lineHeight: "1.1" }}>
            Les <span className="grad-text-lt">Activités.</span>
          </h1>
          <p className="body" style={{ margin: "24px auto 0", maxWidth: "700px", color: "var(--ink-soft)", fontSize: "1.15rem", lineHeight: "1.6" }}>
            Découvrez nos activités interactives et nos espaces d&apos;expérimentation de l&apos;intelligence artificielle. 
            Qu&apos;il s&apos;agisse de conférences d&apos;inspiration, d&apos;ateliers pratiques ou d&apos;un hackathon intense, trouvez le parcours qui vous correspond.
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

        {/* Section 1 : Contexte et Défis (Enrichi TdR) */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{
            background: "rgba(16, 23, 26, 0.4)",
            border: "1px solid var(--line)",
            borderRadius: "24px",
            padding: "40px",
            backdropFilter: "blur(8px)",
          }}>
            <h2 className="display" style={{ fontSize: "2rem", marginBottom: "20px", color: "var(--ink)" }}>
              Le Contexte &amp; Les Défis
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "35px",
              marginTop: "30px"
            }}>
              <div>
                <h4 style={{ color: "var(--pink-lt)", fontWeight: "600", marginBottom: "12px", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Plusieurs défis persistent</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--pink-lt)" }}>•</span>
                    <span>Accès limité à la formation pratique en intelligence artificielle.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--pink-lt)" }}>•</span>
                    <span>Perception de l&apos;IA comme une technologie complexe réservée aux experts.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--pink-lt)" }}>•</span>
                    <span>Faible appropriation des outils numériques avancés par le grand public.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: "var(--green-lt)", fontWeight: "600", marginBottom: "12px", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Nos Impératifs d&apos;Action</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--green-lt)" }}>•</span>
                    <span><strong>Démocratiser</strong> l&apos;accès à l&apos;IA et vulgariser ses applications concrètes.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--green-lt)" }}>•</span>
                    <span><strong>Offrir des espaces</strong> d&apos;expérimentation sensoriels et immersifs.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--green-lt)" }}>•</span>
                    <span><strong>Encourager l&apos;innovation</strong> locale adaptée au contexte ivoirien.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 : Grille des Activités Dynamiques du CMS */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Les Cinq Façons de Participer</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Des expériences diversifiées et complémentaires pour tous les profils</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            maxWidth: "1000px",
            margin: "0 auto"
          }}>
            {activities.map((act, i) => (
              <div 
                key={i} 
                className="surface" 
                style={{ 
                  padding: "30px", 
                  borderRadius: "20px", 
                  background: "rgba(16, 23, 26, 0.6)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    background: "var(--grad-1d)", 
                    color: act.textColor,
                    marginBottom: "20px"
                  }}>
                    {act.icon}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: "700" }}>{act.title}</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--purple-lt)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Activité {act.number}
                    </span>
                  </div>
                  <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                    {act.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 : Objectifs Pédagogiques */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Nos Objectifs</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>L&apos;impact concret que nous souhaitons générer</p>
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

        {/* Section 4 : Résultats Attendus (Enrichi TdR) */}
        <section style={{ marginBottom: "90px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Les Résultats Attendus</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Des indicateurs clairs de réussite à l&apos;échelle nationale</p>
          </div>

          {/* Quantitative Metrics */}
          <div className="metric-grid" style={{ maxWidth: "1000px", margin: "0 auto 40px" }}>
            {quantitativeResults.map((metric, i) => (
              <div key={i} className="metric-card">
                <span>{metric.label}</span>
                <strong style={{ color: "var(--green-lt)" }}>{metric.value}</strong>
              </div>
            ))}
          </div>

          {/* Qualitative Impact List */}
          <div className="surface" style={{ maxWidth: "800px", margin: "0 auto", padding: "30px" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "20px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowUpRight size={18} style={{ color: "var(--purple-lt)" }} /> Impacts qualitatifs à long terme
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {qualitativeResults.map((res, i) => (
                <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: "1.5" }}>
                  <Check size={16} style={{ color: "var(--purple-lt)", marginTop: "3px", flexShrink: 0 }} />
                  <span>{res}</span>
                </li>
              ))}
            </ul>
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
          <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Qui peut y assister ?</h2>
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
            <h2 className="display" style={{ fontSize: "2.2rem" }}>Prenez votre accès d&apos;activité</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "8px" }}>Sélectionnez la formule adaptée à votre projet</p>
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
