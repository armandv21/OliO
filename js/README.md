# js/ — Modules JavaScript

> **Règle absolue** : l'ordre de chargement dans `index.html` est critique.  
> Ne jamais réorganiser les balises `<script>` sans vérifier les dépendances ci-dessous.

---

## Ordre de chargement (index.html)

```
1.  js/config.js           → window.supabaseClient
2.  js/auth.js             → session, doLogin(), doSignup()  [dépend: config]
3.  js/profile.js          → window._profileData            [dépend: auth]
4.  js/assets.js           → window.ASSETS_DATA, openAssetSheet() [dépend: config]
5.  js/ui.js               → openFullPanel(), sidebar       [dépend: assets]
6.  js/optimization.js     → appState, runOptimization()    [dépend: —]
7.  js/charts/frontier.js  → drawFrontier()                 [dépend: optimization]
8.  js/charts/cml.js       → drawCML()                      [dépend: optimization]
9.  js/charts/risk.js      → drawRisk()                     [dépend: optimization]
10. js/charts/correlation.js → drawCorrelation()            [dépend: optimization]
11. js/panels/articles.js  → initArticlesPanel()            [dépend: config]
12. js/panels/portfolios.js → loadPortfolios()              [dépend: config, optimization]
13. js/data/articles.js    → window._articleData (fallback statique)
14. js/app.js              → init() — AVANT-DERNIER         [dépend: tout ce qui précède]
15. js/stripe.js           → upgradeToPro()                 [dépend: auth]
16. js/panels/news.js      → (IIFE) inject news tab         [dépend: —]
17. js/copilot.js          → (IIFE) widget copilote         [dépend: app, assets] ← DERNIER
```

---

## Modules racine

### `config.js`
Initialise le client Supabase et l'expose sur `window.supabaseClient`.  
**Modifier uniquement pour** : changer les credentials Supabase (URL + anon key).

### `auth.js`
Gère login, signup, logout, réinitialisation de mot de passe.  
**Exports globaux** : `doLogin()`, `doSignup()`, `doLogout()`, `openAuthModal()`, `closeAuthModal()`  
**Ne pas toucher** : la logique de session (`onAuthStateChange`) — elle déclenche le chargement du profil.

### `profile.js`
Lit et écrit le profil utilisateur dans Supabase (`profiles` table).  
**Exports globaux** : `window.toggleEditProfile()`, `window.saveProfileData()`, `window.sendPasswordReset()`, `window.isUserPremium()`  
**État** : `window._profileData` — objet `{ pseudo, nom, prenom, email, abonnement, … }`  
**Ne pas toucher** : l'écouteur `onAuthStateChange` — il synchronise le dropdown profil.

### `assets.js`
Charge la liste des actifs depuis Supabase et les rend dans la sidebar.  
**Exports globaux** : `window.ASSETS_DATA`, `window.openAssetSheet(ticker, name, isin)`, `window.applyPortfolio(composition)`, `renderHomeAssetList()`, `updateHomeCount()`  
**Important** : `openAssetSheet()` ouvre la modale d'analyse d'actif — utilisé par le copilote pour créer des liens cliquables.

### `ui.js`
Helpers purement UI : sidebar expand/collapse, ouverture des panneaux full-screen.  
**Exports globaux** : `openFullPanel(id)`, `closePanel(id)`, `expandSidebar()`, `collapseSidebar()`  
**Dépend de** : `renderHomeAssetList()` et `updateHomeCount()` depuis `assets.js`.  
**Ne pas toucher** : `_panelMap` — il mappe les IDs de panneaux aux boutons de nav dans `index.html`.

### `optimization.js`
Algorithme de Markowitz, calcul de la frontière efficiente, Monte Carlo.  
**Exports globaux** : `appState`, `runOptimization()`, `portfolioStats`  
**Ne pas toucher** : `appState.selected` (Set de tickers) — synchronisé avec les checkboxes de la sidebar.

### `app.js`
Orchestrateur principal : chargement des actifs depuis Supabase, event listeners top-level, initialisation post-auth.  
**Doit être chargé après** tous les modules listés aux positions 1–13.  
**Ne pas ajouter** de logique métier ici — déléguer aux modules spécialisés.

### `stripe.js`
Intégration Stripe Checkout pour l'upgrade Pro.  
**Exports globaux** : `window.upgradeToPro()`

### `copilot.js`
Widget copilote LLM (IIFE auto-exécutée, s'injecte dans le DOM).  
**Backend** : `https://app-backend-k9i5.onrender.com/copilot`  
**Exports globaux** : `window._copilotClose()`, `window._copilotSend()`, `window._copilotToggleAuto()`  
**⚠️ Doit être le dernier script chargé** — il appelle `window.openAssetSheet`, `window.applyPortfolio`, `window.openSavePortfolio` qui doivent tous être définis.

---

## charts/

Chaque fichier = une fonction de rendu Plotly.  
Tous dépendent de `appState` et `portfolioStats` (définis dans `optimization.js`).

| Fichier | Fonction principale | Graphique |
|---|---|---|
| `frontier.js` | `drawFrontier()` | Frontière efficiente + nuage de simulations |
| `cml.js` | `drawCML()` | Capital Market Line |
| `risk.js` | `drawRisk()` | Contribution au risque par actif |
| `correlation.js` | `drawCorrelation()` | Heatmap de corrélation |

**Ajouter un graphique** : créer `js/charts/[nom].js`, ajouter le `<script>` dans `index.html` entre `optimization.js` et `panels/articles.js`, ajouter le `<div id="...">` dans `index.html`, ajouter le chemin dans la liste des fichiers vérifiés par `tests/smoke.js`.

---

## panels/

Panneaux full-screen activés via `openFullPanel(id)`.

### `articles.js`
Panneau Articles avec pagination infinie, filtres catégorie/niveau, paywall (6 articles gratuits).  
**Dépend de** : `window.supabaseClient`, `window._articleData` (fallback), `window.isUserPremium()`  
**Exports globaux** : `initArticlesPanel()`, `openArticle(id)`, `closeArticle()`  
**⚠️ `initArticlesPanel()` DOIT rester dans le `onclick` du bouton Articles** dans `index.html` — c'est ce qui active le mode développeur.

### `portfolios.js`
Panneau Portefeuilles : liste des portefeuilles sauvegardés + édition du profil utilisateur.  
**Dépend de** : `window.supabaseClient`, `appState`, `portfolioStats`  
**Note** : contient aussi `window.toggleEditProfile()` et `window.saveProfileData()` — ces fonctions sont également utilisées depuis le dropdown profil dans `index.html`.

### `news.js`
Injecte un onglet "Actualités" dans le panneau Articles (IIFE auto-exécutée).  
Source : `data/news.json` (aucune dépendance Supabase).  
**Ne modifie pas** la structure existante du panneau Articles — elle s'y greffe.

---

## data/

### `data/articles.js`
Contenu HTML complet des articles (fichier volumineux ~100 KB).  
**Expose** : `window._articleData` (objet `{id: htmlString}`) et `window._articlesMeta`  
**Rôle** : fallback si Supabase est indisponible.  
**⚠️ Ne pas modifier manuellement** — le contenu est géré via l'interface d'admin (`#articleEditorModal`).
