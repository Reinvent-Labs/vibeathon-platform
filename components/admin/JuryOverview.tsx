"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type JuryMember = { id: string; fullName: string; email: string };
type TeamRanking = {
  id: string;
  name: string;
  memberCount: number;
  juryCount: number;
  averageScore: number | null;
  isFinalist: boolean;
  rank: number | null;
  demoUrl: string | null;
  aiScore: number | null;
  aiSummary: string | null;
  aiEvaluatedAt: string | null;
  juryTotals: Record<string, number>;
};

type Overview = {
  phase: string;
  juryCount: number;
  juryMembers: JuryMember[];
  criteriaCount: number;
  eligibleTeams: number;
  scoredTeams: number;
  finalists: number;
  allJuryDone: boolean;
  ranking: TeamRanking[];
};

export function JuryOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/jury-overview")
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || !payload.success) throw new Error(payload.error ?? "Chargement impossible.");
        setData(payload.data);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function updateResult(teamId: string, value: "none" | "finalist" | "1" | "2" | "3") {
    const res = await fetch("/api/admin/jury-overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        isFinalist: value !== "none",
        rank: ["1", "2", "3"].includes(value) ? Number(value) : null,
      }),
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) { toast.error(payload.error ?? "Mise à jour impossible."); return; }
    setData(payload.data);
    toast.success("Résultat enregistré.");
  }

  if (loading) return <div className="surface empty-state">Chargement du jury…</div>;

  if (!data || data.finalists === 0) {
    return (
      <div className="surface empty-state">
        <span className="eyebrow">Phase 2</span>
        <h2>Aucune équipe finaliste</h2>
        <p>Terminez la Phase 1 pour qualifier les équipes finalistes. Elles apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {/* Metrics */}
      <div className="metric-grid">
        <div className="metric-card"><span>Jurés actifs</span><strong>{data.juryCount}</strong></div>
        <div className="metric-card"><span>Équipes finalistes</span><strong>{data.finalists}</strong></div>
        <div className="metric-card"><span>Équipes notées</span><strong>{data.scoredTeams}/{data.finalists}</strong></div>
        <div className="metric-card">
          <span>Statut</span>
          <strong style={{ color: data.allJuryDone ? "var(--green)" : undefined }}>
            {data.allJuryDone ? "Terminé ✓" : "En cours"}
          </strong>
        </div>
      </div>

      {/* Jury matrix */}
      {data.juryMembers.length > 0 && (
        <div className="panel">
          <div className="phead">
            <h3>Matrice des scores jury</h3>
            <Link href="/jury" target="_blank">Ouvrir le portail jury →</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Équipe</th>
                  <th>Score IA</th>
                  {data.juryMembers.map((j) => (
                    <th key={j.id} title={j.email}>{j.fullName.split(" ")[0]}</th>
                  ))}
                  <th>Moy. jury</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((team, i) => (
                  <tr key={team.id}>
                    <td>
                      <b>{i < 3 ? ["🥇 ", "🥈 ", "🥉 "][i] : ""}{team.name}</b>
                    </td>
                    <td>
                      {team.aiScore !== null
                        ? <span style={{ color: "var(--ink-faint)", fontSize: 13 }}>{team.aiScore}</span>
                        : <span style={{ color: "var(--ink-faint)" }}>—</span>}
                    </td>
                    {data.juryMembers.map((j) => {
                      const score = team.juryTotals[j.id];
                      const done = score !== undefined;
                      return (
                        <td key={j.id}>
                          {done
                            ? <strong>{score}</strong>
                            : <span style={{ color: "var(--ink-faint)" }}>—</span>}
                        </td>
                      );
                    })}
                    <td>
                      {team.averageScore !== null
                        ? <strong className="grad-text-lt">{team.averageScore}</strong>
                        : <span style={{ color: "var(--ink-faint)" }}>—</span>}
                    </td>
                    <td>
                      <select
                        className="select compact-select"
                        value={team.rank ? String(team.rank) : team.isFinalist ? "finalist" : "none"}
                        onChange={(e) => void updateResult(team.id, e.target.value as "none" | "finalist" | "1" | "2" | "3")}
                        aria-label={`Résultat ${team.name}`}
                      >
                        <option value="none">Non finaliste</option>
                        <option value="finalist">Finaliste</option>
                        <option value="1">1er prix</option>
                        <option value="2">2e prix</option>
                        <option value="3">3e prix</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.allJuryDone && (
            <div style={{ padding: "16px 22px", borderTop: "1px solid var(--line)", background: "color-mix(in srgb, var(--green) 6%, transparent)" }}>
              <strong style={{ color: "var(--green)" }}>✓ Tous les jurés ont soumis leurs notes.</strong>
              <span style={{ marginLeft: 12, fontSize: 13, color: "var(--ink-faint)" }}>Les e-mails de résultats ont été envoyés automatiquement.</span>
            </div>
          )}
        </div>
      )}

      {/* Bar chart ranking */}
      <div className="panel">
        <div className="phead">
          <h3>Classement jury provisoire</h3>
        </div>
        {data.ranking.length > 0 ? (
          <div style={{ padding: 22 }}>
            {data.ranking.map((team, i) => (
              <div className="bar-row" key={team.id}>
                <span className="nm">
                  {team.rank ? `${team.rank}.` : `${i + 1}.`} {team.name}
                </span>
                <span className="tk">
                  <i style={{ width: `${team.averageScore ?? 0}%` }} />
                </span>
                <span className="vv">
                  {team.averageScore === null ? "—" : team.averageScore}
                </span>
                <small>{team.juryCount}/{data.juryCount} juré(s)</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Aucune équipe finaliste à afficher.</div>
        )}
      </div>
    </div>
  );
}
