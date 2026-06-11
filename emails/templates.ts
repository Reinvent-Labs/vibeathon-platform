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

function frame({
  appUrl,
  eyebrow,
  title,
  introduction,
  content,
  action,
}: {
  appUrl: string;
  eyebrow: string;
  title: string;
  introduction: string;
  content?: string;
  action?: { label: string; url: string };
}) {
  const safeAppUrl = escapeHtml(appUrl.replace(/\/$/, ""));
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#050807;color:#f4f7f5;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(introduction)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050807;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #25302c;border-radius:24px;overflow:hidden;background:#0d1512">
            <tr>
              <td style="padding:30px 34px 22px;border-bottom:1px solid #25302c">
                <img src="${safeAppUrl}/logo-white.png" width="190" alt="VIBEATHON 2026" style="display:block;width:190px;max-width:65%;height:auto">
              </td>
            </tr>
            <tr>
              <td style="padding:38px 34px 16px">
                <p style="margin:0 0 14px;color:#ba77ff;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0;font-family:'Arial Narrow',Arial,sans-serif;font-size:42px;line-height:1.02;letter-spacing:-1px;text-transform:uppercase;color:#ffffff">${escapeHtml(title)}</h1>
                <div style="width:100%;height:6px;margin:24px 0;background:linear-gradient(90deg,#07851d,#ba77ff,#ef53d9);border-radius:99px"></div>
                <p style="margin:0;color:#c9d1ce;font-size:17px;line-height:1.65">${escapeHtml(introduction)}</p>
              </td>
            </tr>
            ${
              content
                ? `<tr><td style="padding:12px 34px 6px">${content}</td></tr>`
                : ""
            }
            ${
              action
                ? `<tr>
                    <td style="padding:28px 34px 40px">
                      <a href="${escapeHtml(action.url)}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:linear-gradient(90deg,#07851d,#832edc,#ef53d9);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800">${escapeHtml(action.label)} →</a>
                    </td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding:24px 34px;border-top:1px solid #25302c;background:#09100d;color:#8d9a95;font-size:13px;line-height:1.6">
                <strong style="color:#f4f7f5">${EVENT.date}</strong><br>
                ${EVENT.venue}<br>
                <a href="mailto:contact@vibeathonci.com" style="color:#ba77ff;text-decoration:none">contact@vibeathonci.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function infoCard(label: string, value: string) {
  return `<div style="padding:18px;border:1px solid #2b3732;border-radius:16px;background:#111b17">
    <div style="margin-bottom:7px;color:#8d9a95;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase">${escapeHtml(label)}</div>
    <div style="color:#ffffff;font-size:16px;font-weight:700">${escapeHtml(value)}</div>
  </div>`;
}

export const emailTemplates = {
  staffInvitation: ({
    name,
    role,
    email,
    temporaryPassword,
    loginUrl,
    appUrl,
  }: {
    name: string;
    role: string;
    email: string;
    temporaryPassword: string;
    loginUrl: string;
    appUrl: string;
  }) =>
    frame({
      appUrl,
      eyebrow: "Accès équipe VIBEATHON",
      title: "Votre compte staff est prêt",
      introduction: `Bonjour ${name}, un accès ${role} vient d'être créé pour vous sur la plateforme VIBEATHON 2026.`,
      content: `${infoCard("Adresse de connexion", email)}
        ${infoCard("Mot de passe temporaire", temporaryPassword)}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.65">Pour votre sécurité, ce mot de passe doit être remplacé dès la première connexion. Ne le transférez à personne.</p>`,
      action: { label: "Se connecter", url: loginUrl },
    }),

  staffPasswordReset: ({
    name,
    email,
    temporaryPassword,
    loginUrl,
    appUrl,
  }: {
    name: string;
    email: string;
    temporaryPassword: string;
    loginUrl: string;
    appUrl: string;
  }) =>
    frame({
      appUrl,
      eyebrow: "Sécurité du compte",
      title: "Votre accès a été réinitialisé",
      introduction: `Bonjour ${name}, un nouveau mot de passe temporaire a été généré pour votre compte VIBEATHON.`,
      content: `${infoCard("Adresse de connexion", email)}
        ${infoCard("Nouveau mot de passe temporaire", temporaryPassword)}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.65">L'ancien mot de passe ne fonctionne plus. Vous devrez choisir un nouveau mot de passe personnel après connexion.</p>`,
      action: { label: "Se connecter", url: loginUrl },
    }),

  registration: (name: string, reference: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Candidature enregistrée",
      title: "Bienvenue dans l'aventure",
      introduction: `Bonjour ${name}, ta candidature VIBEATHON a bien été enregistrée.`,
      content: infoCard("Référence du dossier", reference),
      action: {
        label: "Suivre ma candidature",
        url: `${appUrl}/statut`,
      },
    }),

  resultsAvailable: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Résultats VIBEATHON 2026",
      title: "Les résultats sont disponibles",
      introduction: `Bonjour ${name}, l'étude des candidatures est terminée. Consulte maintenant ton espace de suivi pour découvrir la décision.`,
      content: infoCard("Comment consulter", "Utilise l'adresse email de ta candidature"),
      action: { label: "Vérifier mon statut", url: statusUrl },
    }),

  selection: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Dossier accepté",
      title: "Tu passes à l'étape suivante",
      introduction: `Félicitations ${name}. Ton dossier est accepté. Ta place au bootcamp et à la compétition sera confirmée après le paiement.`,
      content: `${infoCard("Statut", "Accepté · paiement en attente")}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.6">Ouvre ton espace de suivi, vérifie tes informations puis finalise le paiement pour recevoir ton badge QR.</p>`,
      action: { label: "Voir mon statut et payer", url: statusUrl },
    }),

  rejection: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Résultat de candidature",
      title: "Merci pour ta candidature",
      introduction: `Bonjour ${name}. Ton dossier n'a pas été retenu pour les 100 places de la compétition cette année.`,
      content:
        '<p style="margin:0;color:#c9d1ce;font-size:14px;line-height:1.65">Cette décision ne remet pas en cause la qualité de ton profil. Continue à créer, expérimenter et faire avancer tes idées.</p>',
      action: { label: "Consulter mon statut", url: statusUrl },
    }),

  /** Official selection email — competition, with payment link + deadline. */
  competitionSelected: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Sélection · Compétition Vibe Coding",
      title: "Félicitations, vous êtes sélectionné(e)",
      introduction: `Bonjour ${name}, nous avons le plaisir de vous informer que votre candidature a été retenue pour participer à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026.`,
      content: `<p style="margin:0 0 16px;color:#c9d1ce;font-size:15px;line-height:1.7">Félicitations ! Vous faites partie des 100 participants sélectionnés pour cette première édition.</p>
        ${infoCard("Frais de participation", "20 000 FCFA")}
        ${infoCard("Date limite de paiement", "Mardi 16 juin 2026")}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:15px;line-height:1.7">Afin de confirmer définitivement votre participation, réglez vos frais via le bouton ci-dessous au plus tard le mardi 16 juin 2026. Passé ce délai, votre place pourra être attribuée à un candidat figurant sur la liste d'attente.</p>
        <p style="margin:14px 2px 0;color:#c9d1ce;font-size:15px;line-height:1.7">Les prochaines informations concernant le bootcamp et le déroulement de la compétition vous seront communiquées prochainement. À très bientôt pour cette belle aventure !</p>
        <p style="margin:14px 2px 0;color:#8d9a95;font-size:14px">L'équipe VIBEATHON Côte d'Ivoire</p>`,
      action: { label: "Régler mes frais de participation", url: statusUrl },
    }),

  /** Waitlist email — candidate kept in reserve. */
  competitionWaitlist: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Liste d'attente · Compétition Vibe Coding",
      title: "Votre candidature est sur liste d'attente",
      introduction: `Bonjour ${name}, nous vous remercions pour l'intérêt porté à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire et pour le temps consacré à votre candidature.`,
      content: `<p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Après évaluation des dossiers reçus, votre candidature a été placée sur liste d'attente.</p>
        <p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Compte tenu du nombre important de candidatures et des confirmations de participation encore en cours, des places pourraient se libérer dans les prochains jours. Nous vous invitons donc à rester attentif(ve) à vos emails.</p>
        <p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Si une place devient disponible, nous vous contacterons directement. Merci encore pour votre intérêt et votre confiance.</p>
        <p style="margin:14px 2px 0;color:#8d9a95;font-size:14px">L'équipe VIBEATHON Côte d'Ivoire</p>`,
      action: { label: "Consulter mon statut", url: statusUrl },
    }),

  /** Rejection email — not retained, invited to public activities. */
  competitionRejected: (name: string, _statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Résultat · Compétition Vibe Coding",
      title: "Résultat de votre candidature",
      introduction: `Bonjour ${name}, nous vous remercions sincèrement pour votre candidature à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026.`,
      content: `<p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Après analyse des informations fournies, nous regrettons de vous informer que votre candidature n'a pas été retenue pour cette édition.</p>
        <p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Cette décision est notamment liée à certains critères de sélection essentiels au bon déroulement du programme, tels que la disponibilité sur l'ensemble du parcours ou les conditions de participation définies dans l'appel à candidatures.</p>
        <p style="margin:0 0 14px;color:#c9d1ce;font-size:15px;line-height:1.7">Nous vous remercions pour l'intérêt porté à cette initiative et espérons pouvoir vous compter parmi nous pour les autres activités du VIBEATHON, notamment les keynotes, panels et ateliers de formation.</p>
        <p style="margin:14px 2px 0;color:#8d9a95;font-size:14px">L'équipe VIBEATHON Côte d'Ivoire</p>`,
      action: { label: "Découvrir les autres activités", url: appUrl },
    }),

  paymentReminder: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Place acceptée",
      title: "Finalise ton paiement",
      introduction: `${name}, ton dossier est accepté mais ta place n'est pas encore officielle. Le paiement confirme ton accès au bootcamp et à la compétition.`,
      content: `${infoCard("Montant", `${EVENT.fee.toLocaleString("fr-FR")} ${EVENT.currency}`)}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.6">Après confirmation, tu recevras automatiquement ton badge QR personnel.</p>`,
      action: { label: "Payer et confirmer ma place", url: statusUrl },
    }),

  paymentConfirmed: ({
    name,
    reference,
    badgeUrl,
    appUrl,
  }: {
    name: string;
    reference: string;
    badgeUrl: string;
    appUrl: string;
  }) =>
    frame({
      appUrl,
      eyebrow: "Paiement confirmé",
      title: "Ton badge est prêt",
      introduction: `Bienvenue officiellement au VIBEATHON, ${name}. Tu peux maintenant participer au bootcamp et à la compétition.`,
      content: `<div style="padding:24px;border:1px solid #2b3732;border-radius:20px;background:#ffffff;text-align:center">
          <img src="cid:vibeathon-qr" width="230" height="230" alt="QR code du badge ${escapeHtml(reference)}" style="display:block;width:230px;max-width:100%;height:auto;margin:0 auto">
          <p style="margin:14px 0 0;color:#050807;font-family:monospace;font-size:13px;font-weight:700">${escapeHtml(reference)}</p>
        </div>
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.6">Conserve cet email et présente ce QR code à l'accueil. Tu peux aussi télécharger la version complète de ton badge.</p>`,
      action: { label: "Afficher mon badge", url: badgeUrl },
    }),

  badgeReady: ({
    name,
    reference,
    badgeUrl,
    appUrl,
    categoryLabel,
  }: {
    name: string;
    reference: string;
    badgeUrl: string;
    appUrl: string;
    categoryLabel: string;
  }) =>
    frame({
      appUrl,
      eyebrow: `Pass ${categoryLabel}`,
      title: "Ton badge est prêt",
      introduction: `Bonjour ${name}, ton inscription VIBEATHON 2026 (${categoryLabel}) est confirmée. Voici ton badge d'accès.`,
      content: `<div style="padding:24px;border:1px solid #2b3732;border-radius:20px;background:#ffffff;text-align:center">
          <img src="cid:vibeathon-qr" width="230" height="230" alt="QR code du badge ${escapeHtml(reference)}" style="display:block;width:230px;max-width:100%;height:auto;margin:0 auto">
          <p style="margin:14px 0 0;color:#050807;font-family:monospace;font-size:13px;font-weight:700">${escapeHtml(reference)}</p>
        </div>
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.6">Conserve cet email et présente ce QR code à l'accueil le jour J. Tu peux aussi télécharger la version complète de ton badge.</p>`,
      action: { label: "Afficher mon badge", url: badgeUrl },
    }),

  reminder: (name: string, badgeUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Rappel événement",
      title: "VIBEATHON, c'est demain",
      introduction: `${name}, prépare ton badge et présente-toi à partir de 07:30.`,
      action: { label: "Ouvrir mon badge", url: badgeUrl },
    }),

  bootcampInfo: (name: string, badgeUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Informations pratiques",
      title: "Prépare ton bootcamp",
      introduction: `${name}, ta participation est confirmée. Voici les essentiels pour arriver prêt le jour du VIBEATHON.`,
      content: `${infoCard("Date", EVENT.date)}
        ${infoCard("Lieu", EVENT.venue)}
        <p style="margin:18px 2px 0;color:#c9d1ce;font-size:14px;line-height:1.6">À prévoir : ordinateur chargé, chargeur, connexion personnelle si possible, pièce d'identité et ton badge QR.</p>`,
      action: { label: "Afficher mon badge", url: badgeUrl },
    }),

  teamAssignment: (
    name: string,
    teamName: string,
    dashboardUrl: string,
    appUrl: string,
  ) =>
    frame({
      appUrl,
      eyebrow: "Équipe confirmée",
      title: "Ton équipe est prête",
      introduction: `${name}, tu es rattaché(e) à l'équipe ${teamName} pour le bootcamp et la compétition.`,
      content:
        '<p style="margin:0;color:#c9d1ce;font-size:14px;line-height:1.65">Présente-toi avec ton badge QR. Les détails de table et d’organisation seront confirmés sur place par l’équipe VIBEATHON.</p>',
      action: { label: "Consulter mes informations", url: dashboardUrl },
    }),

  waitlist: (name: string, statusUrl: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Liste d'attente",
      title: "Ton dossier reste actif",
      introduction: `${name}, ton profil est conservé en liste d'attente. Si une place se libère, l'équipe VIBEATHON te contactera rapidement.`,
      action: { label: "Suivre mon statut", url: statusUrl },
    }),

  custom: (name: string, message: string, appUrl: string) =>
    frame({
      appUrl,
      eyebrow: "Information VIBEATHON",
      title: "Un message pour toi",
      introduction: `Bonjour ${name},`,
      content: `<p style="margin:0;color:#c9d1ce;font-size:15px;line-height:1.7">${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
    }),
};
