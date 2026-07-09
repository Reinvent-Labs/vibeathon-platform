"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

type Phase = "form" | "sent" | "error";

export function JuryAuth({ errorParam }: { errorParam?: string }) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>(errorParam ? "error" : "form");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/jury/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show "sent" — we don't leak whether the email exists
      setPhase("sent");
    } catch {
      setPhase("error");
    } finally {
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

        {phase === "sent" ? (
          <div className="jury-auth-sent">
            <div className="jury-auth-sent-icon">✉</div>
            <p>
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Vérifiez votre boîte mail et cliquez sur le lien — il expire dans 15 minutes.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setPhase("form"); setEmail(""); }}
            >
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <>
            {phase === "error" && (
              <p className="jury-auth-error">
                {errorParam === "expired"
                  ? "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau."
                  : errorParam === "unauthorized"
                    ? "Cette adresse n'est pas autorisée à accéder au portail jury."
                    : "Une erreur est survenue. Réessayez."}
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
                {loading ? "Envoi en cours…" : "Recevoir mon lien de connexion →"}
              </button>
              <p className="jury-auth-note">
                Vous recevrez un lien à usage unique par e-mail. Pas de mot de passe.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
