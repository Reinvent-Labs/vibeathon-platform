"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SITE_CONTENT } from "@/lib/cms-defaults";

type ContentMap = Record<string, string>;
type FieldDef = { key: string; label: string; multiline?: boolean; hint?: string; number?: boolean };
type SectionDef = { id: string; label: string; fields: FieldDef[] };

const IMAGE_FIELDS = [
  { key: "image.hero", label: "Image héro (fond)", description: "Arrière-plan de la section principale. JPG ou PNG, minimum 1920×1080px." },
  { key: "image.about", label: "Image section À propos", description: "Photo ou visuel pour la section concept." },
  { key: "image.organizer", label: "Logo organisateur", description: "Logo principal de l'organisateur, fond transparent recommandé." },
];

const CONTENT_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    label: "Héro",
    fields: [
      { key: "hero.tagline", label: "Accroche principale (grande)" },
      { key: "hero.eyebrow", label: "Pill d'intro (ex. IA × Environnement · Abidjan)" },
      { key: "hero.subtitle", label: "Sous-titre / description", multiline: true },
      { key: "hero.date", label: "Date de l'événement" },
      { key: "hero.venue", label: "Lieu" },
      { key: "hero.cta.primary", label: "Bouton principal (ex. Prendre mon pass)" },
      { key: "hero.cta.secondary", label: "Bouton secondaire (ex. Découvrir le programme)" },
    ],
  },
  {
    id: "stats",
    label: "Chiffres",
    fields: [
      { key: "stats.participants", label: "Valeur · Participants", number: true },
      { key: "stats.participants.label", label: "Libellé · Participants" },
      { key: "stats.competitors", label: "Valeur · Compétiteurs", number: true },
      { key: "stats.competitors.label", label: "Libellé · Compétiteurs" },
      { key: "stats.solutions", label: "Valeur · Solutions", number: true },
      { key: "stats.solutions.label", label: "Libellé · Solutions" },
      { key: "stats.winners", label: "Valeur · Lauréats", number: true },
      { key: "stats.winners.label", label: "Libellé · Lauréats" },
    ],
  },
  {
    id: "concept",
    label: "Concept",
    fields: [
      { key: "concept.eyebrow", label: "Étiquette de section" },
      { key: "concept.lead", label: "Phrase d'accroche (grande)", multiline: true },
      { key: "concept.body", label: "Corps du texte", multiline: true },
      { key: "concept.quote", label: "Citation en encadré", multiline: true },
    ],
  },
  {
    id: "activities",
    label: "Activités",
    fields: [
      { key: "activities.eyebrow", label: "Étiquette de section" },
      { key: "activities.title", label: "Titre de section" },
      ...([1, 2, 3, 4, 5].flatMap((n) => [
        { key: `activities.${n}.title`, label: `Activité ${n} — Titre` },
        { key: `activities.${n}.desc`, label: `Activité ${n} — Description`, multiline: true },
      ])),
    ],
  },
  {
    id: "schedule",
    label: "Programme",
    fields: [
      { key: "schedule.eyebrow", label: "Étiquette de section" },
      { key: "schedule.title", label: "Titre de section" },
      { key: "schedule.count", label: "Nombre d'étapes (1–9)", number: true, hint: "Seules les étapes avec un titre sont affichées." },
      ...([1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [
        { key: `schedule.${n}.time`, label: `Étape ${n} — Heure (ex. 09:00)` },
        { key: `schedule.${n}.title`, label: `Étape ${n} — Titre` },
        { key: `schedule.${n}.desc`, label: `Étape ${n} — Description`, multiline: true },
      ])),
    ],
  },
  {
    id: "prizes",
    label: "Prix",
    fields: [
      { key: "prizes.eyebrow", label: "Étiquette de section" },
      { key: "prizes.title", label: "Titre de section" },
      { key: "prizes.first.label", label: "Libellé 1er prix" },
      { key: "prizes.first", label: "Montant 1er prix (FCFA)" },
      { key: "prizes.second.label", label: "Libellé 2e prix" },
      { key: "prizes.second", label: "Montant 2e prix (FCFA)" },
      { key: "prizes.third.label", label: "Libellé 3e prix" },
      { key: "prizes.third", label: "Montant 3e prix (FCFA)" },
      { key: "prizes.perk.1", label: "Avantage 1", multiline: true },
      { key: "prizes.perk.2", label: "Avantage 2", multiline: true },
      { key: "prizes.perk.3", label: "Avantage 3", multiline: true },
    ],
  },
  {
    id: "tickets",
    label: "Billets",
    fields: [
      { key: "tickets.eyebrow", label: "Étiquette de section" },
      { key: "tickets.title", label: "Titre de section" },
      { key: "tickets.body", label: "Description", multiline: true },
      { key: "tickets.cta.free", label: "Texte bouton gratuit" },
      { key: "tickets.cta.paid", label: "Texte bouton payant" },
    ],
  },
  {
    id: "category-visiteur",
    label: "Pass Visiteur",
    fields: [
      { key: "category.visiteur.label", label: "Nom du pass" },
      { key: "category.visiteur.tagline", label: "Phrase d'accroche" },
      { key: "category.visiteur.fee", label: "Prix (FCFA, 0 = gratuit)", number: true },
      { key: "category.visiteur.perks", label: "Avantages (un par ligne)", multiline: true, hint: "Un avantage par ligne. Ex :\nAccès aux Keynotes\nAccès aux Panels" },
    ],
  },
  {
    id: "category-adulte",
    label: "Formation Adulte",
    fields: [
      { key: "category.formation_adulte.label", label: "Nom du pass" },
      { key: "category.formation_adulte.tagline", label: "Phrase d'accroche" },
      { key: "category.formation_adulte.fee", label: "Prix (FCFA)", number: true },
      { key: "category.formation_adulte.perks", label: "Avantages (un par ligne)", multiline: true, hint: "Un avantage par ligne." },
    ],
  },
  {
    id: "category-kids",
    label: "Formation Kids",
    fields: [
      { key: "category.formation_kids.label", label: "Nom du pass" },
      { key: "category.formation_kids.tagline", label: "Phrase d'accroche" },
      { key: "category.formation_kids.fee", label: "Prix (FCFA)", number: true },
      { key: "category.formation_kids.perks", label: "Avantages (un par ligne)", multiline: true, hint: "Un avantage par ligne." },
    ],
  },
  {
    id: "audience",
    label: "Public",
    fields: [
      { key: "audience.eyebrow", label: "Étiquette de section" },
      { key: "audience.title", label: "Titre de section" },
      { key: "audience.members", label: "Profils (un par ligne)", multiline: true, hint: "Un profil par ligne. Ex :\nÉtudiants\nJeunes diplômés" },
    ],
  },
  {
    id: "cta",
    label: "Boutons / CTA",
    fields: [
      { key: "cta.final.title", label: "Titre section finale" },
      { key: "cta.final.primary", label: "Bouton principal CTA final" },
      { key: "cta.final.secondary", label: "Bouton secondaire CTA final" },
      { key: "nav.cta", label: "Bouton nav (haut de page)" },
    ],
  },
  {
    id: "footer",
    label: "Pied de page",
    fields: [
      { key: "footer.tagline", label: "Slogan sous le logo" },
      { key: "footer.contact", label: "Email de contact" },
      { key: "footer.copyright", label: "Mention copyright" },
      { key: "footer.made", label: "Mention créateur" },
    ],
  },
];

export function ContentPanel() {
  const [tab, setTab] = useState("hero");
  const [content, setContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirty = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((payload) => {
        if (payload.success) {
          setContent({ ...DEFAULT_SITE_CONTENT, ...payload.data });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function update(key: string, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
    dirty.current.add(key);
  }

  async function save() {
    if (dirty.current.size === 0) { toast.info("Aucune modification."); return; }
    setSaving(true);
    try {
      const patch = Object.fromEntries([...dirty.current].map((k) => [k, content[k] ?? ""]));
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Erreur.");
      dirty.current.clear();
      toast.success("Contenu enregistré.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(key: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Upload échoué.");
      update(key, payload.data.url);
      toast.success("Image uploadée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload.");
    }
  }

  const activeSection = CONTENT_SECTIONS.find((s) => s.id === tab);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Contenu du site</h2>
        <p className="panel-sub">Modifie les textes, boutons et options de formation affichés sur le site public.</p>
      </div>

      <div className="cms-tabs" style={{ flexWrap: "wrap" }}>
        {[...CONTENT_SECTIONS.map((s) => ({ id: s.id, label: s.label })), { id: "images", label: "Images" }].map((t) => (
          <button key={t.id} className={`cms-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cms-loading">Chargement...</div>
      ) : tab === "images" ? (
        <div className="cms-fields" style={{ paddingTop: 24 }}>
          {IMAGE_FIELDS.map((img) => (
            <div className="cms-field" key={img.key}>
              <label className="cms-label">{img.label}</label>
              <p className="cms-hint">{img.description}</p>
              {content[img.key] ? (
                <div className="cms-img-preview">
                  <Image src={content[img.key]} alt={img.label} width={120} height={72} />
                  <button className="btn btn-ghost btn-sm" onClick={() => update(img.key, "")}>Supprimer</button>
                </div>
              ) : null}
              <label className="cms-upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(img.key, file);
                  }}
                />
                <span>Cliquer pour uploader une image</span>
              </label>
            </div>
          ))}
          <div className="cms-actions">
            <button className="btn btn-grad" onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : activeSection ? (
        <div className="cms-fields">
          {activeSection.fields.map((field) => (
            <div className="cms-field" key={field.key}>
              <label className="cms-label">{field.label}</label>
              {field.hint ? <p className="cms-hint">{field.hint}</p> : null}
              {field.multiline ? (
                <textarea
                  className="cms-textarea"
                  value={content[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  rows={field.key.includes("perks") || field.key.includes("members") ? 5 : 3}
                />
              ) : (
                <input
                  className="cms-input"
                  type={field.number ? "number" : "text"}
                  value={content[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="cms-actions">
            <button className="btn btn-grad" onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
