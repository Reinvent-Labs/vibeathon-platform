"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplateDefault } from "@/lib/cms-defaults";

type SavedTemplate = EmailTemplateDefault & { isCustomized: boolean };

const PLACEHOLDER_HELP = "Variables disponibles : {{name}} (prénom), {{statusUrl}} (lien statut), {{badgeUrl}} (lien badge), {{reference}} (référence), {{categoryLabel}} (type de billet)";

function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" className={`rich-btn ${editor.isActive("bold") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()}>G</button>
        <button type="button" className={`rich-btn ${editor.isActive("italic") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className={`rich-btn ${editor.isActive("bulletList") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>•—</button>
        <button type="button" className="rich-btn" onClick={() => {
          const url = prompt("URL du lien :");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}>Lien</button>
        <button type="button" className="rich-btn" onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</button>
      </div>
      <EditorContent editor={editor} className="rich-content" />
    </div>
  );
}

export function EmailTemplatesPanel() {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [form, setForm] = useState<EmailTemplateDefault | null>(null);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((p) => {
        if (p.success) {
          setTemplates(p.data);
          if (p.data.length > 0 && !activeSlug) {
            setActiveSlug(p.data[0].slug);
            setForm(p.data[0]);
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTemplate(tpl: SavedTemplate) {
    setActiveSlug(tpl.slug);
    setForm({ ...tpl });
    setPreview(false);
  }

  function updateField(key: keyof EmailTemplateDefault, value: string) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function save() {
    if (!form || !activeSlug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${activeSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Erreur.");
      setTemplates((prev) => prev.map((t) => t.slug === activeSlug ? { ...t, ...form, isCustomized: true } : t));
      toast.success("Template enregistré.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!activeSlug) return;
    const def = DEFAULT_EMAIL_TEMPLATES.find((t) => t.slug === activeSlug);
    if (!def) return;
    await fetch(`/api/admin/email-templates/${activeSlug}`, { method: "DELETE" });
    setForm({ ...def });
    setTemplates((prev) => prev.map((t) => t.slug === activeSlug ? { ...def, isCustomized: false } : t));
    toast.success("Template réinitialisé aux valeurs par défaut.");
  }

  async function sendTest() {
    if (!activeSlug || !testEmail) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${activeSlug}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Envoi échoué.");
      toast.success(`Email de test envoyé à ${testEmail}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi.");
    } finally {
      setSending(false);
    }
  }

  const handleBodyChange = useCallback((html: string) => updateField("bodyHtml", html), []);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Templates email</h2>
        <p className="panel-sub">Modifie les emails envoyés automatiquement aux participants.</p>
      </div>

      <div className="email-tpl-layout">
        <aside className="email-tpl-list">
          {templates.map((tpl) => (
            <button
              key={tpl.slug}
              className={`email-tpl-item ${activeSlug === tpl.slug ? "active" : ""}`}
              onClick={() => selectTemplate(tpl)}
            >
              <span className="email-tpl-name">{tpl.label}</span>
              {tpl.isCustomized ? <span className="email-tpl-badge">Modifié</span> : null}
            </button>
          ))}
        </aside>

        {form ? (
          <div className="email-tpl-editor">
            <div className="email-tpl-tabs">
              <button className={`cms-tab ${!preview ? "active" : ""}`} onClick={() => setPreview(false)}>Éditeur</button>
              <button className={`cms-tab ${preview ? "active" : ""}`} onClick={() => setPreview(true)}>Aperçu</button>
            </div>

            {preview ? (
              <iframe
                srcDoc={buildPreview(form)}
                className="email-tpl-preview"
                title="Aperçu email"
                sandbox=""
              />
            ) : (
              <div className="email-tpl-fields">
                <div className="cms-field">
                  <label className="cms-label">Sujet</label>
                  <input className="cms-input" value={form.subject} onChange={(e) => updateField("subject", e.target.value)} />
                </div>
                <div className="cms-field">
                  <label className="cms-label">Étiquette (petit texte au-dessus du titre)</label>
                  <input className="cms-input" value={form.eyebrow} onChange={(e) => updateField("eyebrow", e.target.value)} />
                </div>
                <div className="cms-field">
                  <label className="cms-label">Titre principal</label>
                  <input className="cms-input" value={form.title} onChange={(e) => updateField("title", e.target.value)} />
                </div>
                <div className="cms-field">
                  <label className="cms-label">Introduction (premier paragraphe)</label>
                  <textarea className="cms-textarea" rows={3} value={form.introduction} onChange={(e) => updateField("introduction", e.target.value)} />
                </div>
                <div className="cms-field">
                  <label className="cms-label">Corps du message</label>
                  <RichEditor value={form.bodyHtml} onChange={handleBodyChange} />
                </div>
                <div className="cms-field">
                  <label className="cms-label">Texte du bouton (laisser vide pour masquer le bouton)</label>
                  <input className="cms-input" value={form.actionLabel} onChange={(e) => updateField("actionLabel", e.target.value)} />
                </div>
                <p className="cms-hint">{PLACEHOLDER_HELP}</p>
              </div>
            )}

            <div className="email-tpl-footer">
              <div className="email-tpl-test">
                <input
                  className="cms-input"
                  type="email"
                  placeholder="Email pour test..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button className="btn btn-ghost" onClick={sendTest} disabled={sending || !testEmail}>
                  {sending ? "Envoi..." : "Envoyer un test"}
                </button>
              </div>
              <div className="email-tpl-actions">
                <button className="btn btn-ghost btn-sm" onClick={reset}>Réinitialiser</button>
                <button className="btn btn-grad" onClick={save} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildPreview(form: EmailTemplateDefault): string {
  const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!);
  const fill = (t: string) => t.replace(/\{\{name\}\}/g, "Kouamé").replace(/\{\{categoryLabel\}\}/g, "Pass Visiteur").replace(/\{\{reference\}\}/g, "VBT-2026-001").replace(/\{\{statusUrl\}\}/g, "#").replace(/\{\{badgeUrl\}\}/g, "#");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>body{margin:0;background:#050807;color:#f4f7f5;font-family:Inter,Arial,sans-serif}p{margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7}</style></head><body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050807;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #25302c;border-radius:24px;overflow:hidden;background:#0d1512">
        <tr><td style="padding:30px 34px 22px;border-bottom:1px solid #25302c"><strong style="color:#fff;font-size:18px">VIBEATHON 2026</strong></td></tr>
        <tr><td style="padding:38px 34px 16px">
          <p style="margin:0 0 14px;color:#ba77ff;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">${esc(fill(form.eyebrow))}</p>
          <h1 style="margin:0;font-size:36px;line-height:1.1;text-transform:uppercase;color:#fff">${esc(fill(form.title))}</h1>
          <div style="width:100%;height:6px;margin:24px 0;background:linear-gradient(90deg,#07851d,#ba77ff,#ef53d9);border-radius:99px"></div>
          <p style="margin:0;color:#c9d1ce;font-size:17px;line-height:1.65">${esc(fill(form.introduction))}</p>
        </td></tr>
        ${form.bodyHtml ? `<tr><td style="padding:12px 34px 6px">${fill(form.bodyHtml)}</td></tr>` : ""}
        ${form.actionLabel ? `<tr><td style="padding:28px 34px 40px"><a href="#" style="display:inline-block;padding:15px 24px;border-radius:999px;background:linear-gradient(90deg,#07851d,#832edc,#ef53d9);color:#fff;text-decoration:none;font-size:15px;font-weight:800">${esc(form.actionLabel)} →</a></td></tr>` : ""}
        <tr><td style="padding:24px 34px;border-top:1px solid #25302c;background:#09100d;color:#8d9a95;font-size:13px">Samedi 11 juillet 2026 · CSCTICAO, Abidjan</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
