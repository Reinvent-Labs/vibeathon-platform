"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Force a newly created staff account to replace its temporary password. */
export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmation,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Modification impossible.");
      }
      toast.success("Mot de passe enregistré.");
      router.replace(payload.data.destination);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Modification impossible.",
      );
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <p className="app-message">
        Ce compte utilise un mot de passe temporaire. Choisis un mot de passe
        personnel avant d&apos;accéder à ton espace.
      </p>
      <label>
        Mot de passe temporaire
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </label>
      <label>
        Nouveau mot de passe
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={12}
          required
        />
      </label>
      <label>
        Confirmer le nouveau mot de passe
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          minLength={12}
          required
        />
      </label>
      <small>
        12 caractères minimum avec majuscule, minuscule, chiffre et caractère
        spécial.
      </small>
      <button className="btn btn-grad btn-block" disabled={loading}>
        {loading ? "Enregistrement…" : "Définir mon mot de passe"}
      </button>
    </form>
  );
}
