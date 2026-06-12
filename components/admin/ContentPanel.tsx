"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SITE_CONTENT } from "@/lib/cms-defaults";

type ContentMap = Record<string, string>;

type ImageField = { key: string; label: string; description: string };

const IMAGE_FIELDS: ImageField[] = [
  { key: "image.hero", label: "Image héro (fond)", description: "Arrière-plan de la section principale. JPG ou PNG, minimum 1920×1080px." },
  { key: "image.about", label: "Image section À propos", description: "Photo ou visuel pour la section concept." },
  { key: "image.organizer", label: "Logo organisateur", description: "Logo principal de l'organisateur, fond transparent recommandé." },
];

const CONTENT_SECTIONS = [
  {
    id: "hero",
    label: "Héro",
    fields: [
      { key: "hero.title", label: "Titre principal", multiline: false },
      { key: "hero.subtitle", label: "Sous-titre", multiline: true },
      { key: "hero.date", label: "Date", multiline: false },
      { key: "hero.venue", label: "Lieu", multiline: false },
    ],
  },
  {
    id: "stats",
    label: "Chiffres clés",
    fields: [
      { key: "stats.participants", label: "Nombre d'inscrits", multiline: false },
      { key: "stats.competitors", label: "Nombre de compétiteurs", multiline: false },
      { key: "stats.prize", label: "Dotation totale (FCFA)", multiline: false },
    ],
  },
  {
    id: "prizes",
    label: "Prix",
    fields: [
      { key: "prizes.first", label: "1er prix", multiline: false },
      { key: "prizes.second", label: "2e prix", multiline: false },
      { key: "prizes.third", label: "3e prix", multiline: false },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    fields: [{ key: "footer.contact", label: "Email de contact", multiline: false }],
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
        <p className="panel-sub">Modifie les textes et images affichés sur le site public.</p>
      </div>

      <div className="cms-tabs">
        {[...CONTENT_SECTIONS.map((s) => ({ id: s.id, label: s.label })), { id: "images", label: "Images" }].map((t) => (
          <button key={t.id} className={`cms-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cms-loading">Chargement...</div>
      ) : tab === "images" ? (
        <div className="cms-fields">
          {IMAGE_FIELDS.map((img) => (
            <div className="cms-field" key={img.key}>
              <label className="cms-label">{img.label}</label>
              <p className="cms-hint">{img.description}</p>
              {content[img.key] ? (
                <div className="cms-img-preview">
                  <img src={content[img.key]} alt={img.label} />
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
              {field.multiline ? (
                <textarea
                  className="cms-textarea"
                  value={content[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <input
                  className="cms-input"
                  type="text"
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
