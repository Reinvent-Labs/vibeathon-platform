import { EVENT } from "@/lib/constants";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
}

function frame(title: string, body: string) {
  return `<div style="background:#050807;color:#f4f7f5;padding:32px;font-family:Inter,Arial,sans-serif"><h1 style="font-family:Arial Narrow,Arial,sans-serif;text-transform:uppercase">${title}</h1>${body}<p style="color:#aab4b0">${EVENT.date} · ${EVENT.venue}</p></div>`;
}

export const emailTemplates = {
  registration: (name: string, reference: string) =>
    frame("Candidature reçue", `<p>Bonjour ${escapeHtml(name)}, ta candidature est enregistrée sous la référence <strong>${escapeHtml(reference)}</strong>.</p>`),
  selection: (name: string) =>
    frame("Tu es sélectionné·e", `<p>Félicitations ${escapeHtml(name)}. Confirme maintenant ta place depuis la page de suivi.</p>`),
  rejection: (name: string) =>
    frame("Résultat de ta candidature", `<p>Bonjour ${escapeHtml(name)}. Ta candidature n'a pas été retenue pour la compétition cette année.</p>`),
  badge: (name: string, badgeUrl: string) =>
    frame("Ton badge est prêt", `<p>${escapeHtml(name)}, ton paiement est confirmé.</p><p><a href="${escapeHtml(badgeUrl)}" style="color:#75FF8D">Afficher mon badge</a></p>`),
  reminder: (name: string) =>
    frame("VIBEATHON, c'est demain", `<p>${escapeHtml(name)}, pense à prendre ton badge et à arriver à partir de 07:30.</p>`),
};
