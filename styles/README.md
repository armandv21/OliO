# styles/ — CSS modulaire

> **Règle** : chaque feuille de style couvre une zone précise. Ne jamais ajouter de règles
> pour une zone dans le mauvais fichier — cela rend les futures modifications imprévisibles.

---

## Fichiers et périmètres

| Fichier | Couvre | Ne couvre PAS |
|---|---|---|
| `variables.css` | Tokens globaux : couleurs, fonts, spacing, radius | Aucune règle de layout |
| `base.css` | Reset, `body`, `html`, typographie globale | Composants spécifiques |
| `layout.css` | `.app`, `.main`, `.topbar`, `.sidebar` (structure principale) | Composants dans les panneaux |
| `sidebar.css` | Barre latérale gauche, liste des actifs, expand/collapse | Topbar |
| `cards.css` | Cartes actifs (home + sidebar), badges labels | Panneaux full-screen |
| `panels.css` | Panneaux full-screen (Articles, Portefeuilles, News…) | La sidebar |
| `auth.css` | Modale auth (login/signup), overlay | Dropdown profil |
| `profile.css` | Dropdown profil, onglets Paramètres/Compte, infos utilisateur | Auth |
| `contact.css` | Formulaire de contact | — |
| `responsive.css` | Media queries ≤768px, ajustements mobile | Styles desktop |

---

## Variables CSS (variables.css)

### Couleurs principales
```css
--blue       /* Bleu brand principal */
--teal       /* Vert accent */
--amber      /* Ambre (niveau Intermédiaire) */
--rose       /* Rose (niveau Avancé, erreurs) */
--rose-lt    /* Rose clair (erreurs légères) */
```

### Surfaces et texte
```css
--ink        /* Texte principal */
--ink2       /* Texte secondaire */
--muted      /* Texte désactivé / labels */
--bg         /* Fond de page */
--surface    /* Fond des cartes / modales */
--surface2   /* Fond secondaire (bulles chat, hover) */
--border     /* Bordures légères */
--border2    /* Bordures interactives (inputs focus) */
```

### Typography
```css
--font-sans   /* DM Sans (corps de texte) */
--font-serif  /* Libre Baskerville (titres) */
/* Note : 'UnifrakturMaguntia' est chargée via Google Fonts
   mais utilisée inline dans la carte newsletter uniquement */
```

---

## Layout critique (layout.css)

Ces règles ne doivent **jamais** être modifiées sans lancer les smoke tests :

```css
.app {
  height: 100vh;      /* ← requis par smoke test */
  overflow: hidden;   /* ← requis par smoke test */
  /* NE PAS utiliser position:fixed + inset:0 — casse la topbar */
}

.main {
  overflow-y: auto;   /* ← requis par smoke test */
}

.topbar {
  min-height: …;      /* ← requis par smoke test */
}
```

---

## Ajouter des styles pour une nouvelle feature

1. Si la feature est un **nouveau panneau** → ajouter dans `panels.css`
2. Si la feature est un **nouveau composant** (bouton, badge, carte) → ajouter dans `cards.css`
3. Si la feature modifie la **structure globale** → modifier `layout.css` avec prudence
4. **Jamais** : ajouter des styles en `style=""` inline dans `index.html` pour des composants réutilisables
5. **Jamais** : définir des couleurs en dur (`#3466a0`) — utiliser les variables CSS (`var(--blue)`)
