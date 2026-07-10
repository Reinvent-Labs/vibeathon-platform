"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

type Phase = "form" | "error";

export function JuryAuth({ errorParam }: { errorParam?: string }) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>(errorParam ? "error" : "form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/jury/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setErrorMessage(payload.error ?? "Connexion impossible.");
        setPhase("error");
        setLoading(false);
        return;
      }
      // Full reload so the server picks up the new session cookie
      window.location.href = "/jury";
    } catch {
      setErrorMessage("Une erreur est survenue. Réessayez.");
      setPhase("error");
      setLoading(false);
    }
  }

  return (
    <main className="jury-auth-shell">
      <div className="jury-auth-card">
        <Logo size={130} />
        <div className="jury-auth-head">
          <span className="eyebrow">Espace jury</span>
          <h1>Connexion</h1>
        </div>

        {phase === "error" && (
          <p className="jury-auth-error">
            {errorMessage ??
              (errorParam === "unauthorized"
                ? "Cette adresse n'est pas autorisée à accéder au portail jury."
                : "Une erreur est survenue. Réessayez.")}
          </p>
        )}
        <form className="jury-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="jury-email">Adresse e-mail du jury</label>
          <input
            id="jury-email"
            type="email"
            className="input"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
          <button
            type="submit"
            className="btn btn-grad btn-block"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
          <p className="jury-auth-note">
            Pas de mot de passe. Entrez simplement votre adresse e-mail de jury.
          </p>
        </form>
      </div>
    </main>
  );
}
