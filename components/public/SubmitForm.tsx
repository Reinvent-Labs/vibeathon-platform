"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Team = { id: string; name: string; label: string };
type FormPhase = "form" | "uploading" | "submitting" | "done";
type Result = { teamName: string };

export function SubmitForm() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [submissionsOpen, setSubmissionsOpen] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<FormPhase>("form");
  const [result, setResult] = useState<Result | null>(null);
  const slidesRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    teamId: "",
    demoUrl: "",
    repositoryUrl: "",
    description: "",
    testEmail: "",
    testPassword: "",
  });
  const [slidesFile, setSlidesFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/teams/list").then((r) => r.json()),
      fetch("/api/competition/status").then((r) => r.json()),
    ])
      .then(([teamsData, statusData]) => {
        if (teamsData.success) setTeams(teamsData.data);
        if (statusData.success) setSubmissionsOpen(statusData.data.submissionsOpen);
        else setSubmissionsOpen(true); // fallback open
      })
      .catch(() => setSubmissionsOpen(true))
      .finally(() => setTeamsLoading(false));
  }, []);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.teamId) { toast.error("Sélectionne ton équipe."); return; }

    // Step 1: upload slides if provided
    if (slidesFile) {
      setPhase("uploading");
      const fd = new FormData();
      fd.append("file", slidesFile);
      fd.append("teamId", form.teamId);
      const uploadRes = await fetch("/api/teams/upload-slides", { method: "POST", body: fd });
      const uploadPayload = await uploadRes.json();
      if (!uploadRes.ok || !uploadPayload.success) {
        toast.error(uploadPayload.error ?? "Erreur lors de l'upload des slides.");
        setPhase("form");
        return;
      }
    }

    // Step 2: submit project
    setPhase("submitting");
    try {
      // The rest of the system (browser-test agent, AI evaluator, jury view)
      // expects a single free-text credentials string — combine the two
      // clearer form fields into that same format here, so nothing else
      // needs to change.
      const testCredentials =
        form.testEmail || form.testPassword
          ? `Email : ${form.testEmail}\nMot de passe : ${form.testPassword}`
          : undefined;

      const res = await fetch("/api/teams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: form.teamId,
          demoUrl: form.demoUrl,
          repositoryUrl: form.repositoryUrl || undefined,
          description: form.description,
          testCredentials,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Soumission impossible.");
      setResult(payload.data);
      setPhase("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue.");
      setPhase("form");
    }
  }

  if (submissionsOpen === false) {
    return (
      <div className="ticket-success">
        <div className="ticket-success-icon" style={{ background: "color-mix(in srgb, var(--ink-faint) 15%, transparent)", borderColor: "var(--line)" }}>🔒</div>
        <h2>Soumissions fermées</h2>
        <p>La Phase 1 a démarré. Les soumissions ne sont plus acceptées.</p>
        <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          L'IA est en train d'évaluer tous les projets. Les résultats seront publiés sous peu.
        </p>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="submit-loading">
        <div className="submit-spinner" />
        <p>Upload des slides…</p>
        <span>Ne ferme pas cette page.</span>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="submit-loading">
        <div className="submit-spinner" />
        <p>Envoi en cours…</p>
        <span>Ne ferme pas cette page.</span>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="ticket-success">
        <div className="ticket-success-icon">✓</div>
        <h2>Votre dossier a été soumis !</h2>
        <p><strong>{result.teamName}</strong> — projet enregistré avec succès.</p>
        <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          Un e-mail de confirmation vient de vous être envoyé. Vous recevrez les résultats dès que l&apos;évaluation sera terminée.
        </p>
        <div className="cluster" style={{ justifyContent: "center", marginTop: 24 }}>
          <button type="button" className="btn btn-ghost"
            onClick={() => { setPhase("form"); setResult(null); setSlidesFile(null); }}>
            Nouvelle soumission
          </button>
          <Link href="/" className="btn btn-ghost">Accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="ticket-form-wrap" onSubmit={handleSubmit}>
      <div className="ticket-fields">

        {/* Team selector */}
        <div className="field">
          <label htmlFor="teamId">
            Ton équipe <span className="req">*</span>
          </label>
          {teamsLoading ? (
            <div className="input input-placeholder">Chargement des équipes…</div>
          ) : teams.length === 0 ? (
            <div className="input input-placeholder" style={{ color: "var(--ink-faint)" }}>
              Aucune équipe disponible pour l&apos;instant.
            </div>
          ) : (
            <select
              id="teamId"
              className="input"
              required
              value={form.teamId}
              onChange={(e) => update("teamId", e.target.value)}
            >
              <option value="">— Sélectionne ton équipe —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Demo URL */}
        <div className="field">
          <label htmlFor="demoUrl">
            URL de la démo <span className="req">*</span>
          </label>
          <input
            id="demoUrl"
            className="input"
            required
            type="url"
            value={form.demoUrl}
            onChange={(e) => update("demoUrl", e.target.value)}
            placeholder="https://mon-app.vercel.app"
          />
        </div>

        {/* Repo URL — optional */}
        <div className="field">
          <label htmlFor="repositoryUrl">Dépôt GitHub <span className="opt">(optionnel)</span></label>
          <input
            id="repositoryUrl"
            className="input"
            type="url"
            value={form.repositoryUrl}
            onChange={(e) => update("repositoryUrl", e.target.value)}
            placeholder="https://github.com/mon-equipe/mon-projet"
          />
        </div>

        {/* Test credentials — optional, split for clarity */}
        <div className="field">
          <label htmlFor="testEmail">
            Email / identifiant de test <span className="opt">(optionnel · si ton app demande une connexion)</span>
          </label>
          <input
            id="testEmail"
            className="input"
            type="text"
            maxLength={200}
            value={form.testEmail}
            onChange={(e) => update("testEmail", e.target.value)}
            placeholder="demo@monapp.com"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="testPassword">
            Mot de passe de test <span className="opt">(optionnel)</span>
          </label>
          <input
            id="testPassword"
            className="input"
            type="text"
            maxLength={200}
            value={form.testPassword}
            onChange={(e) => update("testPassword", e.target.value)}
            placeholder="Demo1234"
            autoComplete="off"
          />
          <p className="form-note" style={{ marginTop: 6 }}>
            Utilisés par l&apos;IA et le jury pour tester ton application. Crée un compte de démonstration, pas un compte réel.
          </p>
        </div>

        {/* Slides upload — optional */}
        <div className="field">
          <label htmlFor="slides">Slides de présentation <span className="opt">(optionnel · PDF, max 30 Mo)</span></label>
          <div
            className={`file-drop${slidesFile ? " has-file" : ""}`}
            onClick={() => slidesRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.type === "application/pdf") setSlidesFile(f);
              else toast.error("Utilise un fichier PDF.");
            }}
          >
            {slidesFile ? (
              <>
                <span className="file-drop-icon">📄</span>
                <span className="file-drop-name">{slidesFile.name}</span>
                <button type="button" className="file-drop-clear"
                  onClick={(e) => { e.stopPropagation(); setSlidesFile(null); if (slidesRef.current) slidesRef.current.value = ""; }}>
                  ✕
                </button>
              </>
            ) : (
              <>
                <span className="file-drop-icon">⬆</span>
                <span>Glisse ton PDF ici ou clique pour choisir</span>
              </>
            )}
            <input
              ref={slidesRef}
              id="slides"
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSlidesFile(f);
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="description">
            Description du projet <span className="req">*</span>
          </label>
          <textarea
            id="description"
            className="input"
            required
            rows={6}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Décris le problème, ta solution, les outils IA utilisés et l'impact attendu (200–500 mots). L'IA utilisera ce texte pour évaluer ton projet."
            style={{ resize: "vertical", minHeight: 130 }}
          />
        </div>

        <button type="submit" className="btn btn-grad btn-block">
          Soumettre mon projet →
        </button>
        <p className="form-note">
          Vous recevrez un e-mail de confirmation, puis les résultats une fois l&apos;évaluation terminée.
        </p>
      </div>
    </form>
  );
}
