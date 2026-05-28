// ── Données actifs & Panneau Actifs ────────────────────────────────────────────────
// Requires: config.js, optimization.js (appState, API_URL)

// ═══════════════════════════════════════════════════
// ASSETS_DATA + PANNEAU ACTIFS
// ═══════════════════════════════════════════════════
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
    {name:'Obligations 20 ans (TLT)',ticker:'TLT',isin:'US4642874576',labels:['ETF']},
    {name:'Obligations corp. (LQD)',ticker:'LQD',isin:'US4642876233',labels:['ETF']},
    {name:'Santé (XLV)',ticker:'XLV',isin:'US81369Y6059',labels:['ETF','Santé']},
    {name:'Technologie (XLK)',ticker:'XLK',isin:'US81369Y7059',labels:['ETF','Tech']},
    {name:'Énergie (XLE)',ticker:'XLE',isin:'US81369Y4058',labels:['ETF','Énergie']},
    {name:'Énergie propre (ICLN)',ticker:'ICLN',isin:'US46429B1017',labels:['ETF','Green']}
  ]}
];

// Get Supabase prices (cached)
async function getPricesFromSupabase(tickers, period) {
  try {
    const { data, error } = await window.supabaseClient
      .from('prix_actifs')
      .select('ticker, date, close')
      .in('ticker', tickers)
      .order('date', { ascending: true });
    if (error || !data) return null;
    const result = {};
    for (const row of data) {
      if (!result[row.ticker]) result[row.ticker] = [];
      result[row.ticker].push({ t: new Date(row.date).getTime() / 1000, p: row.close });
    }
    return result;
  } catch(e) { return null; }
}

function openAssetPanel() {
  document.getElementById('assetPanel').classList.add('open');
  document.getElementById('assetPanelBackdrop').classList.add('open');
}

function closeAssetPanel() {
  document.getElementById('assetPanel').classList.remove('open');
  document.getElementById('assetPanelBackdrop').classList.remove('open');
}

// Sync paramètres panneau ↔ sidebar
function syncAllParams(type, val) {
  val = parseFloat(val);
  if (type === 'period') {
    document.getElementById('homePeriodInput').value = val;
    document.getElementById('homePeriodRange').value = val;
    document.getElementById('periodInput').value = val;
    document.getElementById('periodRange').value = val;
    window.assetStatsCache = {};
    window._statsCachePeriod = null;
    if (typeof appState !== 'undefined') { appState.period = val + 'y'; }
  } else if (type === 'rf') {
    document.getElementById('homeRfInput').value = val;
    document.getElementById('homeRfRange').value = val;
    document.getElementById('rfInput').value = val;
    document.getElementById('rfRange').value = val;
    if (typeof appState !== 'undefined') { appState.rf = val / 100; }
  } else if (type === 'sim') {
    document.getElementById('homeSimInput').value = val;
    document.getElementById('homeSimRange').value = val;
    document.getElementById('simInput').value = val;
    document.getElementById('simRange').value = val;
    const pv = document.getElementById('profileSimVal');
    if (pv) pv.textContent = val.toLocaleString('fr-FR');
    if (typeof appState !== 'undefined') { appState.nSim = val; }
  }
}

window.assetStatsCache = {};
window._statsCachePeriod = null;

// Lazy stats loading
let _triggerStatsTimer = null;
function _triggerStatsLoad() {
  clearTimeout(_triggerStatsTimer);
  _triggerStatsTimer = setTimeout(() => _loadAllStats(), 800);
}

async function _loadAllStats() {
  const period = document.getElementById('homePeriodInput')?.value || '2';
  const periodStr = period + 'y';
  if (window._statsCachePeriod === periodStr && Object.keys(window.assetStatsCache).length > 0) return;
  window.assetStatsCache = {};
  window._statsCachePeriod = periodStr;
  
  const allTickers = [];
  for (const cat of window.ASSETS_DATA) {
    for (const item of cat.items) allTickers.push(item.ticker);
  }
  
  // Fetch in batches of 8
  const BATCH = 8;
  for (let i = 0; i < allTickers.length; i += BATCH) {
    const batch = allTickers.slice(i, i + BATCH);
    await _fetchPricesForStats(batch, periodStr);
  }
}

async function _fetchPricesForStats(tickers, period) {
  try {
    const API_URL = window.CONFIG ? window.CONFIG.API_URL : 'https://app-backend-k9i5.onrender.com';
    const resp = await fetch(API_URL + '/prices', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ tickers, period }),
      signal: AbortSignal.timeout(30000)
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.prices) return;
    for (const [ticker, prices] of Object.entries(data.prices)) {
      if (prices && prices.length > 10) {
        const ps = prices.map(p => typeof p === 'object' ? p.p : p).filter(p => p > 0);
        if (ps.length > 2) {
          // Compute annualized return and volatility
          const rets = [];
          for (let i = 1; i < ps.length; i++) rets.push((ps[i] - ps[i-1]) / ps[i-1]);
          const mean = rets.reduce((s,v)=>s+v,0)/rets.length;
          const variance = rets.reduce((s,v)=>s+(v-mean)**2,0)/(rets.length-1);
          const annRet = mean * 52;
          const annVol = Math.sqrt(variance * 52);
          const perf = (ps[ps.length-1] - ps[0]) / ps[0];
          window.assetStatsCache[ticker] = { annRet, annVol, perf, prices: ps };
          _updateStatRow(ticker);
        }
      }
    }
  } catch(e) { /* silent */ }
}

function _updateStatRow(ticker) {
  const stat = window.assetStatsCache[ticker];
  if (!stat) return;
  // Update stat in home asset rows
  const rows = document.querySelectorAll('.home-asset-row[data-ticker="' + ticker + '"]');
  rows.forEach(row => {
    const statEl = row.querySelector('.har-stat-val');
    if (statEl) {
      const perf = stat.perf * 100;
      statEl.textContent = (perf >= 0 ? '+' : '') + perf.toFixed(1) + '%';
      statEl.style.color = perf >= 0 ? 'var(--teal)' : 'var(--rose)';
    }
  });
}

let _homeChartLogScale = false;
function homeToggleLogScale(btn) {
  _homeChartLogScale = !_homeChartLogScale;
  if (btn) btn.classList.toggle('active', _homeChartLogScale);
  // Re-render all open charts
  document.querySelectorAll('.home-asset-chart.open').forEach(chartDiv => {
    const ticker = chartDiv.dataset.ticker;
    const suffix = chartDiv.id.includes('_sb') ? '_sb' : '';
    if (ticker) {
      const cat = window.ASSETS_DATA.find(c => c.items.some(i => i.ticker === ticker));
      if (cat) renderHomeChart(ticker, '', cat.color, suffix);
    }
  });
}

function renderHomeAssetList(query, containerId) {
  const cid = containerId || 'homeAssetList';
  const container = document.getElementById(cid);
  if (!container) return;
  _renderIntoContainer(container, query, cid.includes('sb') ? '_sb' : '');
}

function _renderIntoContainer(container, query, suffix) {
  const q = (query || '').trim().toLowerCase();
  container.innerHTML = '';
  
  for (const cat of window.ASSETS_DATA) {
    const filteredItems = cat.items.filter(item => {
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.ticker.toLowerCase().includes(q);
    });
    if (filteredItems.length === 0) continue;
    
    // Category header
    const header = document.createElement('div');
    header.className = 'asset-category-header';
    header.style.cssText = 'border-left: 3px solid ' + cat.color;
    header.innerHTML = '<span>' + cat.name + '</span><span class="cat-arrow">▼</span>';
    header.onclick = function() {
      header.classList.toggle('collapsed');
      const items = header.nextElementSibling;
      if (items) items.style.display = header.classList.contains('collapsed') ? 'none' : '';
    };
    container.appendChild(header);
    
    const itemsDiv = document.createElement('div');
    for (const item of filteredItems) {
      const row = document.createElement('div');
      row.className = 'home-asset-row';
      row.dataset.ticker = item.ticker;
      
      const isSelected = (window.selectedAssets || []).includes(item.ticker);
      if (isSelected) row.classList.add('selected');
      
      row.innerHTML = '<div class="har-check"><input type="checkbox" ' + (isSelected ? 'checked' : '') + '></div>' +
        '<div class="har-name"><div class="har-name-main">' + item.name + '</div><div class="har-name-ticker">' + item.ticker + '</div></div>' +
        '<div class="har-labels">' + (item.labels || []).map(l => '<span class="sector-tag">' + l + '</span>').join('') + '</div>' +
        '<div class="har-stat"><div class="har-stat-val" style="color:var(--muted2)">…</div></div>';
      
      const cb = row.querySelector('input[type=checkbox]');
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        homeToggleAsset(item.ticker, cb.checked, row);
      });
      row.addEventListener('click', (e) => {
        if (e.target === cb) return;
        const chartDiv = document.getElementById('homeChart_' + item.ticker + suffix);
        if (chartDiv) {
          const isOpen = chartDiv.classList.contains('open');
          chartDiv.classList.toggle('open', !isOpen);
          if (!isOpen && !chartDiv.dataset.loaded) {
            renderHomeChart(item.ticker, '', cat.color, suffix);
            chartDiv.dataset.loaded = '1';
          }
        }
      });
      
      itemsDiv.appendChild(row);
      
      // Chart div
      const chartDiv = document.createElement('div');
      chartDiv.className = 'home-asset-chart';
      chartDiv.id = 'homeChart_' + item.ticker + suffix;
      chartDiv.dataset.ticker = item.ticker;
      chartDiv.innerHTML = '<div class="home-asset-chart-header"><span>' + item.name + '</span><span class="home-asset-chart-perf"></span></div><div class="home-asset-chart-inner" id="homeChartInner_' + item.ticker + suffix + '"></div>';
      itemsDiv.appendChild(chartDiv);
      
      // Update stat if cached
      if (window.assetStatsCache[item.ticker]) _updateStatRow(item.ticker);
    }
    container.appendChild(itemsDiv);
  }
  _triggerStatsLoad();
}

async function renderHomeChart(ticker, period, color, suffix) {
  const divId = 'homeChartInner_' + ticker + (suffix || '');
  const div = document.getElementById(divId);
  if (!div) return;
  
  const stat = window.assetStatsCache[ticker];
  if (!stat || !stat.prices) {
    div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:0.75rem">Chargement...</div>';
    return;
  }
  
  const prices = stat.prices;
  const n = prices.length;
  const xs = Array.from({length:n}, (_,i) => i);
  const perf = (prices[n-1] - prices[0]) / prices[0];
  const lineColor = perf >= 0 ? '#1a5c52' : '#7a1f2e';
  
  // Update perf in header
  const perfEl = div.parentElement?.querySelector('.home-asset-chart-perf');
  if (perfEl) {
    perfEl.textContent = (perf >= 0 ? '+' : '') + (perf*100).toFixed(1) + '%';
    perfEl.style.color = lineColor;
  }
  
  const layout = {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    margin: {l:0,r:0,t:0,b:0},
    showlegend: false,
    xaxis: {visible:false, fixedrange:true},
    yaxis: {
      visible:false, fixedrange:true,
      type: _homeChartLogScale ? 'log' : 'linear'
    }
  };
  
  Plotly.react(div, [{
    x: xs, y: prices, mode:'lines', type:'scatter',
    line: {color: lineColor, width: 1.5},
    fill: 'tozeroy',
    fillcolor: lineColor.replace(')', ',0.08)').replace('rgb','rgba'),
    hovertemplate: '%{y:.2f}<extra></extra>'
  }], layout, {responsive:true, displayModeBar:false});
}

let selectedAssets = window.selectedAssets || [];
window.selectedAssets = selectedAssets;

function homeToggleAsset(ticker, checked, rowEl) {
  if (checked) {
    if (!selectedAssets.includes(ticker)) selectedAssets.push(ticker);
    if (rowEl) rowEl.classList.add('selected');
  } else {
    const idx = selectedAssets.indexOf(ticker);
    if (idx >= 0) selectedAssets.splice(idx, 1);
    if (rowEl) rowEl.classList.remove('selected');
  }
  // Sync with sidebar selection
  if (typeof appState !== 'undefined') {
    appState.selected.clear();
    selectedAssets.forEach(t => appState.selected.add(t));
  }
  updateHomeCount();
}

function updateHomeCount() {
  const countEls = document.querySelectorAll('.home-selected-count strong, #homeSelectedCount');
  countEls.forEach(el => { el.textContent = selectedAssets.length; });
  // Enable/disable run button
  const btn = document.getElementById('btnRunHome');
  if (btn) btn.disabled = selectedAssets.length < 2;
}

function filterHomeAssets(query) {
  const clearBtn = document.getElementById('sidebarExpandClear');
  if (clearBtn) clearBtn.classList.toggle('visible', query.trim().length > 0);
  renderHomeAssetList(query, 'homeAssetList');
  renderHomeAssetList(query, 'homeAssetList_sb');
}

function clearHomeSearch() {
  const inp = document.getElementById('sidebarExpandSearch');
  if (inp) { inp.value = ''; filterHomeAssets(''); inp.focus(); }
  const clearBtn = document.getElementById('sidebarExpandClear');
  if (clearBtn) clearBtn.classList.remove('visible');
}

window.resetSelection = function() {
  selectedAssets.length = 0;
  document.querySelectorAll('.home-asset-row').forEach(r => {
    r.classList.remove('selected');
    const cb = r.querySelector('input[type=checkbox]');
    if (cb) cb.checked = false;
  });
  if (typeof appState !== 'undefined') appState.selected.clear();
  updateHomeCount();
};

window.openAssetPanel = openAssetPanel;
window.closeAssetPanel = closeAssetPanel;
window.syncAllParams = syncAllParams;
window.renderHomeAssetList = renderHomeAssetList;
window.homeToggleAsset = homeToggleAsset;
window.updateHomeCount = updateHomeCount;
window.filterHomeAssets = filterHomeAssets;
window.clearHomeSearch = clearHomeSearch;
window.homeToggleLogScale = homeToggleLogScale;
window.preloadVisibleCharts = function() {
  if (!window.ASSETS_DATA) return;
  (selectedAssets || []).forEach(ticker => {
    const chartDiv = document.getElementById('homeChart_' + ticker + '_sb');
    if (chartDiv && !chartDiv.classList.contains('open')) {
      chartDiv.classList.add('open');
      const cat = window.ASSETS_DATA.find(c => c.items.some(i => i.ticker === ticker));
      if (cat) renderHomeChart(ticker, '', cat.color, '_sb');
    }
  });
};

// Init: sync sidebar assets with home panel on load
;(function() {
  setTimeout(() => {
    if (typeof buildSidebar === 'function') {
      // Patch sidebar asset list to sync with home panel selection
      const origApply = window.applyFilters;
      // Also sync resetSelection
      updateHomeCount();
    }
  }, 100);
})();
