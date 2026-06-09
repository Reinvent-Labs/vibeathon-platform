import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SiteNav } from "@/components/public/SiteNav";
import { EVENT, JUDGING_CRITERIA } from "@/lib/constants";

const activities = [
  ["01", "Keynotes", "Des voix qui inspirent : visionnaires de la tech africaine et experts de l'IA."],
  ["02", "Compétition du Vibecoding", "100 compétiteurs, une journée pour concevoir une solution IA à fort impact environnemental."],
  ["03", "Ateliers de formation", "Six sessions pratiques pour maîtriser les outils du vibecoding et les bonnes pratiques de l'IA."],
  ["04", "Studio d'expérience IA", "Deux espaces immersifs, photo et musique, pour expérimenter l'IA créative."],
  ["05", "Panels", "Débats croisés entre acteurs de la tech, de l'environnement et de l'entrepreneuriat."],
] as const;

const schedule = [
  ["07:30", "Accueil des participants", "Café, networking et remise des badges."],
  ["09:00", "Keynotes d'ouverture", "Lancement officiel et interventions inspirantes."],
  ["10:30", "Panels", "IA, environnement et innovation inclusive."],
  ["12:00", "Déjeuner & networking", ""],
  ["13:30", "Compétition vibecoding", "Le grand sprint créatif démarre, avec ateliers et Studio IA en parallèle."],
  ["17:30", "Pitch des 10 finalistes", "Les meilleurs projets passent devant le jury."],
  ["19:00", "Remise des prix & clôture", "Célébration des lauréats et photo de groupe."],
] as const;

export default function HomePage() {
  return (
    <>
      <SiteNav />

      <header className="hero-home">
        <div className="ring" />
        <div className="mesh" aria-hidden="true">
          <span className="blob-g" />
          <span className="blob-p" />
          <span className="blob-k" />
          <span className="blob-m" />
        </div>
        <div className="grain" />
        <div className="vignette" />
        <div className="chip-float cf1"><span className="ic" style={{ background: "#75FF8D" }} /> Keynotes</div>
        <div className="chip-float cf2"><span className="ic" style={{ background: "#BA77FF" }} /> Compétition Vibecoding</div>
        <div className="chip-float cf3"><span className="ic" style={{ background: "#FF57E3" }} /> Studio IA</div>
        <div className="chip-float cf4"><span className="ic" style={{ background: "#82C880" }} /> 6 Ateliers</div>

        <div className="eyebrow-pill"><span className="tag">2026</span> IA × Environnement · Abidjan</div>
        <h1 className="display">Pense. Crée.<br /><span className="shine">Lance.</span></h1>
        <p className="sub">
          Intelligence artificielle et environnement : innover pour un avenir
          durable et inclusif. Créer, sans coder, avec l&apos;IA.
        </p>
        <div className="pill-date"><span className="dot" /> {EVENT.date} · {EVENT.venue}</div>
        <div className="cta-row">
          <Link href="/candidature" className="btn btn-grad">
            Je candidate <ArrowRight size={18} />
          </Link>
          <Link href="#programme" className="btn btn-ghost">Découvrir le programme</Link>
        </div>
        <div className="hero-stats wrap">
          {[
            ["400", "Participants"],
            ["100", "Compétiteurs"],
            ["20", "Solutions"],
            ["3", "Lauréats primés"],
          ].map(([value, label]) => (
            <div className="st" key={label}>
              <b className="grad-text-lt">{value}</b><span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main>
        <section id="concept" className="sec-pad">
          <div className="wrap concept">
            <div>
              <span className="eyebrow">Le concept</span>
              <p className="lead">Le vibecoding, c&apos;est créer sans coder, en dialoguant avec l&apos;IA.</p>
              <p className="body">
                VIBEATHON réunit étudiants, jeunes diplômés, entrepreneurs et
                professionnels autour d&apos;un même pari : transformer une idée en
                solution concrète en une seule journée.
              </p>
            </div>
            <div className="grad-border quote">
              <div className="mark">&ldquo;</div>
              <p>Pas besoin d&apos;être développeur. Il suffit de penser, décrire et laisser l&apos;IA construire.</p>
            </div>
          </div>
        </section>

        <section id="activites" className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Au programme</span>
              <h2 className="display">Cinq façons<br />de vibrer.</h2>
            </div>
            <div className="act-grid">
              {activities.map(([number, title, description], index) => (
                <article className={`act-card ${index === 1 || index === 4 ? "wide" : ""}`} key={number}>
                  <div className="swatch" style={{ background: index % 2 ? "var(--grad-lt)" : "var(--grad-1)" }} />
                  <div className="num">{number}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="programme" className="sec-pad">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Le jour J · 11 juillet</span>
              <h2 className="display">Déroulé de<br />la journée.</h2>
            </div>
            <div className="timeline">
              {schedule.map(([time, title, description]) => (
                <div className="tl-row" key={time}>
                  <div className="time">{time}</div><div className="dot" />
                  <div className="body"><h4>{title}</h4>{description ? <p>{description}</p> : null}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="prix" className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Récompenses</span>
              <h2 className="display">Plus qu&apos;un prix,<br />un tremplin.</h2>
            </div>
            <div className="prize-grid">
              {[
                ["1er prix", "1 000 000"],
                ["2e prix", "500 000"],
                ["3e prix", "300 000"],
              ].map(([rank, amount], index) => (
                <div className={`prize ${index === 0 ? "gold" : ""}`} key={rank}>
                  <div className="rank">{rank}</div>
                  <div className={`amt ${index === 0 ? "grad-text-lt" : ""}`}>{amount}<small>FCFA</small></div>
                </div>
              ))}
            </div>
            <div className="perks">
              <div className="perk"><b className="grad-text">90 jours</b> d&apos;incubation pour les 3 lauréats.</div>
              <div className="perk"><b className="grad-text">30 jours</b> d&apos;accompagnement pour les 5 finalistes.</div>
              <div className="perk"><b className="grad-text">1 journée</b> avec un champion de la tech ivoirienne.</div>
            </div>
          </div>
        </section>

        <section className="sec-pad">
          <div className="wrap criteria">
            <div>
              <span className="eyebrow">Le jury évalue</span>
              <h2 className="display" style={{ fontSize: "clamp(36px,4.5vw,64px)", marginTop: 18 }}>Comment<br />on est noté.</h2>
            </div>
            <div>
              {JUDGING_CRITERIA.map((criterion) => (
                <div className="crit-row" key={criterion.id}>
                  <div className="lab"><span className="name">{criterion.name}</span><span className="pct grad-text-lt">{criterion.weight}%</span></div>
                  <div className="bar"><i style={{ width: `${(criterion.weight / 30) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap">
            <div className="section-head"><span className="eyebrow">Pour qui ?</span><h2 className="display">Ouvert à tous<br />les bâtisseurs.</h2></div>
            <div className="aud-row">
              {["Étudiants", "Jeunes diplômés", "Entrepreneurs", "Professionnels"].map((audience) => <div className="aud-chip" key={audience}>{audience}</div>)}
            </div>
          </div>
        </section>

        <section className="sec-pad">
          <div className="wrap">
            <div className="final-cta">
              <div className="mesh" aria-hidden="true"><span className="blob-g" /><span className="blob-p" /><span className="blob-k" /><span className="blob-m" /></div>
              <h2 className="display">Prêt à <span className="grad-text-lt">lancer</span> ?</h2>
              <div className="cta-row">
                <Link href="/candidature" className="btn btn-grad">Je candidate <ArrowRight size={18} /></Link>
                <Link href="/statut" className="btn btn-ghost">Vérifier mon statut</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <Logo size={170} />
              <p>Créer avec l&apos;IA pour un avenir durable et inclusif.</p>
            </div>
            <nav className="foot-links" aria-label="Navigation de pied de page">
              <Link href="#concept">Concept</Link>
              <Link href="#programme">Programme</Link>
              <Link href="/candidature">Candidature</Link>
              <Link href="/statut">Mon statut</Link>
            </nav>
          </div>
          <div className="foot-bottom">
            <span className="copy">© 2026 VIBEATHON · vibeathonci.com</span>
            <a className="copy foot-contact" href="mailto:contact@vibeathonci.com">
              contact@vibeathonci.com
            </a>
            <span className="copy foot-event">{EVENT.date} · {EVENT.venue}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
