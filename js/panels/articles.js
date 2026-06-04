// ── Panneau Articles ─────────────────────────────────────────────────────────

let _currentArticleId = null;
let _articlesLoaded = [];

// ── Chargement : Supabase d'abord, fallback statique ───────────────────────
async function loadArticlesData() {
  try {
    const { data, error } = await window.supabaseClient
      .from('articles')
      .select('*')
      .order('ordre', { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch(e) { /* fallback */ }

  return (window._articlesMeta || []).map(m => ({
    ...m,
    content: (window._articleData || {})[m.id] || ''
  }));
}

// ── Rendu de la grille ──────────────────────────────────────────────────────
function renderArticlesGrid(articles) {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;

  const isMod = typeof window.isUserModerator === 'function' && window.isUserModerator();

  let html = `
    <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:700;color:var(--ink);margin-bottom:8px">Analyses &amp; Concepts</div>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:${isMod ? '14px' : '36px'}">Explorez nos articles pour mieux comprendre les fondements de la finance quantitative.</p>`;

  if (isMod) {
    html += `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;padding:10px 16px;background:rgba(26,92,82,0.06);border:1px solid var(--teal);border-radius:8px;flex-wrap:wrap;">
        <span style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--teal);flex-shrink:0;">Mode modérateur</span>
        <span style="color:var(--border2)">|</span>
        <button onclick="openArticleEditor(null)"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:var(--teal);color:white;border:none;border-radius:6px;font-family:var(--font-sans);font-size:0.7rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:opacity 0.15s;"
          onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">+ Ajouter</button>
        <button onclick="seedArticlesFromStatic()"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:none;color:var(--teal);border:1px solid var(--teal);border-radius:6px;font-family:var(--font-sans);font-size:0.7rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:all 0.15s;"
          onmouseover="this.style.background='rgba(26,92,82,0.08)'" onmouseout="this.style.background='none'"
          title="Importer les articles statiques dans Supabase (une seule fois)">⬆ Importer statiques</button>
      </div>`;
  }

  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px">`;

  articles.forEach(a => {
    const colorVar    = `var(--${a.couleur_lien || 'blue'})`;
    const niveauColor = a.niveau === 'Intermédiaire' ? 'var(--amber)' : a.niveau === 'Avancé' ? 'var(--rose)' : 'var(--teal)';
    const niveauBg    = a.niveau === 'Intermédiaire' ? 'rgba(138,90,0,0.08)' : a.niveau === 'Avancé' ? 'rgba(122,31,46,0.08)' : 'rgba(26,92,82,0.08)';
    const safeTitle   = (a.titre || '').replace(/'/g, "\\'");

    html += `
      <div style="position:relative;">
        <button onclick="openArticle(${a.id})"
          style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px 24px;cursor:pointer;text-align:left;transition:all 0.2s;font-family:var(--font-sans);">
          <div style="width:52px;height:52px;border-radius:12px;background:${a.gradient};display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:1.4rem">${a.icone}</div>
          <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">${a.categorie}</div>
          <div style="font-family:var(--font-serif);font-size:1.05rem;font-weight:700;color:var(--ink);line-height:1.3;margin-bottom:10px">${a.titre}</div>
          <p style="font-size:0.78rem;color:var(--muted);line-height:1.6;margin-bottom:16px">${a.resume}</p>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:0.68rem;color:var(--muted);background:var(--surface2);padding:3px 8px;border-radius:20px">${a.duree}</span>
            <span style="font-size:0.68rem;color:${niveauColor};background:${niveauBg};padding:3px 8px;border-radius:20px">${a.niveau}</span>
          </div>
          <div style="margin-top:16px;font-size:0.75rem;font-weight:600;color:${colorVar};letter-spacing:0.04em">Lire l'article →</div>
        </button>
        ${isMod ? `
        <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;z-index:2;">
          <button onclick="event.stopPropagation();openArticleEditor(${a.id})" title="Modifier"
            style="width:26px;height:26px;background:var(--surface);border:1px solid var(--border);border-radius:5px;cursor:pointer;font-size:0.8rem;color:var(--muted);display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
            onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">✎</button>
          <button onclick="event.stopPropagation();deleteArticle(${a.id},'${safeTitle}')" title="Supprimer"
            style="width:26px;height:26px;background:var(--surface);border:1px solid var(--border);border-radius:5px;cursor:pointer;font-size:1rem;font-weight:300;color:var(--muted);display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
            onmouseover="this.style.borderColor='var(--rose-lt)';this.style.color='var(--rose)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">×</button>
        </div>` : ''}
      </div>`;
  });

  html += `</div>`;
  grid.innerHTML = html;
}

// ── Initialisation du panneau ──────────────────────────────────────────────
async function initArticlesPanel() {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="color:var(--muted);text-align:center;padding:60px;font-size:0.85rem;">Chargement…</div>';
  _articlesLoaded = await loadArticlesData();
  renderArticlesGrid(_articlesLoaded);
}

// ── Helpers navigation ─────────────────────────────────────────────────────
function _getArticleById(id) { return _articlesLoaded.find(a => a.id === Number(id)); }
function _getArticleTitle(id) { const a = _getArticleById(id); return a ? a.titre : `Article ${id}`; }
function _getArticleIds()  { return _articlesLoaded.map(a => Number(a.id)).sort((a, b) => a - b); }

function _renderArticleNav(id) {
  const navEl = document.getElementById('articleNav');
  if (!navEl) return;
  const ids   = _getArticleIds();
  const idx   = ids.indexOf(Number(id));
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

// ── Lecture d'un article ───────────────────────────────────────────────────
function openArticle(id) {
  _currentArticleId = Number(id);
  const article = _getArticleById(id);
  if (!article) return;

  const isMod = typeof window.isUserModerator === 'function' && window.isUserModerator();

  document.getElementById('articlesGrid').style.display  = 'none';
  document.getElementById('articleReader').style.display = 'block';

  const editBar = isMod ? `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
      <button onclick="openArticleEditor(${id})"
        style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:none;border:1px solid var(--border);border-radius:6px;font-family:var(--font-sans);font-size:0.72rem;font-weight:600;color:var(--ink2);cursor:pointer;transition:all 0.15s;"
        onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--ink2)'">✎ Modifier cet article</button>
    </div>` : '';

  document.getElementById('articleContent').innerHTML = editBar + (article.content || '');
  _renderArticleNav(id);
  document.querySelector('.fullscreen-panel-body').scrollTop = 0;
}

function closeArticle() {
  document.getElementById('articleReader').style.display  = 'none';
  document.getElementById('articlesGrid').style.display   = 'block';
  document.querySelector('.fullscreen-panel-body').scrollTop = 0;
}

// ── Éditeur d'article ─────────────────────────────────────────────────────
window.openArticleEditor = function(id) {
  const modal = document.getElementById('articleEditorModal');
  if (!modal) return;

  const article = (id !== null && id !== undefined) ? _getArticleById(id) : null;

  document.getElementById('aeModalTitle').textContent    = article ? "Modifier l'article" : 'Nouvel article';
  document.getElementById('aeId').value                  = article ? article.id : '';
  document.getElementById('aeTitre').value               = article ? (article.titre      || '') : '';
  document.getElementById('aeCategorie').value           = article ? (article.categorie  || '') : '';
  document.getElementById('aeNiveau').value              = article ? (article.niveau     || 'Débutant') : 'Débutant';
  document.getElementById('aeDuree').value               = article ? (article.duree      || '') : '';
  document.getElementById('aeIcone').value               = article ? (article.icone      || '') : '';
  document.getElementById('aeGradient').value            = article ? (article.gradient   || '') : 'linear-gradient(135deg,#1e3a5f,#3466a0)';
  document.getElementById('aeCouleurLien').value         = article ? (article.couleur_lien || 'blue') : 'blue';
  document.getElementById('aeResume').value              = article ? (article.resume     || '') : '';
  document.getElementById('aeContent').value             = article ? (article.content    || '') : '';
  document.getElementById('aeSaveMsg').textContent       = '';

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('aeTitre').focus(), 50);
};

window.closeArticleEditor = function() {
  const modal = document.getElementById('articleEditorModal');
  if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
};

window.saveArticle = async function() {
  const msgEl = document.getElementById('aeSaveMsg');
  msgEl.style.color = 'var(--muted)';
  msgEl.textContent = 'Enregistrement…';

  const idVal        = document.getElementById('aeId').value.trim();
  const titre        = document.getElementById('aeTitre').value.trim();
  const categorie    = document.getElementById('aeCategorie').value.trim();
  const niveau       = document.getElementById('aeNiveau').value;
  const duree        = document.getElementById('aeDuree').value.trim();
  const icone        = document.getElementById('aeIcone').value.trim();
  const gradient     = document.getElementById('aeGradient').value.trim();
  const couleur_lien = document.getElementById('aeCouleurLien').value;
  const resume       = document.getElementById('aeResume').value.trim();
  const content      = document.getElementById('aeContent').value.trim();

  if (!titre)   { msgEl.style.color = 'var(--rose-lt)'; msgEl.textContent = 'Le titre est obligatoire.'; return; }
  if (!content) { msgEl.style.color = 'var(--rose-lt)'; msgEl.textContent = 'Le contenu HTML est obligatoire.'; return; }

  const payload = { titre, categorie, niveau, duree, icone, gradient, couleur_lien, resume, content, updated_at: new Date().toISOString() };

  try {
    let error;
    if (idVal) {
      ({ error } = await window.supabaseClient.from('articles').update(payload).eq('id', parseInt(idVal)));
    } else {
      payload.ordre = _articlesLoaded.length > 0 ? Math.max(..._articlesLoaded.map(a => a.ordre || 0)) + 1 : 1;
      ({ error } = await window.supabaseClient.from('articles').insert([payload]));
    }
    if (error) throw error;

    msgEl.style.color = 'var(--teal)';
    msgEl.textContent = '✓ Enregistré !';

    setTimeout(async () => {
      closeArticleEditor();
      _articlesLoaded = await loadArticlesData();
      document.getElementById('articleReader').style.display = 'none';
      document.getElementById('articlesGrid').style.display  = 'block';
      renderArticlesGrid(_articlesLoaded);
    }, 900);
  } catch(err) {
    console.error('saveArticle:', err);
    msgEl.style.color = 'var(--rose-lt)';
    msgEl.textContent = 'Erreur lors de la sauvegarde.';
  }
};

window.deleteArticle = function(id, titre) {
  if (typeof showConfirmModal !== 'function') return;
  showConfirmModal(
    "Supprimer l'article",
    `Êtes-vous sûr de vouloir supprimer « ${titre} » ? Cette action est irréversible.`,
    async function() {
      closeConfirmModal();
      try {
        const { error } = await window.supabaseClient.from('articles').delete().eq('id', id);
        if (error) throw error;
        _articlesLoaded = await loadArticlesData();
        renderArticlesGrid(_articlesLoaded);
      } catch(err) {
        console.error('deleteArticle:', err);
        showAlertModal('Erreur', "Impossible de supprimer l'article.");
      }
    },
    'Supprimer'
  );
};

// ── Import one-shot des articles statiques vers Supabase ──────────────────
window.seedArticlesFromStatic = function() {
  if (typeof showConfirmModal !== 'function') return;
  showConfirmModal(
    'Importer les articles statiques',
    'Importe les 23 articles statiques dans Supabase (upsert par ID). À faire une seule fois.',
    async function() {
      closeConfirmModal();
      const grid = document.getElementById('articlesGrid');
      if (grid) grid.innerHTML = '<div style="color:var(--muted);text-align:center;padding:60px;">Import en cours…</div>';

      const rows = (window._articlesMeta || []).map(m => ({
        id: m.id, ordre: m.ordre || m.id,
        icone: m.icone, gradient: m.gradient,
        categorie: m.categorie, titre: m.titre,
        resume: m.resume, duree: m.duree,
        niveau: m.niveau, couleur_lien: m.couleur_lien,
        content: (window._articleData || {})[m.id] || ''
      }));

      try {
        const { error } = await window.supabaseClient.from('articles').upsert(rows, { onConflict: 'id' });
        if (error) throw error;
        _articlesLoaded = await loadArticlesData();
        renderArticlesGrid(_articlesLoaded);
        showAlertModal('Import réussi', `${rows.length} articles importés dans Supabase.`);
      } catch(err) {
        console.error('seedArticlesFromStatic:', err);
        showAlertModal('Erreur', "Échec de l'import : " + (err.message || 'erreur inconnue'));
        _articlesLoaded = await loadArticlesData();
        renderArticlesGrid(_articlesLoaded);
      }
    },
    'Importer'
  );
};

window.openArticle       = openArticle;
window.closeArticle      = closeArticle;
window.initArticlesPanel = initArticlesPanel;
