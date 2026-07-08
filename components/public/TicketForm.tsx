"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export function TicketForm() {
  const searchParams = useSearchParams();
  const preselected = categoryBySlug(searchParams.get("type") ?? "");

  // Auto-select when only one pass type is available
  const autoSelect = OPEN_CATEGORIES.length === 1 ? OPEN_CATEGORIES[0] : null;
  const [category, setCategory] = useState<OpenCategory | null>(
    (preselected?.value as OpenCategory) ?? autoSelect ?? null,
  );
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ badgeUrl: string } | null>(null);

  useEffect(() => {
    if (!category && autoSelect) setCategory(autoSelect);
  }, [autoSelect, category]);

  async function handleSubmit(event: { preventDefault(): void }) {
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

  // Success screen
  if (done) {
    return (
      <div className="ticket-success">
        <div className="ticket-success-icon">✓</div>
        <h2>C&apos;est confirmé !</h2>
        <p>
          Ton badge t&apos;a été envoyé par email et WhatsApp. Tu peux aussi
          l&apos;ouvrir tout de suite.
        </p>
        <div className="cluster" style={{ justifyContent: "center", marginTop: 8 }}>
          <Link href={done.badgeUrl} className="btn btn-grad">
            Voir mon badge →
          </Link>
          <Link href="/" className="btn btn-ghost">
            Accueil
          </Link>
        </div>
      </div>
    );
  }

  // Pass picker — only shown when multiple categories are open
  if (!category) {
    return (
      <div className="ticket-picker-wrap">
        <p className="ticket-picker-label">Choisis ton pass</p>
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

  const config = CATEGORIES[category];

  return (
    <form className="ticket-form-wrap" onSubmit={handleSubmit}>
      {/* Featured pass card */}
      <div className="ticket-featured" style={{ ["--cat" as string]: config.color }}>
        <div className="ticket-featured-bar" />
        <div className="ticket-featured-body">
          <div className="ticket-featured-left">
            <span className="ticket-featured-label">Ton pass</span>
            <span className="ticket-featured-name" style={{ color: config.color }}>
              {config.label}
            </span>
            <ul className="ticket-featured-perks">
              {config.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
          <div className="ticket-featured-right">
            <span className="ticket-featured-price">{formatFee(config.fee)}</span>
            {OPEN_CATEGORIES.length > 1 && (
              <button type="button" className="link-btn" onClick={() => setCategory(null)}>
                Changer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Registration fields */}
      <div className="ticket-fields">
        <div className="field">
          <label htmlFor="fullName">
            Nom complet <span className="req">*</span>
          </label>
          <input
            id="fullName"
            className="input"
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
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
              onChange={(e) => update("email", e.target.value)}
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
              onChange={(e) => update("phone", e.target.value)}
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
          {submitting ? "Traitement..." : "Recevoir mon badge →"}
        </button>
        <p className="form-note">
          Badge envoyé instantanément par email et WhatsApp. Entrée gratuite.
        </p>
      </div>
    </form>
  );
}
