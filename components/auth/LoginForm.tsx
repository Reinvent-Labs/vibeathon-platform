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
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!payload.success) return toast.error(payload.error);
    router.replace(searchParams.get("next") ?? payload.data.destination);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>Email<input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>Mot de passe<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      <button className="btn btn-grad btn-block" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
    </form>
  );
}
