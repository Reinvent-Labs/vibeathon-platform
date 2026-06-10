# VIBEATHON notification templates

This file is the operating map for campaign emails and WhatsApp templates.
Email templates are rendered by `emails/templates.ts`. WhatsApp templates are
selected by `lib/whatsapp-templates.ts` and must be approved in Meta before
business-initiated sends work outside the 24h service window.

## Recommended campaign sequence

| Moment | Audience | Email template | WhatsApp template |
| --- | --- | --- | --- |
| Result day | All registered candidates | `results-available` | `vibeathon_resultats_disponibles` |
| Accepted candidate | Selected candidates | `accepted-payment` | `vibeathon_dossier_accepte` |
| Before payment deadline | Selected candidates | `payment-reminder` | `vibeathon_rappel_paiement` |
| Payment confirmed | Official participants | `payment-confirmed` | `vibeathon_paiement_confirme` |
| Bootcamp logistics | Official participants | `bootcamp-info` | `vibeathon_infos_bootcamp` |
| Day-before reminder | Official participants | `event-reminder` | `vibeathon_rappel_event` |
| Team assignment | Official participants in teams | `teamAssignment` | `vibeathon_equipe_confirmee` |

## Meta WhatsApp template drafts

All templates should be created in French as utility templates. Buttons should
use a dynamic URL parameter so the app can pass only the candidate-specific
token or email value.

### `vibeathon_resultats_disponibles`

Body:

```text
Bonjour {{1}}, les résultats VIBEATHON 2026 sont disponibles. Consulte ton espace de suivi pour découvrir la décision.
```

Button URL:

```text
https://vibeathonci.com/statut?email={{1}}
```

### `vibeathon_dossier_accepte`

Body:

```text
Félicitations {{1}}, ton dossier VIBEATHON est accepté. Vérifie ton statut et finalise le paiement pour confirmer ta place.
```

Button URL:

```text
https://vibeathonci.com/statut?email={{1}}
```

### `vibeathon_rappel_paiement`

Body:

```text
Bonjour {{1}}, ton dossier VIBEATHON est accepté mais le paiement reste en attente. Confirme ta place pour recevoir ton badge QR.
```

Button URL:

```text
https://vibeathonci.com/statut?email={{1}}
```

### `vibeathon_paiement_confirme`

Body:

```text
Paiement confirmé, {{1}}. Ton badge QR VIBEATHON est prêt. Présente-le à l'accueil le jour de l'événement.
```

Button URL:

```text
https://vibeathonci.com/badge/{{1}}
```

### `vibeathon_infos_bootcamp`

Body:

```text
Bonjour {{1}}, ta participation VIBEATHON est confirmée. Prépare ton ordinateur, ton chargeur, une pièce d'identité et ton badge QR.
```

Button URL:

```text
https://vibeathonci.com/badge/{{1}}
```

### `vibeathon_rappel_event`

Body:

```text
Rappel VIBEATHON : {{1}}, l'événement approche. Garde ton badge QR prêt et présente-toi à l'heure indiquée.
```

Button URL:

```text
https://vibeathonci.com/badge/{{1}}
```

### `vibeathon_equipe_confirmee`

Body:

```text
Bonjour {{1}}, tu es rattaché(e) à l'équipe {{2}} pour le VIBEATHON. Consulte tes informations avant l'événement.
```

Button URL:

```text
https://vibeathonci.com/statut?email={{1}}
```

## Notes

- Free-form WhatsApp messages should be used only for contacts still inside the
  24h customer service window.
- The payment webhook sends the badge email and WhatsApp automatically after a
  successful payment notification.
- Campaign sends are available in Admin > Communications and are protected by
  admin authentication plus same-origin checks.
