// ── Panneau Articles ─────────────────────────────────────────────────────────

  // ── ARTICLE READER ──────────────────────────────────────────────
  let _currentArticleId = null;

  function _getArticleTitle(id) {
    const html = window._articleData[id] || '';
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    return m ? m[1].replace(/<[^>]+>/g, '') : `Article ${id}`;
  }

  function _getArticleIds() {
    return Object.keys(window._articleData).map(Number).sort((a, b) => a - b);
  }

  function _renderArticleNav(id) {
    const navEl = document.getElementById('articleNav');
    if (!navEl) return;
    const ids = _getArticleIds();
    const idx = ids.indexOf(Number(id));
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;

    const prevBtn = prevId ? `
      <button onclick="openArticle(${prevId})"
        style="flex:1;text-align:left;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--teal-lt);border-radius:8px;padding:16px 20px;cursor:pointer;font-family:var(--font-sans);transition:all 0.18s;"
        onmouseover="this.style.background='var(--surface2)';this.style.borderLeftColor='var(--teal)'"
        onmouseout="this.style.background='var(--surface)';this.style.borderLeftColor='var(--teal-lt)'">
        <div style="font-size:0.6rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);margin-bottom:6px">← Article précédent</div>
        <div style="font-size:0.85rem;font-weight:600;color:var(--ink);line-height:1.35">${_getArticleTitle(prevId)}</div>
      </button>` : `<div style="flex:1"></div>`;

    const nextBtn = nextId ? `
      <button onclick="openArticle(${nextId})"
        style="flex:1;text-align:right;background:var(--surface);border:1px solid var(--border);border-right:3px solid var(--blue);border-radius:8px;padding:16px 20px;cursor:pointer;font-family:var(--font-sans);transition:all 0.18s;"
        onmouseover="this.style.background='var(--surface2)';this.style.borderRightColor='var(--blue-lt)'"
        onmouseout="this.style.background='var(--surface)';this.style.borderRightColor='var(--blue)'">
        <div style="font-size:0.6rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--blue);margin-bottom:6px">Article suivant →</div>
        <div style="font-size:0.85rem;font-weight:600;color:var(--ink);line-height:1.35">${_getArticleTitle(nextId)}</div>
      </button>` : `<div style="flex:1"></div>`;

    navEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:stretch;gap:16px;margin-top:48px;padding-top:32px;border-top:1px solid var(--border)">
        ${prevBtn}${nextBtn}
      </div>`;
  }

  function openArticle(id) {
    _currentArticleId = Number(id);
    document.getElementById('articlesGrid').style.display = 'none';
    document.getElementById('articleReader').style.display = 'block';
    document.getElementById('articleContent').innerHTML = window._articleData[id];
    _renderArticleNav(id);
    document.querySelector('.fullscreen-panel-body').scrollTop = 0;
  }

  function closeArticle() {
    document.getElementById('articleReader').style.display = 'none';
    document.getElementById('articlesGrid').style.display = 'block';
    document.querySelector('.fullscreen-panel-body').scrollTop = 0;
  }

window.openArticle = openArticle;
window.closeArticle = closeArticle;
