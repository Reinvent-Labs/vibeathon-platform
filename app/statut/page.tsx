import type { Metadata } from "next";
import Link from "next/link";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { StatusLookup } from "@/components/public/StatusLookup";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Mon statut" };

export default function StatusPage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      <Suspense fallback={<div className="lookup-wrap">Chargement...</div>}><StatusLookup /></Suspense>
    </div>
  );
}
