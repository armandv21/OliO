// ── Données actifs & Panneau Actifs ──────────────────────────────────────────
// Requires: config.js (window.supabaseClient)

// ── 1. Le "squelette" de présentation (Catégories et Couleurs vides) ──
window.ASSETS_DATA = [
  { name: 'Actions américaines', color: '#1e3a5f', items: [] },
  { name: 'CAC 40', color: '#3466a0', items: [] },
  { name: 'Actions internationales', color: '#1a5c52', items: [] },
  { name: 'ETF', color: '#8a5a00', items: [] }
];

// ── 2. Fonction mathématique pour mélanger un tableau ──
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── 3. Charger et répartir aléatoirement les actifs depuis Supabase ──
window.loadRandomAssetsFromDB = async function() {
  try {
    // ⚠️ REMPLACE 'assets' par le VRAI NOM de ta table contenant les infos des entreprises
    const { data, error } = await window.supabaseClient
      .from('assets') 
      .select('ticker, name, isin, categorie'); // ⚠️ Vérifie que les noms de colonnes correspondent

    if (error || !data) throw error;

    // A. On mélange la totalité de ta base de données
    const shuffledAssets = shuffleArray(data);

    // B. On vide les catégories au cas où on recharge la liste
    window.ASSETS_DATA.forEach(cat => cat.items = []);

    // C. On distribue les actifs dans les catégories
    shuffledAssets.forEach(asset => {
      // On cherche si la catégorie de l'actif correspond à l'une de nos 4 sections
      const cat = window.ASSETS_DATA.find(c => c.name === asset.categorie);
      
      // On limite à 10 actifs par catégorie pour ne pas surcharger le menu (Tu peux changer ce chiffre !)
      if (cat && cat.items.length < 10) {
        cat.items.push({
          name: asset.name,
          ticker: asset.ticker,
          isin: asset.isin || ''
        });
      }
    });

    // ── 4. On dessine la liste dans l'onglet de gauche avec ces nouvelles données ──
    renderHomeAssetList('');
    if (typeof updateHomeCount === 'function') updateHomeCount();

  } catch (err) {
    console.error("Erreur lors du chargement des actifs aléatoires :", err);
  }
};


// ── Panneau actifs ────────────────────────────────────────────────────────────

function openAssetPanel() {
  document.getElementById('assetPanel').classList.add('open');
  document.getElementById('assetPanelBackdrop').classList.add('open');
  renderHomeAssetList('');
  updateHomeCount();
}
function closeAssetPanel() {
  document.getElementById('assetPanel').classList.remove('open');
  document.getElementById('assetPanelBackdrop').classList.remove('open');
}

// ── Sync paramètres panneau ↔ sidebar ────────────────────────────────────────

function syncAllParams(type, val) {
  val = parseFloat(val);
  if (type === 'period') {
    document.getElementById('homePeriodInput').value = val;
    document.getElementById('homePeriodRange').value = val;
    document.getElementById('periodInput').value = val;
    document.getElementById('periodRange').value = val;
    window.assetStatsCache = {};
    window._statsCachePeriod = null;
    const _openInfo = [];
    document.querySelectorAll('.home-asset-chart.open').forEach(c => {
      const m = c.id.match(/^homeChart_(.+?)(_sb)?$/);
      if (m) _openInfo.push({ id: c.id, ticker: m[1], suffix: m[2] || '' });
      c.classList.remove('open');
      const inner = document.getElementById('homeChartInner_' + (m ? m[1] + (m[2]||'') : ''));
      if (inner) inner.innerHTML = '';
    });
    _triggerStatsLoad();
    _openInfo.forEach(({ id, ticker, suffix }) => {
      const chartDiv = document.getElementById(id);
      if (!chartDiv) return;
      chartDiv.classList.add('open');
      const cat = window.ASSETS_DATA && window.ASSETS_DATA.find(c => c.items.some(i => i.ticker === ticker));
      renderHomeChart(ticker, '', cat ? cat.color : '#888', suffix);
    });
  } else if (type === 'rf') {
    const fval = isNaN(val) ? val : parseFloat(val).toFixed(2);
    document.getElementById('homeRfInput').value = fval;
    document.getElementById('homeRfRange').value = val;
    document.getElementById('rfInput').value = fval;
    document.getElementById('rfRange').value = val;
    if (typeof syncRfFromInput === 'function') syncRfFromInput(val);
    window.assetStatsCache = {};
    window._statsCachePeriod = null;
    _triggerStatsLoad();
  } else if (type === 'sim') {
    document.getElementById('homeSimInput').value = val;
    document.getElementById('homeSimRange').value = val;
    const si = document.getElementById('simInput'); if (si) si.value = val;
    const sr = document.getElementById('simRange'); if (sr) sr.value = val;
    const pv = document.getElementById('profileSimVal');
    if (pv) pv.textContent = val.toLocaleString('fr-FR');
  }
}

// ── Toggle log/linéaire ───────────────────────────────────────────────────────

window._homeChartLogScale = false;
window.homeToggleLogScale = function() {
  window._homeChartLogScale = !window._homeChartLogScale;
  const isLog = window._homeChartLogScale;
  const linBtn = document.getElementById('homeLogBtn_lin');
  const logBtn = document.getElementById('homeLogBtn_log');
  if (linBtn) { linBtn.style.background = isLog ? 'none' : 'var(--blue)'; linBtn.style.color = isLog ? 'var(--blue)' : 'white'; }
  if (logBtn) { logBtn.style.background = isLog ? 'var(--blue)' : 'none'; logBtn.style.color = isLog ? 'white' : 'var(--blue)'; }
  document.querySelectorAll('.home-asset-chart.open').forEach(c => {
    const m = c.id.match(/^homeChart_(.+?)(_sb)?$/);
    if (!m) return;
    const ticker = m[1], suffix = m[2] || '';
    const cat = window.ASSETS_DATA && window.ASSETS_DATA.find(e => e.items.some(i => i.ticker === ticker));
    renderHomeChart(ticker, '', cat ? cat.color : '#888', suffix);
  });
};

// ── Stats cache & loader (Supabase stock_prices) ──────────────────────────────

window.assetStatsCache = {};
window._statsCachePeriod = null;
let _statsLoadTimer = null;
let _statsLoadRunning = false;

function _triggerStatsLoad() {
  if (_statsLoadTimer) clearTimeout(_statsLoadTimer);
  _statsLoadTimer = setTimeout(_loadAllStats, 400);
}

async function _loadAllStats() {
  if (_statsLoadRunning) return;
  _statsLoadRunning = true;
  const period = parseFloat(document.getElementById('homePeriodInput')?.value || 2);
  const rf     = parseFloat(document.getElementById('homeRfInput')?.value  || 3) / 100;
  const daysNeeded = Math.round(period * 252);

  const toFetch = [];
  (window.ASSETS_DATA || []).forEach(cat => cat.items.forEach(item => {
    if (!window.assetStatsCache[item.ticker]) toFetch.push(item.ticker);
  }));

  const CHUNK = 4;
  for (let i = 0; i < toFetch.length; i += CHUNK) {
    await Promise.all(toFetch.slice(i, i + CHUNK).map(async ticker => {
      try {
        const prices = await _fetchPricesForStats(ticker, daysNeeded);
        if (!prices || prices.length < 12) return;
        const rets = [];
        for (let j = 1; j < prices.length; j++) {
          if (prices[j] > 0 && prices[j-1] > 0)
            rets.push((prices[j] - prices[j-1]) / prices[j-1]);
        }
        if (rets.length < 4) return;
        const n = rets.length;
        const meanR = rets.reduce((s,v) => s+v, 0) / n;
        const varR  = rets.reduce((s,v) => s + (v-meanR)**2, 0) / (n-1);
        const annRet = meanR * 252 * 100;
        const annVol = Math.sqrt(varR * 252) * 100;
        const sharpe = annVol > 0 ? (annRet/100 - rf) / (annVol/100) : 0;
        window.assetStatsCache[ticker] = { ret: annRet, vol: annVol, sharpe };
        _updateStatRow(ticker, window.assetStatsCache[ticker]);
      } catch(e) { /* silencieux */ }
    }));
  }
  _statsLoadRunning = false;
}

async function _fetchPricesForStats(ticker, daysNeeded) {
  try {
    const { data, error } = await window.supabaseClient
      .from('stock_prices')
      .select('close_price')
      .eq('ticker', ticker)
      .order('price_date', { ascending: true });

    if (error || !data || data.length === 0) return null;

    const dailyPrices = data
      .map(row => parseFloat(row.close_price))
      .filter(p => p != null && p > 0);

    return dailyPrices.slice(-daysNeeded);
  } catch(e) {
    return null;
  }
}

function _updateStatRow(ticker, stats) {
  ['', '_sb'].forEach(sfx => {
    const volCell = document.getElementById('hs-vol-' + ticker + sfx);
    const retCell = document.getElementById('hs-ret-' + ticker + sfx);
    if (volCell) volCell.innerHTML = '<span style="font-family:var(--font-serif);font-size:0.80rem;font-weight:600;color:var(--amber)">' + stats.vol.toFixed(1) + '%</span>';
    if (retCell) {
      const pos = stats.ret >= 0;
      retCell.innerHTML = '<span style="font-family:var(--font-serif);font-size:0.80rem;font-weight:600;color:' + (pos ? 'var(--teal)' : 'var(--rose)') + '">' + (pos ? '+' : '') + stats.ret.toFixed(1) + '%</span>';
    }
  });
}

// ── Render liste actifs (double container) ────────────────────────────────────

function renderHomeAssetList(filterText) {
  _renderIntoContainer(document.getElementById('homeAssetList'), filterText, '');
  _renderIntoContainer(document.getElementById('homeAssetListSidebar'), filterText, '_sb');
  _triggerStatsLoad();
}

function _renderIntoContainer(container, filterText, suffix) {
  if (!container || !window.ASSETS_DATA) return;
  container.innerHTML = '';
  const filter = (filterText || '').toLowerCase();
  window.ASSETS_DATA.forEach(cat => {
    const catItems = cat.items.filter(item =>
      !filter || item.name.toLowerCase().includes(filter)
      || item.ticker.toLowerCase().includes(filter)
      || (item.isin || '').toLowerCase().includes(filter)
    );
    if (!catItems.length) return;
    const catKey = cat.name.replace(/ /g, '_');
    const catHeader = document.createElement('div');
    catHeader.className = 'asset-category-header';
    catHeader.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:' + cat.color + ';flex-shrink:0;display:inline-block;"></span>' + cat.name + '<span class="cat-arrow">▼</span>';
    catHeader.onclick = function() {
      this.classList.toggle('collapsed');
      document.querySelectorAll('[id^="homeCatBody_' + catKey + '"]').forEach(b => {
        b.style.display = this.classList.contains('collapsed') ? 'none' : '';
      });
    };
    container.appendChild(catHeader);
    const catBody = document.createElement('div');
    catBody.id = 'homeCatBody_' + catKey + suffix;
    container.appendChild(catBody);
    catItems.forEach(item => {
      const isSelected = (window.selectedAssets || []).includes(item.ticker);
      const cached = window.assetStatsCache && window.assetStatsCache[item.ticker];
      const dash = '<span style="color:var(--muted2);font-size:0.75rem">—</span>';
      const volHtml = cached ? '<span style="font-family:var(--font-serif);font-size:0.80rem;font-weight:600;color:var(--amber)">' + cached.vol.toFixed(1) + '%</span>' : dash;
      const retHtml = cached ? '<span style="font-family:var(--font-serif);font-size:0.80rem;font-weight:600;color:' + (cached.ret >= 0 ? 'var(--teal)' : 'var(--rose)') + '">' + (cached.ret >= 0 ? '+' : '') + cached.ret.toFixed(1) + '%</span>' : dash;
      const row = document.createElement('div');
      row.className = 'home-asset-row' + (isSelected ? ' selected' : '');
      row.id = 'homeRow_' + item.ticker + suffix;
      row.innerHTML =
        '<div class="har-check"><input type="checkbox"' + (isSelected ? ' checked' : '') + ' onclick="event.stopPropagation();homeToggleAsset(\'' + item.ticker + '\',this.checked)"/></div>' +
        '<div class="har-name">' +
          '<div class="har-name-main">' + item.name + '</div>' +
          '<div class="har-name-ticker">' + item.ticker + (item.isin ? '<span style="margin-left:6px;font-family:monospace;letter-spacing:0.01em;color:var(--muted2);font-size:0.58rem;">' + item.isin + '</span>' : '') + '</div>' +
        '</div>' +
        '<div class="har-stat" id="hs-ret-' + item.ticker + suffix + '">' + retHtml + '</div>' +
        '<div class="har-stat" id="hs-vol-' + item.ticker + suffix + '">' + volHtml + '</div>';
      row.onclick = function(e) {
        if (e.target.type === 'checkbox') return;
        const cid = 'homeChart_' + item.ticker + suffix;
        const chartDiv = document.getElementById(cid);
        if (!chartDiv) return;
        if (chartDiv.classList.contains('open')) {
          chartDiv.classList.remove('open');
        } else {
          chartDiv.classList.add('open');
          renderHomeChart(item.ticker, item.name, cat.color, suffix);
        }
      };
      catBody.appendChild(row);
      const chartDiv = document.createElement('div');
      chartDiv.className = 'home-asset-chart';
      chartDiv.id = 'homeChart_' + item.ticker + suffix;
      chartDiv.innerHTML =
        '<div class="home-asset-chart-header">' +
          '<span style="color:' + cat.color + ';font-weight:600">' + item.name + ' (' + item.ticker + ')' + (item.isin ? '<span style="margin-left:8px;font-family:monospace;letter-spacing:0.01em;color:var(--muted2);font-size:0.60rem;font-weight:400">' + item.isin + '</span>' : '') + '</span>' +
        '</div>' +
        '<div class="home-asset-chart-inner" id="homeChartInner_' + item.ticker + suffix + '"></div>';
      catBody.appendChild(chartDiv);
    });
  });
}

// ── Render graphe actif (Supabase stock_prices) ───────────────────────────────

async function renderHomeChart(ticker, name, catColor, suffix) {
  const sfx = suffix || '';
  const container = document.getElementById('homeChartInner_' + ticker + sfx);
  if (!container) return;
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Chargement...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from('stock_prices')
      .select('price_date, close_price')
      .eq('ticker', ticker)
      .order('price_date', { ascending: true });

    if (error || !data || data.length === 0) throw new Error('no data');

    const periodValue = parseFloat(document.getElementById('homePeriodInput').value) || 2;
    const daysToKeep  = Math.round(periodValue * 252);
    const useLog      = window._homeChartLogScale === true;
    const tickfmt     = periodValue <= 1 ? '%d/%m/%y' : '%m/%y';

    const filteredData = data.slice(-daysToKeep);
    const dates  = filteredData.map(d => new Date(d.price_date));
    const prices = filteredData.map(d => parseFloat(d.close_price));

    const isPos     = prices[prices.length - 1] >= prices[0];
    const lineColor = isPos ? '#2d8a7a' : '#b03045';
    const yaxis     = useLog
      ? { type:'log', showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false }
      : { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false, tickformat:'.0f' };

    container.innerHTML = '';
    Plotly.newPlot(container, [{
      x: dates, y: prices, type:'scatter', mode:'lines',
      line:      { color: lineColor, width: 1.8 },
      fill:      useLog ? 'none' : 'tozeroy',
      fillcolor: isPos ? 'rgba(45,138,122,0.07)' : 'rgba(176,48,69,0.07)',
      hovertemplate: '%{x|%d/%m/%Y}<br><b>%{y:.2f}</b><extra></extra>'
    }], {
      margin:        { t:4, r:16, b:32, l:55 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, tickformat:tickfmt, showline:false, zeroline:false },
      yaxis,
      showlegend: false
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.72rem;font-style:italic;">Données indisponibles</div>';
  }
}

// ── Sélection actifs ──────────────────────────────────────────────────────────

window.selectedAssets = window.selectedAssets || [];

function homeToggleAsset(ticker, checked) {
  if (!window.selectedAssets) window.selectedAssets = [];
  const cb = document.querySelector('#assetList .asset-item input[type=checkbox][data-ticker="' + ticker + '"]');
  if (checked && !window.selectedAssets.includes(ticker)) {
    window.selectedAssets.push(ticker);
    if (cb) cb.checked = true;
  } else if (!checked) {
    window.selectedAssets = window.selectedAssets.filter(t => t !== ticker);
    if (cb) cb.checked = false;
  }
  ['', '_sb'].forEach(sfx => {
    const row = document.getElementById('homeRow_' + ticker + sfx);
    if (row) {
      row.classList.toggle('selected', checked);
      const rowCb = row.querySelector('input[type=checkbox]');
      if (rowCb) rowCb.checked = checked;
    }
  });
  updateHomeCount();
  if (typeof updateSidebarCount === 'function') updateSidebarCount();
}

function updateHomeCount() {
  const el = document.getElementById('homeSelectedCount');
  if (el) el.textContent = (window.selectedAssets || []).length;
  const btn = document.getElementById('btnRunHome');
  if (btn) btn.disabled = (window.selectedAssets || []).length < 2;
}

function filterHomeAssets(val) {
  document.getElementById('homeSearchClear')?.classList.toggle('visible', val.length > 0);
  document.getElementById('sidebarExpandClear')?.classList.toggle('visible', val.length > 0);
  renderHomeAssetList(val);
}

function clearHomeSearch() {
  const inp = document.getElementById('homeAssetSearch');
  if (inp) inp.value = '';
  document.getElementById('homeSearchClear')?.classList.remove('visible');
  renderHomeAssetList('');
}

window.resetSelection = function() {
  window.selectedAssets = [];
  ['', '_sb'].forEach(sfx => {
    document.querySelectorAll('[id^="homeRow_"]').forEach(r => {
      if (!sfx || r.id.endsWith(sfx)) {
        r.classList.remove('selected');
        const cb = r.querySelector('input[type=checkbox]');
        if (cb) cb.checked = false;
      }
    });
  });
  updateHomeCount();
  if (typeof updateSidebarCount === 'function') updateSidebarCount();
};

window.preloadVisibleCharts = function() {
  if (!window.ASSETS_DATA) return;
  (window.selectedAssets || []).forEach(ticker => {
    const chartDiv = document.getElementById('homeChart_' + ticker + '_sb');
    if (chartDiv && !chartDiv.classList.contains('open')) {
      chartDiv.classList.add('open');
      const cat = window.ASSETS_DATA.find(c => c.items.some(i => i.ticker === ticker));
      if (cat) renderHomeChart(ticker, '', cat.color, '_sb');
    }
  });
};

// Expose globally
window.openAssetPanel = openAssetPanel;
window.closeAssetPanel = closeAssetPanel;
window.syncAllParams = syncAllParams;
window.renderHomeAssetList = renderHomeAssetList;
window.homeToggleAsset = homeToggleAsset;
window.updateHomeCount = updateHomeCount;
window.filterHomeAssets = filterHomeAssets;
window.clearHomeSearch = clearHomeSearch;
