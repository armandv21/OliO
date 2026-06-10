# OliO — Architecture & Guide de navigation

> **Règle d'or** : chaque modification doit toucher **uniquement** le fichier responsable de la fonctionnalité concernée. `index.html` ne doit jamais être modifié par un script automatisé.

---

## Vue d'ensemble

OliO est une SaaS de gestion de portefeuille en Vanilla JS + CSS modulaire.  
Backend : Supabase (auth + BDD) · Paiements : Stripe · Charts : Plotly.js

```
┌─────────────────────────────────────────────────────────────┐
│  index.html  ← SHELL UNIQUE. Contient le DOM de base       │
│              Ne jamais modifier sans lancer les smoke tests │
└───────────────────────┬─────────────────────────────────────┘
                        │ charge dans l'ordre ↓
     ┌──────────────────┼──────────────────────────┐
     ▼                  ▼                          ▼
 styles/*.css       js/*.js                  js/panels/*.js
 (apparence)        (logique métier)         (panneaux full-screen)
```

---

## Arborescence commentée

```
OliO/
│
├── index.html                  # Shell HTML unique. Contient :
│                               #   - les <link> CSS (ordre obligatoire)
│                               #   - la topbar + nav
│                               #   - les modales (auth, asset-sheet, alert…)
│                               #   - les <script> JS (ordre obligatoire, voir js/README.md)
│                               # ⚠️  FICHIER CRITIQUE — voir "Zones protégées" ci-dessous
│
├── styles/                     # CSS modulaire — voir styles/README.md
│   ├── variables.css           # Tokens de design (couleurs, fonts, spacing)
│   ├── base.css                # Reset + styles globaux body/html
│   ├── layout.css              # Grille principale (.app, .main, .topbar, .sidebar)
│   ├── sidebar.css             # Barre latérale gauche (liste des actifs)
│   ├── cards.css               # Cartes actifs (home + sidebar)
│   ├── panels.css              # Panneaux full-screen (Articles, Portefeuilles…)
│   ├── auth.css                # Modale d'authentification
│   ├── profile.css             # Dropdown profil + onglets Paramètres/Compte
│   ├── contact.css             # Formulaire de contact
│   └── responsive.css          # Media queries mobile
│
├── js/                         # Voir js/README.md pour les dépendances et l'ordre de chargement
│   ├── config.js               # Initialisation Supabase (window.supabaseClient)
│   ├── auth.js                 # Authentification (login, signup, logout)
│   ├── profile.js              # Profil utilisateur (lecture/écriture Supabase)
│   ├── assets.js               # Liste des actifs + modale fiche actif
│   ├── ui.js                   # Helpers UI (sidebar, ouverture des panneaux)
│   ├── optimization.js         # Algorithme d'optimisation (Markowitz, appState)
│   ├── app.js                  # Orchestrateur principal — CHARGÉ EN AVANT-DERNIER
│   ├── stripe.js               # Intégration Stripe (upgrade Pro)
│   ├── copilot.js              # Copilote LLM (IIFE, CHARGÉ EN DERNIER)
│   │
│   ├── charts/                 # Visualisations Plotly — une par graphique
│   │   ├── frontier.js         # Frontière efficiente
│   │   ├── cml.js              # Capital Market Line
│   │   ├── risk.js             # Analyse du risque
│   │   └── correlation.js      # Matrice de corrélation
│   │
│   ├── panels/                 # Panneaux full-screen (chargés après app.js)
│   │   ├── articles.js         # Panneau Articles (Supabase + fallback statique)
│   │   ├── portfolios.js       # Panneau Portefeuilles + édition profil
│   │   └── news.js             # Panneau Actualités (IIFE, lit data/news.json)
│   │
│   └── data/
│       └── articles.js         # Contenu HTML statique des articles (fallback offline)
│
├── data/
│   └── news.json               # Articles auto-générés (mis à jour 3×/jour par news_bot)
│                               # ← SEUL fichier que le workflow news_cron.yml doit modifier
│
├── scripts/
│   └── news_bot.py             # Générateur d'articles (RSS + Claude API)
│                               # Ne modifie QUE data/news.json
│
├── backend/                    # Backend Python (déployé sur Render, repo App-backend)
│   ├── main.py                 # Endpoints /copilot (Groq + Llama 3.3 70B)
│   └── requirements.txt
│
├── images/
│   └── logo_olio.png           # Logo (utilisé dans la modale auth)
│
├── tests/
│   └── smoke.js                # 64 tests d'intégrité — voir tests/README.md
│
└── .github/
    ├── CODEOWNERS              # Fichiers critiques → review @armandv21 requise
    └── workflows/
        ├── smoke.yml           # CI : lance smoke.js sur chaque push/PR
        └── news_cron.yml       # Bot news : 3×/jour, modifie UNIQUEMENT data/news.json
```

---

## Zones protégées

Ces éléments dans `index.html` **ne doivent jamais être supprimés ou déplacés** — les smoke tests les vérifient automatiquement et bloqueront tout merge qui les toucherait :

| Élément | ID/sélecteur | Rôle |
|---|---|---|
| Lien font gothique | `UnifrakturMaguntia` dans le `<link>` Google Fonts | Carte newsletter |
| Favicon no-op | `<link rel="icon" href="data:,">` | Évite un 404 |
| Bouton Articles | `onclick="…initArticlesPanel()"` | Mode développeur articles |
| Dropdown profil | `id="profileWrap"` — doit être **dans la topbar** | Menu utilisateur |
| Carte newsletter | `id="newsletterSideTab"` | Lien Brevo |
| Éditeur articles | `id="articleEditorModal"` | Interface dev pour éditer les articles |
| Script copilote | `src="js/copilot.js"` — doit être le **dernier** `<script>` | Copilote LLM |

---

## Flux de données

```
Supabase (BDD)
    │
    ├──► auth.js          → session utilisateur (window._profileData)
    ├──► assets.js        → liste des actifs (window.ASSETS_DATA)
    ├──► panels/articles.js → articles (fallback : js/data/articles.js)
    └──► panels/portfolios.js → portefeuilles sauvegardés

data/news.json (GitHub)
    └──► panels/news.js   → fil d'actualités (aucune dépendance Supabase)

Backend Render (Groq API)
    └──► js/copilot.js    → réponses du copilote (/copilot endpoint)

Stripe
    └──► js/stripe.js     → upgrade Pro (window.upgradeToPro)
```

---

## Règles d'isolation des modifications

| Tu veux modifier… | Tu touches UNIQUEMENT… | Tu ne touches PAS… |
|---|---|---|
| L'apparence de la topbar | `styles/layout.css` | `index.html` |
| La carte newsletter | `id="newsletterSideTab"` dans `index.html` | Les scripts JS |
| Le panneau Articles | `js/panels/articles.js` | `index.html`, `js/app.js` |
| Le copilote LLM (front) | `js/copilot.js` | `index.html` (sauf URL backend) |
| Le copilote LLM (back) | `backend/main.py` dans App-backend | Rien dans OliO |
| Les articles news | `data/news.json` (via `scripts/news_bot.py`) | `index.html`, tout JS |
| Un graphique existant | `js/charts/[nom].js` | `js/app.js`, `optimization.js` |
| Les couleurs/fonts | `styles/variables.css` | Aucun autre fichier CSS |
| L'auth (login/signup) | `js/auth.js` + `styles/auth.css` | `js/profile.js`, `js/app.js` |
| Les tests CI | `tests/smoke.js` | `.github/workflows/smoke.yml` |
