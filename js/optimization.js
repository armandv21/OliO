// ── Optimisation de portefeuille ───────────────────────────────────────────
// Requires: config.js (CONFIG, window.supabaseClient)


const ASSETS = {
  "Actions américaines": {
    "Apple":"AAPL","Microsoft":"MSFT","Amazon":"AMZN","Alphabet":"GOOGL","NVIDIA":"NVDA",
    "Meta":"META","Tesla":"TSLA","Berkshire B":"BRK-B","JPMorgan":"JPM","Johnson & Johnson":"JNJ",
    "ExxonMobil":"XOM","Visa":"V","UnitedHealth":"UNH","Procter & Gamble":"PG","Mastercard":"MA",
    "Home Depot":"HD","Chevron":"CVX","Coca-Cola":"KO","PepsiCo":"PEP","AbbVie":"ABBV"
  },
  "CAC 40": {
    "LVMH":"MC.PA","TotalEnergies":"TTE.PA","Hermès":"RMS.PA","Airbus":"AIR.PA",
    "Schneider Electric":"SU.PA","BNP Paribas":"BNP.PA","Sanofi":"SAN.PA","L'Oréal":"OR.PA",
    "Kering":"KER.PA","Danone":"BN.PA","Vinci":"DG.PA"
  },
  "Actions internationales": {
    "Toyota":"TM","ASML":"ASML","Nestlé":"NSRGY","Novo Nordisk":"NVO","HSBC":"HSBC",
    "Shell":"SHEL","AstraZeneca":"AZN","SAP":"SAP","Siemens":"SIEGY","Sony":"SONY","Nintendo":"NTDOY"
  },
  "ETF": {
    "S&P 500 (SPY)":"SPY","Nasdaq (QQQ)":"QQQ","MSCI World (URTH)":"URTH","Total Market (VTI)":"VTI",
    "Marchés émergents (IEMG)":"IEMG","Europe (IEV)":"IEV","Dividendes (VIG)":"VIG",
    "Innovation (ARKK)":"ARKK","Japon (EWJ)":"EWJ","Robotique (BOTZ)":"BOTZ",
    "Or (IAU)":"IAU","Immobilier (VNQ)":"VNQ","Obligations 20 ans (TLT)":"TLT",
    "Obligations corp. (LQD)":"LQD","Santé (XLV)":"XLV","Technologie (XLK)":"XLK",
    "Énergie (XLE)":"XLE","Énergie propre (ICLN)":"ICLN"
  }
};

// ── Tags sectoriels par ticker ────────────────────────────────────────────────
const SECTOR_TAGS = {
  "AAPL":["Tech","Hardware"],"MSFT":["Cloud","IA"],"AMZN":["Cloud","Consommation"],
  "GOOGL":["Tech","IA"],"NVDA":["Semi-conducteurs","IA"],"META":["Tech","IA"],
  "TSLA":["Auto","GreenTech"],"BRK-B":["Finance"],"JPM":["Finance"],
  "JNJ":["Santé"],"XOM":["Énergie"],"V":["Finance","Paiement"],
  "UNH":["Santé"],"PG":["Consommation"],"MA":["Finance","Paiement"],
  "HD":["Consommation"],"CVX":["Énergie"],"KO":["Consommation"],
  "PEP":["Consommation"],"ABBV":["Santé"],
  "MC.PA":["Luxe"],"TTE.PA":["Énergie","GreenTech"],"RMS.PA":["Luxe"],
  "AIR.PA":["Industrie","Défense"],"SU.PA":["GreenTech","Industrie"],
  "BNP.PA":["Finance"],"SAN.PA":["Santé"],"OR.PA":["Luxe"],
  "KER.PA":["Luxe"],"BN.PA":["Consommation"],"DG.PA":["Industrie"],
  "TM":["Auto","Industrie"],"ASML":["Semi-conducteurs","Tech"],"NSRGY":["Consommation"],
  "NVO":["Santé"],"HSBC":["Finance"],"SHEL":["Énergie"],
  "AZN":["Santé"],"SAP":["Cloud","Logiciel"],"SIEGY":["Industrie","GreenTech"],
  "SONY":["Hardware","Divertissement"],"NTDOY":["Tech","Divertissement"],
  "SPY":["ETF large"],"QQQ":["ETF large","Tech"],"URTH":["ETF large"],
  "VTI":["ETF large"],"IEMG":["ETF large","Émergents"],"IEV":["ETF large"],
  "VIG":["ETF large"],"ARKK":["ETF thématique","Tech"],"EWJ":["ETF large"],
  "BOTZ":["ETF thématique","IA"],"IAU":["ETF thématique","Matières premières"],
  "VNQ":["ETF thématique","Immobilier"],"TLT":["ETF thématique","Obligations"],
  "LQD":["ETF thématique","Obligations"],"XLV":["ETF thématique","Santé"],
  "XLK":["ETF thématique","Tech"],"XLE":["ETF thématique","Énergie"],
  "ICLN":["ETF thématique","GreenTech"]
};

// Couleurs par tag
const TAG_COLORS = {
  "Tech":"#dbeafe:#1e40af","IA":"#ede9fe:#5b21b6","Cloud":"#e0f2fe:#0369a1",
  "Semi-conducteurs":"#fef3c7:#92400e","Logiciel":"#dbeafe:#1e3a8a",
  "Hardware":"#f1f5f9:#334155","Divertissement":"#fce7f3:#9d174d",
  "Finance":"#d1fae5:#065f46","Paiement":"#d1fae5:#047857",
  "Santé":"#fee2e2:#991b1b","Énergie":"#fef3c7:#b45309",
  "GreenTech":"#dcfce7:#15803d","Industrie":"#f1f5f9:#475569",
  "Défense":"#fef2f2:#7f1d1d","Luxe":"#fdf4ff:#7e22ce",
  "Consommation":"#fff7ed:#c2410c","Auto":"#f0fdf4:#166534",
  "Immobilier":"#fef9c3:#854d0e","Obligations":"#f8fafc:#1e293b",
  "Matières premières":"#fef3c7:#78350f","ETF large":"#f0f9ff:#0c4a6e",
  "ETF thématique":"#fdf4ff:#6b21a8","Émergents":"#ecfdf5:#064e3b"
};

function getTagStyle(tag) {
  const c = TAG_COLORS[tag] || "#f1f5f9:#334155";
  const [bg, fg] = c.split(":");
  return "background:" + bg + ";color:" + fg + ";";
}
function renderTags(ticker) {
  const tags = SECTOR_TAGS[ticker] || [];
  return tags.map(t => '<span class="sector-tag" style="' + getTagStyle(t) + '">' + t + '</span>').join('');
}

let appState = { selected:new Set(), rf:0.03, period:'2y', nSim:6000, results:null, cmlExposure:1.0 };

let _assetSectionOpen = true;
let _paramsSectionOpen = false;

function toggleAssetSection() {
  _assetSectionOpen = !_assetSectionOpen;
  const col = document.getElementById('assetCollapsible');
  const arrow = document.getElementById('assetArrow');
  const body = document.getElementById('assetBodySection');
  col.style.maxHeight = _assetSectionOpen ? '500px' : '0';
  col.style.overflow = 'hidden';
  arrow.classList.toggle('open', _assetSectionOpen);
  body.style.display = _assetSectionOpen ? '' : 'none';
}

function toggleParamsSection() {
  _paramsSectionOpen = !_paramsSectionOpen;
  const col = document.getElementById('paramsCollapsible');
  const arrow = document.getElementById('paramsArrow');
  col.style.maxHeight = _paramsSectionOpen ? '400px' : '0';
  arrow.classList.toggle('open', _paramsSectionOpen);
}

// Active filters state
let activeRegions = new Set(Object.keys(ASSETS));
let activeLabels = new Set();

function buildSidebar() {
  buildFilterPanel();
  renderAssetList();
  applyFilters();
}

function buildFilterPanel() {
  const container = document.getElementById('filterPanelSticky');

  // Filter toggle button
  const filterDiv = document.createElement('div');
  filterDiv.className = 'asset-category';
  filterDiv.id = 'filterCategory';
  filterDiv.style.borderBottom = '1px solid var(--border)';
  filterDiv.style.marginBottom = '0';

  const toggle = document.createElement('button');
  toggle.className = 'category-toggle';
  toggle.style.padding = '5px 0';
  toggle.innerHTML = 'Filtres <span class="category-arrow">▶</span>';
  const panel = document.createElement('div');
  panel.className = 'category-items';
  panel.id = 'filterPanel';
  panel.style.maxHeight = '220px';
  panel.style.overflowY = 'auto';

  toggle.onclick = function() {
    toggle.classList.toggle('open');
    panel.classList.toggle('open');
  };

  // Regions
  let html = '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:6px 0 4px">Région</div>';
  for (const cat of Object.keys(ASSETS)) {
    const id = 'reg_' + cat;
    html += '<label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:0.75rem;color:var(--ink2);cursor:pointer">' +
      '<input type="checkbox" id="' + id + '" checked style="accent-color:var(--blue);width:12px;height:12px"> ' + cat + '</label>';
  }

  // All unique tags
  const allTags = new Set();
  Object.values(SECTOR_TAGS).forEach(function(tags) { tags.forEach(function(t){ allTags.add(t); }); });
  const sortedTags = Array.from(allTags).sort();

  html += '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:10px 0 4px">Secteur</div>';
  for (const tag of sortedTags) {
    const id = 'tag_' + tag.replace(/[^a-zA-Z0-9]/g, '_');
    html += '<label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:0.75rem;color:var(--ink2);cursor:pointer">' +
      '<input type="checkbox" id="' + id + '" data-tag="' + tag + '" style="accent-color:var(--blue);width:12px;height:12px"> ' +
      '<span class="sector-tag" style="' + getTagStyle(tag) + '">' + tag + '</span></label>';
  }

  panel.innerHTML = html;
  filterDiv.appendChild(toggle);
  filterDiv.appendChild(panel);
  container.appendChild(filterDiv);

  // Bind region checkboxes
  for (const cat of Object.keys(ASSETS)) {
    const cb = document.getElementById('reg_' + cat);
    if (cb) cb.addEventListener('change', function() {
      if (this.checked) activeRegions.add(cat); else activeRegions.delete(cat);
      applyFilters();
    });
  }

  // Bind tag checkboxes
  panel.querySelectorAll('[data-tag]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      const tag = this.getAttribute('data-tag');
      if (this.checked) activeLabels.add(tag); else activeLabels.delete(tag);
      applyFilters();
    });
  });

  filterDiv.appendChild(toggle);
  filterDiv.appendChild(panel);
  container.appendChild(filterDiv);
}

function renderAssetList() {
  // assetItems lives in assetList (sidebar-body)
  let container = document.getElementById('assetItems');
  if (!container) {
    container = document.createElement('div');
    container.id = 'assetItems';
    document.getElementById('assetList').appendChild(container);
  }
  container.innerHTML = '';
  for (const [cat, assets] of Object.entries(ASSETS)) {
    for (const [name, ticker] of Object.entries(assets)) {
      const item = document.createElement('label');
      item.className = 'asset-item';
      item.dataset.cat = cat;
      item.dataset.ticker = ticker;
      item.dataset.tags = (SECTOR_TAGS[ticker] || []).join(',');
      item.innerHTML = '<input type="checkbox" value="' + ticker + '" style="flex-shrink:0;margin-top:1px"/> ' +
        '<span style="flex:1;min-width:0;line-height:1.3"><span style="display:block">' + name + '</span>' +
        '<span class="ticker-tag">' + ticker + '</span></span>' +
        '<span style="flex-shrink:0;text-align:right">' + renderTags(ticker) + '</span>';
      item.querySelector('input').addEventListener('change', function(e) {
        if (e.target.checked) { appState.selected.add(ticker); item.classList.add('selected'); }
        else { appState.selected.delete(ticker); item.classList.remove('selected'); }
        document.getElementById('selectedCount').textContent = appState.selected.size;
      });
      container.appendChild(item);
    }
  }
}

function applyFilters() {
  const q = (document.getElementById('assetSearch').value || '').trim().toLowerCase();
  document.querySelectorAll('#assetItems .asset-item').forEach(function(item) {
    const cat = item.dataset.cat;
    const itemTags = item.dataset.tags ? item.dataset.tags.split(',') : [];
    const regionOk = activeRegions.has(cat);
    const labelOk = activeLabels.size === 0 || itemTags.some(function(t){ return activeLabels.has(t); });
    const searchOk = !q || item.textContent.toLowerCase().includes(q);
    item.style.display = (regionOk && labelOk && searchOk) ? '' : 'none';
  });
}


// ── Sync paramètres ──────────────────────────────────────────────────────────
const periodLabels = {1:'1 an',2:'2 ans',3:'3 ans',4:'4 ans',5:'5 ans'};
document.getElementById('periodRange').addEventListener('input', e => {
  const v = +e.target.value;
  document.getElementById('periodInput').value = v;
  appState.period = v + 'y';
});
function syncPeriodFromInput(val) {
  const v = Math.max(1, Math.min(5, Math.round(+val)));
  if (!isNaN(v)) {
    document.getElementById('periodRange').value = v;
    document.getElementById('periodInput').value = v;
    appState.period = v + 'y';
  }
}
document.getElementById('rfRange').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  document.getElementById('rfInput').value = v.toFixed(2);
  appState.rf = v / 100;
});
function syncRfFromInput(val) {
  const v = Math.max(0, Math.min(10, parseFloat(val)));
  if (!isNaN(v)) {
    document.getElementById('rfRange').value = Math.round(v * 10) / 10;
    document.getElementById('rfInput').value = val;
    appState.rf = v / 100;
  }
}
document.getElementById('simRange').addEventListener('input', e => {
  const v = +e.target.value;
  document.getElementById('simInput').value = v;
  appState.nSim = v;
});
function syncSimFromInput(val) {
  const v = Math.max(1000, Math.min(15000, Math.round(+val)));
  if (!isNaN(v)) {
    const snapped = Math.round(v / 500) * 500;
    document.getElementById('simRange').value = snapped;
    document.getElementById('simInput').value = v;
    appState.nSim = v;
  }
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}


// ── API + fetch prix ─────────────────────────────────────────────────────────
const API_URL = 'https://app-backend-k9i5.onrender.com';

async function fetchOneTicker(ticker, period) {
  const y1 = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${period}&interval=1wk&includePrePost=false`;
  const y2 = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=${period}&interval=1wk&includePrePost=false`;
  const proxies = [
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];
  for (const base of [y1, y2]) {
    for (const proxyFn of proxies) {
      try {
        const resp = await fetch(proxyFn(base), { signal: AbortSignal.timeout(9000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        const result = data?.chart?.result?.[0];
        if (!result) continue;
        const closes = result?.indicators?.adjclose?.[0]?.adjclose || result?.indicators?.quote?.[0]?.close;
        const timestamps = result?.timestamp;
        if (!closes || !timestamps) continue;
        const prices = [];
        for (let j = 0; j < closes.length; j++) if (closes[j] != null) prices.push({t:timestamps[j], p:closes[j]});
        if (prices.length > 10) return prices;
      } catch(e) { /* try next */ }
    }
  }
  return null;
}

async function fetchPrices(tickers, period) {
  // Try backend first (bypasses Yahoo Finance CORS restrictions)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const resp = await fetch(`${API_URL}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers, period }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      return data.prices;
    }
  } catch(e) { /* fall through to local fetch */ }

  // Fallback: fetch directly from Yahoo Finance
  const results = {};
  const chunkSize = 4;
  for (let i = 0; i < tickers.length; i += chunkSize) {
    const chunk = tickers.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async ticker => {
      const prices = await fetchOneTicker(ticker, period);
      if (prices) results[ticker] = prices;
    }));
  }
  return results;
}

// ── Mathématiques portfolio ──────────────────────────────────────────────────
function returns(prices) {
  const r = [];
  for (let i=1;i<prices.length;i++) r.push((prices[i]-prices[i-1])/prices[i-1]);
  return r;
}
function mean(a) { return a.reduce((s,v)=>s+v,0)/a.length; }
function cov(a,b) { const ma=mean(a),mb=mean(b); return a.map((v,i)=>(v-ma)*(b[i]-mb)).reduce((s,v)=>s+v,0)/(a.length-1); }
function std(a) { return Math.sqrt(cov(a,a)); }

function portfolioStats(weights, meanRets, covMatrix, rf) {
  const n=weights.length;
  let ret=0; for(let i=0;i<n;i++) ret+=weights[i]*meanRets[i]; ret*=52;
  let variance=0; for(let i=0;i<n;i++) for(let j=0;j<n;j++) variance+=weights[i]*weights[j]*covMatrix[i][j];
  const vol=Math.sqrt(variance*52);
  return {ret, vol, sharpe:vol>0?(ret-rf)/vol:0};
}

function buildCovMatrix(rets2d, n) {
  const m=Array.from({length:n},()=>new Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) m[i][j]=cov(rets2d[i],rets2d[j]);
  return m;
}

// ── Portfolio Optimization via Projected Gradient Descent ──────────────

// Project weight vector onto probability simplex (sum=1, all>=0)
function projectSimplex(w) {
  const n = w.length;
  const sorted = [...w].sort((a,b)=>b-a);
  let cumsum = 0, rho = 0;
  for (let i=0; i<n; i++) {
    cumsum += sorted[i];
    if (sorted[i] - (cumsum - 1)/(i+1) > 0) rho = i;
  }
  const cumsum2 = sorted.slice(0,rho+1).reduce((a,b)=>a+b,0);
  const theta = (cumsum2 - 1) / (rho + 1);
  return w.map(v => Math.max(0, v - theta));
}

// Projected gradient descent to minimize variance (optionally with soft return target)
function pgdMinVar(meanRets, covMatrix, targetRet, nIter=800, lr=0.5) {
  const n = meanRets.length;
  const mu52 = meanRets.map(r=>r*52);
  // Cov annualized = covMatrix * 52
  const C = covMatrix.map(row => row.map(v => v*52));

  // Warm start: equal weight, then try to find a good starting point
  let w = Array(n).fill(1/n);

  // If target return given, bias initial weights toward high-return assets
  if (targetRet !== undefined) {
    const sorted = mu52.map((r,i)=>({r,i})).sort((a,b)=>b.r-a.r);
    w = Array(n).fill(0);
    // Concentrate on assets closest to target return
    let allocated = 0;
    for (const {r,i} of sorted) {
      if (allocated >= 0.9) break;
      w[i] = Math.min(0.5, 0.9 - allocated);
      allocated += w[i];
    }
    w = projectSimplex(w);
  }

  let bestW = [...w];
  let bestVol = portfolioStats(w, meanRets, covMatrix, 0).vol;

  for (let iter = 0; iter < nIter; iter++) {
    // Gradient of variance = 2 * C * w
    const grad = Array(n).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) grad[i] += 2*C[i][j]*w[j];

    // If we have a target return, add penalty gradient to enforce it
    if (targetRet !== undefined) {
      const curRet = mu52.reduce((s,r,i)=>s+r*w[i], 0);
      const penalty = 80 * (curRet - targetRet); // large penalty coefficient
      for (let i=0;i<n;i++) grad[i] -= penalty * mu52[i];
    }

    // Adaptive learning rate
    const stepSize = lr / (1 + iter * 0.005);
    const wNew = w.map((v,i) => v - stepSize * grad[i]);
    w = projectSimplex(wNew);

    const stats = portfolioStats(w, meanRets, covMatrix, 0);
    const retOk = targetRet === undefined || Math.abs(stats.ret - targetRet) < 0.04;
    if (retOk && stats.vol < bestVol) {
      bestVol = stats.vol;
      bestW = [...w];
    }
  }
  return bestW;
}

// Max Sharpe via gradient ascent on Sharpe ratio
function optimizeMaxSharpe(meanRets, covMatrix, rf, iters=6000) {
  const n = meanRets.length;

  // Phase 1: Monte Carlo to find good region
  let bestW = Array(n).fill(1/n);
  let bestS = portfolioStats(bestW, meanRets, covMatrix, rf).sharpe;
  for (let i=0; i<iters; i++) {
    const raw = Array.from({length:n}, () => -Math.log(Math.random()+1e-10));
    const s = raw.reduce((a,b)=>a+b,0);
    const w = raw.map(v=>v/s);
    const sh = portfolioStats(w, meanRets, covMatrix, rf).sharpe;
    if (sh > bestS) { bestS=sh; bestW=[...w]; }
  }

  // Phase 2: Projected gradient ascent on Sharpe from best Monte Carlo point
  const mu52 = meanRets.map(r=>r*52);
  const C = covMatrix.map(row=>row.map(v=>v*52));
  let w = [...bestW];

  for (let iter=0; iter<1500; iter++) {
    const ret = mu52.reduce((s,r,i)=>s+r*w[i],0);
    const variance = w.reduce((s,wi,i)=>s+wi*C[i].reduce((ss,cij,j)=>ss+cij*w[j],0),0);
    const vol = Math.sqrt(Math.max(variance, 1e-10));
    const excess = ret - rf;

    // Gradient of Sharpe = (mu*vol - excess * Cw/vol) / vol^2
    const Cw = Array(n).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) Cw[i]+=C[i][j]*w[j];

    const grad = mu52.map((m,i) => (m*vol - excess*Cw[i]/vol) / (vol*vol));
    const lr = 0.03 / (1 + iter*0.003);
    const wNew = w.map((v,i) => v + lr*grad[i]);
    w = projectSimplex(wNew);

    const sh = portfolioStats(w, meanRets, covMatrix, rf).sharpe;
    if (sh > bestS) { bestS=sh; bestW=[...w]; }
  }
  return bestW;
}

// Min variance portfolio (with optional return target)
function optimizeMinVar(meanRets, covMatrix, rf, targetRet) {
  return pgdMinVar(meanRets, covMatrix, targetRet, 600, 0.4);
}


// ── Optimisation principale ──────────────────────────────────────────────────
// Toolbar: only zoom/pan/reset
const TOOLBAR = {
  responsive:true, displayModeBar:true, displaylogo:false,
  modeBarButtonsToRemove:['select2d','lasso2d','hoverClosestCartesian','hoverCompareCartesian','toggleSpikelines','sendDataToCloud','toImage'],
};

function plotLayout() {
  return {
    paper_bgcolor:'transparent', plot_bgcolor:'#faf8f4',
    font:{color:'#3d3830', family:'DM Sans, sans-serif', size:11},
    xaxis:{
      title:{text:'Volatilité annualisée (%)', font:{size:11,color:'#8a8278'}, standoff:12},
      gridcolor:'#e4dfd5', gridwidth:1, zeroline:false,
      tickfont:{size:10,color:'#8a8278'}, linecolor:'#d4cfc5', linewidth:1, mirror:true,
    },
    yaxis:{
      title:{text:'Rendement annualisé (%)', font:{size:11,color:'#8a8278'}, standoff:12},
      gridcolor:'#e4dfd5', gridwidth:1, zeroline:false,
      tickfont:{size:10,color:'#8a8278'}, linecolor:'#d4cfc5', linewidth:1, mirror:true,
    },
    showlegend:false,
    hoverlabel:{bgcolor:'#faf8f4', bordercolor:'#1e3a5f', font:{size:11,color:'#1a1714',family:'DM Sans, sans-serif'}},
    margin:{l:60, r:20, t:20, b:60},
    dragmode:'zoom',
  };
}

async function runOptimization() {
  const tickers = [...appState.selected];
  if (tickers.length < 2) { alert('Sélectionnez au moins 2 actifs.'); return; }
  document.getElementById('loadingOverlay').classList.add('active');
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('btnRun').disabled = true;
  try {
    setLoading('Récupération des données de marché…');
    const rawPrices = await fetchPrices(tickers, appState.period);
    const available = tickers.filter(t => rawPrices[t] && rawPrices[t].length > 10);
    if (available.length < 2) { alert('Données insuffisantes.'); return; }

    const allNames = available.map(t => {
      for (const [cat,assets] of Object.entries(ASSETS))
        for (const [name,ticker] of Object.entries(assets))
          if (ticker===t) return name;
      return t;
    });

    const minLen = Math.min(...available.map(t=>rawPrices[t].length));
    const priceArrays = available.map(t=>rawPrices[t].slice(-minLen).map(d=>d.p));
    const retsArrays = priceArrays.map(arr=>returns(arr));
    const minRetLen = Math.min(...retsArrays.map(r=>r.length));
    const retsAligned = retsArrays.map(r=>r.slice(-minRetLen));

    setLoading('Calcul de la frontière efficiente…'); await sleep(30);

    const meanRets = retsAligned.map(r=>mean(r));
    const annMeanRets = meanRets.map(r=>r*52);
    const covMatrix = buildCovMatrix(retsAligned, available.length);
    const annStds = retsAligned.map(r=>std(r)*Math.sqrt(52));
    const n = available.length;

    const simRets=[],simVols=[],simSharpes=[],simWeightsAll=[];
    for(let i=0;i<appState.nSim;i++){
      const raw=Array.from({length:n},()=>-Math.log(Math.random()+1e-10));
      const s=raw.reduce((a,b)=>a+b,0); const w=raw.map(v=>v/s);
      const stats=portfolioStats(w,meanRets,covMatrix,appState.rf);
      simRets.push(stats.ret); simVols.push(stats.vol); simSharpes.push(stats.sharpe); simWeightsAll.push(w);
    }

    setLoading('Optimisation du portefeuille tangent…'); await sleep(30);
    const tangentW = optimizeMaxSharpe(meanRets, covMatrix, appState.rf, 4000);
    const tangentStats = portfolioStats(tangentW, meanRets, covMatrix, appState.rf);
    const minVarW = optimizeMinVar(meanRets, covMatrix, appState.rf);
    const minVarStats = portfolioStats(minVarW, meanRets, covMatrix, appState.rf);

    setLoading('Construction de la frontière efficiente…'); await sleep(30);

    // ── FRONTIÈRE EFFICIENTE ──────────────────────────────────────────────────
    // 1. Pool dense : simulations MC normales + simulations Dirichlet concentrées
    //    (poids biaisés vers les coins du simplexe → couvre la frontière)
    // 2. Binning en rendement (500 tranches) → min vol par tranche
    //    → sélectionne les points les plus à gauche dans chaque tranche
    // 3. Lissage LOESS (fenêtre glissante) → supprime les escaliers

    // ── CONSTRUCTION ITÉRATIVE DE LA FRONTIÈRE (5 boucles) ──────────────────
    // Principe : chaque itération raffine la frontière précédente
    // en perturbant les points gagnants → convergence vers la vraie frontière

    // Pool initial : simulations MC + actifs individuels + minVar + tangent
    // ── Paramètres adaptatifs selon le nombre d'actifs ─────────────────────────
    const isSmall  = n <= 6;
    const isMedium = n > 6 && n <= 15;
    const isLarge  = n > 15;

    const N_ITER       = isSmall ? 4   : isMedium ? 5   : 8;
    const N_PERTURB    = isSmall ? 60  : isMedium ? 80  : 150;
    const N_EDGE_PTS   = isSmall ? 20  : isMedium ? 30  : 40;
    const N_DIRICHLET  = isSmall ? 0   : isMedium ? 300 : 1000;
    const N_COARSE     = isSmall ? 60  : isMedium ? 80  : 120;
    const epsilons     = isSmall
      ? [0.20, 0.12, 0.06, 0.02]
      : isMedium
        ? [0.20, 0.14, 0.09, 0.05, 0.02]
        : [0.30, 0.22, 0.16, 0.11, 0.07, 0.04, 0.02, 0.01];

    setLoading(`Initialisation pool (${n} actifs, mode ${isSmall?'rapide':isMedium?'standard':'haute résolution'})…`); await sleep(10);

    // Pool initial : minVar + tangent + actifs individuels
    let pool = [
      { v: minVarStats.vol, r: minVarStats.ret, w: minVarW },
      { v: tangentStats.vol, r: tangentStats.ret, w: tangentW },
    ];
    for (let i = 0; i < n; i++) {
      const w0 = new Array(n).fill(0); w0[i] = 1;
      const s0 = portfolioStats(w0, meanRets, covMatrix, appState.rf);
      pool.push({ v: s0.vol, r: s0.ret, w: w0 });
    }

    // Arêtes du simplexe : interpolations paires d'actifs
    for (let i = 0; i < n; i++) {
      for (let j = i+1; j < n; j++) {
        for (let k = 1; k < N_EDGE_PTS; k++) {
          const a = k / N_EDGE_PTS;
          const w = new Array(n).fill(0); w[i] = 1-a; w[j] = a;
          const st = portfolioStats(w, meanRets, covMatrix, appState.rf);
          pool.push({ v: st.vol, r: st.ret, w: [...w] });
        }
      }
    }

    // Grand n : Dirichlet uniforme concentré sur TOUS les actifs
    // (pas de sélection directionnelle qui crée des clusters isolés)
    if (N_DIRICHLET > 0) {
      for (let s = 0; s < N_DIRICHLET; s++) {
        // Dirichlet avec exposant modéré (2-3) → concentré mais pas trop
        const raw = Array.from({length: n}, () => Math.pow(-Math.log(Math.random()+1e-10), 3));
        const sum = raw.reduce((a,b)=>a+b,0);
        if (sum < 1e-10) continue;
        const w = raw.map(v=>v/sum);
        const st = portfolioStats(w, meanRets, covMatrix, appState.rf);
        pool.push({ v: st.vol, r: st.ret, w });
      }
    }

    // Fonction utilitaire : binning max-ret
    function extractFrontierSeeds(pts, nBins) {
      const vMin = Math.min(...pts.map(p=>p.v));
      const vMax = Math.max(...pts.map(p=>p.v));
      const bSz = (vMax - vMin) / nBins;
      const b = new Array(nBins).fill(null);
      for (const p of pts) {
        const idx = Math.min(nBins-1, Math.floor((p.v - vMin) / bSz));
        if (!b[idx] || p.r > b[idx].r) b[idx] = p;
      }
      return b.filter(x => x !== null);
    }

    // Itérations de raffinage adaptatif
    for (let iter = 0; iter < N_ITER; iter++) {
      setLoading(`Raffinage frontière — itération ${iter+1}/${N_ITER}…`); await sleep(10);
      const seeds = extractFrontierSeeds(pool, N_COARSE);
      const eps = epsilons[iter];
      const newPts = [];
      for (const seed of seeds) {
        for (let s = 0; s < N_PERTURB; s++) {
          const noise = seed.w.map(() => (Math.random() - 0.5) * 2 * eps);
          const wP = seed.w.map((v, i) => Math.max(0, v + noise[i]));
          const wSum = wP.reduce((a,b) => a+b, 0);
          if (wSum < 1e-10) continue;
          const wn = wP.map(v => v/wSum);
          const st = portfolioStats(wn, meanRets, covMatrix, appState.rf);
          newPts.push({ v: st.vol, r: st.ret, w: wn });
        }
      }
      pool = pool.concat(newPts);
    }

    setLoading('Tracé de la frontière efficiente…'); await sleep(10);

    // ── Binning final fin → max rendement par tranche de vol ─────────────────
    const N_BINS = 500;
    const vAllMin = Math.min(...pool.map(p => p.v));
    const vAllMax = Math.max(...pool.map(p => p.v));
    const binSz = (vAllMax - vAllMin) / N_BINS;
    const bins = new Array(N_BINS).fill(null);
    for (const p of pool) {
      const b = Math.min(N_BINS-1, Math.floor((p.v - vAllMin) / binSz));
      if (!bins[b] || p.r > bins[b].r) bins[b] = p;
    }
    let efCands = bins.filter(b => b !== null);
    efCands.sort((a,b) => a.v - b.v);

    // ── Détection du gap sur le binning BRUT (avant tout filtre) ───────────────
    // Gap = saut de vol > 4× la médiane des espacements → rupture réelle des données
    const retMinVar = minVarStats.ret;
    if (efCands.length > 2) {
      const gaps = [];
      for (let i = 1; i < efCands.length; i++) gaps.push(efCands[i].v - efCands[i-1].v);
      gaps.sort((a,b) => a-b);
      const medianGap = gaps[Math.floor(gaps.length / 2)];
      const GAP_THRESHOLD = medianGap * 4;
      for (let i = 1; i < efCands.length; i++) {
        if (efCands[i].v - efCands[i-1].v > GAP_THRESHOLD) {
          efCands = efCands.slice(0, i); // couper au premier gap
          break;
        }
      }
    }

    // ── Filtrage efficiente : ret >= retMinVar (après coupure gap) ───────────
    efCands = efCands.filter(p => p.r >= retMinVar - 0.001);
    efCands.sort((a,b) => a.v - b.v);

    // ── Filtre outliers : supprimer les pics isolés ──────────────────────────
    // Un point est un outlier si son rendement s'écarte > 2× l'écart-type local
    // de ses voisins (fenêtre de 5 points de chaque côté)
    if (efCands.length > 10) {
      const OW = 5; // fenêtre outlier
      efCands = efCands.filter((p, i) => {
        const lo = Math.max(0, i - OW), hi = Math.min(efCands.length-1, i + OW);
        const neighbors = [];
        for (let j = lo; j <= hi; j++) if (j !== i) neighbors.push(efCands[j].r);
        const mean = neighbors.reduce((a,b)=>a+b,0) / neighbors.length;
        const std  = Math.sqrt(neighbors.reduce((a,b)=>a+(b-mean)**2,0) / neighbors.length);
        return Math.abs(p.r - mean) <= 2.5 * std + 0.005; // tolérance absolue 0.5%
      });
    }

    // Garantir minVar exact en premier
    if (efCands.length > 0) {
      const mvIdx2 = efCands.reduce((best,p,i) => p.v < efCands[best].v ? i : best, 0);
      efCands[mvIdx2] = { v: minVarStats.vol, r: minVarStats.ret, w: minVarW };
    }

    // Tangent exact : remplacer point le plus proche en vol
    const tVol = tangentStats.vol;
    let tIdx = 0;
    for (let i = 1; i < efCands.length; i++) {
      if (Math.abs(efCands[i].v - tVol) < Math.abs(efCands[tIdx].v - tVol)) tIdx = i;
    }
    if (efCands.length > 0) efCands[tIdx] = { v: tVol, r: tangentStats.ret, w: tangentW };

    // ── Points ultra-proches du minVar (3 niveaux de granularité) ──────────────
    const mvZonePts = [];
    // Niveau 1 : perturbation infime (0.1–0.5%) → alimente les bins 0–0.5%
    for (let s = 0; s < 2000; s++) {
      const eps = 0.001 + Math.random() * 0.004;
      const noise = minVarW.map(() => (Math.random() - 0.5) * 2 * eps);
      const wP = minVarW.map((v, i) => Math.max(0, v + noise[i]));
      const wSum = wP.reduce((a, b) => a + b, 0);
      if (wSum < 1e-10) continue;
      const wn = wP.map(v => v / wSum);
      const st = portfolioStats(wn, meanRets, covMatrix, appState.rf);
      if (st.r >= retMinVar - 0.001) mvZonePts.push({ v: st.vol, r: st.ret, w: wn });
    }
    // Niveau 2 : perturbation petite (0.5–1.5%) → alimente bins 0.5–1%
    for (let s = 0; s < 1000; s++) {
      const eps = 0.005 + Math.random() * 0.01;
      const noise = minVarW.map(() => (Math.random() - 0.5) * 2 * eps);
      const wP = minVarW.map((v, i) => Math.max(0, v + noise[i]));
      const wSum = wP.reduce((a, b) => a + b, 0);
      if (wSum < 1e-10) continue;
      const wn = wP.map(v => v / wSum);
      const st = portfolioStats(wn, meanRets, covMatrix, appState.rf);
      if (st.r >= retMinVar - 0.001) mvZonePts.push({ v: st.vol, r: st.ret, w: wn });
    }
    // Niveau 3 : perturbation moyenne (1.5–3%) → alimente bins 1–10%
    for (let s = 0; s < 500; s++) {
      const eps = 0.015 + Math.random() * 0.015;
      const noise = minVarW.map(() => (Math.random() - 0.5) * 2 * eps);
      const wP = minVarW.map((v, i) => Math.max(0, v + noise[i]));
      const wSum = wP.reduce((a, b) => a + b, 0);
      if (wSum < 1e-10) continue;
      const wn = wP.map(v => v / wSum);
      const st = portfolioStats(wn, meanRets, covMatrix, appState.rf);
      if (st.r >= retMinVar - 0.001) mvZonePts.push({ v: st.vol, r: st.ret, w: wn });
    }
    efCands = [...efCands, ...mvZonePts, { v: minVarStats.vol, r: minVarStats.ret, w: minVarW }];
    efCands.sort((a, b) => a.v - b.v);

    // ── Re-binning avec bins extra-denses près du minVar ─────────────────────
    // 4 zones : 1000 bins sur 0.5%, 600 sur 0.5% suivants, 900 sur 9% suivants, 1500 sur 90% restants
    const vMin2 = Math.min(...efCands.map(p => p.v));
    const vMax2 = Math.max(...efCands.map(p => p.v));
    const vRange = vMax2 - vMin2;
    const vP05  = vMin2 + vRange * 0.005;
    const vP1   = vMin2 + vRange * 0.01;
    const vP10  = vMin2 + vRange * 0.10;
    const N_Z1 = 1000, N_Z2 = 600, N_Z3 = 900, N_Z4 = 1500;
    const bSz1 = (vP05 - vMin2) / Math.max(1, N_Z1);
    const bSz2 = (vP1  - vP05)  / Math.max(1, N_Z2);
    const bSz3 = (vP10 - vP1)   / Math.max(1, N_Z3);
    const bSz4 = (vMax2 - vP10) / Math.max(1, N_Z4);
    const bins1 = new Array(N_Z1).fill(null);
    const bins2 = new Array(N_Z2).fill(null);
    const bins3 = new Array(N_Z3).fill(null);
    const bins4 = new Array(N_Z4).fill(null);
    for (const p of efCands) {
      if (p.v <= vP05) {
        const b = Math.min(N_Z1-1, Math.floor((p.v - vMin2) / bSz1));
        if (!bins1[b] || p.r > bins1[b].r) bins1[b] = p;
      } else if (p.v <= vP1) {
        const b = Math.min(N_Z2-1, Math.floor((p.v - vP05) / bSz2));
        if (!bins2[b] || p.r > bins2[b].r) bins2[b] = p;
      } else if (p.v <= vP10) {
        const b = Math.min(N_Z3-1, Math.floor((p.v - vP1) / bSz3));
        if (!bins3[b] || p.r > bins3[b].r) bins3[b] = p;
      } else {
        const b = Math.min(N_Z4-1, Math.floor((p.v - vP10) / bSz4));
        if (!bins4[b] || p.r > bins4[b].r) bins4[b] = p;
      }
    }
    let efDense = [...bins1, ...bins2, ...bins3, ...bins4].filter(b => b !== null);
    efDense.sort((a, b) => a.v - b.v);

    // ── Upper convex hull local par fenêtres glissantes ────────────────────────
    // Sur toute la frontière : ne garder que les points qui forment
    // l'enveloppe supérieure réelle (algorithme de Graham scan simplifié)
    // Tolérance adaptative : plus stricte au centre, plus souple aux extrémités
    function upperEnvelope(pts) {
      if (pts.length <= 2) return pts;
      const hull = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        hull.push(pts[i]);
        // Éliminer les points qui créent une concavité vers le bas
        while (hull.length >= 3) {
          const n = hull.length;
          const a = hull[n-3], b = hull[n-2], c = hull[n-1];
          // Vérifier si b est au-dessus de la ligne a→c
          const t = (b.v - a.v) / Math.max(1e-10, c.v - a.v);
          const rLine = a.r + t * (c.r - a.r);
          if (b.r >= rLine) break; // b est sur ou au-dessus → garder
          hull.splice(n-2, 1); // b est sous la ligne → supprimer
        }
      }
      return hull;
    }

    // Frontière provisoire pour interpolation des poids
    const efProvisional = upperEnvelope(efDense);
    const efVolsSorted    = efProvisional.map(p => p.v);
    const efRetsSorted    = efProvisional.map(p => p.r);
    const efWeightsSorted = efProvisional.map(p => p.w);
    // Sous-échantillonner le pool adaptatif pour l'affichage du nuage de points
    // Ratio : pool_size / 7.5 (moitié de l'ancien coeff 15)
    const DISPLAY_RATIO = 15;
    const nDisplay = Math.min(appState.nSim * 2, Math.floor(pool.length / DISPLAY_RATIO));

    // Partie supérieure : points adaptatifs filtrés
    // Pour grand n, filtrer aussi les points trop éloignés de la frontière (outliers visuels)
    let poolTop = pool.filter(p => p.r >= retMinVar - 0.001);
    if (isLarge && efCands.length > 5) {
      // Construire une enveloppe max-ret par bin pour filtrer les points trop bas
      const ENV_BINS = 100;
      const envVMin = Math.min(...poolTop.map(p=>p.v));
      const envVMax = Math.max(...poolTop.map(p=>p.v));
      const envBSz = (envVMax - envVMin) / ENV_BINS;
      const envMax = new Array(ENV_BINS).fill(-Infinity);
      for (const p of poolTop) {
        const b = Math.min(ENV_BINS-1, Math.floor((p.v - envVMin) / envBSz));
        if (p.r > envMax[b]) envMax[b] = p.r;
      }
      // Garder seulement les points dans les 60% supérieurs de chaque bin
      poolTop = poolTop.filter(p => {
        const b = Math.min(ENV_BINS-1, Math.floor((p.v - envVMin) / envBSz));
        return p.r >= envMax[b] * 0.55 + retMinVar * 0.45;
      });
    }
    const N_MV_BOOST = Math.min(800, Math.floor(appState.nSim * 0.15));
    const mvBoostPts = [];
    for (let s = 0; s < N_MV_BOOST; s++) {
      const eps = 0.04 + Math.random() * 0.08;
      const noise = minVarW.map(() => (Math.random() - 0.5) * 2 * eps);
      const wP = minVarW.map((v, i) => Math.max(0, v + noise[i]));
      const wSum = wP.reduce((a, b) => a + b, 0);
      if (wSum < 1e-10) continue;
      const wn = wP.map(v => v / wSum);
      const st = portfolioStats(wn, meanRets, covMatrix, appState.rf);
      mvBoostPts.push({ v: st.vol, r: st.ret, w: wn });
    }
    const poolTopDisplay = [...poolTop, ...mvBoostPts.filter(p => p.r >= retMinVar - 0.001)];
    const poolShuffledTop = [...poolTopDisplay].sort(() => Math.random() - 0.5);
    const displayTop = poolShuffledTop.slice(0, nDisplay + Math.floor(N_MV_BOOST * 0.6));

    // Partie inférieure (ret < retMinVar) : puiser dans le pool adaptatif (couvre toute la vol)
    // + simulations MC de base pour les zones non couvertes par le pool
    const poolBottomAdaptive = pool.filter(p => p.r < retMinVar - 0.001);
    const poolBottomMC = simVols.map((v,i) => ({ v, r: simRets[i], w: simWeightsAll[i] }))
      .filter(p => p.r < retMinVar - 0.001);
    const poolBottom = [...poolBottomAdaptive, ...poolBottomMC];
    const nBottom = Math.floor(nDisplay * 0.30); // 30% de points pour le bas
    // Sous-échantillonnage uniforme en vol pour bien couvrir toute la largeur
    poolBottom.sort((a,b) => a.v - b.v);
    const displayBottom = [];
    const bottomStep = Math.max(1, Math.floor(poolBottom.length / nBottom));
    for (let i = 0; i < poolBottom.length && displayBottom.length < nBottom; i += bottomStep) {
      displayBottom.push(poolBottom[i]);
    }

    const displayPts = [...displayTop, ...displayBottom];

    // Ajouter les simulations MC filtrées PAR DESSUS (ret >= retMinVar seulement)
    const mcFiltered = simVols
      .map((v,i) => ({ v, r: simRets[i] }))
      .filter(p => p.r >= retMinVar - 0.001);
    const allDisplayPts = [...displayPts, ...mcFiltered];

    // ── Frontière finale : upper envelope sur TOUS les points affichés ─────────
    // Garantit qu'aucun point affiché ne se retrouve au-dessus de la courbe
    const allTopPts = allDisplayPts.filter(p => p.r >= retMinVar - 0.001);
    allTopPts.sort((a, b) => a.v - b.v);
    // Binning sur tous les points affichés pour extraire les max par tranche fine
    const N_FINAL_BINS = 3000;
    const vFMin = Math.min(...allTopPts.map(p => p.v));
    const vFMax = Math.max(...allTopPts.map(p => p.v));
    const bFSz = (vFMax - vFMin) / N_FINAL_BINS;
    const finalBins = new Array(N_FINAL_BINS).fill(null);
    for (const p of allTopPts) {
      const b = Math.min(N_FINAL_BINS-1, Math.floor((p.v - vFMin) / Math.max(bFSz, 1e-10)));
      if (!finalBins[b] || p.r > finalBins[b].r) finalBins[b] = p;
    }
    // Ajouter minVar exact
    finalBins[0] = { v: minVarStats.vol, r: minVarStats.ret, w: minVarW };
    const finalCands = finalBins.filter(b => b !== null);
    finalCands.sort((a, b) => a.v - b.v);
    const efFinal = upperEnvelope(finalCands);

    const dispRets = allDisplayPts.map(p => p.r);
    const dispVols = allDisplayPts.map(p => p.v);
    // Sharpe pour coloration
    const dispSharpes = allDisplayPts.map(p => (p.r - appState.rf) / (p.v + 1e-9));

    // Compute corrMatrix here so it's available everywhere
    const corrMatrix = Array.from({length:n}, function(_,i) {
      return Array.from({length:n}, function(_,j) {
        const si = annStds[i] / Math.sqrt(52);
        const sj = annStds[j] / Math.sqrt(52);
        return Math.max(-1, Math.min(1, covMatrix[i][j] / (si * sj + 1e-12)));
      });
    });

    appState.results = {available,allNames,n,meanRets,annMeanRets,covMatrix,annStds,retsAligned,
      simRets: dispRets, simVols: dispVols, simSharpes: dispSharpes,
      tangentW,tangentStats,minVarW,minVarStats,
      efVols:efFinal.map(p=>p.v),efRets:efFinal.map(p=>p.r),efWeights:efFinal.map(p=>p.w),
      corrMatrix:corrMatrix};
    appState.cmlExposure = 1.0;
    renderAll();
  } catch(e) { console.error(e); alert('Erreur : '+e.message); }
  finally { document.getElementById('loadingOverlay').classList.remove('active'); document.getElementById('btnRun').disabled=false; }
}

function setLoading(txt) { document.getElementById('loadingText').textContent = txt; }
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

function renderAll() {
  const r = appState.results;
  document.getElementById('kpiBar').style.display = 'grid';
  document.getElementById('kpiRet').textContent = (r.tangentStats.ret*100).toFixed(2)+' %';
  document.getElementById('kpiVol').textContent = (r.tangentStats.vol*100).toFixed(2)+' %';
  document.getElementById('kpiSharpe').textContent = r.tangentStats.sharpe.toFixed(2);
  document.getElementById('kpiAssets').textContent = r.n;
  renderFrontier(); renderCML(); renderRiskLevels(); renderPerf();
}


// ── CML édition ───────────────────────────────────────────────────────────
// ── CML editable inputs ─────────────────────────────────────────────────────
function startCMLEdit(field) { /* no-op: replaced by stepper buttons */ }

let _applyingCML = false;
let _cmlStepTimer = null;
let _cmlCurrentVal = { ret: null, vol: null };

function startCMLStep(field, delta) {
  const r = appState.results;
  if (!r) return;
  // Read current value from input
  const span = document.getElementById(field === 'ret' ? 'mixRetInp' : 'mixVolInp');
  let cur = parseFloat(span.value);
  if (isNaN(cur)) cur = field === 'ret'
    ? r.tangentStats.ret * 100
    : r.tangentStats.vol * 100;
  _cmlCurrentVal[field] = cur;

  // Immediate first step
  _cmlCurrentVal[field] += delta;
  applyCMLEditDirect(field, _cmlCurrentVal[field]);

  // Then repeat with acceleration
  let delay = 300, count = 0;
  function repeat() {
    _cmlCurrentVal[field] += delta;
    applyCMLEditDirect(field, _cmlCurrentVal[field]);
    count++;
    // Accelerate after 5 steps: 300ms → 80ms → 30ms
    delay = count < 5 ? 180 : count < 15 ? 80 : 30;
    _cmlStepTimer = setTimeout(repeat, delay);
  }
  _cmlStepTimer = setTimeout(repeat, delay);
}

function stopCMLStep() {
  clearTimeout(_cmlStepTimer);
  _cmlStepTimer = null;
}

function applyCMLEdit(field) { /* kept for legacy blur/keydown */ }

function applyCMLEditDirect(field, val) {
  if (_applyingCML) return;
  const r = appState.results;
  if (!r) return;

  if (isNaN(val)) return;

  // Clamp to CML range
  const maxVol = r.tangentStats.vol * 2.2;
  let exp;

  if (field === 'vol') {
    const targetVol = Math.max(0, Math.min(val/100, maxVol));
    exp = targetVol / r.tangentStats.vol;
  } else { // ret
    // Solve: mixRet = rf*(1-exp) + tangentRet*exp → exp = (targetRet - rf)/(tangentRet - rf)
    const targetRet = val / 100;
    const denom = r.tangentStats.ret - appState.rf;
    if (Math.abs(denom) < 1e-9) return;
    exp = (targetRet - appState.rf) / denom;
    exp = Math.max(0, Math.min(exp, 2.2));
  }

  appState.cmlExposure = exp;
  clearCMLResults();
  const mixRet = (1-exp)*appState.rf + exp*r.tangentStats.ret;
  const mixVol = Math.abs(exp)*r.tangentStats.vol;

  _applyingCML = true;
  updateCMLControls(exp, mixRet, mixVol);
  _applyingCML = false;


  // Update bar + labels
  updateCMLBarLabels(exp);

  // Move the draggable point on chart
  const borderColor = exp>1?'#7a1f2e':'#1a5c52';
  Plotly.restyle('cmlChart',{x:[[mixVol*100]],y:[[mixRet*100]],'marker.line.color':[borderColor]},[5]);
  renderCMLAlloc();

  // Reset card styles

}

function updateCMLBarLabels(exp) {
  if(exp<=1){
    const rfPct=(1-exp)*100, tPct=exp*100;
    document.getElementById('mixBarRf').style.width=rfPct+'%';
    document.getElementById('mixBarTangent').style.width=tPct+'%';
    document.getElementById('mixBarLev').style.display='none';
    document.getElementById('leverageLabel').style.display='none';
    document.getElementById('mixRfPct').textContent=rfPct.toFixed(0)+' %';
    document.getElementById('mixTangentPct').textContent=tPct.toFixed(0)+' %';
  } else {
    const leveragePct=(exp-1)*100, totalPct=exp*100;
    const tShare=(100/totalPct)*100, lShare=(leveragePct/totalPct)*100;
    document.getElementById('mixBarRf').style.width='0%';
    document.getElementById('mixBarTangent').style.width=tShare.toFixed(1)+'%';
    document.getElementById('mixBarLev').style.width=lShare.toFixed(1)+'%';
    document.getElementById('mixBarLev').style.display='block';
    document.getElementById('leverageLabel').style.display='inline';
    document.getElementById('mixRfPct').textContent='0 %';
    document.getElementById('mixTangentPct').textContent=(exp*100).toFixed(0)+' %';
    document.getElementById('mixLeveragePct').textContent=leveragePct.toFixed(0)+' %';
  }
}


// ── ETF Équivalent ───────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// ETF EQUIVALENT — Bibliothèque + optimisation
// ════════════════════════════════════════════════════════════════════════════

const ETF_LIBRARY = [
  // ── Actions US large cap ──
  { ticker:'SPY',   name:'SPDR S&P 500',                   cat:'Actions US' },
  { ticker:'IVV',   name:'iShares Core S&P 500',           cat:'Actions US' },
  { ticker:'VOO',   name:'Vanguard S&P 500',               cat:'Actions US' },
  { ticker:'QQQ',   name:'Invesco Nasdaq-100',             cat:'Actions US' },
  { ticker:'VTI',   name:'Vanguard Total Stock Market',    cat:'Actions US' },
  { ticker:'DIA',   name:'SPDR Dow Jones Industrial',      cat:'Actions US' },
  { ticker:'RSP',   name:'Invesco S&P 500 Equal Weight',   cat:'Actions US' },
  // ── Actions US growth / value ──
  { ticker:'IWF',   name:'iShares Russell 1000 Growth',    cat:'Growth US' },
  { ticker:'IWD',   name:'iShares Russell 1000 Value',     cat:'Value US' },
  { ticker:'VUG',   name:'Vanguard Growth',                cat:'Growth US' },
  { ticker:'VTV',   name:'Vanguard Value',                 cat:'Value US' },
  { ticker:'MTUM',  name:'iShares MSCI USA Momentum',      cat:'Growth US' },
  // ── Actions US small / mid cap ──
  { ticker:'IJR',   name:'iShares Core S&P Small-Cap',     cat:'Small Cap US' },
  { ticker:'IWM',   name:'iShares Russell 2000',           cat:'Small Cap US' },
  { ticker:'VO',    name:'Vanguard Mid-Cap',               cat:'Mid Cap US' },
  { ticker:'VBK',   name:'Vanguard Small-Cap Growth',      cat:'Small Cap US' },
  // ── Secteurs US ──
  { ticker:'XLK',   name:'Technology Select Sector',       cat:'Tech' },
  { ticker:'XLF',   name:'Financial Select Sector',        cat:'Finance' },
  { ticker:'XLV',   name:'Health Care Select Sector',      cat:'Santé' },
  { ticker:'XLE',   name:'Energy Select Sector',           cat:'Énergie' },
  { ticker:'XLY',   name:'Conso. Discret. Select',         cat:'Conso. disc.' },
  { ticker:'XLP',   name:'Consumer Staples Select',        cat:'Conso. base' },
  { ticker:'XLI',   name:'Industrials Select Sector',      cat:'Industrie' },
  { ticker:'XLB',   name:'Materials Select Sector',        cat:'Matériaux' },
  { ticker:'XLU',   name:'Utilities Select Sector',        cat:'Services pub.' },
  { ticker:'XLRE',  name:'Real Estate Select Sector',      cat:'Immo. US' },
  { ticker:'XLC',   name:'Comm. Services Select Sector',   cat:'Comm.' },
  // ── Tech thématique ──
  { ticker:'SMH',   name:'VanEck Semiconductor',           cat:'Semi-conducteurs' },
  { ticker:'SOXX',  name:'iShares Semiconductor',          cat:'Semi-conducteurs' },
  { ticker:'ARKK',  name:'ARK Innovation',                 cat:'Innovation' },
  { ticker:'CIBR',  name:'First Trust Cybersecurity',      cat:'Cybersécurité' },
  { ticker:'ROBO',  name:'Robo Global Robotics & AI',      cat:'IA & Robotique' },
  // ── Actions monde ──
  { ticker:'ACWI',  name:'iShares MSCI ACWI',              cat:'Actions monde' },
  { ticker:'VT',    name:'Vanguard Total World',           cat:'Actions monde' },
  { ticker:'URTH',  name:'iShares MSCI World',             cat:'Actions monde' },
  // ── Actions Europe ──
  { ticker:'VGK',   name:'Vanguard FTSE Europe',           cat:'Actions Europe' },
  { ticker:'EZU',   name:'iShares MSCI Eurozone',          cat:'Actions Europe' },
  { ticker:'FEZ',   name:'SPDR Euro Stoxx 50',             cat:'Actions Europe' },
  { ticker:'EWG',   name:'iShares MSCI Germany',           cat:'Actions Europe' },
  { ticker:'EWQ',   name:'iShares MSCI France',            cat:'Actions Europe' },
  { ticker:'EWU',   name:'iShares MSCI United Kingdom',    cat:'Actions Europe' },
  { ticker:'EWI',   name:'iShares MSCI Italy',             cat:'Actions Europe' },
  // ── Actions Asie / Pacifique ──
  { ticker:'EWJ',   name:'iShares MSCI Japan',             cat:'Actions Asie' },
  { ticker:'EWY',   name:'iShares MSCI South Korea',       cat:'Actions Asie' },
  { ticker:'EWT',   name:'iShares MSCI Taiwan',            cat:'Actions Asie' },
  { ticker:'AAXJ',  name:'iShares MSCI Asia ex Japan',     cat:'Actions Asie' },
  { ticker:'EWH',   name:'iShares MSCI Hong Kong',         cat:'Actions Asie' },
  // ── Actions émergents ──
  { ticker:'EEM',   name:'iShares MSCI Emerging Markets',  cat:'Émergents' },
  { ticker:'VWO',   name:'Vanguard FTSE Emerging Markets', cat:'Émergents' },
  { ticker:'IEMG',  name:'iShares Core MSCI Emerging',     cat:'Émergents' },
  { ticker:'EWZ',   name:'iShares MSCI Brazil',            cat:'Émergents' },
  { ticker:'MCHI',  name:'iShares MSCI China',             cat:'Émergents' },
  { ticker:'INDA',  name:'iShares MSCI India',             cat:'Émergents' },
  // ── Obligations US ──
  { ticker:'AGG',   name:'iShares Core US Aggregate Bond', cat:'Oblig. US' },
  { ticker:'BND',   name:'Vanguard Total Bond Market',     cat:'Oblig. US' },
  { ticker:'TLT',   name:'iShares 20+ Year Treasury',      cat:'Oblig. LT' },
  { ticker:'IEF',   name:'iShares 7-10 Year Treasury',     cat:'Oblig. MT' },
  { ticker:'SHY',   name:'iShares 1-3 Year Treasury',      cat:'Oblig. CT' },
  { ticker:'VGIT',  name:'Vanguard Intermediate Treasury', cat:'Oblig. MT' },
  { ticker:'VGLT',  name:'Vanguard Long-Term Treasury',    cat:'Oblig. LT' },
  { ticker:'LQD',   name:'iShares iBoxx $ IG Corp Bond',   cat:'Oblig. corp.' },
  { ticker:'HYG',   name:'iShares iBoxx $ HY Corp Bond',   cat:'Oblig. HY' },
  { ticker:'JNK',   name:'SPDR Bloomberg High Yield Bond', cat:'Oblig. HY' },
  { ticker:'MBB',   name:'iShares MBS ETF',                cat:'Oblig. hypothèc.' },
  { ticker:'TIP',   name:'iShares TIPS Bond',              cat:'Oblig. inflation' },
  { ticker:'VTIP',  name:'Vanguard Short-Term Inflation',  cat:'Oblig. inflation' },
  // ── Obligations monde ──
  { ticker:'BNDX',  name:'Vanguard Total Intl Bond',       cat:'Oblig. monde' },
  { ticker:'EMB',   name:'iShares JP Morgan EM Bond',      cat:'Oblig. émergents' },
  { ticker:'PCY',   name:'Invesco EM Sovereign Debt',      cat:'Oblig. émergents' },
  // ── Or & Matières premières ──
  { ticker:'GLD',   name:'SPDR Gold Shares',               cat:'Or' },
  { ticker:'IAU',   name:'iShares Gold Trust',             cat:'Or' },
  { ticker:'SGOL',  name:'Aberdeen Physical Gold',         cat:'Or' },
  { ticker:'SLV',   name:'iShares Silver Trust',           cat:'Argent' },
  { ticker:'PDBC',  name:'Invesco Optimum Yield Cmdty',    cat:'Matières premières' },
  { ticker:'GSG',   name:'iShares S&P GSCI Commodity',     cat:'Matières premières' },
  { ticker:'DBC',   name:'Invesco DB Commodity',           cat:'Matières premières' },
  { ticker:'USO',   name:'United States Oil Fund',         cat:'Pétrole' },
  { ticker:'UNG',   name:'United States Natural Gas Fund', cat:'Gaz naturel' },
  // ── Immobilier ──
  { ticker:'VNQ',   name:'Vanguard Real Estate',           cat:'Immo. US' },
  { ticker:'USRT',  name:'iShares Core US REIT',           cat:'Immo. US' },
  { ticker:'IYR',   name:'iShares US Real Estate',         cat:'Immo. US' },
  { ticker:'REM',   name:'iShares Mortgage Real Estate',   cat:'Immo. hypothèc.' },
  { ticker:'VNQI',  name:'Vanguard Global ex-US Real Est.',cat:'Immo. monde' },
  // ── Dividendes ──
  { ticker:'VYM',   name:'Vanguard High Dividend Yield',   cat:'Dividendes' },
  { ticker:'DVY',   name:'iShares Select Dividend',        cat:'Dividendes' },
  { ticker:'SCHD',  name:'Schwab US Dividend Equity',      cat:'Dividendes' },
  { ticker:'HDV',   name:'iShares Core High Dividend',     cat:'Dividendes' },
  // ── Multi-actifs / Allocation ──
  { ticker:'AOR',   name:'iShares Core Growth Alloc.',     cat:'Multi-actifs' },
  { ticker:'AOM',   name:'iShares Core Moderate Alloc.',   cat:'Multi-actifs' },
  { ticker:'AOA',   name:'iShares Core Aggressive Alloc.', cat:'Multi-actifs' },
  { ticker:'AOK',   name:'iShares Core Conservative Alloc.',cat:'Multi-actifs' },
  // ── Alternatifs / Volatilité ──
  { ticker:'BTAL',  name:'AGF US Market Neutral Anti-Beta',cat:'Alternatif' },
  { ticker:'TAIL',  name:'Cambria Tail Risk',              cat:'Alternatif' },
  { ticker:'USMV',  name:'iShares MSCI USA Min Volatility',cat:'Faible vol.' },
  { ticker:'SPLV',  name:'Invesco S&P 500 Low Volatility', cat:'Faible vol.' },
  { ticker:'EFAV',  name:'iShares MSCI EAFE Min Vol',      cat:'Faible vol.' },
  // ── Crypto / Thématique récent ──
  { ticker:'BITO',  name:'ProShares Bitcoin Strategy',     cat:'Crypto' },
  { ticker:'IBIT',  name:'iShares Bitcoin Trust',          cat:'Crypto' },
  { ticker:'FBTC',  name:'Fidelity Wise Origin Bitcoin',   cat:'Crypto' },
  { ticker:'BLOK',  name:'Amplify Transformational Data',  cat:'Blockchain' },
  { ticker:'ICLN',  name:'iShares Global Clean Energy',    cat:'Énergie propre' },
  { ticker:'QCLN',  name:'First Trust NASDAQ Clean Edge',  cat:'Énergie propre' },
];

// State for ETF computation
const etfState = { targetStats: null, etfData: null };

async function computeETFEquivalent() {
  const r = appState.results;
  if (!r) return;

  // Get current risk profile stats from active tab
  const activeTab = document.querySelector('.risk-tab.active');
  const isCustom = activeTab && activeTab.textContent.trim() === 'Personnalisé';

  // Read target from displayed KPIs
  let targetRet, targetVol, targetSharpe;
  if (isCustom) {
    targetRet    = parseFloat(document.getElementById('inp-ret').value) / 100;
    targetVol    = parseFloat(document.getElementById('inp-vol').value) / 100;
    targetSharpe = parseFloat(document.getElementById('inp-sharpe').value);
  } else {
    // Read from KPI cards in riskContent
    const kpis = document.querySelectorAll('#riskContent .kpi-value');
    targetRet    = parseFloat(kpis[0]?.textContent) / 100 || r.tangentStats.ret;
    targetVol    = parseFloat(kpis[1]?.textContent) / 100 || r.tangentStats.vol;
    targetSharpe = parseFloat(kpis[2]?.textContent)        || r.tangentStats.sharpe;
  }
  etfState.targetStats = { ret: targetRet, vol: targetVol, sharpe: targetSharpe };

  // Show loading
  const resultDiv = document.getElementById('etfEquivResult');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="etf-loading">Récupération des données ETF en cours…</div>';
  document.getElementById('etfEquivBtn').disabled = true;

  try {
    // ── Step 1: Fetch all ETF data in parallel ──
    const period = appState.period || 2;

    const periodStr = period <= 1 ? '1y' : period <= 2 ? '2y' : period <= 5 ? '5y' : '10y';
    const results = await Promise.allSettled(
      ETF_LIBRARY.map(etf => fetchOneTicker(etf.ticker, periodStr)
        .then(prices => ({ ...etf, prices }))
        .catch(() => null)
      )
    );

    const validETFs = results
      .filter(r => r.status === 'fulfilled' && r.value && r.value !== null)
      .map(r => r.value)
      .filter(etf => etf && etf.prices && etf.prices.length >= 30);

    if (validETFs.length < 2) throw new Error('Données insuffisantes pour les ETF');

    resultDiv.innerHTML = '<div class="etf-loading">Optimisation en cours…</div>';

    // ── Step 2: Compute clean weekly returns ──────────────────────────────────
    const MAX_WEEKLY_RET = 0.25; // filter out |r| > 25%/week (data errors, splits)

    const etfReturns = validETFs.map(etf => {
      // Extract prices, skip nulls/zeros
      const rawPrices = etf.prices
        .map(p => typeof p === 'object' ? p.p : p)
        .filter(p => p != null && p > 0);

      // Compute log returns (more stable than arithmetic for annualisation)
      const rets = [];
      for (let i = 1; i < rawPrices.length; i++) {
        const r = (rawPrices[i] - rawPrices[i-1]) / rawPrices[i-1];
        // Skip aberrant values: splits, bad data, zero prices
        if (Math.abs(r) <= MAX_WEEKLY_RET) rets.push(r);
      }
      return rets;
    });

    // Filter out ETFs with too few clean returns
    const filtered = validETFs.map((etf, i) => ({ etf, rets: etfReturns[i] }))
      .filter(x => x.rets.length >= 30);

    if (filtered.length < 2) throw new Error('Données insuffisantes — moins de 2 ETF avec assez de données propres');

    const validETFsFinal = filtered.map(x => x.etf);
    const filteredReturns = filtered.map(x => x.rets);

    // Align on common length (most recent observations)
    const minLen = Math.min(...filteredReturns.map(r => r.length));
    const aligned = filteredReturns.map(r => r.slice(r.length - minLen));

    // ── Weekly mean returns + weekly covariance matrix ──────────────────────
    // portfolioStats() multiplies internally by 52 for annualisation,
    // so we must pass WEEKLY (not annualised) values — same convention as main code.
    const n = validETFsFinal.length;

    // Weekly arithmetic mean (same as main code: mean(rets) passed to portfolioStats)
    const meanR = aligned.map(rets => rets.reduce((s,v) => s+v, 0) / rets.length);

    // Weekly covariance (portfolioStats multiplies by 52 internally)
    const covM = [];
    for (let i = 0; i < n; i++) {
      covM[i] = [];
      for (let j = 0; j < n; j++) {
        let c = 0;
        for (let k = 0; k < minLen; k++) {
          c += (aligned[i][k] - meanR[i]) * (aligned[j][k] - meanR[j]);
        }
        covM[i][j] = c / (minLen - 1); // weekly covariance — NOT pre-annualised
      }
    }

    // ── Step 3: Pré-filtrage — garder les 15 ETFs individuels les plus proches ──
    const rf = appState.rf;
    const tVol = etfState.targetStats.vol;
    const tRet = etfState.targetStats.ret;

    // Score individuel : distance normalisée dans l'espace (vol, ret)
    function score(vol, ret) {
      const dVol = (vol - tVol) / (tVol + 1e-6);
      const dRet = (ret - tRet) / (Math.abs(tRet) + 0.01);
      return 2*dVol*dVol + dRet*dRet;
    }

    // Évaluer chaque ETF individuellement (poids=1) pour pré-trier
    const etfIndivScores = validETFsFinal.map((etf, i) => {
      const st = portfolioStats([1], [meanR[i]], [[covM[i][i]]], rf);
      return { idx: i, score: score(st.vol, st.ret) };
    });
    etfIndivScores.sort((a, b) => a.score - b.score);

    // Garder les 15 meilleurs ETFs pour les combinaisons
    const TOP_K = 15;
    const topIdx = etfIndivScores.slice(0, Math.min(TOP_K, n)).map(x => x.idx);
    // Toujours garder tous les ETFs pour le test à 1 seul ETF
    const allIdx = [...Array(n).keys()];

    resultDiv.innerHTML = `<div class="etf-loading">Optimisation sur ${topIdx.length} ETF présélectionnés…</div>`;

    let bestCombos = [];

    for (let size = 1; size <= 3; size++) {
      // Pour 1 ETF : tester tous ; pour 2-3 ETFs : seulement les top K pré-filtrés
      const pool = size === 1 ? allIdx : topIdx;
      const combos = getCombinations(pool, size);

      for (const combo of combos) {
        const subN = combo.length;
        const subMean = combo.map(i => meanR[i]);
        const subCov  = combo.map(i => combo.map(j => covM[i][j]));

        let bestW = null, bestScore = Infinity;

        // Equal weight baseline
        const ewW = new Array(subN).fill(1/subN);
        const ewS = portfolioStats(ewW, subMean, subCov, rf);
        const ewSc = score(ewS.vol, ewS.ret);
        if (ewSc < bestScore) { bestScore = ewSc; bestW = [...ewW]; }

        // Monte Carlo 1000 draws
        for (let mc = 0; mc < 1000; mc++) {
          const raw = combo.map(() => Math.random());
          const sum = raw.reduce((a,b) => a+b, 0);
          const w   = raw.map(v => v/sum);
          const st  = portfolioStats(w, subMean, subCov, rf);
          const sc  = score(st.vol, st.ret);
          if (sc < bestScore) { bestScore = sc; bestW = [...w]; }
        }

        if (bestW) {
          const st = portfolioStats(bestW, subMean, subCov, rf);
          bestCombos.push({
            etfs: combo.map((i,k) => ({ ...validETFsFinal[i], w: bestW[k] })),
            stats: st,
            score: bestScore,
            size
          });
        }
      }
    }

    // Sort by score, keep top 3 (one per size if possible)
    bestCombos.sort((a,b) => a.score - b.score);
    const shown = [];
    const usedSizes = new Set();
    for (const c of bestCombos) {
      if (!usedSizes.has(c.size)) { shown.push(c); usedSizes.add(c.size); }
      if (shown.length >= 3) break;
    }
    shown.sort((a,b) => a.size - b.size);

    // ── Step 4: Render results ──
    renderETFResults(shown, etfState.targetStats);

  } catch(e) {
    resultDiv.innerHTML = `<div class="etf-loading" style="color:var(--rose)">Erreur : ${e.message}</div>`;
  } finally {
    document.getElementById('etfEquivBtn').disabled = false;
  }
}

function getCombinations(arr, size) {
  if (size === 1) return arr.map(v => [v]);
  const result = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getCombinations(arr.slice(i+1), size-1);
    for (const r of rest) result.push([arr[i], ...r]);
  }
  return result;
}

function renderETFResults(combos, target) {
  const resultDiv = document.getElementById('etfEquivResult');

  let html = `
    <div style="margin-bottom:12px">
      <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Portefeuille cible</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <span class="etf-metric">Rendement : <strong>${(target.ret*100).toFixed(2)} %</strong></span>
        <span class="etf-metric">Volatilité : <strong>${(target.vol*100).toFixed(2)} %</strong></span>
        <span class="etf-metric">Sharpe : <strong>${target.sharpe.toFixed(2)}</strong></span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">`;

  for (const combo of combos) {
    // Score absolu : pénalise chaque écart relatif indépendamment
    const _dVol  = Math.abs(combo.stats.vol - target.vol) / (target.vol + 1e-6);
    const _dRet  = Math.abs(combo.stats.ret - target.ret) / (Math.abs(target.ret) + 0.01);
    const rmse   = Math.sqrt(0.6 * _dVol*_dVol + 0.4 * _dRet*_dRet);
    const matchPct = Math.max(0, Math.min(100, 100 * Math.exp(-2.5 * rmse)));
    const matchColor = matchPct > 70 ? 'var(--teal)' : matchPct > 40 ? 'var(--amber)' : 'var(--rose)';
    const dRet = ((combo.stats.ret - target.ret)*100).toFixed(2);
    const dVol = ((combo.stats.vol - target.vol)*100).toFixed(2);
    const dRetSign = dRet > 0 ? '+' : '';
    const dVolSign = dVol > 0 ? '+' : '';

    html += `<div class="etf-card">
      <div class="etf-card-header">${combo.size} ETF${combo.size>1?'s':''}</div>
      <div style="margin-bottom:10px">
        ${combo.etfs.map(e => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid var(--border)">
            <div>
              <strong style="font-size:0.8rem">${e.ticker}</strong>
              <div style="font-size:0.62rem;color:var(--muted2)">${e.name}</div>
              <div style="font-size:0.6rem;color:var(--muted);font-style:italic">${e.cat}</div>
            </div>
            <div style="text-align:right">
              <div style="color:var(--amber);font-weight:700;font-size:0.85rem">${(e.w*100).toFixed(1)} %</div>
              <div class="alloc-bar-bg" style="width:50px;margin-top:3px">
                <div class="alloc-bar-fill" style="width:${Math.min(100,e.w*100)}%"></div>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px">
        <div class="etf-metric">Rend.<br><strong style="color:var(--teal)">${(combo.stats.ret*100).toFixed(2)} %</strong><br><span style="font-size:0.6rem;color:var(--muted2)">${dRetSign}${dRet}%</span></div>
        <div class="etf-metric">Vol.<br><strong style="color:var(--amber)">${(combo.stats.vol*100).toFixed(2)} %</strong><br><span style="font-size:0.6rem;color:var(--muted2)">${dVolSign}${dVol}%</span></div>
        <div class="etf-metric">Sharpe<br><strong style="color:var(--blue)">${combo.stats.sharpe.toFixed(2)}</strong></div>
      </div>
      <div class="etf-metric" style="margin-bottom:4px">Score d'approximation : <strong style="color:${matchColor}">${matchPct.toFixed(0)} %</strong></div>
      <div class="etf-match-bar"><div class="etf-match-fill" style="width:${matchPct.toFixed(0)}%;background:${matchColor}"></div></div>
    </div>`;
  }

  html += '</div>';
  resultDiv.innerHTML = html;
}


// ── Diagnostic & Contact ─────────────────────────────────────────────────────
function applyCMLExp(exp) {
  const r = appState.results;
  if (!r) return;
  exp = Math.max(0, Math.min(2.2, exp));
  appState.cmlExposure = exp;
  clearCMLResults();
  const mixRet = (1-exp)*appState.rf + exp*r.tangentStats.ret;
  const mixVol = Math.abs(exp)*r.tangentStats.vol;
  _applyingCML = true;
  updateCMLControls(exp, mixRet, mixVol);
  updateCMLBarLabels(exp);
  _applyingCML = false;
  Plotly.restyle('cmlChart',{x:[[mixVol*100]],y:[[mixRet*100]],'marker.line.color':[exp>1?'#7a1f2e':'#1a5c52']},[5]);
  renderCMLAlloc();
}

function setCMLFromRet(val) {
  const v = parseFloat(val.toString().replace(',','.'));
  if (!isNaN(v)) applyCMLEditDirect('ret', v);
}

function setCMLFromVol(val) {
  const v = parseFloat(val.toString().replace(',','.'));
  if (!isNaN(v)) applyCMLEditDirect('vol', v);
}

function clearCMLResults() {
  var d;
  d = document.getElementById('cmlDiagResult'); if (d) d.style.display = 'none';
}
function clearRiskResults() {
  var d;
  d = document.getElementById('riskDiagResult'); if (d) d.style.display = 'none';
  d = document.getElementById('etfEquivResult'); if (d) d.style.display = 'none';
}

function showCMLDiagnostic() {
  const r = appState.results;
  const exp = appState.cmlExposure;
  const resultDiv = document.getElementById('cmlDiagResult');
  resultDiv.style.display = 'block';

  const tickers = r.available;
  const names = r.allNames;
  const n = tickers.length;

  const barColors = {"Tech":"#3b82f6","IA":"#8b5cf6","Cloud":"#0ea5e9","Semi-conducteurs":"#f59e0b",
    "Logiciel":"#6366f1","Hardware":"#64748b","Divertissement":"#ec4899",
    "Finance":"#10b981","Paiement":"#059669","Sante":"#ef4444",
    "Energie":"#f97316","GreenTech":"#22c55e","Industrie":"#94a3b8",
    "Defense":"#dc2626","Luxe":"#a855f7","Consommation":"#fb923c",
    "Auto":"#16a34a","Immobilier":"#eab308","Obligations":"#334155",
    "Matieres premieres":"#d97706","ETF large":"#0284c7",
    "ETF thematique":"#7c3aed","Emergents":"#047857"};

  // 1. Exposition sectorielle absolue (poids tangent * exposition)
  const sectorAbs = {};
  for (let i = 0; i < tickers.length; i++) {
    const tags = SECTOR_TAGS[tickers[i]] || ['Autre'];
    const wAbs = r.tangentW[i] * exp; // exposition réelle
    tags.forEach(function(tag) { sectorAbs[tag] = (sectorAbs[tag] || 0) + wAbs; });
  }
  const sectorEntries = Object.entries(sectorAbs).sort(function(a,b){ return b[1]-a[1]; });
  const maxSectorW = sectorEntries.length > 0 ? sectorEntries[0][1] : 1;

  let html = '<div style="border-top:1px solid var(--border);padding-top:18px">';
  html += '<div style="font-size:0.65rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Exposition sectorielle absolue</div>';
  for (let ei = 0; ei < sectorEntries.length; ei++) {
    const tag = sectorEntries[ei][0], w = sectorEntries[ei][1];
    if (Math.abs(w) < 0.005) continue;
    const pct = (w * 100).toFixed(1);
    const color = barColors[tag] || '#94a3b8';
    const barPct = Math.min(100, Math.abs(w) / Math.abs(maxSectorW) * 100);
    html += '<div class="sector-bar-row"><div class="sector-bar-label">' + tag + '</div>' +
      '<div class="sector-bar-track"><div class="sector-bar-fill" style="width:' + barPct + '%;background:' + color + '"></div></div>' +
      '<div class="sector-bar-pct">' + pct + ' %</div></div>';
  }

  // 2. Badges spécifiques CML
  const badges = [];

  // Badge levier / sous-investissement
  if (exp > 1.20) {
    badges.push({color:'#ef4444',
      title:'Levier important : ' + (exp*100).toFixed(0) + ' % investi',
      desc:'Exposition superieure a 120 %. Le levier amplifie les gains mais aussi les pertes. Risque d appel de marge en cas de chute des marches.'});
  } else if (exp > 1.01) {
    badges.push({color:'#f97316',
      title:'Levier modere : ' + (exp*100).toFixed(0) + ' % investi',
      desc:'Faible recours au levier. Surveiller les couts d emprunt et la volatilite effective du portefeuille.'});
  } else if (exp < 0.80) {
    badges.push({color:'#0ea5e9',
      title:'Sous-investissement : ' + ((1-exp)*100).toFixed(0) + ' % en cash',
      desc:'Une part importante reste en tresorerie. Rendement potentiel reduit mais risque global faible.'});
  } else if (exp < 0.99) {
    badges.push({color:'#22c55e',
      title:'Mix prudent : ' + ((1-exp)*100).toFixed(0) + ' % en actif sans risque',
      desc:'Allocation partiellement defensive avec une poche liquide bien calibree.'});
  } else {
    badges.push({color:'#22c55e',
      title:'Exposition 100 % : portefeuille tangent pur',
      desc:'Aucun levier ni tresorerie. Profil risque/rendement optimal selon Markowitz.'});
  }

  // Volatilite effective
  const volEff = r.tangentStats.vol * exp * 100;
  const retEff = (r.tangentStats.ret - appState.rf) * exp * 100 + appState.rf * 100;
  badges.push({color: exp > 1 ? '#f97316' : '#22c55e',
    title:'Volatilite effective : ' + volEff.toFixed(1) + ' %',
    desc:'Rendement effectif attendu : ' + retEff.toFixed(1) + ' %. ' +
      (exp > 1 ? 'Le levier multiplie la volatilite proportionnellement.' : 'Volatilite reduite par la poche sans risque.')});

  // Concentration sectorielle absolue (top secteur hors ETF)
  const topAbs = sectorEntries.filter(function(e){ return e[0] !== 'ETF large' && e[0] !== 'ETF thematique'; });
  if (topAbs.length > 0) {
    const topTag = topAbs[0][0], topW = topAbs[0][1];
    if (topW > 0.60) {
      badges.push({color:'#ef4444',
        title:'Concentration absolue : ' + topTag + ' (' + (topW*100).toFixed(0) + ' %)',
        desc:'Plus de 60 % du capital total est expose a ' + topTag + '. Diversification sectorielle insuffisante.'});
    } else if (topW > 0.40) {
      badges.push({color:'#f97316',
        title:'Exposition dominante : ' + topTag + ' (' + (topW*100).toFixed(0) + ' %)',
        desc:topTag + ' concentre plus de 40 % de l exposition totale.'});
    }
  }

  let badgesHTML = '<div style="font-size:0.65rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin:16px 0 10px">Diagnostic</div>';
  for (let bi = 0; bi < badges.length; bi++) {
    const b = badges[bi];
    badgesHTML += '<div class="diag-badge"><div class="diag-dot" style="background:' + b.color + '"></div>' +
      '<div><div class="diag-badge-title">' + b.title + '</div>' +
      '<div class="diag-badge-desc">' + b.desc + '</div></div></div>';
  }

  html += badgesHTML + '</div>';
  resultDiv.innerHTML = html;
}
function showRiskDiagnostic() {
  const r = appState.results;
  const w = appState.currentRiskW || r.tangentW;
  const resultDiv = document.getElementById('riskDiagResult');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = buildDiagnosticHTML(w, r);
}

function buildDiagnosticHTML(weights, r) {
  const tickers = r.available;
  const names = r.allNames;
  const n = tickers.length;

  const barColors = {"Tech":"#3b82f6","IA":"#8b5cf6","Cloud":"#0ea5e9","Semi-conducteurs":"#f59e0b",
    "Logiciel":"#6366f1","Hardware":"#64748b","Divertissement":"#ec4899",
    "Finance":"#10b981","Paiement":"#059669","Sante":"#ef4444",
    "Energie":"#f97316","GreenTech":"#22c55e","Industrie":"#94a3b8",
    "Defense":"#dc2626","Luxe":"#a855f7","Consommation":"#fb923c",
    "Auto":"#16a34a","Immobilier":"#eab308","Obligations":"#334155",
    "Matieres premieres":"#d97706","ETF large":"#0284c7",
    "ETF thematique":"#7c3aed","Emergents":"#047857"};

  // 1. Exposition sectorielle
  const sectorWeight = {};
  for (let i = 0; i < tickers.length; i++) {
    const tags = SECTOR_TAGS[tickers[i]] || ['Autre'];
    const w = weights[i];
    tags.forEach(function(tag) { sectorWeight[tag] = (sectorWeight[tag] || 0) + w; });
  }
  const sectorEntries = Object.entries(sectorWeight).sort(function(a,b){ return b[1]-a[1]; });
  const totalSectorW = sectorEntries.reduce(function(s,e){ return s+e[1]; }, 0);
  let barsHTML = '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Exposition sectorielle</div>';
  for (let ei = 0; ei < sectorEntries.length; ei++) {
    const tag = sectorEntries[ei][0], w = sectorEntries[ei][1];
    if (w < 0.005) continue;
    const pct = (w * 100).toFixed(1);
    const color = barColors[tag] || '#94a3b8';
    const barPct = Math.min(100, w / totalSectorW * 100);
    barsHTML += '<div class="sector-bar-row"><div class="sector-bar-label">' + tag + '</div>' +
      '<div class="sector-bar-track"><div class="sector-bar-fill" style="width:' + barPct + '%;background:' + color + '"></div></div>' +
      '<div class="sector-bar-pct">' + pct + ' %</div></div>';
  }

  // 2. Badges
  const badges = [];
  const maxW = Math.max.apply(null, weights);
  const maxName = names[weights.indexOf(maxW)];
  if (maxW > 0.45) {
    badges.push({color:'#ef4444', title:'Concentration elevee : ' + maxName + ' (' + (maxW*100).toFixed(0) + ' %)',
      desc:'Un seul actif represente plus de 45 % du portefeuille. Risque idiosyncratique eleve.'});
  } else if (maxW > 0.30) {
    badges.push({color:'#f97316', title:'Concentration moderee : ' + maxName + ' (' + (maxW*100).toFixed(0) + ' %)',
      desc:'Un actif domine le portefeuille. Surveiller son evolution individuelle.'});
  } else {
    badges.push({color:'#22c55e', title:'Bonne dispersion des poids',
      desc:'Aucun actif ne depasse 30 % du portefeuille. Risque individuel bien dilue.'});
  }
  const topSectors = sectorEntries.filter(function(e){ return e[0] !== 'ETF large' && e[0] !== 'ETF thematique'; });
  if (topSectors.length > 0) {
    const topTag = topSectors[0][0], topW = topSectors[0][1];
    const topPct = (topW * 100).toFixed(0);
    if (topW > 0.55) {
      badges.push({color:'#ef4444', title:'Surexposition sectorielle : ' + topTag + ' (' + topPct + ' %)',
        desc:'Plus de la moitie du portefeuille est concentree sur ' + topTag + '. Diversification insuffisante.'});
    } else if (topW > 0.35) {
      badges.push({color:'#f97316', title:'Exposition dominante : ' + topTag + ' (' + topPct + ' %)',
        desc:topTag + ' represente plus d un tiers du portefeuille. Envisager d autres secteurs.'});
    } else {
      badges.push({color:'#22c55e', title:'Diversification sectorielle satisfaisante',
        desc:'Aucun secteur ne depasse 35 %. La repartition sectorielle est equilibree.'});
    }
  }
  let sumCorr = 0, countCorr = 0;
  for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) { sumCorr += r.corrMatrix[i][j]; countCorr++; }
  const avgCorr = countCorr > 0 ? sumCorr / countCorr : 0;
  if (avgCorr > 0.75) {
    badges.push({color:'#ef4444', title:'Correlation moyenne elevee : ' + avgCorr.toFixed(2),
      desc:'Les actifs evoluent tres souvent ensemble. La diversification est en partie illusoire.'});
  } else if (avgCorr > 0.55) {
    badges.push({color:'#f97316', title:'Correlation moyenne moderee : ' + avgCorr.toFixed(2),
      desc:'Diversification partielle. Certains actifs se comportent de facon similaire.'});
  } else {
    badges.push({color:'#22c55e', title:'Bonne independance des actifs : corr. moy. ' + avgCorr.toFixed(2),
      desc:'Les actifs presentent des comportements suffisamment differencies.'});
  }
  if (n < 4) {
    badges.push({color:'#f97316', title:'Portefeuille peu diversifie (' + n + ' actifs)',
      desc:'Un portefeuille solide compte generalement au moins 5 actifs distincts.'});
  } else if (n >= 8) {
    badges.push({color:'#22c55e', title:'Bonne diversite : ' + n + ' actifs selectionnes',
      desc:'Le nombre d actifs permet une bonne dilution du risque specifique.'});
  }
  let badgesHTML = '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">Diagnostic</div>';
  for (let bi = 0; bi < badges.length; bi++) {
    const b = badges[bi];
    badgesHTML += '<div class="diag-badge"><div class="diag-dot" style="background:' + b.color + '"></div>' +
      '<div><div class="diag-badge-title">' + b.title + '</div>' +
      '<div class="diag-badge-desc">' + b.desc + '</div></div></div>';
  }

  // 3. Paires correlees
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
    if (r.corrMatrix[i][j] > 0.75) pairs.push({a:names[i], b:names[j], corr:r.corrMatrix[i][j]});
  }
  pairs.sort(function(a,b){ return b.corr - a.corr; });
  let corrHTML = '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">Paires fortement correlees</div>';
  if (pairs.length === 0) {
    corrHTML += '<div style="color:var(--muted);font-size:0.8rem">Aucune paire avec correlation > 0.75</div>';
  } else {
    for (let pi = 0; pi < Math.min(8, pairs.length); pi++) {
      const p = pairs[pi];
      const c = p.corr > 0.90 ? '#ef4444' : p.corr > 0.82 ? '#f97316' : '#eab308';
      corrHTML += '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">' +
        '<div style="width:40px;font-size:0.8rem;font-weight:700;color:' + c + '">' + p.corr.toFixed(2) + '</div>' +
        '<div style="font-size:0.78rem;color:var(--ink2)">' + p.a + ' <span style="color:var(--muted)">&#x2194;</span> ' + p.b + '</div></div>';
    }
  }
  return barsHTML + badgesHTML + corrHTML;
}

function renderDiagnostic() {
  const r = appState.results;
  document.getElementById('diagnosticCard').style.display = 'block';
  document.getElementById('diagEmpty').style.display = 'none';
  const html = buildDiagnosticHTML(r.tangentW, r);
  document.getElementById('diagSectorBars').innerHTML = '';
  document.getElementById('diagPortfolioName').textContent = 'Portefeuille tangent';
  document.getElementById('diagBadges').innerHTML = '';
  document.getElementById('diagCorr').innerHTML = '';
  // Re-render into the 3 sections
  const r2 = appState.results;
  const tickers = r2.available; const names = r2.allNames; const n = tickers.length;
  const barColors = {"Tech":"#3b82f6","IA":"#8b5cf6","Cloud":"#0ea5e9","Semi-conducteurs":"#f59e0b",
    "Logiciel":"#6366f1","Hardware":"#64748b","Divertissement":"#ec4899",
    "Finance":"#10b981","Paiement":"#059669","Sante":"#ef4444",
    "Energie":"#f97316","GreenTech":"#22c55e","Industrie":"#94a3b8",
    "Defense":"#dc2626","Luxe":"#a855f7","Consommation":"#fb923c",
    "Auto":"#16a34a","Immobilier":"#eab308","Obligations":"#334155",
    "Matieres premieres":"#d97706","ETF large":"#0284c7",
    "ETF thematique":"#7c3aed","Emergents":"#047857"};
  const weights = r2.tangentW;
  const sectorWeight = {};
  for (let i = 0; i < tickers.length; i++) {
    const tags = SECTOR_TAGS[tickers[i]] || ['Autre'];
    tags.forEach(function(tag) { sectorWeight[tag] = (sectorWeight[tag]||0) + weights[i]; });
  }
  const sectorEntries = Object.entries(sectorWeight).sort(function(a,b){ return b[1]-a[1]; });
  const totalSectorW = sectorEntries.reduce(function(s,e){ return s+e[1]; }, 0);
  let barsHTML = '';
  for (let ei = 0; ei < sectorEntries.length; ei++) {
    const tag = sectorEntries[ei][0], w = sectorEntries[ei][1];
    if (w < 0.005) continue;
    barsHTML += '<div class="sector-bar-row"><div class="sector-bar-label">' + tag + '</div>' +
      '<div class="sector-bar-track"><div class="sector-bar-fill" style="width:' + Math.min(100,w/totalSectorW*100) + '%;background:' + (barColors[tag]||'#94a3b8') + '"></div></div>' +
      '<div class="sector-bar-pct">' + (w*100).toFixed(1) + ' %</div></div>';
  }
  document.getElementById('diagSectorBars').innerHTML = barsHTML;
  // Badges & corr via shared html
  const allHTML = buildDiagnosticHTML(weights, r2);
  // Extract badges and corr parts (after barsHTML)
  const badgesStart = allHTML.indexOf('<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">Diagnostic</div>');
  const corrStart = allHTML.indexOf('<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">Paires fortement correlees</div>');
  if (badgesStart >= 0 && corrStart >= 0) {
    document.getElementById('diagBadges').innerHTML = allHTML.slice(badgesStart, corrStart);
    document.getElementById('diagCorr').innerHTML = allHTML.slice(corrStart);
  }
}
function openContact() {
  const u = ['armand', 'villata'].join('.');
  const d = ['icloud', 'com'].join('.');
  const addr = u + String.fromCharCode(64) + d;
  const target = document.getElementById('contactMailTarget');
  // Always rebuild to avoid any cached obfuscation
  target.innerHTML = '';
  const a = document.createElement('a');
  a.className = 'popup-mail';
  a.textContent = addr;
  a.href = 'mailto:' + addr;
  target.appendChild(a);
  document.getElementById('contactPopup').classList.add('active');
}
function closeContact() {
  document.getElementById('contactPopup').classList.remove('active');
}
document.addEventListener('keydown', e => { if(e.key==='Escape') closeContact(); });



function filterAssets(query) {
  document.getElementById('searchClear').classList.toggle('visible', query.trim().length > 0);
  applyFilters();
}

function resetSelection() {
  appState.selected.clear();
  document.querySelectorAll('#assetItems .asset-item').forEach(function(el) {
    el.classList.remove('selected');
    const cb = el.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = false;
  });
  document.getElementById('selectedCount').textContent = 0;
}

function clearSearch() {
  const inp = document.getElementById('assetSearch');
  inp.value = '';
  filterAssets('');
  inp.focus();
}

buildSidebar();


// Expose globally for HTML onclick
window.runOptimization = runOptimization;
window.switchTab = switchTab;
window.syncPeriodFromInput = syncPeriodFromInput;
window.syncRfFromInput = syncRfFromInput;
window.syncSimFromInput = syncSimFromInput;
window.openContact = openContact;
window.closeContact = closeContact;
window.filterAssets = filterAssets;
window.resetSelection = resetSelection;
window.clearSearch = clearSearch;
window.applyCMLExp = applyCMLExp;
window.setCMLFromRet = setCMLFromRet;
window.setCMLFromVol = setCMLFromVol;
window.showCMLDiagnostic = showCMLDiagnostic;
window.showRiskDiagnostic = showRiskDiagnostic;
window.computeETFEquivalent = computeETFEquivalent;
window.startCMLStep = startCMLStep;
window.stopCMLStep = stopCMLStep;
window.renderRiskContent = renderRiskContent;
window.renderCustomRisk = renderCustomRisk;
window.startCustomEdit = startCustomEdit;
window.solveCustom = solveCustom;
window.portfolioStats = portfolioStats;
