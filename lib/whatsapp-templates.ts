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
    message: `Bonjour ${name}, les résultats VIBEATHON 2026 sont disponibles. Consulte ton statut ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.resultsAvailable,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [encodeURIComponent(name)],
    },
  }),
  accepted: (name: string, statusUrl: string) => ({
    message: `Félicitations ${name}, ton dossier VIBEATHON est accepté. Vérifie ton statut et finalise le paiement ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.accepted,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [encodeURIComponent(name)],
    },
  }),
  paymentReminder: (name: string, statusUrl: string) => ({
    message: `Bonjour ${name}, ton dossier VIBEATHON est accepté mais le paiement reste en attente. Confirme ta place ici : ${statusUrl}`,
    waTemplate: {
      name: WHATSAPP_TEMPLATE_NAMES.paymentReminder,
      languageCode: "fr",
      bodyParams: [name],
      buttonUrlParams: [encodeURIComponent(name)],
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
      buttonUrlParams: [encodeURIComponent(name)],
    },
  }),
};
