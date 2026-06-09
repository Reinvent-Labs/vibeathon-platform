"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Connexion impossible.");
      }
      const requested = searchParams.get("next");
      const destination =
        requested &&
        requested.startsWith("/") &&
        !requested.startsWith("//") &&
        (requested === payload.data.destination ||
          requested.startsWith(`${payload.data.destination}/`))
          ? requested
          : payload.data.destination;
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>Email<input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>Mot de passe<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      <button className="btn btn-grad btn-block" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
    </form>
  );
}
