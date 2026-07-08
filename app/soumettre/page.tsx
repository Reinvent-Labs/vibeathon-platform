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
      <div className="split">
        <aside className="aside">
          <div className="top">
            <span className="eyebrow">Compétition · Vibe Coding</span>
            <h1>
              Soumets<br />
              <span className="grad-text-lt">ton projet.</span>
            </h1>
            <p className="lede">
              Sélectionne ton équipe, dépose l&apos;URL de ta démo et tes slides.
              L&apos;IA évalue ton projet instantanément et le jury voit les résultats en temps réel.
            </p>
          </div>
          <div className="facts">
            <div className="fact">
              <span className="k" style={{ background: "#75FF8D" }} />
              <div>
                <b>Évaluation instantanée</b>
                <span>Score IA généré en 15–30 secondes après soumission.</span>
              </div>
            </div>
            <div className="fact">
              <span className="k" style={{ background: "#BA77FF" }} />
              <div>
                <b>Visible par le jury</b>
                <span>Les scores IA et slides apparaissent dans le tableau du jury.</span>
              </div>
            </div>
            <div className="fact">
              <span className="k" style={{ background: "#FF57E3" }} />
              <div>
                <b>Une seule soumission</b>
                <span>La dernière soumission écrase la précédente. Assurez-vous que tout est prêt.</span>
              </div>
            </div>
          </div>
        </aside>
        <div className="formcol">
          <SubmitForm />
        </div>
      </div>
    </div>
  );
}
