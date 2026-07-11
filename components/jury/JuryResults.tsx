"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

type RankingEntry = {
  id: string;
  name: string;
  rank: number | null;
  averageScore: number | null;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export function JuryResults({ user }: { user: SessionPayload & { fullName: string } }) {
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jury/results")
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          setError(payload.error ?? "Résultats indisponibles.");
          return;
        }
        setRanking(payload.data.ranking);
      })
      .catch(() => setError("Résultats indisponibles."));
  }, []);

  return (
    <main className="jury-directory-shell">
      <div className="jury-directory-header">
        <div>
          <span className="eyebrow">Espace jury · Résultats finaux</span>
          <h1 className="display">Classement final</h1>
        </div>
        <div className="jury-directory-actions">
          <Link href="/jury" className="btn btn-ghost">← Retour</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="jury-directory-content">
        {error && <div className="surface empty-state">{error}</div>}

        {!error && !ranking && (
          <div className="surface empty-state">Chargement du classement…</div>
        )}

        {ranking && (
          <div className="panel">
            <div style={{ padding: 22 }}>
              {ranking.map((team, i) => (
                <div className="bar-row" key={team.id}>
                  <span className="nm">
                    {i < 3 ? `${MEDALS[i]} ` : `${i + 1}. `}{team.name}
                  </span>
                  <span className="tk">
                    <i style={{ width: `${team.averageScore ?? 0}%` }} />
                  </span>
                  <span className="vv">{team.averageScore ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 16 }}>
          Merci pour votre contribution au jury de VIBEATHON 2026, {user.fullName.split(" ")[0]}.
        </p>
      </div>
    </main>
  );
}
