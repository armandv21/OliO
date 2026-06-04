// ── Panneau Articles ─────────────────────────────────────────────────────────


  // ── ARTICLE READER ──────────────────────────────────────────────
  function openArticle(id) {
    document.getElementById('articlesGrid').style.display = 'none';
    document.getElementById('articleReader').style.display = 'block';
    document.getElementById('articleContent').innerHTML = window._articleData[id];
    document.querySelector('.fullscreen-panel-body').scrollTop = 0;
  }
  function closeArticle() {
    document.getElementById('articleReader').style.display = 'none';
    document.getElementById('articlesGrid').style.display = 'block';
    document.querySelector('.fullscreen-panel-body').scrollTop = 0;
  }
  

window.openArticle = openArticle;
window.closeArticle = closeArticle;
