/* ── OliO · Actualités ────────────────────────────────────────────────────────
 * Injecte un onglet "Actualités" dans le panneau Articles.
 * Source : data/news.json (généré par GitHub Actions 3×/jour).
 * Aucune dépendance Supabase.
 * Mode modérateur : édition/suppression/ajout en mémoire + export JSON.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ─── État ─── */
  let _activeTab       = 'analyses';
  let _newsInitialized = false;
  let _newsData        = null;   // cache du JSON complet
  let _editingIdx      = null;   // null = nouvel article, nombre = édition

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
    const isMod = typeof window.isUserModerator === 'function' && window.isUserModerator();

    if (!articles.length) {
      let emptyHtml = '';
      if (isMod) emptyHtml += _modBarHtml();
      emptyHtml += `
        <div style="text-align:center;padding:64px 0;color:var(--muted);font-size:0.88rem;line-height:2;">
          Aucune actualité disponible pour le moment.<br>
          <span style="font-size:0.78rem;opacity:0.65;">Les articles sont générés automatiquement 3 fois par jour.</span>
        </div>`;
      ng.innerHTML = emptyHtml;
      return;
    }

    let html = '';

    if (isMod) html += _modBarHtml();

    html += `
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

      const cardInner = `
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
                      letter-spacing:0.04em;">Lire l'article →</div>`;

      if (isMod) {
        html += `
        <div style="position:relative;">
          <button onclick="openNewsArticle(${idx})"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;
                   padding:28px 24px;cursor:pointer;text-align:left;transition:all 0.2s;font-family:var(--font-sans);"
            onmouseover="this.style.borderColor='var(--border2)';this.style.background='var(--surface2)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
            ${cardInner}
          </button>
          <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;z-index:2;">
            <button onclick="event.stopPropagation();openNewsEditor(${idx})" title="Modifier"
              style="width:26px;height:26px;background:var(--surface);border:1px solid var(--border);border-radius:5px;
                     cursor:pointer;font-size:0.8rem;color:var(--muted);display:flex;align-items:center;
                     justify-content:center;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'"
              onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">✎</button>
            <button onclick="event.stopPropagation();deleteNewsArticle(${idx})" title="Supprimer"
              style="width:26px;height:26px;background:var(--surface);border:1px solid var(--border);border-radius:5px;
                     cursor:pointer;font-size:1rem;font-weight:300;color:var(--muted);display:flex;align-items:center;
                     justify-content:center;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--rose-lt)';this.style.color='var(--rose)'"
              onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">×</button>
          </div>
        </div>`;
      } else {
        html += `
        <button onclick="openNewsArticle(${idx})"
          style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
                 padding:28px 24px;cursor:pointer;text-align:left;transition:all 0.2s;font-family:var(--font-sans);"
          onmouseover="this.style.borderColor='var(--border2)';this.style.background='var(--surface2)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
          ${cardInner}
        </button>`;
      }
    });

    html += '</div>';
    ng.innerHTML = html;
  }

  /* ─── Barre de mode modérateur ─── */
  function _modBarHtml() {
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 16px;
                  background:rgba(26,92,82,0.06);border:1px solid var(--teal);border-radius:8px;flex-wrap:wrap;">
        <span style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
                     color:var(--teal);flex-shrink:0;">Mode modérateur</span>
        <span style="color:var(--border2)">|</span>
        <button onclick="openNewsEditor(null)"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:var(--teal);color:white;
                 border:none;border-radius:6px;font-family:var(--font-sans);font-size:0.7rem;font-weight:600;
                 letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:opacity 0.15s;"
          onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">+ Ajouter</button>
        <button onclick="exportNewsJson()"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:none;color:var(--teal);
                 border:1px solid var(--teal);border-radius:6px;font-family:var(--font-sans);font-size:0.7rem;
                 font-weight:600;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:all 0.15s;"
          onmouseover="this.style.background='rgba(26,92,82,0.08)'" onmouseout="this.style.background='none'">
          ↓ Exporter JSON</button>
      </div>`;
  }

  /* ─── Ouverture d'un article ─── */
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

    const isMod = typeof window.isUserModerator === 'function' && window.isUserModerator();
    const editBar = isMod ? `
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:20px;">
        <button onclick="openNewsEditor(${idx})"
          style="padding:7px 16px;background:none;border:1px solid var(--teal);color:var(--teal);
                 border-radius:7px;font-family:var(--font-sans);font-size:0.75rem;font-weight:600;
                 cursor:pointer;transition:all 0.15s;"
          onmouseover="this.style.background='rgba(26,92,82,0.08)'"
          onmouseout="this.style.background='none'">✎ Modifier cet article</button>
        <button onclick="deleteNewsArticle(${idx})"
          style="padding:7px 16px;background:none;border:1px solid var(--rose-lt);color:var(--rose-lt);
                 border-radius:7px;font-family:var(--font-sans);font-size:0.75rem;font-weight:600;
                 cursor:pointer;transition:all 0.15s;"
          onmouseover="this.style.background='rgba(122,31,46,0.08)'"
          onmouseout="this.style.background='none'">✕ Supprimer</button>
      </div>` : '';

    content.innerHTML = editBar + (article.content || '<p>Contenu indisponible.</p>');
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

  /* ─── Création (lazy) de la modale éditeur news ─── */
  function _ensureNewsEditorModal() {
    if ($('newsEditorModal')) return;
    const m = document.createElement('div');
    m.id = 'newsEditorModal';
    m.className = 'popup-overlay hidden';
    m.onclick = function (e) { if (e.target === m) closeNewsEditor(); };
    m.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
                  width:min(760px,96vw);max-height:92vh;overflow-y:auto;
                  box-shadow:0 20px 60px rgba(0,0,0,0.18);display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:18px 28px;border-bottom:1px solid var(--border);
                    position:sticky;top:0;background:var(--surface);z-index:1;flex-shrink:0;">
          <div id="neModalTitle"
            style="font-family:var(--font-serif);font-size:1.05rem;font-weight:700;color:var(--ink)">
            Modifier l'article
          </div>
          <button onclick="closeNewsEditor()" class="popup-close" style="position:static;">✕</button>
        </div>
        <div style="padding:22px 28px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div style="grid-column:1/-1;">
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">Titre *</label>
            <input id="neTitre" type="text" placeholder="Titre de l'article"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:var(--font-sans);font-size:0.85rem;
                     color:var(--ink);outline:none;box-sizing:border-box;"/>
          </div>
          <div>
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">Catégorie</label>
            <input id="neCategorie" type="text" placeholder="Actualité · Marchés"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:var(--font-sans);font-size:0.82rem;
                     color:var(--ink);outline:none;box-sizing:border-box;"/>
          </div>
          <div>
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">Icône (emoji)</label>
            <input id="neIcone" type="text" placeholder="📈"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:var(--font-sans);font-size:1.1rem;
                     color:var(--ink);outline:none;box-sizing:border-box;"/>
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">Résumé (carte) *</label>
            <textarea id="neResume" rows="2" placeholder="Description courte affichée sur la carte…"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:var(--font-sans);font-size:0.82rem;
                     color:var(--ink);outline:none;box-sizing:border-box;resize:vertical;"></textarea>
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">
              Tags <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted2)">(séparés par des virgules)</span>
            </label>
            <input id="neTags" type="text" placeholder="Actions, Marchés, France"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:var(--font-sans);font-size:0.82rem;
                     color:var(--ink);outline:none;box-sizing:border-box;"/>
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                          text-transform:uppercase;color:var(--muted);margin-bottom:5px">
              Contenu HTML * <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted2)">(corps de l'article)</span>
            </label>
            <textarea id="neContent" rows="14" placeholder="<h1 style=&quot;...&quot;>Titre</h1>…"
              style="width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);
                     border-radius:6px;font-family:monospace;font-size:0.78rem;
                     color:var(--ink);outline:none;box-sizing:border-box;resize:vertical;line-height:1.5;"></textarea>
          </div>
        </div>
        <div style="padding:14px 28px 22px;border-top:1px solid var(--border);
                    display:flex;align-items:center;justify-content:space-between;
                    flex-shrink:0;position:sticky;bottom:0;background:var(--surface);">
          <div id="neSaveMsg" style="font-size:0.78rem;font-weight:600;"></div>
          <div style="display:flex;gap:10px;">
            <button onclick="closeNewsEditor()"
              style="padding:9px 18px;background:none;border:1px solid var(--border);border-radius:6px;
                     font-family:var(--font-sans);font-size:0.78rem;font-weight:600;color:var(--ink2);
                     cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--border2)'"
              onmouseout="this.style.borderColor='var(--border)'">Annuler</button>
            <button onclick="saveNewsArticle()"
              style="padding:9px 18px;background:var(--teal);color:white;border:none;border-radius:6px;
                     font-family:var(--font-sans);font-size:0.78rem;font-weight:600;
                     cursor:pointer;transition:opacity 0.15s;"
              onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Enregistrer</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
  }

  /* ─── Ouvrir l'éditeur (idx = null → nouvel article) ─── */
  window.openNewsEditor = function (idx) {
    _ensureNewsEditorModal();
    const m = $('newsEditorModal');
    if (!m) return;
    _editingIdx = idx;

    const title = $('neModalTitle');
    if (title) title.textContent = idx === null ? 'Nouvel article' : 'Modifier l\'article';

    const msg = $('neSaveMsg');
    if (msg) msg.textContent = '';

    if (idx !== null && _newsData && _newsData[idx]) {
      const a = _newsData[idx];
      if ($('neTitre'))    $('neTitre').value    = a.titre    || '';
      if ($('neCategorie')) $('neCategorie').value = a.categorie || '';
      if ($('neIcone'))    $('neIcone').value    = a.icone    || '';
      if ($('neResume'))   $('neResume').value   = a.resume   || '';
      if ($('neTags'))     $('neTags').value     = (a.tags || []).join(', ');
      if ($('neContent'))  $('neContent').value  = a.content  || '';
    } else {
      ['neTitre','neCategorie','neIcone','neResume','neTags','neContent'].forEach(id => {
        const el = $(id); if (el) el.value = '';
      });
      if ($('neCategorie')) $('neCategorie').value = 'Actualité · Marchés';
      if ($('neIcone'))     $('neIcone').value     = '📰';
    }

    m.classList.remove('hidden');
    m.style.display = 'flex';
  };

  /* ─── Fermer l'éditeur ─── */
  window.closeNewsEditor = function () {
    const m = $('newsEditorModal');
    if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
  };

  /* ─── Enregistrer (en mémoire) ─── */
  window.saveNewsArticle = function () {
    const titre   = ($('neTitre')    || {}).value.trim();
    const resume  = ($('neResume')   || {}).value.trim();
    const content = ($('neContent')  || {}).value.trim();
    const msg     = $('neSaveMsg');

    if (!titre || !resume || !content) {
      if (msg) { msg.style.color = 'var(--rose-lt)'; msg.textContent = 'Titre, résumé et contenu sont obligatoires.'; }
      return;
    }

    const article = {
      titre,
      categorie : ($('neCategorie') || {}).value.trim() || 'Actualité · Marchés',
      icone     : ($('neIcone')     || {}).value.trim() || '📰',
      resume,
      tags      : ($('neTags')      || {}).value.split(',').map(t => t.trim()).filter(Boolean),
      content,
      id          : _editingIdx !== null ? _newsData[_editingIdx].id : Date.now(),
      published_at: _editingIdx !== null ? _newsData[_editingIdx].published_at : new Date().toISOString(),
    };

    if (!_newsData) _newsData = [];

    if (_editingIdx !== null) {
      _newsData[_editingIdx] = article;
    } else {
      _newsData.unshift(article);  // nouvel article en tête de liste
    }

    if (msg) { msg.style.color = 'var(--teal)'; msg.textContent = 'Enregistré ✓'; }
    setTimeout(() => {
      closeNewsEditor();
      _renderNewsGrid(_newsData);
    }, 600);
  };

  /* ─── Supprimer un article ─── */
  window.deleteNewsArticle = function (idx) {
    if (!_newsData || !_newsData[idx]) return;
    const titre = _newsData[idx].titre || 'cet article';
    if (!confirm(`Supprimer "${titre}" ?\n\nCette action est réversible : rechargez la page pour retrouver la version originale.`)) return;

    // Fermer le reader si l'article supprimé est celui qui est affiché
    const reader = $('articleReader');
    if (reader && reader.style.display !== 'none') {
      reader.style.display = 'none';
      const ng = $('newsGrid'); if (ng) ng.style.display = 'block';
      if (reader.querySelector('button')) {
        reader.querySelector('button').textContent = '← Retour aux articles';
        reader.querySelector('button').onclick = window.closeArticle;
      }
    }

    _newsData.splice(idx, 1);
    _renderNewsGrid(_newsData);
  };

  /* ─── Export JSON (téléchargement) ─── */
  window.exportNewsJson = function () {
    if (!_newsData) return;
    const json = JSON.stringify(_newsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'news.json';
    a.click();
    URL.revokeObjectURL(url);
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
      // Race condition : si le profil n'était pas encore chargé, re-rendre une fois qu'il l'est
      if (typeof window.isUserModerator !== 'function' || !window.isUserModerator()) {
        setTimeout(() => {
          if (typeof window.isUserModerator === 'function' && window.isUserModerator() && _newsData) {
            _renderNewsGrid(_newsData);
          }
        }, 900);
      }
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
