import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Créer mon mot de passe" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.mustChangePassword) {
    redirect(
      session.role === "JURY"
        ? "/jury"
        : session.role === "SCANNER"
          ? "/scan"
          : "/admin",
    );
  }
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
      </div>
      <div className="auth-card surface">
        <span className="eyebrow">Première connexion</span>
        <h1 className="display">
          Sécurise
          <br />
          <span className="grad-text-lt">ton compte.</span>
        </h1>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
