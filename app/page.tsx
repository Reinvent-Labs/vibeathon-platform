import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SiteNav } from "@/components/public/SiteNav";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { JUDGING_CRITERIA, REGISTRATIONS_CLOSED, REGISTRATIONS_CLOSED_COPY } from "@/lib/constants";
import { CATEGORIES, formatFee } from "@/lib/categories";
import { getSiteContent, get, getList } from "@/lib/site-content";
import { Countdown } from "@/components/public/Countdown";
export default async function HomePage() {
  const c = await getSiteContent();

  const scheduleCount = Math.min(9, Math.max(1, Number(c["schedule.count"]) || 7));
  const scheduleItems = Array.from({ length: scheduleCount }, (_, i) => ({
    time: get(c, `schedule.${i + 1}.time`),
    title: get(c, `schedule.${i + 1}.title`),
    desc: get(c, `schedule.${i + 1}.desc`),
  })).filter((item) => item.title);

  const activities = [1, 2, 3, 4, 5].map((n) => ({
    number: String(n).padStart(2, "0"),
    title: get(c, `activities.${n}.title`),
    desc: get(c, `activities.${n}.desc`),
  })).filter((a) => a.title);

  const openTickets = [
    {
      value: "VISITEUR",
      label: get(c, "category.visiteur.label", CATEGORIES.VISITEUR.label),
      tagline: get(c, "category.visiteur.tagline", CATEGORIES.VISITEUR.tagline),
      perks: getList(c, "category.visiteur.perks", CATEGORIES.VISITEUR.perks),
      fee: Number(c["category.visiteur.fee"] ?? "0") || 0,
      color: CATEGORIES.VISITEUR.color,
      slug: CATEGORIES.VISITEUR.slug,
    },
  ];

  const audienceMembers = getList(c, "audience.members", [
    "Étudiants",
    "Jeunes diplômés",
    "Entrepreneurs",
    "Professionnels",
  ]);

  const prizes = [
    { rank: get(c, "prizes.first.label", "1er prix"), amount: get(c, "prizes.first", "1 000 000"), gold: true },
    { rank: get(c, "prizes.second.label", "2e prix"), amount: get(c, "prizes.second", "500 000"), gold: false },
    { rank: get(c, "prizes.third.label", "3e prix"), amount: get(c, "prizes.third", "300 000"), gold: false },
  ];

  const perks = [
    get(c, "prizes.perk.1", "Bootcamp de 3 jours : Initiation au Vibe Coding et préparation au pitch."),
    get(c, "prizes.perk.2", "Mentorat & Accompagnement pour transformer votre idée en startup."),
    get(c, "prizes.perk.3", "Opportunités d'incubation et accès à des investisseurs stratégiques."),
  ];

  const activityColors = ["#75FF8D", "#BA77FF", "#FF57E3", "#82C880", "#C084FC"];

  return (
    <>
      <SiteNav />

      {/* ── HERO ─────────────────────────────────────────────────── */}
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

        <div className="eyebrow-pill"><span className="tag">2026</span> {get(c, "hero.eyebrow")}</div>
        <h1 className="display">
          {(() => {
            const tagline = get(c, "hero.tagline", "Pense. Crée. Lance.");
            const words = tagline.split(" ");
            const last = words.pop();
            return <>{words.join(" ")}<br /><span className="shine">{last}</span></>;
          })()}
        </h1>
        <p className="sub">{get(c, "hero.subtitle")}</p>
        <Countdown />
        <div className="pill-date"><span className="dot" /> {get(c, "hero.date")} · {get(c, "hero.venue")}</div>
        <div className="cta-row">
          {/* The primary call to action invited sign-ups, so it is dropped once
              the edition is over rather than leading to a closed form. */}
          {REGISTRATIONS_CLOSED ? null : (
            <Link href="#billets" className="btn btn-grad">
              {get(c, "hero.cta.primary", "Prendre mon pass")} <ArrowRight size={18} />
            </Link>
          )}
          <Link href="#programme" className="btn btn-ghost">{get(c, "hero.cta.secondary", "Découvrir le programme")}</Link>
        </div>
        <div className="hero-stats wrap">
          {[
            [get(c, "stats.participants", "400"), get(c, "stats.participants.label", "Participants")],
            [get(c, "stats.competitors", "100"), get(c, "stats.competitors.label", "Compétiteurs")],
            [get(c, "stats.solutions", "20"), get(c, "stats.solutions.label", "Solutions")],
            [get(c, "stats.winners", "3"), get(c, "stats.winners.label", "Lauréats primés")],
          ].map(([value, label]) => (
            <div className="st" key={label}>
              <b className="grad-text-lt">{value}</b><span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main>

        {/* ── CONCEPT ─────────────────────────────────────────────── */}
        <section id="concept" className="sec-pad">
          <div className="wrap concept">
            <div data-reveal="left">
              <span className="eyebrow">{get(c, "concept.eyebrow", "Le concept")}</span>
              <p className="lead">{get(c, "concept.lead")}</p>
              <p className="body">{get(c, "concept.body")}</p>
            </div>
            <div className="grad-border quote" data-reveal="right">
              <div className="mark">&ldquo;</div>
              <q>{get(c, "concept.quote")}</q>
            </div>
          </div>
        </section>

        {/* ── ACTIVITIES ──────────────────────────────────────────── */}
        {activities.length > 0 && (
          <section id="activites" className="sec-pad" style={{ background: "var(--bg-0)" }}>
            <div className="wrap">
              <div className="section-head" data-reveal>
                <span className="eyebrow">{get(c, "activities.eyebrow", "Au programme")}</span>
                <h2 className="display">{get(c, "activities.title", "Cinq façons de vibrer.")}</h2>
              </div>
              <div className="act-grid" data-stagger>
                {activities.map(({ number, title, desc }, i) => (
                  <article
                    className={`act-card${i === 0 ? " wide" : ""}`}
                    key={number}
                    data-reveal="scale"
                  >
                    <div className="swatch" style={{ background: activityColors[i] }} />
                    <div className="num">{number}</div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SCHEDULE / TIMELINE ─────────────────────────────────── */}
        {scheduleItems.length > 0 && (
          <section id="programme" className="sec-pad">
            <div className="wrap">
              <div className="section-head" data-reveal>
                <span className="eyebrow">{get(c, "schedule.eyebrow", "Le jour J · 11 juillet")}</span>
                <h2 className="display">{get(c, "schedule.title", "Déroulé de la journée.")}</h2>
              </div>
              <div className="timeline" data-stagger>
                {scheduleItems.map(({ time, title, desc }) => (
                  <div className="tl-row" key={time} data-reveal>
                    <div className="time grad-text-lt">{time}</div>
                    <div className="dot" />
                    <div className="body">
                      <h4>{title}</h4>
                      {desc && <p>{desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PRIZES ──────────────────────────────────────────────── */}
        <section id="prix" className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">{get(c, "prizes.eyebrow", "Récompenses")}</span>
              <h2 className="display">{get(c, "prizes.title", "Plus qu'un prix, un tremplin.")}</h2>
            </div>
            <div className="prize-grid" data-stagger>
              {prizes.map(({ rank, amount, gold }) => (
                <div className={`prize${gold ? " gold" : ""}`} key={rank} data-reveal="scale">
                  <div className="rank">{rank}</div>
                  <div className={`amt${gold ? " grad-text-lt" : ""}`}>{amount}<small>FCFA</small></div>
                </div>
              ))}
            </div>
            <div className="perks" data-stagger>
              {perks.map((perk, i) => {
                const [title, ...rest] = perk.split(":");
                return (
                  <div className="perk" key={i} data-reveal="scale">
                    <div className="perk-num">0{i + 1}</div>
                    <strong className="perk-title grad-text">{title.trim()}</strong>
                    {rest.length > 0 && <p className="perk-body">{rest.join(":").trim()}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── BILLETS / PASSES ────────────────────────────────────── */}
        <section id="billets" className="sec-pad">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">{get(c, "tickets.eyebrow", "Participer")}</span>
              <h2 className="display">
                {REGISTRATIONS_CLOSED
                  ? REGISTRATIONS_CLOSED_COPY.heading
                  : get(c, "tickets.title", "Choisis ton pass.")}
              </h2>
              <p>
                {REGISTRATIONS_CLOSED
                  ? REGISTRATIONS_CLOSED_COPY.body
                  : get(c, "tickets.body")}
              </p>
            </div>

            {REGISTRATIONS_CLOSED ? null : openTickets.length === 1 ? (
              /* Single pass: full-width featured treatment */
              <div className="pass-hero" style={{ ["--cat" as string]: openTickets[0].color }} data-reveal="scale">
                <div className="pass-hero-bar" />
                <div className="pass-hero-body">
                  <div className="pass-hero-left">
                    <span className="pass-hero-label">Pass disponible</span>
                    <span className="pass-hero-name" style={{ color: openTickets[0].color }}>
                      {openTickets[0].label}
                    </span>
                    <p className="pass-hero-tag">{openTickets[0].tagline}</p>
                    <ul className="pass-hero-perks">
                      {openTickets[0].perks.map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pass-hero-right">
                    <div className="pass-hero-price">{formatFee(openTickets[0].fee)}</div>
                    <Link href={`/billet?type=${openTickets[0].slug}`} className="btn btn-grad">
                      {openTickets[0].fee === 0
                        ? get(c, "tickets.cta.free", "S'inscrire gratuitement")
                        : get(c, "tickets.cta.paid", "Réserver")}{" "}
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid" data-stagger>
                {openTickets.map(({ value, label, tagline, perks: ticketPerks, fee, color, slug }) => (
                  <article
                    className="ticket-card"
                    key={value}
                    data-reveal="scale"
                    style={{ ["--cat" as string]: color }}
                  >
                    <div className="ticket-bar" />
                    <h3 style={{ color }}>{label}</h3>
                    <div className="ticket-price">{formatFee(fee)}</div>
                    <p className="ticket-tag">{tagline}</p>
                    <ul className="ticket-list">
                      {ticketPerks.map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                    <Link href={`/billet?type=${slug}`} className="btn btn-grad btn-block">
                      {fee === 0
                        ? get(c, "tickets.cta.free", "S'inscrire gratuitement")
                        : get(c, "tickets.cta.paid", "Réserver")}{" "}
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── JUDGING CRITERIA ────────────────────────────────────── */}
        <section className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap criteria">
            <div data-reveal="left">
              <span className="eyebrow">Le jury évalue</span>
              <h2 className="display" style={{ fontSize: "clamp(36px,4.5vw,64px)", marginTop: 18 }}>
                Comment<br />on est noté.
              </h2>
            </div>
            <div data-reveal="right">
              {JUDGING_CRITERIA.map((criterion) => (
                <div className="crit-row" key={criterion.id}>
                  <div className="lab">
                    <span className="name">{criterion.name}</span>
                    <span className="pct grad-text-lt">{criterion.weight}%</span>
                  </div>
                  <div className="bar"><i style={{ width: `${(criterion.weight / 30) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AUDIENCE ────────────────────────────────────────────── */}
        <section className="sec-pad">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="eyebrow">{get(c, "audience.eyebrow", "Pour qui ?")}</span>
              <h2 className="display">{get(c, "audience.title", "Ouvert à tous les bâtisseurs.")}</h2>
            </div>
            <div className="aud-row" data-stagger>
              {audienceMembers.map((member) => (
                <div className="aud-chip" key={member} data-reveal>{member}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────── */}
        <section className="sec-pad" style={{ background: "var(--bg-0)" }}>
          <div className="wrap">
            <div className="final-cta">
              <div className="mesh" aria-hidden="true">
                <span className="blob-g" /><span className="blob-p" />
                <span className="blob-k" /><span className="blob-m" />
              </div>
              <h2 className="display">
                {(() => {
                  const words = get(c, "cta.final.title", "Prêt à lancer ?").split(" ");
                  const last = words.pop();
                  return <>{words.join(" ")} <span className="grad-text-lt">{last}</span></>;
                })()}
              </h2>
              <div className="cta-row">
                <Link href="/billet" className="btn btn-grad">
                  {get(c, "cta.final.primary", "Prendre mon pass")} <ArrowRight size={18} />
                </Link>
                <Link href="/statut" className="btn btn-ghost">
                  {get(c, "cta.final.secondary", "Vérifier mon statut")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARTNERS MARQUEE ────────────────────────────────────── */}
        <section className="partners-section" style={{ padding: "60px 0" }}>
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center", marginBottom: "40px" }} data-reveal>
              <span className="eyebrow">Soutien & Partenariat</span>
              <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>Nos Partenaires & Sponsors</h2>
            </div>
          </div>

          <div className="partners-marquee-container">
            <div className="partners-track-wrapper" style={{ background: "rgba(255, 255, 255, 0.95)", padding: "30px 0", borderTop: "1px solid rgba(255, 255, 255, 0.15)", borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }}>
              <div className="partners-track" style={{ display: "flex", gap: "80px", width: "max-content", alignItems: "center" }}>
                {/* Original */}
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} />
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} />
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} />
                
                {/* Duplicated for seamless loop */}
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} aria-hidden="true" />
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} aria-hidden="true" />
                <img src="/images/partners.jpg" alt="Partenaires et Sponsors" style={{ height: "90px", width: "auto", display: "block" }} aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

      </main>

      <ScrollReveal />

      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <Logo size={170} />
              <p>{get(c, "footer.tagline")}</p>
            </div>
            <nav className="foot-links" aria-label="Navigation de pied de page">
              <Link href="/">Accueil</Link>
              <Link href="#programme">Programme</Link>
              <Link href="/formation">Formations</Link>
              <Link href="/membres-du-jury">Le jury</Link>
              <Link href="#billets">Mon pass</Link>
              <Link href="/statut">Mon statut</Link>
            </nav>
          </div>
          <div className="foot-bottom">
            <span className="copy">{get(c, "footer.copyright")}</span>
            <a className="copy foot-contact" href={`mailto:${get(c, "footer.contact")}`}>
              {get(c, "footer.contact")}
            </a>
            <span className="copy foot-event">{get(c, "hero.date")} · {get(c, "hero.venue")}</span>
            <a
              className="copy foot-made"
              href="https://www.reinvent-labs.com/"
              target="_blank"
              rel="noreferrer"
            >
              {get(c, "footer.made", "Made with ♥ by Reinvent Labs")}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
