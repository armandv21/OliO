# tests/ — Suite de tests

> Les smoke tests sont la **ligne de défense principale** contre les régressions.  
> Tout commit qui casse un test est automatiquement bloqué par le CI.

---

## Lancer les tests

```bash
node tests/smoke.js
```

Sortie attendue : `64 tests — 64 ✓  0 ✗`

---

## Ce que les tests vérifient (10 sections)

| Section | Nb tests | Ce qu'elle protège |
|---|---|---|
| 1. Structure HTML | 13 | Topbar, nav buttons, profileWrap dans la bonne position |
| 2. Fonts & Favicon | 2 | `UnifrakturMaguntia`, favicon `data:,` |
| 3. Newsletter | 2 | `#newsletterSideTab`, lien Brevo |
| 4. Copilote LLM | 3 | Script tag, fichier sur disque, URL backend |
| 5. Mode dev Articles | 2 | `#articleEditorModal`, champs `aeTitre`/`aeContent` |
| 6. CSS layout | 6 | `height:100vh`, `overflow:hidden`, pas de `position:fixed+inset:0` |
| 7. Fichiers CSS | 10 | Présence de tous les fichiers `styles/*.css` |
| 8. Fichiers JS | 15 | Présence de tous les fichiers `js/**/*.js` |
| 9. Ordre des scripts | 2 | `auth.js` avant `app.js`, `copilot.js` en dernier |
| 10. Onglet Profil | 9 | Badge abonnement (gratuit/pro/premium), exports `profile.js` |

---

## Ajouter un test

Chaque test suit le même pattern :

```javascript
test('description claire de ce qui est vérifié', () => {
  assert(condition, 'message affiché si le test échoue');
});
```

**Règles** :
- Le nom du test doit dire POURQUOI c'est important, pas juste QUOI
- Ajouter dans la section thématique correspondante (pas en fin de fichier)
- Toujours ajouter un test quand on restaure quelque chose de cassé — pour empêcher la régression

**Exemple — ajouter un test pour un nouvel ID critique** :
```javascript
// Section 1 — Structure HTML
test('id="monNouvelElement" présent dans index.html', () =>
  assert(html.includes('id="monNouvelElement"'),
    'monNouvelElement manquant — [expliquer la conséquence]'));
```

---

## Pourquoi ces tests existent

Le commit `b2e7d659` (news_bot, juin 2026) a pushé directement sur `main` en réécrivant
`index.html` depuis une version ancienne, supprimant silencieusement :
- `js/copilot.js` (script tag remplacé par `news.js`)
- `initArticlesPanel()` (mode dev Articles cassé)
- `profileWrap` (dropdown profil déplacé en bas du body)
- `UnifrakturMaguntia` (newsletter sans typo gothique)
- `#newsletterSideTab` (carte newsletter disparue)
- `#articleEditorModal` (modale dev supprimée)

Les sections 2, 3, 4, 5 et le test "profileWrap dans la topbar" ont été ajoutés
spécifiquement pour détecter ce type de régression.
