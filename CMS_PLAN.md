# CMS Plan — Contenu du site + Templates email

## Objectif

Permettre à une personne non-dev de modifier le contenu visible du site et les templates email directement depuis l'admin existant, sans toucher au code.

---

## Périmètre

### Contenu du site (`/admin/contenu`)
- Textes du héro (titre, sous-titre, date, lieu)
- Chiffres clés (inscrits, compétiteurs, montant du prix)
- Étapes de la timeline (liste éditable)
- Montants et noms des prix (1er, 2e, 3e)
- Upload d'image par section (héro background, section cover)

### Templates email (`/admin/emails`)
- 6 templates : sélectionné, liste d'attente, refusé, paiement confirmé, badge, résultats généraux
- Éditeur WYSIWYG (TipTap) — gras, italique, liens, titre
- Aperçu rendu final (iframe HTML)
- Champ sujet éditable
- Bouton "Envoyer un test" → reçoit l'email sur sa boîte

---

## Architecture technique

### Base de données (2 nouveaux modèles Prisma)

```
SiteContent   key (unique) | value (Text) | updatedAt
EmailTemplate slug (unique) | subject | htmlBody | textBody | updatedAt
MediaAsset    id | filename | path | size | createdAt
```

### API routes
- `GET/PUT /api/admin/content` — lire/écrire tout le contenu site
- `GET /api/admin/email-templates` — liste des templates
- `GET/PUT /api/admin/email-templates/[slug]` — lire/modifier un template
- `POST /api/admin/email-templates/[slug]/test` — envoyer email de test
- `POST /api/admin/media/upload` — upload image → public/uploads/

### Pages admin
- `app/admin/contenu/page.tsx` — éditeur contenu site (tabs par section)
- `app/admin/emails/page.tsx` — liste + éditeur templates

### Pages publiques
- Hydration depuis `SiteContent` au lieu de valeurs hardcodées
- Fallback sur les valeurs actuelles si la clé n'existe pas en DB

---

## Phases de build

### Phase 1 — Schema + migration [ ]
Ajouter `SiteContent`, `EmailTemplate`, `MediaAsset` au schema Prisma.
Seeder les valeurs actuelles (textes hardcodés → DB).

### Phase 2 — API routes [ ]
CRUD content, email templates, upload media, test send.

### Phase 3 — Page `/admin/contenu` [ ]
- Tabs : Héro / Chiffres / Timeline / Prix / Images
- Champs texte labellisés, save auto ou bouton
- Composant upload image avec preview

### Phase 4 — Page `/admin/emails` [ ]
- Liste des templates à gauche
- TipTap (WYSIWYG) au centre
- Panel aperçu à droite
- Bouton test send

### Phase 5 — Hydration pages publiques [ ]
- `lib/site-content.ts` → helper `getContent(key, fallback)`
- Wirer les sections héro, timeline, prix sur les valeurs DB

---

## Dépendances à installer
- `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image` — WYSIWYG
- `formidable` ou `busboy` — upload multipart (ou Next.js native `request.formData()`)

---

## Contraintes
- Auth admin existante — toutes les routes `/api/admin/*` déjà protégées
- Images stockées dans `public/uploads/` (pas de S3 pour l'instant)
- Fallbacks obligatoires — si une clé n'est pas en DB, on affiche le texte actuel
- Pas de redéploiement nécessaire après une modif contenu (valeurs lues à la requête)
