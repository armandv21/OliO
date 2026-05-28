// ── Graphiques et onglets de risque ───────────────────────────────────────────
// Requires: optimization.js (appState, portfolioStats, clearRiskResults)

const RISK_LEVELS=[
  {
    label: 'Défensif', frac: 0.00,
    qual: 'Capital préservé en priorité. Convient à un horizon court ou une faible tolérance aux pertes.',
    math: "Portefeuille à variance minimale : w* = arg min w'Σw sous Σwᵢ=1, wᵢ≥0. Aucune contrainte de rendement."
  },
  {
    label: 'Modéré', frac: 0.25,
    qual: 'Légère prise de risque pour améliorer le rendement. Bon équilibre pour un horizon moyen terme.',
    math: 'Vol cible = σ_min + 25% × (σ_tangent − σ_min). Point à 1/4 entre variance minimale et portefeuille tangent.'
  },
  {
    label: 'Équilibré', frac: 0.50,
    qual: 'Compromis rendement/risque centré. Adapté à un investisseur long terme sans contrainte de liquidité immédiate.',
    math: 'Vol cible = σ_min + 50% × (σ_tangent − σ_min). Point médian entre variance minimale et portefeuille tangent.'
  },
  {
    label: 'Dynamique', frac: 0.75,
    qual: 'Priorité au rendement avec un risque élevé assumé. Horizon long terme, tolérance aux drawdowns importants.',
    math: 'Vol cible = σ_min + 75% × (σ_tangent − σ_min). Proche du portefeuille tangent, forte concentration.'
  },
  {
    label: 'Agressif', frac: 1.00,
    qual: 'Maximisation du rendement attendu sans contrainte de risque. Concentration maximale sur le meilleur actif.',
    math: "Portefeuille tangent exact : w* = arg max (μ-rf)/σ. Maximise le ratio de Sharpe. Identique au portefeuille de la CML interactive à exposition 100%." 
  },
];

function renderRiskLevels() {
  clearRiskResults();
  document.getElementById('riskCard').style.display='block';
  const tabs=document.getElementById('riskTabs'); tabs.innerHTML='';
  RISK_LEVELS.forEach((lvl,i)=>{
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:0';
    const btn=document.createElement('button');
    btn.className='risk-tab'+(i===0?' active':'');
    btn.textContent=lvl.label;
    btn.onclick=()=>{
      document.querySelectorAll('.risk-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderRiskContent(i);
    };
    const tipWrap = document.createElement('span');
    tipWrap.className = 'risk-tooltip-wrap';
    tipWrap.innerHTML = `<span class="risk-help-btn" tabindex="0">?</span><div class="risk-tooltip-box"><strong>${lvl.label}</strong>${lvl.qual}</div>`;
    wrap.appendChild(btn); wrap.appendChild(tipWrap); tabs.appendChild(wrap);
  });
  const customBtn=document.createElement('button');
  customBtn.className='risk-tab custom';
  customBtn.textContent='Personnalisé';
  customBtn.onclick=()=>{
    document.querySelectorAll('.risk-tab').forEach(b=>b.classList.remove('active'));
    customBtn.classList.add('active');
    renderCustomRisk();
  };
  tabs.appendChild(customBtn);
  renderRiskContent(0);
}

function renderRiskAlloc(w, stats, containerSel, pieDivId) {
  const r=appState.results;
  const alloc=r.allNames.map((name,i)=>({name,ticker:r.available[i],w:w[i]}))
    .sort((a,b)=>b.w-a.w).filter(a=>a.w>0.005);
  document.getElementById(containerSel).innerHTML=`
    <div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
        <div class="kpi-card teal" style="padding:12px"><div class="kpi-label">Rendement</div><div class="kpi-value teal" style="font-size:1.2rem">${(stats.ret*100).toFixed(2)} %</div></div>
        <div class="kpi-card amber" style="padding:12px"><div class="kpi-label">Volatilité</div><div class="kpi-value amber" style="font-size:1.2rem">${(stats.vol*100).toFixed(2)} %</div></div>
        <div class="kpi-card blue" style="padding:12px"><div class="kpi-label">Ratio de Sharpe</div><div class="kpi-value blue" style="font-size:1.2rem">${stats.sharpe.toFixed(2)}</div></div>
        <div class="kpi-card rose" style="padding:12px"><div class="kpi-label">Actifs</div><div class="kpi-value rose" style="font-size:1.2rem">${alloc.length}</div></div>
      </div>
      <table class="alloc-table"><thead><tr><th>Actif</th><th>Poids</th><th style="width:80px"></th></tr></thead>
      <tbody>${alloc.map(a=>`<tr><td><strong>${a.name}</strong><br><span style="color:var(--muted2);font-size:0.65rem">${a.ticker}</span></td><td style="color:var(--amber)">${(a.w*100).toFixed(1)} %</td><td><div class="alloc-bar-bg"><div class="alloc-bar-fill" style="width:${Math.min(100,a.w*100)}%"></div></div></td></tr>`).join('')}</tbody></table>
    </div>
    <div id="${pieDivId}" style="height:300px"></div>`;
  const colors=alloc.map((_,i)=>`hsl(${200+i*22},40%,${45+i%3*8}%)`);
  Plotly.react(pieDivId,[{type:'pie',labels:alloc.map(a=>a.name),values:alloc.map(a=>a.w*100),hole:0.42,
    marker:{colors,line:{color:'white',width:1}},textinfo:'percent',
    hovertemplate:'<b>%{label}</b><br>%{value:.1f} %<extra></extra>',textfont:{color:'white',size:10}}],
    {paper_bgcolor:'transparent',plot_bgcolor:'transparent',showlegend:false,margin:{l:10,r:10,t:10,b:10},
     font:{color:'#3d3830',family:'DM Sans, sans-serif'}},{responsive:true,displayModeBar:false});
}

function renderRiskContent(idx) {
  clearRiskResults();
  const r=appState.results; const lvl=RISK_LEVELS[idx];
  let w, stats;
  if (lvl.frac === 1.00) { w = r.tangentW; stats = r.tangentStats; }
  else if (lvl.frac === 0.00) { w = r.minVarW; stats = r.minVarStats; }
  else {
    const targetVol = r.minVarStats.vol + lvl.frac * (r.tangentStats.vol - r.minVarStats.vol);
    const efIdx = r.efVols.reduce((best,v,i) => Math.abs(v-targetVol) < Math.abs(r.efVols[best]-targetVol) ? i : best, 0);
    w = r.efWeights[efIdx];
    stats = portfolioStats(w, r.meanRets, r.covMatrix, appState.rf);
  }
  appState.currentRiskW = w; appState.currentRiskStats = stats;
  renderRiskAlloc(w, stats, 'riskContent', 'riskPieDiv');
}

function renderCustomRisk() {
  const r = appState.results;
  const defStats = r.tangentStats;
  document.getElementById('riskContent').innerHTML = `
    <div>
      <div style="font-size:0.72rem;color:var(--muted);margin-bottom:14px;font-style:italic">Cliquez sur une valeur pour la modifier. Les autres s'ajusteront automatiquement.</div>
      <div class="custom-inputs">
        <div class="custom-kpi-card teal" id="cc-ret" onclick="startCustomEdit('ret')">
          <div class="kpi-label">Rendement souhaité</div>
          <div class="kpi-value teal" style="font-size:1.2rem" id="cc-ret-val">
            <input class="custom-input-field" id="inp-ret" type="number" step="0.01" placeholder="${(defStats.ret*100).toFixed(2)}" style="color:var(--teal)" onchange="solveCustom('ret')"/>
            <span id="cc-ret-unit" style="font-size:0.85rem;margin-left:2px">%</span></div></div>
        <div class="custom-kpi-card amber" id="cc-vol" onclick="startCustomEdit('vol')">
          <div class="kpi-label">Volatilité souhaitée</div>
          <div class="kpi-value amber" style="font-size:1.2rem" id="cc-vol-val">
            <input class="custom-input-field" id="inp-vol" type="number" step="0.01" placeholder="${(defStats.vol*100).toFixed(2)}" style="color:var(--amber)" onchange="solveCustom('vol')"/>
            <span id="cc-vol-unit" style="font-size:0.85rem;margin-left:2px">%</span></div></div>
        <div class="custom-kpi-card blue" id="cc-sharpe" onclick="startCustomEdit('sharpe')">
          <div class="kpi-label">Ratio de Sharpe</div>
          <div class="kpi-value blue" style="font-size:1.2rem" id="cc-sharpe-val">
            <input class="custom-input-field" id="inp-sharpe" type="number" step="0.01" placeholder="${defStats.sharpe.toFixed(2)}" style="color:var(--blue)" onchange="solveCustom('sharpe')"/></div></div>
        <div class="kpi-card rose" style="padding:12px;cursor:default">
          <div class="kpi-label">Actifs optimaux</div>
          <div class="kpi-value rose" style="font-size:1.2rem" id="cc-nassets">—</div></div>
      </div>
      <div id="customAllocLeft"></div>
    </div>
    <div id="customPie" style="height:300px;"></div>`;
}

let customActiveField = null;
function startCustomEdit(field) {
  ['ret','vol','sharpe'].forEach(f => {
    const card = document.getElementById('cc-'+f);
    if (card) card.classList.toggle('editing', f === field);
  });
  const inp = document.getElementById('inp-'+field);
  if (inp) { inp.focus(); inp.select(); }
  customActiveField = field;
}

let _solvingCustom = false;
function solveCustom(field) {
  clearRiskResults();
  if (_solvingCustom) return;
  const r = appState.results;
  const rawVal = parseFloat(document.getElementById('inp-'+field).value);
  if (isNaN(rawVal)) return;
  const efVols = r.efVols, efRets = r.efRets;
  const efSharpes = efVols.map((v,i) => v > 0 ? (efRets[i] - appState.rf) / v : 0);
  const maxVol = Math.max(...efVols), minVol = Math.min(...efVols);
  const maxRet = Math.max(...efRets), minRet = Math.min(...efRets);
  const maxSharpe = Math.max(...efSharpes), minSharpe = Math.min(...efSharpes);
  let clampedVal = rawVal, clamped = false;
  if (field === 'vol') {
    if (rawVal > maxVol*100) { clampedVal = maxVol*100; clamped = true; }
    if (rawVal < minVol*100) { clampedVal = minVol*100; clamped = true; }
  } else if (field === 'ret') {
    if (rawVal > maxRet*100) { clampedVal = maxRet*100; clamped = true; }
    if (rawVal < minRet*100) { clampedVal = minRet*100; clamped = true; }
  } else if (field === 'sharpe') {
    if (rawVal > maxSharpe) { clampedVal = maxSharpe; clamped = true; }
    if (rawVal < minSharpe) { clampedVal = minSharpe; clamped = true; }
  }
  if (clamped) {
    const inp = document.getElementById('inp-'+field);
    inp.value = clampedVal.toFixed(2);
    inp.style.color = 'var(--rose)';
    setTimeout(() => { inp.style.color = field==='vol'?'var(--amber)':field==='ret'?'var(--teal)':'var(--blue)'; }, 900);
  }
  const tangentVol = r.tangentStats.vol*100, tangentRet = r.tangentStats.ret*100, tangentSh = r.tangentStats.sharpe;
  const minVarVol = r.minVarStats.vol*100, minVarRet = r.minVarStats.ret*100, minVarSh = r.minVarStats.sharpe;
  const snapTol = 0.15;
  let w, stats;
  const nearTangent = (field==='vol' && Math.abs(clampedVal-tangentVol)<snapTol)||(field==='ret' && Math.abs(clampedVal-tangentRet)<snapTol)||(field==='sharpe' && Math.abs(clampedVal-tangentSh)<snapTol);
  const nearMinVar = (field==='vol' && Math.abs(clampedVal-minVarVol)<snapTol)||(field==='ret' && Math.abs(clampedVal-minVarRet)<snapTol)||(field==='sharpe' && Math.abs(clampedVal-minVarSh)<snapTol);
  if (nearTangent) { w = r.tangentW; stats = r.tangentStats; }
  else if (nearMinVar) { w = r.minVarW; stats = r.minVarStats; }
  else {
    const wMV = r.minVarW, wT = r.tangentW;
    const t = field === 'sharpe' ? clampedVal : clampedVal / 100;
    const evalAlpha = a => { const wk = wMV.map((v,i) => (1-a)*v + a*wT[i]); return portfolioStats(wk, r.meanRets, r.covMatrix, appState.rf); };
    const metric = s => field === 'vol' ? s.vol : field === 'ret' ? s.ret : s.sharpe;
    const f = a => metric(evalAlpha(a)) - t;
    const f0 = f(0), f1 = f(1);
    let alpha;
    if (f0*f1 > 0) { alpha = Math.abs(f0) < Math.abs(f1) ? 0 : 1; }
    else { let lo=0, hi=1; for(let iter=0;iter<64;iter++){const mid=(lo+hi)/2; if(f(mid)*f0<=0)hi=mid; else lo=mid;} alpha=(lo+hi)/2; }
    alpha = Math.max(0, Math.min(1, alpha));
    const wInterp = wMV.map((v,i) => (1-alpha)*v + alpha*wT[i]);
    const wSum = wInterp.reduce((s,v) => s+Math.max(0,v), 0);
    w = wInterp.map(v => Math.max(0,v)/wSum);
    stats = portfolioStats(w, r.meanRets, r.covMatrix, appState.rf);
  }
  _solvingCustom = true;
  if (field !== 'ret') document.getElementById('inp-ret').value = (stats.ret*100).toFixed(2);
  if (field !== 'vol') document.getElementById('inp-vol').value = (stats.vol*100).toFixed(2);
  if (field !== 'sharpe') document.getElementById('inp-sharpe').value = stats.sharpe.toFixed(2);
  _solvingCustom = false;
  appState.currentRiskW = w; appState.currentRiskStats = stats;
  const alloc = r.allNames.map((name,i) => ({name, ticker:r.available[i], w:w[i]})).filter(a => a.w > 0.005);
  document.getElementById('cc-nassets').textContent = alloc.length;
  const sortedAlloc = [...alloc].sort((a,b) => b.w - a.w);
  document.getElementById('customAllocLeft').innerHTML = `
    <table class="alloc-table"><thead><tr><th>Actif</th><th>Poids</th><th style="width:80px"></th></tr></thead>
    <tbody>${sortedAlloc.map(a => `<tr><td><strong>${a.name}</strong><br><span style="color:var(--muted2);font-size:0.65rem">${a.ticker}</span></td><td style="color:var(--amber)">${(a.w*100).toFixed(1)} %</td><td><div class="alloc-bar-bg"><div class="alloc-bar-fill" style="width:${Math.min(100,a.w*100)}%"></div></div></td></tr>`).join('')}</tbody></table>`;
  const colors = sortedAlloc.map((_,i) => `hsl(${200+i*22},40%,${45+i%3*8}%)`);
  Plotly.react('customPie', [{
    type:'pie', labels:sortedAlloc.map(a=>a.name), values:sortedAlloc.map(a=>a.w*100),
    hole:0.42, marker:{colors, line:{color:'white',width:1}},
    textinfo:'percent', hovertemplate:'<b>%{label}</b><br>%{value:.1f} %<extra></extra>',
    textfont:{color:'white', size:10}
  }], { paper_bgcolor:'transparent', plot_bgcolor:'transparent', showlegend:false, margin:{l:10,r:10,t:10,b:10}, font:{color:'#3d3830', family:'DM Sans, sans-serif'} }, {responsive:true, displayModeBar:false});
}

window.renderRiskLevels = renderRiskLevels;
window.renderRiskContent = renderRiskContent;
window.renderCustomRisk = renderCustomRisk;
window.startCustomEdit = startCustomEdit;
window.solveCustom = solveCustom;
window.renderRiskAlloc = renderRiskAlloc;
