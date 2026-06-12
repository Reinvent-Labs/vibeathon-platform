export type EmailTemplateDefault = {
  slug: string;
  label: string;
  subject: string;
  eyebrow: string;
  title: string;
  introduction: string;
  bodyHtml: string;
  actionLabel: string;
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateDefault[] = [
  {
    slug: "competitionSelected",
    label: "Sélectionné — Compétition",
    subject: "Votre candidature VIBEATHON 2026 a été retenue",
    eyebrow: "Sélection · Compétition Vibe Coding",
    title: "Félicitations, vous êtes sélectionné(e)",
    introduction:
      "Bonjour {{name}}, nous avons le plaisir de vous informer que votre candidature a été retenue pour participer à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026.",
    bodyHtml:
      "<p>Félicitations ! Vous faites partie des 100 participants sélectionnés pour cette première édition.</p><p>Afin de confirmer définitivement votre participation, réglez vos frais de 20 000 FCFA via le bouton ci-dessous au plus tard le mardi 16 juin 2026. Passé ce délai, votre place pourra être attribuée à un candidat figurant sur la liste d'attente.</p><p>Les prochaines informations concernant le bootcamp et le déroulement de la compétition vous seront communiquées prochainement. À très bientôt pour cette belle aventure !</p><p style=\"color:#8d9a95\">L'équipe VIBEATHON Côte d'Ivoire</p>",
    actionLabel: "Régler mes frais de participation",
  },
  {
    slug: "competitionWaitlist",
    label: "Liste d'attente — Compétition",
    subject: "Votre candidature VIBEATHON 2026 — liste d'attente",
    eyebrow: "Liste d'attente · Compétition Vibe Coding",
    title: "Votre candidature est sur liste d'attente",
    introduction:
      "Bonjour {{name}}, nous vous remercions pour l'intérêt porté à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire et pour le temps consacré à votre candidature.",
    bodyHtml:
      "<p>Après évaluation des dossiers reçus, votre candidature a été placée sur liste d'attente.</p><p>Compte tenu du nombre important de candidatures et des confirmations de participation encore en cours, des places pourraient se libérer dans les prochains jours. Nous vous invitons donc à rester attentif(ve) à vos emails.</p><p>Si une place devient disponible, nous vous contacterons directement. Merci encore pour votre intérêt et votre confiance.</p><p style=\"color:#8d9a95\">L'équipe VIBEATHON Côte d'Ivoire</p>",
    actionLabel: "Consulter mon statut",
  },
  {
    slug: "competitionRejected",
    label: "Non retenu — Compétition",
    subject: "Résultat de votre candidature VIBEATHON 2026",
    eyebrow: "Résultat · Compétition Vibe Coding",
    title: "Résultat de votre candidature",
    introduction:
      "Bonjour {{name}}, nous vous remercions sincèrement pour votre candidature à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026.",
    bodyHtml:
      "<p>Après analyse des informations fournies, nous regrettons de vous informer que votre candidature n'a pas été retenue pour cette édition.</p><p>Cette décision est notamment liée à certains critères de sélection essentiels au bon déroulement du programme, tels que la disponibilité sur l'ensemble du parcours ou les conditions de participation définies dans l'appel à candidatures.</p><p>Nous vous remercions pour l'intérêt porté à cette initiative et espérons pouvoir vous compter parmi nous pour les autres activités du VIBEATHON, notamment les keynotes, panels et ateliers de formation.</p><p style=\"color:#8d9a95\">L'équipe VIBEATHON Côte d'Ivoire</p>",
    actionLabel: "Découvrir les autres activités",
  },
  {
    slug: "paymentConfirmed",
    label: "Paiement confirmé — Badge",
    subject: "Paiement confirmé — Ton badge VIBEATHON est prêt",
    eyebrow: "Paiement confirmé",
    title: "Ton badge est prêt",
    introduction:
      "Bienvenue officiellement au VIBEATHON, {{name}}. Tu peux maintenant participer au bootcamp et à la compétition.",
    bodyHtml:
      "<p>Conserve cet email et présente ce QR code à l'accueil. Tu peux aussi télécharger la version complète de ton badge.</p>",
    actionLabel: "Afficher mon badge",
  },
  {
    slug: "badgeReady",
    label: "Badge prêt — Billets visiteur/formation",
    subject: "Ton badge VIBEATHON 2026 est disponible",
    eyebrow: "Pass {{categoryLabel}}",
    title: "Ton badge est prêt",
    introduction:
      "Bonjour {{name}}, ton inscription VIBEATHON 2026 ({{categoryLabel}}) est confirmée. Voici ton badge d'accès.",
    bodyHtml:
      "<p>Conserve cet email et présente ce QR code à l'accueil le jour J. Tu peux aussi télécharger la version complète de ton badge.</p>",
    actionLabel: "Afficher mon badge",
  },
  {
    slug: "paymentReminder",
    label: "Rappel de paiement",
    subject: "Ta place VIBEATHON n'est pas encore confirmée",
    eyebrow: "Place acceptée",
    title: "Finalise ton paiement",
    introduction:
      "{{name}}, ton dossier est accepté mais ta place n'est pas encore officielle. Le paiement confirme ton accès au bootcamp et à la compétition.",
    bodyHtml:
      "<p>Après confirmation, tu recevras automatiquement ton badge QR personnel.</p>",
    actionLabel: "Payer et confirmer ma place",
  },
];

export const DEFAULT_SITE_CONTENT: Record<string, string> = {
  "hero.title": "La compétition de Vibe Coding",
  "hero.subtitle":
    "Le premier hackathon d'Afrique de l'Ouest entièrement construit avec l'IA. Une journée pour concevoir, coder et pitcher une application complète.",
  "hero.date": "Samedi 11 juillet 2026",
  "hero.venue": "CSCTICAO, Abidjan",
  "stats.participants": "396",
  "stats.competitors": "100",
  "stats.prize": "1 000 000",
  "prizes.first": "500 000 FCFA",
  "prizes.second": "300 000 FCFA",
  "prizes.third": "200 000 FCFA",
  "footer.contact": "contact@vibeathonci.com",
};
