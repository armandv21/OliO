# .github/workflows/ — Workflows CI/CD

---

## smoke.yml — Tests d'intégrité

**Déclencheur** : tout push sur n'importe quelle branche + toute PR vers `main`  
**Durée** : ~15 secondes  
**Bloque le merge si** : au moins 1 des 64 tests échoue

```
push / PR → checkout → node tests/smoke.js → ✓ ou ✗
```

**Modifier uniquement pour** : changer la version de Node, ajouter des étapes (lint, build…).  
**Ne jamais** : supprimer le job `smoke` ou changer son nom — c'est le nom déclaré comme required status check dans la branch protection.

---

## news_cron.yml — Générateur d'articles automatique

**Déclencheur** : cron 3×/jour (8h, 16h, 22h heure de Paris) + déclenchement manuel  
**Ce qu'il fait** :
1. Checkout du repo (avec `GH_PAT` pour pouvoir pusher)
2. Lance `scripts/news_bot.py` (fetche des flux RSS + génère un article avec Claude API)
3. Git commit + push de `data/news.json` uniquement

**⚠️ Ce workflow NE DOIT modifier que `data/news.json`**  
Il ne doit jamais toucher `index.html`, les fichiers `js/`, `styles/` ou `tests/`.

**Si le bot casse quelque chose** : vérifier que `git add` dans le workflow ne cible que `data/news.json` (et non `git add .` ou `git add -A`).

**Secrets requis** :
- `GH_PAT` — Personal Access Token avec droit `contents: write`
- `ANTHROPIC_API_KEY` — Clé API Claude pour la génération d'articles

---

## Branch protection (main)

Configurée via l'API GitHub (pas de fichier — état live du repo) :

| Règle | Valeur | Pourquoi |
|---|---|---|
| Required status checks | `smoke` | Bloque tout merge si les tests échouent |
| `strict` mode | `true` | La branche doit être à jour avec main avant le merge |
| Force push | Interdit | Protège l'historique |
| Deletions | Interdit | Protège la branche main |
| `enforce_admins` | `false` | Le propriétaire peut bypass en cas d'urgence |
| Required PR reviews | Aucune | Solo dev — les smoke tests suffisent |

**Pour modifier la branch protection** :
```bash
gh api --method PUT repos/armandv21/OliO/branches/main/protection --input protection.json
```

---

## CODEOWNERS

Fichiers critiques qui déclenchent une notification de review pour `@armandv21` :
- `index.html` — shell HTML unique, le plus fragile
- `.github/workflows/*.yml` — workflows CI/CD
- `tests/smoke.js` — les tests eux-mêmes ne doivent pas être affaiblis
- `js/copilot.js` — copilote LLM
