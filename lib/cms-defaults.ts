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
    label: "Sélectionné · Compétition",
    subject: "Votre candidature VIBEATHON 2026 a été retenue",
    eyebrow: "Sélection · Compétition Vibe Coding",
    title: "Félicitations, vous êtes sélectionné(e)",
    introduction:
      "Bonjour {{name}}, nous avons le plaisir de vous informer que votre candidature a été retenue pour participer à la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026.",
    bodyHtml:
      "<p>Félicitations ! Vous faites partie des 100 participants sélectionnés pour cette première édition.</p><p>Votre participation est confirmée. Vous pouvez ouvrir votre espace de suivi pour vérifier vos informations et retrouver votre badge QR.</p><p>Les prochaines informations concernant le bootcamp et le déroulement de la compétition vous seront communiquées prochainement. À très bientôt pour cette belle aventure !</p><p style=\"color:#8d9a95\">L'équipe VIBEATHON Côte d'Ivoire</p>",
    actionLabel: "Voir mon statut",
  },
  {
    slug: "competitionWaitlist",
    label: "Liste d'attente · Compétition",
    subject: "Votre candidature VIBEATHON 2026 : liste d'attente",
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
    label: "Non retenu · Compétition",
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
    label: "Paiement confirmé · Badge",
    subject: "Paiement confirmé : ton badge VIBEATHON est prêt",
    eyebrow: "Paiement confirmé",
    title: "Ton badge est prêt",
    introduction:
      "Bienvenue officiellement au VIBEATHON, {{name}}. Tu peux maintenant participer au bootcamp et à la compétition.",
    bodyHtml:
      "<p style=\"text-align:center\"><img src=\"cid:vibeathon-qr\" width=\"230\" height=\"230\" alt=\"QR code du badge {{reference}}\"></p><p>Conserve cet email et présente ce QR code à l'accueil. Tu peux aussi télécharger la version complète de ton badge.</p>",
    actionLabel: "Afficher mon badge",
  },
  {
    slug: "badgeReady",
    label: "Badge prêt · Pass visiteur/formation",
    subject: "Ton badge VIBEATHON 2026 est disponible",
    eyebrow: "Pass {{categoryLabel}}",
    title: "Ton badge est prêt",
    introduction:
      "Bonjour {{name}}, ton inscription VIBEATHON 2026 ({{categoryLabel}}) est confirmée. Voici ton badge d'accès.",
    bodyHtml:
      "<p style=\"text-align:center\"><img src=\"cid:vibeathon-qr\" width=\"230\" height=\"230\" alt=\"QR code du badge {{reference}}\"></p><p>Conserve cet email et présente ce QR code à l'accueil le jour J. Tu peux aussi télécharger la version complète de ton badge.</p>",
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
  // ── Hero ──────────────────────────────────────────────────────────────────
  "hero.tagline": "Pense. Crée. Lance.",
  "hero.title": "La compétition de Vibe Coding",
  "hero.subtitle":
    "Le premier hackathon d'Afrique de l'Ouest entièrement construit avec l'IA. Une journée pour concevoir, coder et pitcher une application complète.",
  "hero.eyebrow": "IA × Environnement · Abidjan",
  "hero.date": "Samedi 11 juillet 2026",
  "hero.venue": "CSCTICAO, Abidjan",
  "hero.cta.primary": "Prendre mon pass",
  "hero.cta.secondary": "Découvrir le programme",

  // ── Stats ─────────────────────────────────────────────────────────────────
  "stats.participants": "400",
  "stats.participants.label": "Participants",
  "stats.competitors": "100",
  "stats.competitors.label": "Compétiteurs",
  "stats.solutions": "20",
  "stats.solutions.label": "Solutions",
  "stats.winners": "3",
  "stats.winners.label": "Lauréats primés",

  // ── Concept ───────────────────────────────────────────────────────────────
  "concept.eyebrow": "Accueil",
  "concept.lead":
    "Le vibecoding, c'est créer sans coder, en dialoguant avec l'IA.",
  "concept.body":
    "VIBEATHON réunit étudiants, jeunes diplômés, entrepreneurs et professionnels, avec des profils non techniques fortement encouragés. 100 participants répartis en 20 équipes de 5 personnes imagineront des solutions dans les secteurs : Agriculture, Énergie, Transport, Ressources naturelles.",
  "concept.quote":
    "Pas besoin d'être développeur. Il suffit de penser, décrire et laisser l'IA construire.",

  // ── Activities (5 items) ─────────────────────────────────────────────────
  "activities.eyebrow": "Au programme",
  "activities.title": "Cinq façons de vibrer.",
  "activities.1.title": "Keynotes",
  "activities.1.desc":
    "Des voix qui inspirent : visionnaires de la tech africaine et experts de l'IA.",
  "activities.2.title": "Compétition du Vibecoding",
  "activities.2.desc":
    "100 compétiteurs, une journée pour concevoir une solution IA à fort impact environnemental.",
  "activities.3.title": "Ateliers de formation",
  "activities.3.desc":
    "Six sessions pratiques pour maîtriser les outils du vibecoding et les bonnes pratiques de l'IA.",
  "activities.4.title": "Studio d'expérience IA",
  "activities.4.desc":
    "Deux espaces immersifs, photo et musique, pour expérimenter l'IA créative.",
  "activities.5.title": "Panels",
  "activities.5.desc":
    "Débats croisés entre acteurs de la tech, de l'environnement et de l'entrepreneuriat.",

  // ── Schedule / Timeline (up to 9 items) ──────────────────────────────────
  "schedule.eyebrow": "Le jour J · 11 juillet",
  "schedule.title": "Déroulé de la journée.",
  "schedule.count": "7",
  "schedule.1.time": "07:30",
  "schedule.1.title": "Accueil des participants",
  "schedule.1.desc": "Café, networking et remise des badges.",
  "schedule.2.time": "09:00",
  "schedule.2.title": "Keynotes d'ouverture",
  "schedule.2.desc": "Lancement officiel et interventions inspirantes.",
  "schedule.3.time": "10:30",
  "schedule.3.title": "Panels",
  "schedule.3.desc": "IA, environnement et innovation inclusive.",
  "schedule.4.time": "12:00",
  "schedule.4.title": "Déjeuner & networking",
  "schedule.4.desc": "",
  "schedule.5.time": "13:30",
  "schedule.5.title": "Compétition vibecoding",
  "schedule.5.desc":
    "Le grand sprint créatif démarre, avec ateliers et Studio IA en parallèle.",
  "schedule.6.time": "17:30",
  "schedule.6.title": "Pitch des 10 finalistes",
  "schedule.6.desc": "Les meilleurs projets passent devant le jury.",
  "schedule.7.time": "19:00",
  "schedule.7.title": "Remise des prix & clôture",
  "schedule.7.desc": "Célébration des lauréats et photo de groupe.",

  // ── Prizes ────────────────────────────────────────────────────────────────
  "prizes.eyebrow": "Récompenses",
  "prizes.title": "Plus qu'un prix, un tremplin.",
  "prizes.first": "1 000 000",
  "prizes.first.label": "1er prix",
  "prizes.second": "500 000",
  "prizes.second.label": "2e prix",
  "prizes.third": "300 000",
  "prizes.third.label": "3e prix",
  "prizes.perk.1":
    "Bootcamp de 3 jours : Initiation au Vibe Coding et préparation au pitch.",
  "prizes.perk.2":
    "Mentorat & Accompagnement pour transformer votre idée en startup.",
  "prizes.perk.3":
    "Opportunités d'incubation et accès à des investisseurs stratégiques.",

  // ── Tickets / Billets section ─────────────────────────────────────────────
  "tickets.eyebrow": "Participer",
  "tickets.title": "Choisis ton pass.",
  "tickets.body":
    "Les candidatures à la compétition sont closes, mais l'événement reste ouvert : viens en visiteur et assiste aux keynotes, panels et au pitch final. Badge reçu par email et WhatsApp.",
  "tickets.cta.free": "S'inscrire gratuitement",
  "tickets.cta.paid": "Réserver",

  // ── Category configs (editable ticket types) ──────────────────────────────
  "category.visiteur.label": "Visiteur",
  "category.visiteur.tagline": "Vivez l'événement en spectateur",
  "category.visiteur.fee": "0",
  "category.visiteur.perks":
    "Accès aux Keynotes\nAccès aux Panels et conférences\nAccès au Pitch Final des compétiteurs",

  "category.formation_adulte.label": "Formation Adulte",
  "category.formation_adulte.tagline":
    "Pour les adultes qui veulent suivre le bootcamp de formation",
  "category.formation_adulte.fee": "0",
  "category.formation_adulte.perks":
    "Accès au Panel",

  "category.formation_kids.label": "Formation Kids",
  "category.formation_kids.tagline":
    "Le bootcamp de formation pensé pour les enfants",
  "category.formation_kids.fee": "0",
  "category.formation_kids.perks":
    "Accès au Panel",

  // ── Audience ──────────────────────────────────────────────────────────────
  "audience.eyebrow": "Pour qui ?",
  "audience.title": "Ouvert à tous les bâtisseurs.",
  "audience.members":
    "Étudiants\nJeunes diplômés\nEntrepreneurs\nProfessionnels",

  // ── Final CTA ─────────────────────────────────────────────────────────────
  "cta.final.title": "Prêt à lancer ?",
  "cta.final.primary": "Prendre mon pass",
  "cta.final.secondary": "Vérifier mon statut",

  // ── Footer ────────────────────────────────────────────────────────────────
  "footer.tagline": "Créer avec l'IA pour un avenir durable et inclusif.",
  "footer.contact": "contact@vibeathonci.com",
  "footer.copyright": "© 2026 VIBEATHON · vibeathonci.com",
  "footer.made": "Made with ♥ by Reinvent Labs",

  // ── Nav ───────────────────────────────────────────────────────────────────
  "nav.cta": "Je candidate",
};
