export const WHATSAPP_TEMPLATE_NAMES = {
  resultsAvailable:
    process.env.WHATSAPP_TEMPLATE_RESULTS ?? "vibeathon_resultats_disponibles",
  accepted:
    process.env.WHATSAPP_TEMPLATE_ACCEPTED ?? "vibeathon_dossier_accepte",
  paymentReminder:
    process.env.WHATSAPP_TEMPLATE_PAYMENT_REMINDER ??
    "vibeathon_rappel_paiement",
  paymentConfirmed:
    process.env.WHATSAPP_TEMPLATE_PAYMENT ?? "vibeathon_paiement_confirme",
  bootcampInfo:
    process.env.WHATSAPP_TEMPLATE_BOOTCAMP ?? "vibeathon_infos_bootcamp",
  eventReminder:
    process.env.WHATSAPP_TEMPLATE_EVENT_REMINDER ?? "vibeathon_rappel_event",
  teamAssignment:
    process.env.WHATSAPP_TEMPLATE_TEAM ?? "vibeathon_equipe_confirmee",
} as const;

function urlToken(url: string) {
  return url.split("/").pop() ?? "";
}

export const whatsAppMessages = {
  resultsAvailable: (name: string, statusUrl: string) => ({
    message: `Salut ${name} 👋\n\nLes résultats VIBEATHON 2026 sont disponibles. Consulte ton statut ici :\n${statusUrl}\n\nL'équipe VIBEATHON`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.resultsAvailable,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),
  // --- Competition decision messages ---
  competitionSelected: (name: string, statusUrl: string) => ({
    message:
      `🎉 FÉLICITATIONS ${name} ! 🚀\n\n` +
      `Tu fais partie des *100 sélectionnés* pour la compétition Vibe Coding du VIBEATHON Côte d'Ivoire 2026 ! 🇨🇮🔥\n\n` +
      `Ta participation est confirmée. Retrouve ton statut et ton badge ici :\n` +
      `👉 ${statusUrl}\n\n` +
      `Les prochaines informations sur le bootcamp et la compétition te seront communiquées très bientôt. On compte sur toi ! 💚\n` +
      `L'équipe VIBEATHON`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.accepted,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),
  competitionWaitlist: (name: string, statusUrl: string) => ({
    message:
      `Salut ${name} 👋\n\n` +
      `Merci pour ta candidature à la compétition Vibe Coding du VIBEATHON CI 2026 🙌\n\n` +
      `Tu es sur notre *liste d'attente* ⏳. Des places peuvent se libérer très vite, garde un œil sur tes messages 👀\n\n` +
      `👉 ${statusUrl}\n\n` +
      `On te prévient dès qu'une place s'ouvre ! 💚\n` +
      `L'équipe VIBEATHON`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.resultsAvailable,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),
  competitionRejected: (name: string, _statusUrl: string, appUrl: string) => ({
    message:
      `Salut ${name} 👋\n\n` +
      `Merci d'avoir candidaté à la compétition Vibe Coding du VIBEATHON CI 2026 🙏\n\n` +
      `Ta candidature n'a pas été retenue pour la compétition cette fois, mais l'aventure continue ! Rejoins-nous pour les *keynotes, panels et ateliers* 🎤✨\n` +
      `👉 ${appUrl}/billet\n\n` +
      `À très vite,\nL'équipe VIBEATHON`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.resultsAvailable,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),

  accepted: (name: string, statusUrl: string) => ({
    message: `Félicitations ${name}, ton dossier VIBEATHON est accepté. Vérifie ton statut et finalise le paiement ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.accepted,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),
  paymentReminder: (name: string, statusUrl: string) => ({
    message: `Bonjour ${name}, ton dossier VIBEATHON est accepté mais le paiement reste en attente. Confirme ta place ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.paymentReminder,
      languageCode: "fr",
      bodyParams: [name],
    },
  }),
  badgeReady: (name: string, badgeUrl: string, categoryLabel: string) => ({
    message: `Bonjour ${name}, ton inscription VIBEATHON 2026 (${categoryLabel}) est confirmée. Ton badge QR est prêt : ${badgeUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.paymentConfirmed,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [urlToken(badgeUrl)],
    },
  }),
  paymentConfirmed: (name: string, badgeUrl: string) => ({
    message: `Paiement confirmé, ${name}. Ton badge QR VIBEATHON est prêt : ${badgeUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.paymentConfirmed,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [urlToken(badgeUrl)],
    },
  }),
  bootcampInfo: (name: string, badgeUrl: string) => ({
    message: `Bonjour ${name}, ta participation VIBEATHON est confirmée. Prépare ton badge QR et tes essentiels : ${badgeUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.bootcampInfo,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [urlToken(badgeUrl)],
    },
  }),
  eventReminder: (name: string, badgeUrl: string) => ({
    message: `Rappel VIBEATHON : ${name}, l'événement approche. Garde ton badge QR prêt : ${badgeUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.eventReminder,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [urlToken(badgeUrl)],
    },
  }),
  teamAssignment: (name: string, teamName: string, statusUrl: string) => ({
    message: `Bonjour ${name}, tu es rattaché(e) à l'équipe ${teamName} pour le VIBEATHON. Consulte tes informations ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.teamAssignment,
      languageCode: "fr",
      bodyParams: [name, teamName],
    },
  }),
};
