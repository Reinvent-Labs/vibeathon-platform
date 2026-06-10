import type { Metadata } from "next";
import Link from "next/link";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { EVENT } from "@/lib/constants";

export const metadata: Metadata = { title: "Candidature" };

export default function CandidaturePage() {
  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/" className="back">← Retour à l&apos;accueil</Link>
      </div>
      <div className="split">
        <aside className="aside">
          <div className="top">
            <span className="eyebrow">Candidature</span>
            <h1>Fais vibrer<br /><span className="grad-text-lt">ton idée.</span></h1>
            <p className="lede">
              Dépose ta candidature en 2 minutes. Après étude du dossier, les
              personnes acceptées devront payer pour confirmer leur place parmi
              les 100 participants du bootcamp et de la compétition.
            </p>
          </div>
          <div className="facts">
            <div className="fact"><span className="k" style={{ background: "#75FF8D" }} /><div><b>{EVENT.date}</b><span>{EVENT.venue}</span></div></div>
            <div className="fact"><span className="k" style={{ background: "#BA77FF" }} /><div><b>Gratuit pour candidater</b><span>Frais après sélection</span></div></div>
            <div className="fact"><span className="k" style={{ background: "#FF57E3" }} /><div><b>Aucune compétence en code requise</b><span>Crée avec l&apos;IA</span></div></div>
          </div>
        </aside>
        <div className="formcol"><RegistrationForm /></div>
      </div>
    </div>
  );
}
