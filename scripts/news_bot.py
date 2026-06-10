#!/usr/bin/env python3
"""
OliO News Bot — génère 1 article d'actualité financière et l'ajoute à data/news.json.
Déclenché 3×/jour par GitHub Actions qui commit + push le fichier mis à jour.
Seul secret requis : ANTHROPIC_API_KEY
"""
import os, sys, re, json, httpx, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
import anthropic

# ── Config ────────────────────────────────────────────────────────────────────
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]
NEWS_FILE     = Path("data/news.json")
MAX_ARTICLES  = 90   # garder les 90 derniers articles

RSS_FEEDS = [
    "https://news.google.com/rss/search?q=bourse+actions+march%C3%A9s+financiers&hl=fr&gl=FR&ceid=FR:fr",
    "https://news.google.com/rss/search?q=%C3%A9conomie+banque+centrale+inflation+taux&hl=fr&gl=FR&ceid=FR:fr",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,BTC-USD,EURUSD%3DX&region=US&lang=en-US",
]
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; OliO-NewsBot/1.0)"}
MOIS_FR = ["janvier","février","mars","avril","mai","juin",
           "juillet","août","septembre","octobre","novembre","décembre"]

# ── RSS fetch ─────────────────────────────────────────────────────────────────
def _clean(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t or "")).strip()

def fetch_headlines() -> list[dict]:
    seen, out = set(), []
    for url in RSS_FEEDS:
        try:
            r = httpx.get(url, headers=HEADERS, timeout=20, follow_redirects=True)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            for item in root.iter("item"):
                title = _clean(item.findtext("title") or "")
                desc  = _clean(item.findtext("description") or "")
                if len(title) > 12 and title not in seen:
                    seen.add(title)
                    out.append({"title": title, "desc": desc[:250]})
        except Exception as e:
            print(f"[WARN] RSS {url}: {e}", file=sys.stderr)
        if len(out) >= 15:
            break
    return out[:15]

# ── Claude generation ─────────────────────────────────────────────────────────
PROMPT = """Tu es le rédacteur financier d'OliO, application d'investissement pour particuliers français.

Date du jour : {date}

Dernières actualités financières :
{headlines}

MISSION : sélectionne l'information la plus importante pour un investisseur de détail et génère un article d'actualité bref, percutant et illustré.

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant ou après) :
{{
  "titre": "Titre accrocheur, max 75 caractères",
  "categorie": "Actualité · [Marchés | Macro | Crypto | Taux | Entreprises]",
  "icone": "un seul emoji adapté",
  "resume": "Une phrase résumant l'essentiel, max 110 caractères",
  "tags": ["tag1", "tag2"],
  "content": "HTML complet de l'article (voir règles ci-dessous)"
}}

━━━ RÈGLES CONTENT ━━━
Structure obligatoire dans cet ordre :

1. Badge catégorie :
   <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">CATÉGORIE</div>

2. Titre H1 :
   <h1 style="font-family:var(--font-serif);font-size:2rem;font-weight:700;line-height:1.25;color:var(--ink);margin-bottom:10px">TITRE</h1>

3. Meta lecture :
   <p style="font-size:0.8rem;color:var(--muted);margin-bottom:32px">Lecture : 2 min · {date}</p>

4. Paragraphe 1 — Le fait clé (chiffres concrets, ce qui s'est passé) :
   <p style="font-size:1rem;line-height:1.75;color:var(--ink2);margin-bottom:20px">...</p>

5. Illustration SVG — graphique simple illustrant l'info clé :
   <svg viewBox="0 0 620 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:620px;display:block;margin:20px auto 28px">
     <!-- Palette : #1e3a5f bleu marine, #3466a0 bleu, #1a5c52 vert, #8a5a00 ambre, #7a1f2e rouge, #ede9e1 fond, #b0a99f gris -->
     <!-- Bar chart ou line chart avec données chiffrées réelles de l'article -->
   </svg>

6. Paragraphe 2 — Pourquoi ça compte pour l'investisseur :
   <p style="font-size:1rem;line-height:1.75;color:var(--ink2);margin-bottom:20px">...</p>

7. Paragraphe 3 — Ce qu'il faut surveiller / perspective :
   <p style="font-size:1rem;line-height:1.75;color:var(--ink2);margin-bottom:20px">...</p>

8. Encadré "À retenir" :
   <div style="background:var(--surface2);border-left:4px solid var(--blue);border-radius:0 8px 8px 0;padding:20px 28px;margin:20px 0">
     <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">À retenir</div>
     <p style="font-size:0.9rem;line-height:1.65;color:var(--ink2);margin:0">Synthèse en 2-3 lignes max.</p>
   </div>

Règles rédaction :
- Mots clés en gras : <strong style="color:var(--ink)">mot</strong>
- Ton factuel, concis, sans jargon inutile — 280 à 380 mots
- Données chiffrées concrètes obligatoires (%, montants, indices)
- Écriture française impeccable"""

def generate(headlines: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    date_fr = f"{now.day} {MOIS_FR[now.month - 1]} {now.year}"

    hl_text = "\n".join(
        f"• {h['title']}" + (f"\n  {h['desc']}" if h['desc'] else "")
        for h in headlines[:12]
    )

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    msg = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        messages=[{"role": "user", "content": PROMPT.format(date=date_fr, headlines=hl_text)}],
    )
    raw = msg.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$",         "", raw)
    article = json.loads(raw)

    # Ajouter les métadonnées
    article["id"]           = int(now.timestamp())
    article["published_at"] = now.isoformat()
    return article

# ── Lecture / écriture du fichier JSON ────────────────────────────────────────
def load_news() -> list[dict]:
    if NEWS_FILE.exists():
        return json.loads(NEWS_FILE.read_text(encoding="utf-8"))
    return []

def save_news(articles: list[dict]) -> None:
    NEWS_FILE.parent.mkdir(exist_ok=True)
    NEWS_FILE.write_text(
        json.dumps(articles, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("→ Fetching headlines…")
    headlines = fetch_headlines()
    if not headlines:
        print("No headlines found — aborting", file=sys.stderr)
        sys.exit(1)
    print(f"→ {len(headlines)} titres · génération avec claude-opus-4-8…")

    article  = generate(headlines)
    existing = load_news()

    # Prepend + trim
    updated = [article] + existing
    updated = updated[:MAX_ARTICLES]

    save_news(updated)
    print(f"✓ Publié : {article['titre']}")
    print(f"  Total : {len(updated)} articles dans data/news.json")
