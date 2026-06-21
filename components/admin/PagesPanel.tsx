"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, ExternalLink } from "lucide-react";

type Page = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  published: boolean;
  updatedAt: string;
};

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function RichEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  const btn = (action: () => void, label: string, active?: boolean) => (
    <button
      key={label}
      type="button"
      className={`editor-btn ${active ? "active" : ""}`}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      title={label}
    >
      {label}
    </button>
  );

  return (
    <div className="editor-wrap">
      <div className="editor-toolbar">
        {btn(() => editor.chain().focus().toggleBold().run(), "B", editor.isActive("bold"))}
        {btn(() => editor.chain().focus().toggleItalic().run(), "I", editor.isActive("italic"))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2", editor.isActive("heading", { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3", editor.isActive("heading", { level: 3 }))}
        {btn(() => editor.chain().focus().toggleBulletList().run(), "• Liste", editor.isActive("bulletList"))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), "1. Liste", editor.isActive("orderedList"))}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), "❝ Citation", editor.isActive("blockquote"))}
        {btn(() => editor.chain().focus().toggleCode().run(), "Code", editor.isActive("code"))}
        <button
          type="button"
          className="editor-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt("URL du lien :");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Lien"
        >
          Lien
        </button>
        {btn(() => editor.chain().focus().unsetLink().run(), "Suppr. lien")}
        <div style={{ flex: 1 }} />
        {btn(() => editor.chain().focus().undo().run(), "↩")}
        {btn(() => editor.chain().focus().redo().run(), "↪")}
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

export function PagesPanel() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Page> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/pages");
      const p = await r.json();
      if (p.success) setPages(p.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function newPage() {
    setEditing({ title: "", slug: "", description: "", content: "", published: false });
  }

  function editPage(page: Page) {
    setEditing({ ...page });
  }

  async function save() {
    if (!editing) return;
    if (!editing.title?.trim()) { toast.error("Titre requis."); return; }
    if (!editing.slug?.trim()) { toast.error("Slug requis."); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const p = await r.json();
      if (!r.ok || !p.success) throw new Error(p.error ?? "Erreur.");
      toast.success(isNew ? "Page créée." : "Page enregistrée.");
      setEditing(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(page: Page) {
    try {
      const r = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !page.published }),
      });
      const p = await r.json();
      if (!r.ok || !p.success) throw new Error(p.error ?? "Erreur.");
      toast.success(page.published ? "Page dépubliée." : "Page publiée.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Supprimer cette page ?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      const p = await r.json();
      if (!r.ok || !p.success) throw new Error(p.error ?? "Erreur.");
      toast.success("Page supprimée.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setDeleting(null);
    }
  }

  if (editing !== null) {
    return (
      <div className="panel">
        <div className="panel-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
              <ArrowLeft size={15} /> Retour
            </button>
            <h2 className="panel-title" style={{ margin: 0 }}>
              {editing.id ? "Modifier la page" : "Nouvelle page"}
            </h2>
          </div>
        </div>

        <div className="cms-fields">
          <div className="cms-field">
            <label className="cms-label">Titre</label>
            <input
              className="cms-input"
              value={editing.title ?? ""}
              onChange={(e) => {
                const title = e.target.value;
                setEditing((prev) => ({
                  ...prev,
                  title,
                  slug: prev?.id ? prev.slug : slugify(title),
                }));
              }}
              placeholder="Ex. À propos du VIBEATHON"
            />
          </div>

          <div className="cms-field">
            <label className="cms-label">Slug (URL)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--ink-faint)", fontSize: 13 }}>/p/</span>
              <input
                className="cms-input"
                style={{ flex: 1 }}
                value={editing.slug ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                placeholder="a-propos"
              />
            </div>
            {editing.slug ? (
              <a href={`/p/${editing.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <ExternalLink size={12} /> Voir la page
              </a>
            ) : null}
          </div>

          <div className="cms-field">
            <label className="cms-label">Description (meta SEO)</label>
            <input
              className="cms-input"
              value={editing.description ?? ""}
              onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Courte description affichée dans les résultats de recherche"
            />
          </div>

          <div className="cms-field">
            <label className="cms-label">Contenu</label>
            <RichEditor
              content={editing.content ?? ""}
              onChange={(html) => setEditing((prev) => ({ ...prev, content: html }))}
            />
          </div>

          <div className="cms-field">
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editing.published ?? false}
                onChange={(e) => setEditing((prev) => ({ ...prev, published: e.target.checked }))}
              />
              <span className="cms-label" style={{ margin: 0 }}>Publier (visible sur le site)</span>
            </label>
          </div>

          <div className="cms-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
            <button className="btn btn-grad" onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 className="panel-title">Pages</h2>
          <p className="panel-sub">Crée et gère les pages du site accessibles via <code>/p/slug</code>.</p>
        </div>
        <button className="btn btn-grad btn-sm" onClick={newPage}>
          <Plus size={15} /> Nouvelle page
        </button>
      </div>

      {loading ? (
        <div className="cms-loading">Chargement...</div>
      ) : pages.length === 0 ? (
        <div className="cms-empty">
          <p>Aucune page créée.</p>
          <button className="btn btn-grad" onClick={newPage}><Plus size={15} /> Créer la première page</button>
        </div>
      ) : (
        <div className="pages-list">
          {pages.map((page) => (
            <div key={page.id} className="page-row">
              <div className="page-info">
                <div className="page-title-row">
                  <span className="page-title">{page.title}</span>
                  <span className={`page-badge ${page.published ? "published" : "draft"}`}>
                    {page.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="page-slug">
                  /p/{page.slug} <ExternalLink size={11} />
                </a>
                {page.description ? <p className="page-desc">{page.description}</p> : null}
              </div>
              <div className="page-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => togglePublish(page)}
                  title={page.published ? "Dépublier" : "Publier"}
                >
                  {page.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => editPage(page)}>
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#ff4d8d" }}
                  onClick={() => deletePage(page.id)}
                  disabled={deleting === page.id}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
