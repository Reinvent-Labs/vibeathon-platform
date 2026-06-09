"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

export function BadgeActions() {
  async function downloadBadge() {
    const node = document.getElementById("participant-badge");
    if (!node) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(node, { backgroundColor: "#050807", scale: 2 });
      const link = document.createElement("a");
      link.download = "badge-vibeathon-2026.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.error("Le téléchargement a échoué. Utilise l'impression à la place.");
    }
  }

  return (
    <div className="badge-actions">
      <button className="btn btn-grad" onClick={downloadBadge}><Download size={18} /> Télécharger le badge</button>
      <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={18} /> Imprimer</button>
      <Link href="/" className="btn btn-ghost">Accueil</Link>
    </div>
  );
}
