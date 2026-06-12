"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CATEGORIES,
  OPEN_CATEGORIES,
  categoryBySlug,
  formatFee,
  type OpenCategory,
} from "@/lib/categories";

const initialForm = { fullName: "", email: "", phone: "" };

/**
 * Public ticket registration. Reads `?type=` to preselect a pass; otherwise
 * shows the three pass cards. Free passes confirm instantly and surface the
 * badge link; paid passes redirect to the PaiementPro checkout.
 */
export function TicketForm() {
  const searchParams = useSearchParams();
  const preselected = categoryBySlug(searchParams.get("type") ?? "");
  const [category, setCategory] = useState<OpenCategory | null>(
    (preselected?.value as OpenCategory) ?? null,
  );
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ badgeUrl: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Inscription impossible.");
      }
      if (payload.data.free) {
        setDone({ badgeUrl: payload.data.badgeUrl });
        toast.success("Inscription confirmée. Badge envoyé.");
      } else {
        toast.success("Redirection vers le paiement...");
        window.location.href = payload.data.paymentUrl;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  const update = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  // Success screen for free (visitor) passes.
  if (done) {
    return (
      <div className="success">
        <div className="check">✓</div>
        <h2>Bienvenue !</h2>
        <p>
          Ton badge vient de t&apos;être envoyé par email et WhatsApp. Tu peux
          aussi l&apos;ouvrir tout de suite.
        </p>
        <div className="cluster" style={{ justifyContent: "center" }}>
          <Link href={done.badgeUrl} className="btn btn-grad">
            Voir mon badge
          </Link>
          <Link href="/" className="btn btn-ghost">
            Accueil
          </Link>
        </div>
      </div>
    );
  }

  // Step 1 — pick a pass.
  if (!category) {
    return (
      <div className="form-card">
        <h2 style={{ margin: "0 0 6px" }}>Choisis ton pass</h2>
        <p className="form-note" style={{ marginTop: 0 }}>
          Sélectionne le type de participation qui te correspond.
        </p>
        <div className="ticket-pick">
          {OPEN_CATEGORIES.map((value) => {
            const config = CATEGORIES[value];
            return (
              <button
                type="button"
                key={value}
                className="ticket-pick-card"
                style={{ ["--cat" as string]: config.color }}
                onClick={() => setCategory(value)}
              >
                <span className="ticket-pick-name" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="ticket-pick-fee">{formatFee(config.fee)}</span>
                <span className="ticket-pick-tag">{config.tagline}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2 — fill in details for the chosen pass.
  const config = CATEGORIES[category];
  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div
        className="ticket-chosen"
        style={{ ["--cat" as string]: config.color }}
      >
        <div>
          <span className="ticket-chosen-name" style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="ticket-chosen-fee">{formatFee(config.fee)}</span>
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={() => setCategory(null)}
        >
          Changer
        </button>
      </div>
      <ul className="ticket-perks">
        {config.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
      <div className="field">
        <label htmlFor="fullName">
          Nom complet <span className="req">*</span>
        </label>
        <input
          id="fullName"
          className="input"
          required
          value={form.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          placeholder="Ex. Aïcha Koné"
          autoComplete="name"
        />
      </div>
      <div className="field two">
        <div className="field">
          <label htmlFor="email">
            Email <span className="req">*</span>
          </label>
          <input
            id="email"
            className="input"
            required
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="toi@email.com"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="phone">
            WhatsApp <span className="req">*</span>
          </label>
          <input
            id="phone"
            className="input"
            required
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+225 ..."
            autoComplete="tel"
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-grad btn-block"
        disabled={submitting}
      >
        {submitting
          ? "Traitement..."
          : config.fee === 0
            ? "Recevoir mon badge →"
            : `Payer ${formatFee(config.fee)} →`}
      </button>
      <p className="form-note">
        {config.fee === 0
          ? "Ton badge te sera envoyé immédiatement par email et WhatsApp."
          : "Après paiement, ton badge te sera envoyé par email et WhatsApp."}
      </p>
    </form>
  );
}
