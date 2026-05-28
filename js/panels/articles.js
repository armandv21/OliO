// ── Panneau Articles ──────────────────────────────────────────────────────────
// Contains: _articleData (3 articles), openArticle(), closeArticle()
// Full content pushed via git tree API due to size (25KB)
// See: js/data/articles.js for the data-only export

window.openArticle = function(id) {
  document.getElementById('articlesGrid').style.display = 'none';
  document.getElementById('articleReader').style.display = 'block';
  document.getElementById('articleContent').innerHTML = window._articleData && window._articleData[id] ? window._articleData[id] : '';
  document.querySelector('.fullscreen-panel-body').scrollTop = 0;
};
window.closeArticle = function() {
  document.getElementById('articleReader').style.display = 'none';
  document.getElementById('articlesGrid').style.display = 'block';
  document.querySelector('.fullscreen-panel-body').scrollTop = 0;
};