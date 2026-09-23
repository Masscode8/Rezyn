# Rezyn — site vitrine

Site de la maison Rezyn (sols en résine époxy coulés sur mesure).
Statique : **aucune installation, aucun build**. Ouvrez `index.html` et c'est tout.

---

## Lancer le site

Double-clic sur `index.html`, ou pour un rendu strictement identique à la production
(les polices et le chargement différé des images se comportent mieux via HTTP) :

```bash
python -m http.server 4180
```

Puis ouvrez <http://localhost:4180>.

---

## Les pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil en quatre temps : le métier, la collection, les matières, **deux portes** — estimation ou contact |
| `finitions.html` | Les quatre matières, nuancier, sols techniques, méthode en cinq étapes, questions fréquentes |
| `realisations.html` | Collection filtrable + visionneuse, avant/après, chiffres, témoignages |
| `simulateur.html` | Estimation en direct, détaillée ligne par ligne |
| `contact.html` | Coordonnées + demande de devis validée |

L'accueil reste court volontairement : le visiteur doit comprendre le métier et
choisir sa porte sans faire défiler dix écrans. Tout le détail vit sur les pages
intérieures.

---

## Architecture

```
claude_rezyn/
├── index.html · finitions.html · realisations.html · simulateur.html · contact.html
├── css/
│   ├── tokens.css        Design tokens (primitive → sémantique → composant)
│   ├── base.css          Reset, typographie, rythme, accessibilité, reduced-motion
│   ├── components.css    Nav, boutons, champs, visionneuse, pied de page
│   └── sections.css      Héros, éditorial, collection, méthode, estimation, FAQ
├── js/
│   ├── core.js           Nav, révélations, chiffres, questions, avant/après
│   ├── gallery.js        Filtres + visionneuse accessible
│   ├── simulator.js      Moteur de chiffrage et passage de relais vers le contact
│   └── forms.js          Validation, résumé d'erreurs, états de soumission
├── images/               Photographies de chantier
├── design-system/rezyn/  Système de design généré par la skill ui-ux-pro-max
└── .claude/skills/       Skills UI/UX installées pour ce projet
```

Aucune dépendance, aucun framework. Seules ressources externes : les polices Google
(Cormorant Garamond, Montserrat).

---

## Direction artistique — maison de luxe

La palette et la typographie viennent de la skill `ui-ux-pro-max`
(`design-system/rezyn/MASTER.md`, profil « premium + accent or »), retravaillées
pour un registre de maison plutôt que de site technique.

- **Palette** — ivoire `#fbf9f5` (le papier), encre `#14110d` (le texte et les
  salles sombres), bronze `#7a5a22` (l'unique métal, employé avec parcimonie).
  Aucun bleu, aucun néon, aucun dégradé sur le texte.
- **Typographie** — Cormorant Garamond en graisse 300–400 pour la voix,
  Montserrat en petites capitales espacées (0.3 em) pour le service. Les surtitres
  sont en gris encre ou en bronze, jamais en couleur vive.
- **Formes** — angles vifs, rayon nul. Les boutons sont des rectangles filetés,
  les champs de simples filets bas, les cartes n'existent pas : ce sont des lignes.
- **Rythme** — l'espace fait la valeur. Sections à 11 rem, filets d'un pixel,
  colonnes étroites (34 caractères pour les titres, 48 pour le texte).
- **Mouvement** — lent et sans rebond : fondus de 1 200 ms, voiles d'image qui se
  retirent, recadrage du visuel d'accueil sur 26 secondes. Rien ne doit sembler pressé.
- **Salles sombres** — `.on-ink` bascule une section entière en encre (les matières,
  la transformation, les invitations, le pied de page). Les photographies de sol y
  ressortent comme dans une galerie.

---

## Accessibilité

Contrôles passés sur les cinq pages :

- Contraste : tout le texte mesuré est entre 5,16:1 et 17,9:1 — le minimum AA
  (4,5:1) n'est jamais approché de trop près.
- Anneaux de focus visibles partout, jamais supprimés ; lien d'évitement en tête.
- Cibles tactiles ≥ 44 px, à l'exception d'un numéro de téléphone inline dans une
  phrase, cas explicitement exempté par WCAG 2.2.
- `prefers-reduced-motion` respecté : recadrage du héros figé, révélations et voiles
  désactivés, chiffres affichés directement.
- Visionneuse : piège de focus, `Échap`, flèches, restitution du focus à la fermeture.
- Formulaire : libellés visibles, erreur sous le champ concerné, résumé focalisable
  après échec, validation au `blur` et non à la frappe.
- Aucun défilement horizontal de 375 px à 1240 px.
- Icônes SVG uniquement, aucun emoji utilisé comme icône.

---

## À brancher avant la mise en ligne

Le site est complet côté interface ; trois points relèvent d'un back-end :

1. **Formulaire de contact** — `js/forms.js` simule l'envoi (900 ms puis message de
   confirmation). Remplacez le `setTimeout` de la fonction de soumission par un
   `fetch()` vers votre endpoint ou un service de formulaire.
2. **Contenus** — téléphone, e-mail, adresse, nombre de chantiers, notes et
   témoignages sont des valeurs de démonstration cohérentes, à remplacer par les
   vôtres. Les tarifs, eux, reprennent les vôtres (120 / 180 / 220 € le m²).
3. **Images** — les sept visuels viennent de votre dossier `images`. Pour la
   production, pensez au format WebP ou AVIF : le poids sera divisé par trois environ.

Le barème de l'estimation est centralisé en haut de `js/simulator.js`
(`SYSTEMS`, `PREPARATIONS`, `FINISHES`, `DELAYS`, `MOBILISATION`) — c'est le seul
endroit à modifier pour faire évoluer les prix.
