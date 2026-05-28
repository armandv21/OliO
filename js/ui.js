// ── UI Helpers ───────────────────────────────────────────────────────────────────
// Requires: assets.js (renderHomeAssetList, updateHomeCount, preloadVisibleCharts)

// ── Sidebar expand/collapse ───────────────────────────────────────────────────

function expandSidebar() {
  const sb = document.querySelector('.sidebar');
  const btn = document.getElementById('sidebarExpandBtn');
  sb.getBoundingClientRect();
  sb.classList.add('expanded');
  if (btn) btn.style.left = '100vw';
  if (typeof renderHomeAssetList === 'function') renderHomeAssetList('');
  if (typeof updateHomeCount === 'function') updateHomeCount();
  setTimeout(() => {
    const s = document.getElementById('sidebarExpandSearch');
    if (s) s.focus();
    preloadVisibleCharts();
  }, 460);
}

function collapseSidebar() {
  const sb = document.querySelector('.sidebar');
  const btn = document.getElementById('sidebarExpandBtn');
  sb.getBoundingClientRect();
  sb.classList.remove('expanded');
  if (btn) btn.style.left = '280px';
  const s = document.getElementById('sidebarExpandSearch');
  if (s) s.value = '';
  document.getElementById('sidebarExpandClear')?.classList.remove('visible');
  document.querySelectorAll('.home-asset-chart.open').forEach(c => c.classList.remove('open'));
}

function preloadVisibleCharts() {
  if (!window.ASSETS_DATA) return;
  (window.selectedAssets || []).forEach(ticker => {
    const chartDiv = document.getElementById('homeChart_' + ticker + '_sb');
    if (chartDiv && !chartDiv.classList.contains('open')) {
      chartDiv.classList.add('open');
      const cat = window.ASSETS_DATA.find(c => c.items.some(i => i.ticker === ticker));
      if (cat) renderHomeChart(ticker, '', cat.color, '_sb');
    }
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') collapseSidebar();
});

// ── Panneaux plein écran ─────────────────────────────────────────────────────────

const _panelMap = {
  articles: { panel: 'panelArticles', btn: 'btnArticles' },
  portefeuilles: { panel: 'panelPortefeuilles', btn: 'btnPortefeuilles' },
};

function openFullPanel(id) {
  Object.keys(_panelMap).forEach(k => { if (k !== id) closeFullPanel(k); });
  const { panel, btn } = _panelMap[id];
  document.getElementById(panel).classList.add('open');
  document.getElementById(btn).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFullPanel(id) {
  const { panel, btn } = _panelMap[id];
  document.getElementById(panel).classList.remove('open');
  document.getElementById(btn).classList.remove('open');
  const anyOpen = Object.keys(_panelMap).some(k =>
    document.getElementById(_panelMap[k].panel).classList.contains('open')
  );
  if (!anyOpen) document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') Object.keys(_panelMap).forEach(k => closeFullPanel(k));
});

// Expose globally
window.expandSidebar = expandSidebar;
window.collapseSidebar = collapseSidebar;
window.openFullPanel = openFullPanel;
window.closeFullPanel = closeFullPanel;
