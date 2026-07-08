import type { Metadata } from "next";
import { SubmitForm } from "@/components/public/SubmitForm";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export const metadata: Metadata = { title: "Soumettre mon projet — VIBEATHON 2026" };

export default function SoumettreePage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      <div className="form-wrap">
        <div className="form-intro">
          <span className="eyebrow">Compétition · Vibe Coding</span>
          <h1 className="display">
            Soumets ton<br />
            <span className="grad-text-lt">projet.</span>
          </h1>
          <p>
            Renseigne le nom de ton équipe, l&apos;URL de ta démo et une description.
            Notre IA évalue le projet instantanément.
          </p>
        </div>
        <SubmitForm />
      </div>
    </div>
  );
}
