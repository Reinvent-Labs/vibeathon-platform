import type { Metadata } from "next";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Connexion staff" };

export default function LoginPage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav"><Logo size={145} /></div>
      <div className="auth-card surface">
        <span className="eyebrow">Accès sécurisé</span>
        <h1 className="display">Espace<br /><span className="grad-text-lt">staff.</span></h1>
        <Suspense fallback={<p>Chargement...</p>}><LoginForm /></Suspense>
      </div>
    </div>
  );
}
