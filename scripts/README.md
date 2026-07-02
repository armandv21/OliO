# scripts/ — Utilitaires

---

## news_bot.py

Génère automatiquement un article d'actualité financière et l'ajoute à `data/news.json`.

**Déclenchement** : via `news_cron.yml` (3×/jour) ou en local :
```bash
ANTHROPIC_API_KEY=sk-... python scripts/news_bot.py
```

**Ce qu'il fait** :
1. Fetche plusieurs flux RSS financiers (via `httpx`)
2. Sélectionne les articles les plus récents
3. Appelle Claude (Anthropic API) pour générer un résumé structuré en français
4. Ajoute le résultat en tête de `data/news.json` (max ~50 entrées gardées)

**Format de sortie** (`data/news.json`) :
```json
[
  {
    "date": "2026-06-10T14:30:00Z",
    "titre": "...",
    "resume": "...",
    "source": "...",
    "url": "..."
  }
]
```

**⚠️ Règle critique** : ce script modifie **uniquement** `data/news.json`.  
Il ne doit jamais modifier `index.html`, les fichiers `js/` ou `styles/`.

**Dépendances** :
```
anthropic   # Client Claude API
httpx       # HTTP async pour les flux RSS
```
