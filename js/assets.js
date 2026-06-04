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
      .select('*');

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
      // --- FORMATAGE DES DONNÉES ---
      const peVal = item.pe_ratio != null ? item.pe_ratio.toFixed(1) : '—';
      const divVal = item.dividend_yield != null ? (item.dividend_yield * 100).toFixed(2) + '%' : '—';
      const betaVal = item.beta != null ? item.beta.toFixed(2) : '—';
      const marginVal = item.net_margin != null ? (item.net_margin * 100).toFixed(1) + '%' : '—';
      let capVal = '—';
      if (item.market_cap != null) {
          capVal = item.market_cap >= 1e12 ? (item.market_cap / 1e12).toFixed(2) + ' T$' : (item.market_cap / 1e9).toFixed(2) + ' Md$';
      }

      // --- INJECTION DANS LE HTML ---
      chartDiv.innerHTML =
        '<div class="home-asset-chart-header">' +
          '<span style="color:' + cat.color + ';font-weight:600;font-size:0.68rem">' + item.name + ' (' + item.ticker + ')' + (item.isin ? '<span style="margin-left:6px;font-family:monospace;letter-spacing:0.01em;color:var(--muted2);font-size:0.57rem;font-weight:400">' + item.isin + '</span>' : '') + '</span>' +
        '</div>' +
        '<div class="asset-detail-body">' +
          '<div class="home-asset-chart-inner" id="homeChartInner_' + item.ticker + suffix + '"></div>' +
          '<div class="asset-kpi-grid" id="assetKpi_' + item.ticker + suffix + '">' +
            _buildKpiCell('P/E', peVal, 'kpi-pe-' + item.ticker + suffix) +
            _buildKpiCell('Dividende', divVal, 'kpi-div-' + item.ticker + suffix) +
            _buildKpiCell('Bêta', betaVal, 'kpi-beta-' + item.ticker + suffix) +
            _buildKpiCell('Cap.', capVal, 'kpi-cap-' + item.ticker + suffix) +
            _buildKpiCell('Marge N.', marginVal, 'kpi-margin-' + item.ticker + suffix) +
            '<div class="asset-kpi-cell" style="padding:0">' +
              '<button class="asset-kpi-open-btn" onclick="event.stopPropagation();openAssetSheet(\'' + item.ticker + '\',\'' + encodeURIComponent(item.name) + '\',\'' + (item.isin || '') + '\')" title="Fiche complète">+</button>' +
            '</div>' +
          '</div>' +
        '</div>';
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

  // 🌟 APPEL À LA VRAIE BASE DE DONNÉES :
  const isPremium = typeof window.isUserPremium === 'function' ? window.isUserPremium() : false;

  // 1. VÉRIFICATION PREMIUM : Si on veut cocher un 4ème actif
  if (checked && window.selectedAssets.length >= 3 && !window.selectedAssets.includes(ticker) && !isPremium) {
    
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = '';
    }
    
    // On force la case à décocher pour que l'interface soit cohérente
    const cb = document.querySelector('input[type=checkbox][onclick*="' + ticker + '"]');
    if (cb) cb.checked = false;
    
    return; // On arrête l'exécution ici
  }

  // 2. LOGIQUE NORMALE DE SÉLECTION
  const cb = document.querySelector('#assetList .asset-item input[type=checkbox][data-ticker="' + ticker + '"]');
  
  if (checked && !window.selectedAssets.includes(ticker)) {
    window.selectedAssets.push(ticker);
    if (cb) cb.checked = true;
  } else if (!checked) {
    window.selectedAssets = window.selectedAssets.filter(t => t !== ticker);
    if (cb) cb.checked = false;
  }

  // 3. MISE À JOUR VISUELLE
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

// ── Génération du graphique pour la Fiche Complète ──
async function renderAssetSheetChart(ticker, color) {
  const container = document.getElementById('as-price-chart');
  if (!container) return;
  
  // Message de chargement
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.8rem;font-style:italic;">Chargement de l\'historique...</div>';

  try {
    // Récupération de TOUT l'historique disponible pour cet actif
    const { data, error } = await window.supabaseClient
      .from('stock_prices')
      .select('price_date, close_price')
      .eq('ticker', ticker)
      .order('price_date', { ascending: true });

    if (error || !data || data.length === 0) throw new Error('no data');

    const dates  = data.map(d => new Date(d.price_date));
    const prices = data.map(d => parseFloat(d.close_price));

    // Si on n'a pas passé de couleur spécifique, on met vert (hausse) ou rouge (baisse)
    const isPos = prices[prices.length - 1] >= prices[0];
    const lineColor = color || (isPos ? '#2d8a7a' : '#b03045'); 
    
    // Détermination de la couleur de fond transparente sous la courbe
    let fillColor = 'rgba(0,0,0,0.05)';
    if (lineColor === '#2d8a7a') fillColor = 'rgba(45,138,122,0.07)';
    if (lineColor === '#b03045') fillColor = 'rgba(176,48,69,0.07)';

    container.innerHTML = ''; // On vide le chargement
    
    // Création du graphique Plotly
    Plotly.newPlot(container, [{
      x: dates, y: prices, type:'scatter', mode:'lines',
      line:      { color: lineColor, width: 2 },
      fill:      'tozeroy',
      fillcolor: fillColor,
      hovertemplate: '%{x|%d/%m/%Y}<br><b>%{y:.2f}</b><extra></extra>'
    }], {
      margin: { t:10, r:20, b:30, l:40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      yaxis: { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      showlegend: false
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.8rem;font-style:italic;">Données historiques indisponibles</div>';
  }
}

// ── KPI helpers ───────────────────────────────────────────────────────────────

function _buildKpiCell(label, value, id) {
  return '<div class="asset-kpi-cell">' +
    '<div class="asset-kpi-label">' + label + '</div>' +
    '<div class="asset-kpi-value" id="' + id + '">' + value + '</div>' +
  '</div>';
}

// ── Fiche complète actif ──────────────────────────────────────────────────────

const _SHEET_TABS = [
  { id: 'overview',    label: 'Aperçu'       },
  { id: 'price',       label: 'Prix'         },
  { id: 'valuation',   label: 'Valorisation' },
  { id: 'dividends',   label: 'Dividendes'   },
  { id: 'financials',  label: 'Finances'     },
  { id: 'growth',      label: 'Croissance'   },
  { id: 'profitability',label: 'Rentabilité' },
  { id: 'health',      label: 'Santé'        },
  { id: 'dcf',         label: 'DCF'          },
  { id: 'segments',    label: 'Segments'     },
];

window.openAssetSheet = function(ticker, encodedName, isin) {
  const name = decodeURIComponent(encodedName);
  const overlay = document.getElementById('assetSheetOverlay');
  if (!overlay) return;

  // 1. On cherche les données de l'actif cliqué dans notre liste globale
  let assetData = null;
  let catColor = '#1e3a5f'; // Couleur par défaut
  
  window.ASSETS_DATA.forEach(cat => {
    const found = cat.items.find(i => i.ticker === ticker);
    if (found) {
        assetData = found;
        catColor = cat.color; // On récupère la couleur de la catégorie !
    }
  });

  // 🌟 On lance la création du graphique (il s'affichera tout seul une fois chargé)
  renderAssetSheetChart(ticker, catColor);

  // 🌟 NOUVEAU : On lance le graphique P/E (en lui passant l'EPS de l'action)
  const currentEps = assetData ? assetData.eps : null;
  renderPEChart(ticker, currentEps, catColor);

  // graphique dividendes
  renderDividendChart(ticker, catColor);

  // 2. Textes d'en-tête
  overlay.querySelector('.asset-sheet-title').textContent = name;

  // 3. Remplissage des données si elles existent
  if (assetData) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const fPct = v => v != null ? (v * 100).toFixed(2) + '%' : '—';
    const fNum = v => v != null ? v.toFixed(2) : '—';
    const fCap = v => v != null ? (v >= 1e12 ? (v / 1e12).toFixed(2) + ' T$' : (v / 1e9).toFixed(2) + ' Md$') : '—';

    // Remplissage de l'onglet "Aperçu"
    el('as-pe', fNum(assetData.pe_ratio));
    el('as-div', fPct(assetData.dividend_yield));
    el('as-cap', fCap(assetData.market_cap));
    el('as-beta', fNum(assetData.beta));
    el('as-eps', fNum(assetData.eps)); 
    el('as-divgrowth', fPct(assetData.dividend_growth));
    
    // Description (on écrase le placeholder)
    el('as-description', assetData.description || 'Aucune description disponible pour cette entreprise.');

    // Onglet Valorisation
    el('as-payout', fPct(assetData.payout_ratio)); 
    el('as-pb', fNum(assetData.price_to_book));
    el('as-ps', fNum(assetData.price_to_sales));
    el('as-pfcf', fNum(assetData.price_to_fcf));
    el('as-peg', fNum(assetData.peg_ratio));
    el('as-evrev', fNum(assetData.ev_to_revenue));
    
    // Onglet Dividendes
    el('as-yield', fPct(assetData.dividend_yield));
    el('as-divgrowth2', fPct(assetData.dividend_growth)); 
    el('as-divamt', assetData.dividend_rate != null ? assetData.dividend_rate.toFixed(2) : '—');
    el('as-freq', assetData.dividend_frequency || '—');
    el('as-lastdiv', assetData.last_dividend_value != null ? assetData.last_dividend_value.toFixed(2) : '—');
    
    // Date Ex-Dividende 
    if (assetData.ex_dividend_date) {
        const d = new Date(assetData.ex_dividend_date);
        el('as-exdiv', d.toLocaleDateString('fr-FR')); 
    } else {
        el('as-exdiv', '—');
    }

    // Onglet Finances
    el('as-rev', fCap(assetData.total_revenue)); 
    el('as-fcf', fCap(assetData.free_cash_flow)); 
    el('as-ebitda', fCap(assetData.ebitda));

    renderPEChart(ticker, currentEps, catColor);
    renderDividendChart(ticker, catColor);
    renderWaterfallChart(assetData);

    // Onglet Croissance Annuelle
    el('as-rev-growth', fPct(assetData.revenue_growth));
    el('as-eps-growth', fPct(assetData.earnings_growth));
    el('as-price-growth', fPct(assetData.price_growth));

    renderGrowthChart(ticker);
    
    // Onglet Rentabilité
    el('as-roe', fPct(assetData.roe));
    el('as-opm', fPct(assetData.operating_margin));
    el('as-netmargin', fPct(assetData.profit_margins));

    renderProfitabilityChart(assetData);
    
    // Onglet Santé Financière 
    el('as-health-de', assetData.debt_to_equity != null ? (assetData.debt_to_equity / 100).toFixed(2) : '—');
    el('as-health-debitebitda', assetData.debt_to_ebitda != null ? assetData.debt_to_ebitda.toFixed(2) + 'x' : '—');
    el('as-health-ic', assetData.interest_coverage != null ? assetData.interest_coverage.toFixed(2) + 'x' : '—');
    
    el('as-current-ratio', assetData.current_ratio != null ? assetData.current_ratio.toFixed(2) : '—');
    el('as-total-cash', fCap(assetData.total_cash));
    el('as-total-debt', fCap(assetData.total_debt));

    renderDebtEbitdaChart(ticker);

    // Onglet DCF & Valorisation Avancée
    if (assetData.dcf_fair_value) {
        el('as-dcf-fairvalue', assetData.dcf_fair_value.toFixed(2) + ' $');
        
        // 🌟 CORRECTION 2 : On utilise la donnée de l'action pour le prix
        const currentPrice = assetData.current_price || assetData.price || null;
        el('as-dcf-price', currentPrice != null ? currentPrice.toFixed(2) + ' $' : '—');
        
        // Marge de sécurité 
        const marginEl = document.getElementById('as-dcf-margin');
        if (marginEl && assetData.dcf_margin != null) {
            const marginPct = (assetData.dcf_margin * 100).toFixed(1);
            marginEl.innerHTML = `<span style="color: ${assetData.dcf_margin > 0 ? 'var(--teal)' : 'var(--rose)'}; font-weight: 600;">${assetData.dcf_margin > 0 ? '+' : ''}${marginPct}%</span>`;
        }

        el('as-dcf-growth', fPct(assetData.dcf_growth_est));
        el('as-dcf-wacc', fPct(assetData.dcf_wacc));
        
        el('as-dcf-revgrowth', fPct(assetData.dcf_reverse_growth));
        el('as-dcf-irr', fPct(assetData.dcf_irr));

        // Météo du prix 
        const diffGrowth = assetData.dcf_reverse_growth - assetData.dcf_growth_est;
        let sentiment = "Juste prix";
        let sentColor = "var(--text)";
        if (diffGrowth > 0.03) { sentiment = "Trop Optimiste"; sentColor = "var(--rose)"; } 
        else if (diffGrowth < -0.03) { sentiment = "Opportunité (Pessimiste)"; sentColor = "var(--teal)"; }

        const sentEl = document.getElementById('as-dcf-sentiment');
        if (sentEl) sentEl.innerHTML = `<span style="color: ${sentColor}; font-weight: 600;">${sentiment}</span>`;

    } else {
        ['as-dcf-fairvalue', 'as-dcf-price', 'as-dcf-margin', 'as-dcf-growth', 'as-dcf-wacc', 'as-dcf-revgrowth', 'as-dcf-irr', 'as-dcf-sentiment'].forEach(id => el(id, 'N/A (FCF Négatif)'));
    }
  } // 🌟 CORRECTION 1 : Cette accolade ferme le "if (assetData) {", elle manquait !

  // 4. Reset tabs (Remet sur le premier onglet)
  overlay.querySelectorAll('.asset-sheet-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  overlay.querySelectorAll('.asset-sheet-pane').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });

  // 5. Affichage
  overlay.classList.add('open');
}; // 🌟 CORRECTION 1 (Suite) : C'est la fin propre de la fonction. Le "}" en trop en dessous a été supprimé.

window.closeAssetSheet = function() {
  document.getElementById('assetSheetOverlay')?.classList.remove('open');
};

window.switchAssetSheetTab = function(tabId, btn) {
  const overlay = document.getElementById('assetSheetOverlay');
  overlay.querySelectorAll('.asset-sheet-tab').forEach(t => t.classList.remove('active'));
  overlay.querySelectorAll('.asset-sheet-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  overlay.querySelector('#assetPane-' + tabId)?.classList.add('active');
};

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

// ── Génération du graphique P/E Historique ──
async function renderPEChart(ticker, currentEps, color) {
  const container = document.getElementById('as-pe-chart');
  if (!container) return;

  // S'il n'y a pas de bénéfice (EPS négatif ou manquant), le P/E n'a pas de sens mathématique
  if (!currentEps || currentEps <= 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.75rem;font-style:italic;text-align:center;">Historique P/E indisponible<br>(Bénéfices négatifs ou nuls)</div>';
    return;
  }
  
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Calcul du P/E...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from('stock_prices')
      .select('price_date, close_price')
      .eq('ticker', ticker)
      .order('price_date', { ascending: true });

    if (error || !data || data.length === 0) throw new Error('no data');

    // Pour que le P/E calculé avec l'EPS actuel soit pertinent, on se limite à la dernière année (environ 252 jours de bourse)
    const recentData = data.slice(-252); 

    const dates  = recentData.map(d => new Date(d.price_date));
    
    // 🌟 LA MAGIE EST ICI : On divise le prix historique par le bénéfice actuel
    const peValues = recentData.map(d => parseFloat(d.close_price) / currentEps);

    container.innerHTML = ''; 
    
    Plotly.newPlot(container, [{
      x: dates, y: peValues, type:'scatter', mode:'lines',
      line:      { color: color || '#3466a0', width: 2 },
      fill:      'tozeroy',
      fillcolor: 'rgba(52, 102, 160, 0.08)',
      hovertemplate: '%{x|%d/%m/%Y}<br><b>P/E : %{y:.1f}</b><extra></extra>'
    }], {
      margin: { t:10, r:20, b:30, l:30 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      yaxis: { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      showlegend: false
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.75rem;font-style:italic;">Données indisponibles</div>';
  }
}

// ── Génération du graphique des Dividendes ──
async function renderDividendChart(ticker, color) {
  const container = document.getElementById('as-div-chart');
  if (!container) return;

  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Chargement des dividendes...</div>';

  try {
    // ⚠️ On interrogera une future table 'dividends' dans Supabase
    const { data, error } = await window.supabaseClient
      .from('dividends')
      .select('date, amount')
      .eq('ticker', ticker)
      .order('date', { ascending: true });

    if (error || !data || data.length === 0) throw new Error('no data');

    const dates = data.map(d => new Date(d.date));
    const amounts = data.map(d => parseFloat(d.amount));

    container.innerHTML = ''; 
    
    // Création du graphique Plotly en BARRES
    Plotly.newPlot(container, [{
      x: dates, 
      y: amounts, 
      type: 'bar', // C'est ici que la magie des barres opère !
      marker: { color: color || '#2d8a7a' },
      hovertemplate: '%{x|%d/%m/%Y}<br><b>Montant : %{y:.2f} $</b><extra></extra>'
    }], {
      margin: { t:10, r:20, b:30, l:30 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      yaxis: { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, showline:false, zeroline:false },
      showlegend: false
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.75rem;font-style:italic;">Historique des dividendes indisponible</div>';
  }
}

// ── Génération du graphique Cascade (Compte de résultat) ──
function renderWaterfallChart(assetData) {
  const container = document.getElementById('as-waterfall-chart');
  if (!container) return;

  // Si on n'a pas les données de base, on annule
  if (!assetData.total_revenue || !assetData.net_income) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Données insuffisantes pour le graphique</div>';
      return;
  }

  // Plotly gère les cascades de façon géniale : on lui donne les montants TOTAUX des paliers 
  // (type: "absolute") et il calcule lui-même la différence (les coûts) entre chaque palier !
  
  const trace = {
      type: "waterfall",
      orientation: "v",
      measure: [
          "absolute", // Chiffre d'Affaires
          "absolute", // Bénéfice Brut
          "absolute", // EBITDA
          "absolute", // EBIT
          "absolute"  // Résultat Net
      ],
      x: ["C.A.", "Bénéfice Brut", "EBITDA", "EBIT", "Résultat Net"],
      textposition: "outside",
      
      // On convertit tout en Milliards pour que ce soit lisible
      y: [
          assetData.total_revenue / 1e9,
          assetData.gross_profit ? assetData.gross_profit / 1e9 : null,
          assetData.ebitda ? assetData.ebitda / 1e9 : null,
          assetData.operating_income ? assetData.operating_income / 1e9 : null,
          assetData.net_income / 1e9
      ],
      connector: {
        visible: false
      },
      decreasing: { marker: { color: "#e74c3c" } }, // Rouge pour les dépenses qui font baisser
      increasing: { marker: { color: "#2d8a7a" } }, 
      totals: { marker: { color: "#2980b9" } } // Bleu pour les paliers restants
  };

  container.innerHTML = '';

  Plotly.newPlot(container, [trace], {
      margin: { t: 20, r: 10, b: 30, l: 40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: { showgrid: false, tickfont: { size: 10, color: '#8a8278' } },
      yaxis: { showgrid: true, gridcolor: '#e4dfd5', tickfont: { size: 10, color: '#8a8278' }, ticksuffix: " Md" },
      showlegend: false
  }, { displayModeBar: false, responsive: true });
}

// ── Génération du graphique Historique Croissance ──
async function renderGrowthChart(ticker) {
  const container = document.getElementById('as-growth-chart');
  if (!container) return;

  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Chargement de l\'historique...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from('financial_history')
      .select('year, total_revenue, net_income')
      .eq('ticker', ticker)
      .order('year', { ascending: true }); // Du plus ancien au plus récent

    if (error || !data || data.length === 0) throw new Error('no data');

    const years = data.map(d => d.year);
    // On divise par 1 milliard pour avoir des chiffres lisibles (Md$)
    const revenues = data.map(d => d.total_revenue ? d.total_revenue / 1e9 : 0);
    const incomes = data.map(d => d.net_income ? d.net_income / 1e9 : 0);

    container.innerHTML = ''; 
    
    // On crée deux séries de barres : une pour le C.A., une pour le Bénéfice
    const traceRev = {
      x: years, y: revenues, name: "Chiffre d'affaires", type: 'bar', marker: { color: '#3466a0' }
    };
    const traceInc = {
      x: years, y: incomes, name: "Bénéfice Net", type: 'bar', marker: { color: '#2d8a7a' }
    };

    Plotly.newPlot(container, [traceRev, traceInc], {
      barmode: 'group', // 🌟 C'est ça qui met les barres côte à côte !
      margin: { t:10, r:10, b:30, l:40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, type: 'category' }, // category pour forcer l'affichage des années sans virgule
      yaxis: { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, ticksuffix: " Md" },
      showlegend: true,
      legend: { orientation: "h", y: 1.1, font: {size: 10, color: '#8a8278'} }
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.75rem;font-style:italic;">Historique indisponible</div>';
  }
}

// ── Génération du graphique de Rentabilité (Entonnoir des Marges) ──
function renderProfitabilityChart(assetData) {
  const container = document.getElementById('as-profit-chart');
  if (!container) return;

  // S'il nous manque les données de marge, on affiche un petit message
  if (!assetData.profit_margins && !assetData.operating_margin) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.75rem;font-style:italic;">Données de marges indisponibles</div>';
      return;
  }

  // 1. Calcul de la marge brute (Bénéfice Brut / Chiffre d'Affaires)
  let grossMargin = 0;
  if (assetData.gross_profit && assetData.total_revenue) {
      grossMargin = assetData.gross_profit / assetData.total_revenue;
  }

  // 2. Préparation des données (on multiplie par 100 pour l'affichage en %)
  // On les met de bas en haut pour Plotly (Nette en bas, Brute en haut)
  const xData = [
      (assetData.profit_margins || 0) * 100,
      (assetData.operating_margin || 0) * 100,
      grossMargin * 100
  ];
  
  const yData = ['Marge Nette', 'Marge Opérationnelle', 'Marge Brute'];

  container.innerHTML = '';

  const trace = {
      x: xData,
      y: yData,
      type: 'bar',
      orientation: 'h', // 🌟 Magique : met les barres à l'horizontale !
      marker: {
          // Un joli code couleur pour différencier les 3 étapes
          color: ['#3466a0', '#2d8a7a', '#b38f4f'] 
      },
      hovertemplate: '<b>%{y}</b>: %{x:.1f}%<extra></extra>',
      // On écrit le chiffre directement DANS la barre
      text: xData.map(val => val ? val.toFixed(1) + '%' : ''),
      textposition: 'auto',
      insidetextanchor: 'middle'
  };

  Plotly.newPlot(container, [trace], {
      // 🌟 1. On passe le 'r' (Right margin) de 20 à 80 pour laisser respirer l'infobulle
      margin: { t: 20, r: 80, b: 30, l: 120 }, 
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: { showgrid: true, gridcolor: '#e4dfd5', tickfont: { size: 10, color: '#8a8278' }, ticksuffix: '%' },
      yaxis: { showgrid: false, tickfont: { size: 11, color: '#333' } },
      showlegend: false,
      
      // 🌟 2. NOUVEAU : On personnalise l'infobulle au survol (Premium & lisible)
      hoverlabel: {
          bgcolor: '#2c3e50', // Un beau gris-bleu très sombre
          font: { color: '#ffffff', size: 12 }, // Texte en blanc
          bordercolor: 'transparent'
      }
  }, { displayModeBar: false, responsive: true });
}

// ── Génération du graphique Historique Dette vs EBITDA ──
async function renderDebtEbitdaChart(ticker) {
  const container = document.getElementById('as-debt-ebitda-chart');
  if (!container) return;

  try {
    const { data, error } = await window.supabaseClient
      .from('financial_history')
      .select('year, total_debt, ebitda')
      .eq('ticker', ticker)
      .order('year', { ascending: true });

    if (error || !data || data.length === 0) throw new Error('no data');

    const years = data.map(d => d.year);
    const debts = data.map(d => d.total_debt ? d.total_debt / 1e9 : 0);
    const ebitdas = data.map(d => d.ebitda ? d.ebitda / 1e9 : 0);

    container.innerHTML = ''; 
    
    const traceEbitda = {
      x: years, y: ebitdas, name: "EBITDA", type: 'bar', marker: { color: '#3466a0' }
    };
    const traceDebt = {
      x: years, y: debts, name: "Dette Totale", type: 'bar', marker: { color: '#e74c3c' }
    };

    Plotly.newPlot(container, [traceEbitda, traceDebt], {
      barmode: 'group',
      margin: { t:10, r:10, b:30, l:40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      xaxis: { showgrid:false, tickfont:{size:10,color:'#8a8278'}, type: 'category' },
      yaxis: { showgrid:true, gridcolor:'#e4dfd5', tickfont:{size:10,color:'#8a8278'}, ticksuffix: " Md" },
      showlegend: true,
      legend: { orientation: "h", y: 1.1, font: {size: 10, color: '#8a8278'} }
    }, { displayModeBar:false, responsive:true });

  } catch(e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted2);font-size:0.75rem;font-style:italic;">Historique indisponible</div>';
  }
}


async function loadSegmentsForAsset(assetId) {
    const { data, error } = await window.supabaseClient
        .from('segments')
        .select('*')
        .eq('asset_id', assetId);

    if (error) return console.error(error);
    if (data && data.length > 0) {
        renderSegmentsChart(data); // Utilise la fonction que nous avons écrite précédemment
        
        // Remplissage de la liste
        const listEl = document.getElementById('as-segments-list');
        listEl.innerHTML = data.map(s => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${s.segment_name}</span>
                <strong>${(s.revenue_val / 1e9).toFixed(2)} Md$</strong>
            </div>
        `).join('');
    }
}

// Expose globally
window.openAssetPanel = openAssetPanel;
window.closeAssetPanel = closeAssetPanel;
window.syncAllParams = syncAllParams;
window.renderHomeAssetList = renderHomeAssetList;
window.homeToggleAsset = homeToggleAsset;
window.updateHomeCount = updateHomeCount;
window.filterHomeAssets = filterHomeAssets;
window.clearHomeSearch = clearHomeSearch;