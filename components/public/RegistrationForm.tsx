"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  profile: "",
  motivation: "",
  source: "",
};

export function RegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const completed = useMemo(
    () => Object.values(form).filter(Boolean).length,
    [form],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Impossible d'envoyer la candidature.");
      }
      setReference(payload.data.reference);
      toast.success("Candidature envoyée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="success">
        <div className="check">✓</div>
        <h2>C&apos;est envoyé.</h2>
        <p>Ta candidature est enregistrée. Garde cette référence pour le suivi.</p>
        <div className="ref">Référence <span className="grad-text-lt">{reference}</span></div>
        <div className="cluster" style={{ justifyContent: "center" }}>
          <Link href={`/statut?email=${encodeURIComponent(form.email)}`} className="btn btn-grad">Suivre mon statut</Link>
          <Link href="/" className="btn btn-ghost">Accueil</Link>
        </div>
      </div>
    );
  }

  const update = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-progress"><i style={{ width: `${(completed / 7) * 100}%` }} /></div>
      <div className="field">
        <label htmlFor="fullName">Nom complet <span className="req">*</span></label>
        <input id="fullName" className="input" required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Ex. Aïcha Koné" autoComplete="name" />
      </div>
      <div className="field two">
        <div className="field">
          <label htmlFor="email">Email <span className="req">*</span></label>
          <input id="email" className="input" required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="toi@email.com" autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="phone">Téléphone <span className="req">*</span></label>
          <input id="phone" className="input" required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+225 ..." autoComplete="tel" />
        </div>
      </div>
      <div className="field two">
        <div className="field">
          <label htmlFor="city">Ville <span className="req">*</span></label>
          <input id="city" className="input" required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Abidjan" />
        </div>
        <div className="field">
          <label htmlFor="profile">Profil <span className="req">*</span></label>
          <select id="profile" className="select" required value={form.profile} onChange={(event) => update("profile", event.target.value)}>
            <option value="">Choisir</option>
            <option>Étudiant·e</option><option>Jeune diplômé·e</option><option>Entrepreneur·e</option><option>Professionnel·le</option><option>Autre</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="motivation">Motivation <span className="req">*</span><span className="hint">{form.motivation.length}/300</span></label>
        <textarea id="motivation" className="textarea" required minLength={20} maxLength={300} value={form.motivation} onChange={(event) => update("motivation", event.target.value)} placeholder="Pourquoi veux-tu participer ? Quelle cause environnementale t'anime ?" />
      </div>
      <div className="field">
        <label htmlFor="source">Comment as-tu connu VIBEATHON ?</label>
        <select id="source" className="select" value={form.source} onChange={(event) => update("source", event.target.value)}>
          <option value="">Choisir</option><option>Instagram</option><option>LinkedIn</option><option>École / université</option><option>Bouche-à-oreille</option><option>Autre</option>
        </select>
      </div>
      <button type="submit" className="btn btn-grad btn-block" disabled={submitting}>{submitting ? "Envoi..." : "Soumettre ma candidature →"}</button>
      <p className="form-note">En soumettant, tu acceptes d&apos;être recontacté·e par l&apos;équipe VIBEATHON.</p>
    </form>
  );
}
