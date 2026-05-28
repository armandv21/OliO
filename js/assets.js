// ── Données actifs & Panneau Actifs ──────────────────────────────────────────
// Requires: config.js (window.supabaseClient)

window.ASSETS_DATA = [
  { name:'Actions américaines', color:'#1e3a5f', items:[
    {name:'Apple',ticker:'AAPL',isin:'US0378331005',labels:['Tech','Hardware']},
    {name:'Microsoft',ticker:'MSFT',isin:'US5949181045',labels:['Cloud','IA']},
    {name:'Amazon',ticker:'AMZN',isin:'US0231351067',labels:['Cloud','Conso']},
    {name:'Alphabet',ticker:'GOOGL',isin:'US02079K3059',labels:['Tech','IA']},
    {name:'NVIDIA',ticker:'NVDA',isin:'US67066G1040',labels:['Semi','IA']},
    {name:'Meta',ticker:'META',isin:'US30303M1027',labels:['Tech','IA']},
    {name:'Tesla',ticker:'TSLA',isin:'US88160R1014',labels:['Auto','Green']},
    {name:'Berkshire B',ticker:'BRK-B',isin:'US0846707026',labels:['Finance']},
    {name:'JPMorgan',ticker:'JPM',isin:'US46625H1005',labels:['Finance']},
    {name:'Johnson & Johnson',ticker:'JNJ',isin:'US4781601046',labels:['Santé']},
    {name:'ExxonMobil',ticker:'XOM',isin:'US30231G1022',labels:['Énergie']},
    {name:'Visa',ticker:'V',isin:'US92826C8394',labels:['Finance']},
    {name:'UnitedHealth',ticker:'UNH',isin:'US91324P1021',labels:['Santé']},
    {name:'Procter & Gamble',ticker:'PG',isin:'US7427181091',labels:['Conso']},
    {name:'Mastercard',ticker:'MA',isin:'US57636Q1040',labels:['Finance']},
    {name:'Home Depot',ticker:'HD',isin:'US4370761029',labels:['Conso']},
    {name:'Chevron',ticker:'CVX',isin:'US1667641005',labels:['Énergie']},
    {name:'Coca-Cola',ticker:'KO',isin:'US1912161007',labels:['Conso']},
    {name:'PepsiCo',ticker:'PEP',isin:'US7134481081',labels:['Conso']},
    {name:'AbbVie',ticker:'ABBV',isin:'US00287Y1091',labels:['Santé']}
  ]},
  { name:'CAC 40', color:'#3466a0', items:[
    {name:'LVMH',ticker:'MC.PA',isin:'FR0000121014',labels:['Luxe']},
    {name:'TotalEnergies',ticker:'TTE.PA',isin:'FR0014000MR3',labels:['Énergie']},
    {name:'Hermès',ticker:'RMS.PA',isin:'FR0000052292',labels:['Luxe']},
    {name:'Airbus',ticker:'AIR.PA',isin:'NL0000235190',labels:['Industrie']},
    {name:'Schneider Electric',ticker:'SU.PA',isin:'FR0000121972',labels:['Green']},
    {name:'BNP Paribas',ticker:'BNP.PA',isin:'FR0000131104',labels:['Finance']},
    {name:'Sanofi',ticker:'SAN.PA',isin:'FR0000120578',labels:['Santé']},
    {name:"L'Oréal",ticker:'OR.PA',isin:'FR0000120321',labels:['Luxe']},
    {name:'Kering',ticker:'KER.PA',isin:'FR0000121485',labels:['Luxe']},
    {name:'Danone',ticker:'BN.PA',isin:'FR0000120644',labels:['Conso']},
    {name:'Vinci',ticker:'DG.PA',isin:'FR0000125486',labels:['Industrie']}
  ]},
  { name:'Actions internationales', color:'#1a5c52', items:[
    {name:'Toyota',ticker:'TM',isin:'US8923313071',labels:['Auto']},
    {name:'ASML',ticker:'ASML',isin:'NL0010273215',labels:['Semi','Tech']},
    {name:'Nestlé',ticker:'NSRGY',isin:'CH0038863350',labels:['Conso']},
    {name:'Novo Nordisk',ticker:'NVO',isin:'DK0060534915',labels:['Santé']},
    {name:'HSBC',ticker:'HSBC',isin:'GB0005405286',labels:['Finance']},
    {name:'Shell',ticker:'SHEL',isin:'GB00BP6MXD84',labels:['Énergie']},
    {name:'AstraZeneca',ticker:'AZN',isin:'GB0009895292',labels:['Santé']},
    {name:'SAP',ticker:'SAP',isin:'DE0007164600',labels:['Cloud','Logiciel']},
    {name:'Siemens',ticker:'SIEGY',isin:'DE0007236101',labels:['Industrie']},
    {name:'Sony',ticker:'SONY',isin:'JP3435000009',labels:['Tech']},
    {name:'Nintendo',ticker:'NTDOY',isin:'JP3756600007',labels:['Tech']}
  ]},
  { name:'ETF', color:'#8a5a00', items:[
    {name:'S&P 500 (SPY)',ticker:'SPY',isin:'US78462F1030',labels:['ETF']},
    {name:'Nasdaq (QQQ)',ticker:'QQQ',isin:'US46090E1038',labels:['ETF','Tech']},
    {name:'MSCI World (URTH)',ticker:'URTH',isin:'US46434G8473',labels:['ETF']},
    {name:'Total Market (VTI)',ticker:'VTI',isin:'US9229087690',labels:['ETF']},
    {name:'Marchés émergents (IEMG)',ticker:'IEMG',isin:'US46434G1031',labels:['ETF']},
    {name:'Europe (IEV)',ticker:'IEV',isin:'US4642867422',labels:['ETF']},
    {name:'Dividendes (VIG)',ticker:'VIG',isin:'US9229083228',labels:['ETF']},
    {name:'Innovation (ARKK)',ticker:'ARKK',isin:'US00214Q1040',labels:['ETF','Tech']},
    {name:'Japon (EWJ)',ticker:'EWJ',isin:'US4642864007',labels:['ETF']},
    {name:'Robotique (BOTZ)',ticker:'BOTZ',isin:'US9220428588',labels:['ETF','IA']},
    {name:'Or (IAU)',ticker:'IAU',isin:'US4642851053',labels:['ETF']},
    {name:'Immobilier (VNQ)',ticker:'VNQ',isin:'US9229085538',labels:['ETF']},
    {name:'Obligations 20 ans (TLT)',ticker:'TLT',isin:'US4642874329',labels:['ETF']},
    {name:'Obligations corp. (LQD)',ticker:'LQD',isin:'US4642876233',labels:['ETF']},
    {name:'Santé (XLV)',ticker:'XLV',isin:'US81369Y8030',labels:['ETF','Santé']},
    {name:'Technologie (XLK)',ticker:'XLK',isin:'US81369Y6030',labels:['ETF','Tech']},
    {name:'Énergie (XLE)',ticker:'XLE',isin:'US81369Y2026',labels:['ETF','Éner.']},
    {name:'Énergie propre (ICLN)',ticker:'ICLN',isin:'IE00B1XNHC34',labels:['ETF','Green']}
  ]}
];

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
