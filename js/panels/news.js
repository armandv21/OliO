/* ── OliO · Actualités ────────────────────────────────────────────────────────
 * Injecte un onglet "Actualités" dans le panneau Articles.
 * Source : data/news.json (généré par GitHub Actions 3×/jour).
 * Aucune dépendance Supabase.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ─── État ─── */
  let _activeTab       = 'analyses';
  let _newsInitialized = false;
  let _newsData        = null;   // cache du JSON complet

  /* ─── Helper DOM ─── */
  const $ = id => document.getElementById(id);

  /* ─── Injection UI : onglets + conteneur news ─── */
  function _injectNewsUI() {
    if ($('articlesTabs')) return;
    const ag = $('articlesGrid');
    if (!ag) return;

    const tabs = document.createElement('div');
    tabs.id = 'articlesTabs';
    Object.assign(tabs.style, {
      display: 'flex', gap: '0',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      position: 'sticky', top: '0', zIndex: '10',
      background: 'var(--bg)',
    });
    tabs.innerHTML = `
      <button id="tabBtnAnalyses" onclick="switchArticlesTab('analyses')"
        style="padding:13px 20px;background:none;border:none;border-bottom:2px solid var(--blue);
               font-family:var(--font-sans);font-size:0.78rem;font-weight:700;color:var(--blue);
               cursor:pointer;letter-spacing:0.04em;transition:all 0.15s;outline:none;">
        Analyses &amp; Concepts
      </button>
      <button id="tabBtnActu" onclick="switchArticlesTab('actu')"
        style="padding:13px 20px;background:none;border:none;border-bottom:2px solid transparent;
               font-family:var(--font-sans);font-size:0.78rem;font-weight:700;color:var(--muted);
               cursor:pointer;letter-spacing:0.04em;transition:all 0.15s;outline:none;">
        Actualités
        <span id="newsNewBadge" style="display:none;margin-left:6px;padding:1px 7px;
          background:var(--rose);color:white;border-radius:10px;
          font-size:0.58rem;font-weight:700;vertical-align:middle;">NEW</span>
      </button>`;

    const ng = document.createElement('div');
    ng.id = 'newsGrid';
    ng.style.cssText = 'display:none;max-width:900px;margin:28px auto 60px;padding:0 32px;';

    ag.parentNode.insertBefore(tabs, ag);
    ag.insertAdjacentElement('afterend', ng);
    ag.style.marginTop = '24px';
  }

  /* ─── Basculement d'onglet ─── */
  window.switchArticlesTab = function (tab) {
    _activeTab = tab;
    const reader = $('articleReader');
    if (reader) reader.style.display = 'none';

    const btnA = $('tabBtnAnalyses'), btnN = $('tabBtnActu');
    if (btnA) { btnA.style.color = tab === 'analyses' ? 'var(--blue)' : 'var(--muted)'; btnA.style.borderBottomColor = tab === 'analyses' ? 'var(--blue)' : 'transparent'; }
    if (btnN) { btnN.style.color = tab === 'actu'     ? 'var(--blue)' : 'var(--muted)'; btnN.style.borderBottomColor = tab === 'actu'     ? 'var(--blue)' : 'transparent'; }

    const ag = $('articlesGrid'), ng = $('newsGrid');
    if (ag) ag.style.display = tab === 'analyses' ? 'block' : 'none';
    if (ng) ng.style.display = tab === 'actu'     ? 'block' : 'none';

    const badge = $('newsNewBadge');
    if (badge && tab === 'actu') badge.style.display = 'none';

    if (tab === 'actu' && !_newsInitialized) {
      _newsInitialized = true;
      _initNewsPanel();
    }
    const pb = document.querySelector('.fullscreen-panel-body');
    if (pb) pb.scrollTop = 0;
  };

  /* ─── Chargement du JSON ─── */
  async function _loadNews() {
    if (_newsData) return _newsData;
    const r = await fetch('./data/news.json?_=' + Date.now());
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    _newsData = await r.json();
    return _newsData;
  }

  /* ─── Format date FR ─── */
  function _dateFR(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ─── Rendu de la grille ─── */
  const _GRADS = [
    'linear-gradient(135deg,#1e3a5f,#3466a0)',
    'linear-gradient(135deg,#1a5c52,#2d8a7a)',
    'linear-gradient(135deg,#8a5a00,#c4820a)',
    'linear-gradient(135deg,#7a1f2e,#b03045)',
    'linear-gradient(135deg,#3466a0,#1a5c52)',
  ];

  function _renderNewsGrid(articles) {
    const ng = $('newsGrid');
    if (!ng) return;

    if (!articles.length) {
      ng.innerHTML = `
        <div style="text-align:center;padding:64px 0;color:var(--muted);font-size:0.88rem;line-height:2;">
          Aucune actualité disponible pour le moment.<br>
          <span style="font-size:0.78rem;opacity:0.65;">Les articles sont générés automatiquement 3 fois par jour.</span>
        </div>`;
      return;
    }

    let html = `
      <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:700;color:var(--ink);margin-bottom:8px">
        Actualités Financières
      </div>
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:28px">
        Analyses générées 3× par jour à partir des dernières nouvelles des marchés.
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px">`;

    articles.forEach((a, idx) => {
      const grad     = _GRADS[idx % _GRADS.length];
      const date     = _dateFR(a.published_at);
      const tagsHtml = (a.tags || []).slice(0, 2).map(t =>
        `<span style="font-size:0.67rem;color:var(--teal);background:rgba(26,92,82,0.1);padding:3px 9px;border-radius:20px;">${t}</span>`
      ).join('');

      html += `
        <button onclick="openNewsArticle(${idx})"
          style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
                 padding:28px 24px;cursor:pointer;text-align:left;transition:all 0.2s;font-family:var(--font-sans);"
          onmouseover="this.style.borderColor='var(--border2)';this.style.background='var(--surface2)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
          <div style="width:52px;height:52px;border-radius:12px;background:${grad};
                      display:flex;align-items:center;justify-content:center;
                      margin-bottom:18px;font-size:1.4rem;">${a.icone || '📰'}</div>
          <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.14em;
                      text-transform:uppercase;color:var(--muted);margin-bottom:8px">${a.categorie}</div>
          <div style="font-family:var(--font-serif);font-size:1.05rem;font-weight:700;
                      color:var(--ink);line-height:1.3;margin-bottom:10px">${a.titre}</div>
          <p style="font-size:0.78rem;color:var(--muted);line-height:1.6;margin-bottom:14px">${a.resume}</p>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.66rem;color:var(--muted);background:var(--surface2);
                         padding:3px 9px;border-radius:20px;">${date}</span>
            ${tagsHtml}
          </div>
          <div style="margin-top:14px;font-size:0.75rem;font-weight:600;color:var(--blue);
                      letter-spacing:0.04em;">Lire l'article →</div>
        </button>`;
    });

    html += '</div>';
    ng.innerHTML = html;
  }

  /* ─── Ouverture d'un article (par index dans le tableau) ─── */
  window.openNewsArticle = function (idx) {
    const reader  = $('articleReader');
    const content = $('articleContent');
    if (!reader || !content || !_newsData) return;

    const article = _newsData[idx];
    if (!article) return;

    const ag = $('articlesGrid'); if (ag) ag.style.display = 'none';
    const ng = $('newsGrid');     if (ng) ng.style.display = 'none';
    reader.style.display = 'block';

    const backBtn = reader.querySelector('button');
    if (backBtn) {
      backBtn.textContent = '← Retour aux actualités';
      backBtn.onclick = window.closeNewsArticle;
    }

    content.innerHTML = article.content || '<p>Contenu indisponible.</p>';
    const pb = document.querySelector('.fullscreen-panel-body');
    if (pb) pb.scrollTop = 0;
  };

  /* ─── Fermeture → retour actualités ─── */
  window.closeNewsArticle = function () {
    const reader = $('articleReader'); if (reader) reader.style.display = 'none';
    const ng     = $('newsGrid');      if (ng)     ng.style.display     = 'block';
    if (reader) {
      const backBtn = reader.querySelector('button');
      if (backBtn) { backBtn.textContent = '← Retour aux articles'; backBtn.onclick = window.closeArticle; }
    }
    const pb = document.querySelector('.fullscreen-panel-body');
    if (pb) pb.scrollTop = 0;
  };

  /* ─── closeArticle conscient de l'onglet actif ─── */
  const _origClose = window.closeArticle;
  window.closeArticle = function () {
    if (_activeTab === 'actu') window.closeNewsArticle();
    else if (_origClose) _origClose.call(this);
  };

  /* ─── Init panneau actualités ─── */
  async function _initNewsPanel() {
    const ng = $('newsGrid');
    if (!ng) return;
    ng.innerHTML = '<div style="color:var(--muted);text-align:center;padding:64px;font-size:0.85rem;">Chargement…</div>';
    try {
      _newsData = null;   // forcer un fetch frais à chaque ouverture
      const articles = await _loadNews();
      _renderNewsGrid(articles);
      if (articles.length) {
        const badge    = $('newsNewBadge');
        const lastSeen = localStorage.getItem('olio_news_seen');
        if (badge && lastSeen !== String(articles[0].id)) badge.style.display = 'inline';
        localStorage.setItem('olio_news_seen', String(articles[0].id));
      }
    } catch (e) {
      const ng2 = $('newsGrid');
      if (ng2) ng2.innerHTML = `<div style="color:var(--rose-lt);text-align:center;padding:64px;">
        Impossible de charger les actualités.<br>
        <span style="font-size:0.75rem;opacity:0.7;">${e.message}</span>
      </div>`;
    }
  }

  /* ─── Hook sur initArticlesPanel ─── */
  function _patchInit() {
    const orig = window.initArticlesPanel;
    if (!orig) return;
    window.initArticlesPanel = async function () {
      _injectNewsUI();
      _activeTab       = 'analyses';
      _newsInitialized = false;
      const btnA = $('tabBtnAnalyses'), btnN = $('tabBtnActu');
      if (btnA) { btnA.style.color = 'var(--blue)'; btnA.style.borderBottomColor = 'var(--blue)'; }
      if (btnN) { btnN.style.color = 'var(--muted)'; btnN.style.borderBottomColor = 'transparent'; }
      const ag = $('articlesGrid'); if (ag) ag.style.display = 'block';
      const ng = $('newsGrid');     if (ng) ng.style.display = 'none';
      await orig.call(this);
    };
  }

  /* ─── Bootstrap ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _patchInit(); _injectNewsUI(); });
  } else {
    _patchInit();
    _injectNewsUI();
  }

})();
