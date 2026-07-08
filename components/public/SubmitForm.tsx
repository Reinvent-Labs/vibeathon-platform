"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Phase = "form" | "loading" | "done";

type Result = {
  teamName: string;
  aiScore: number | null;
  aiSummary: string | null;
};

export function SubmitForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<Result | null>(null);

  const [form, setForm] = useState({
    teamName: "",
    demoUrl: "",
    repositoryUrl: "",
    description: "",
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setPhase("loading");
    try {
      const res = await fetch("/api/teams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Soumission impossible.");
      }
      setResult(payload.data);
      setPhase("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue.");
      setPhase("form");
    }
  }

  if (phase === "loading") {
    return (
      <div className="submit-loading">
        <div className="submit-spinner" />
        <p>Soumission en cours + évaluation par IA…</p>
        <span>Ça peut prendre 15-30 secondes.</span>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="ticket-success">
        <div className="ticket-success-icon">✓</div>
        <h2>Projet soumis !</h2>
        <p>
          <strong>{result.teamName}</strong> — ton projet a bien été enregistré.
        </p>
        {result.aiScore !== null && (
          <div className="submit-ai-result">
            <div className="submit-ai-score">
              <span className="submit-ai-score-num grad-text-lt">{result.aiScore}</span>
              <span className="submit-ai-score-denom">/100</span>
            </div>
            <p className="submit-ai-score-label">Score IA préliminaire</p>
            {result.aiSummary && (
              <p className="submit-ai-summary">{result.aiSummary}</p>
            )}
            <p className="submit-ai-note">
              Ce score est indicatif. Les jurés humains évaluent le pitch en direct.
            </p>
          </div>
        )}
        <div className="cluster" style={{ justifyContent: "center", marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setPhase("form"); setResult(null); }}
          >
            Nouvelle soumission
          </button>
          <Link href="/" className="btn btn-ghost">Accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="ticket-form-wrap" onSubmit={handleSubmit}>
      <div className="ticket-fields">
        <div className="field">
          <label htmlFor="teamName">
            Nom de l&apos;équipe <span className="req">*</span>
          </label>
          <input
            id="teamName"
            className="input"
            required
            value={form.teamName}
            onChange={(e) => update("teamName", e.target.value)}
            placeholder="Ex. Team Alpha"
          />
          <p className="field-hint">Exactement comme sur ton badge d&apos;équipe.</p>
        </div>

        <div className="field">
          <label htmlFor="demoUrl">
            URL de la démo <span className="req">*</span>
          </label>
          <input
            id="demoUrl"
            className="input"
            required
            type="url"
            value={form.demoUrl}
            onChange={(e) => update("demoUrl", e.target.value)}
            placeholder="https://mon-app.vercel.app"
          />
        </div>

        <div className="field">
          <label htmlFor="repositoryUrl">
            URL du dépôt (GitHub, etc.)
          </label>
          <input
            id="repositoryUrl"
            className="input"
            type="url"
            value={form.repositoryUrl}
            onChange={(e) => update("repositoryUrl", e.target.value)}
            placeholder="https://github.com/mon-equipe/mon-projet"
          />
        </div>

        <div className="field">
          <label htmlFor="description">
            Description du projet <span className="req">*</span>
          </label>
          <textarea
            id="description"
            className="input"
            required
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Décris le problème que vous adressez, votre solution, les outils IA utilisés et l'impact attendu (200–500 mots)."
            style={{ resize: "vertical", minHeight: 120 }}
          />
        </div>

        <button type="submit" className="btn btn-grad btn-block">
          Soumettre mon projet →
        </button>
        <p className="form-note">
          La soumission déclenche une évaluation par IA instantanée.
          Les scores sont visibles dans le tableau de bord du jury.
        </p>
      </div>
    </form>
  );
}
