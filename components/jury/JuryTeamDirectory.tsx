"use client";

import Link from "next/link";
import { ChevronDown, Mail, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

type DirectoryMember = {
  id: string;
  fullName: string;
  gender: string | null;
  email: string;
};

type DirectoryTeam = {
  id: string;
  name: string;
  domain: string;
  members: DirectoryMember[];
};

const ALL_DOMAINS = "Toutes les thématiques";

const memberInitials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/** Displays the non-scoring, private directory of all definitive teams. */
export function JuryTeamDirectory({
  user,
}: {
  user: SessionPayload & { fullName: string };
}) {
  const [teams, setTeams] = useState<DirectoryTeam[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(ALL_DOMAINS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jury/teams", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Impossible de charger les équipes.");
        }
        setTeams(payload.data);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les équipes.");
      })
      .finally(() => setLoading(false));
  }, []);

  const domains = [
    ALL_DOMAINS,
    ...Array.from(new Set(teams.map((team) => team.domain))).sort((a, b) => a.localeCompare(b, "fr")),
  ];
  const search = query.trim().toLocaleLowerCase("fr");
  const visibleTeams = teams.filter((team) => {
    const inDomain = selectedDomain === ALL_DOMAINS || team.domain === selectedDomain;
    const matches =
      !search ||
      team.name.toLocaleLowerCase("fr").includes(search) ||
      team.domain.toLocaleLowerCase("fr").includes(search) ||
      team.members.some((member) => member.fullName.toLocaleLowerCase("fr").includes(search));
    return inDomain && matches;
  });

  return (
    <main className="jury-directory-shell">
      <header className="jury-directory-header">
        <Logo size={126} />
        <div className="jury-directory-actions">
          <Link className="btn btn-ghost" href="/jury" prefetch={false}>
            Évaluer les finalistes
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="jury-directory-content" aria-labelledby="directory-title">
        <div className="jury-directory-intro">
          <div>
            <span className="eyebrow">Espace jury · Répertoire confidentiel</span>
            <h1 id="directory-title" className="display">Les 20 équipes en compétition</h1>
            <p>Consultez les thématiques et les coordonnées e-mail des membres de chaque équipe.</p>
          </div>
          <div className="jury-directory-user">
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <div className="surface jury-directory-controls">
          <label className="jury-directory-search" htmlFor="team-directory-search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Rechercher une équipe ou un membre</span>
            <input
              id="team-directory-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une équipe ou un membre"
            />
          </label>
          <div className="jury-directory-filters" aria-label="Filtrer par thématique">
            {domains.map((domain) => (
              <button
                key={domain}
                type="button"
                className={`jury-domain-filter${domain === selectedDomain ? " active" : ""}`}
                aria-pressed={domain === selectedDomain}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="surface jury-directory-message">Chargement du répertoire…</div>}
        {error && <div className="app-message error">{error}</div>}

        {!loading && !error && (
          <>
            <p className="jury-directory-result-count">
              <Users aria-hidden="true" size={17} />
              {visibleTeams.length} équipe{visibleTeams.length > 1 ? "s" : ""} · {visibleTeams.reduce((total, team) => total + team.members.length, 0)} membre{visibleTeams.reduce((total, team) => total + team.members.length, 0) > 1 ? "s" : ""}
            </p>
            {visibleTeams.length > 0 ? (
              <div className="jury-directory-grid">
                {visibleTeams.map((team) => (
                  <details className="surface jury-directory-team" key={team.id}>
                    <summary>
                      <span className="jury-directory-team-heading">
                        <span className="jury-directory-domain">{team.domain}</span>
                        <strong>{team.name}</strong>
                      </span>
                      <ChevronDown className="jury-directory-disclosure" aria-hidden="true" size={18} />
                    </summary>
                    <div className="jury-directory-members">
                      {team.members.map((member) => (
                        <article className="jury-directory-member" key={member.id}>
                          <div className="jury-directory-member-identity">
                            <span className="jury-directory-member-avatar" aria-hidden="true">
                              {memberInitials(member.fullName)}
                            </span>
                            <div>
                              <h2>{member.fullName}</h2>
                              <p>{member.gender ?? "Genre non renseigné"}</p>
                            </div>
                          </div>
                          <div className="jury-directory-contact">
                            <a href={`mailto:${member.email}`} aria-label={`Envoyer un e-mail à ${member.fullName}`}>
                              <Mail aria-hidden="true" size={14} />
                              <span>{member.email}</span>
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="surface jury-directory-message">Aucune équipe ne correspond à cette recherche.</div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
