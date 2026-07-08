import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuroraMesh } from "@/components/AuroraMesh";

export default function NotFound() {
  return (
    <main className="page-shell empty-state">
      <AuroraMesh />
      <Logo size={160} />
      <p className="eyebrow">404</p>
      <h1 className="display">
        Page<br /><span className="grad-text-lt">introuvable.</span>
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 17, maxWidth: 380, margin: 0 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn btn-grad">Retour à l&apos;accueil →</Link>
    </main>
  );
}
