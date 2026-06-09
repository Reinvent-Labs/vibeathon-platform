"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell empty-state">
      <p className="eyebrow">Erreur</p>
      <h1 className="display">Quelque chose<br /><span className="grad-text-lt">a déraillé.</span></h1>
      <button className="btn btn-grad" onClick={reset}>Réessayer</button>
    </main>
  );
}
