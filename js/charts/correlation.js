// ── Matrice de corrélation et performances ───────────────────────────────────────────
// Requires: optimization.js (appState)

function renderPerf() {
  const r=appState.results;
  document.getElementById('perfCard').style.display='block';
  document.getElementById('corrCard').style.display='block';

  const nA = r.n;
  const mktRets = r.retsAligned[0].map((_,t) =>
    r.retsAligned.reduce((s,arr)=>s+arr[t],0) / nA
  );
  const mktVar = r.retsAligned[0].map((_,t)=>mktRets[t]).reduce((s,v,t,a)=>{
    const m=a.reduce((x,y)=>x+y,0)/a.length; return s+(v-m)*(v-m);
  },0) / (mktRets.length-1);

  const rows=r.allNames.map((name,i)=>{
    const assetRets = r.retsAligned[i];
    const mA = assetRets.reduce((s,v)=>s+v,0)/assetRets.length;
    const mM = mktRets.reduce((s,v)=>s+v,0)/mktRets.length;
    const covAM = assetRets.reduce((s,v,t)=>s+(v-mA)*(mktRets[t]-mM),0)/(assetRets.length-1);
    const beta = mktVar > 0 ? covAM / mktVar : 1;
    return {name, ticker:r.available[i], ret:r.annMeanRets[i], vol:r.annStds[i],
      sharpe:(r.annMeanRets[i]-appState.rf)/r.annStds[i], beta};
  }).sort((a,b)=>b.sharpe-a.sharpe);

  let html=`<thead><tr>
    <th>Actif</th>
    <th style="text-align:right">Rendement annualisé</th>
    <th style="text-align:right">Volatilité annualisée</th>
    <th style="text-align:right">Ratio de Sharpe</th>
    <th style="text-align:right">Bêta</th>
  </tr></thead><tbody>`;
  for(const row of rows) {
    const betaColor = row.beta>1.2?'var(--rose)':row.beta<0.8?'var(--teal)':'var(--ink2)';
    html+=`<tr>
      <td><strong>${row.name}</strong> <span style="color:var(--muted2);font-size:0.7rem">${row.ticker}</span></td>
      <td class="${row.ret>=0?'positive':'negative'}">${(row.ret*100).toFixed(2)} %</td>
      <td style="color:var(--amber)">${(row.vol*100).toFixed(2)} %</td>
      <td class="${row.sharpe>=1?'positive':row.sharpe<0?'negative':''}">${row.sharpe.toFixed(2)}</td>
      <td style="color:${betaColor};font-weight:500">${row.beta.toFixed(2)}</td></tr>`;
  }
  document.getElementById('perfTable').innerHTML=html+'</tbody>';
  renderCorrMatrix();
}

function renderCorrMatrix() {
  const r=appState.results; const n=r.n;
  const corr=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
    const si = r.annStds[i] / Math.sqrt(52);
    const sj = r.annStds[j] / Math.sqrt(52);
    return Math.max(-1, Math.min(1, r.covMatrix[i][j] / (si * sj + 1e-12)));
  }));

  function corrColor(v) {
    if (v >= 0) {
      const t = v;
      return `rgb(${Math.round(255+t*(30-255))},${Math.round(255+t*(58-255))},${Math.round(255+t*(95-255))})`;
    } else {
      const t = -v;
      return `rgb(${Math.round(255+t*(122-255))},${Math.round(255+t*(31-255))},${Math.round(255+t*(46-255))})`;
    }
  }
  function textColor(v) { return Math.abs(v) > 0.45 ? 'white' : 'var(--ink2)'; }

  const labels=r.allNames.map(n=>n.length>9?n.slice(0,9):n);
  let html='<table class="corr-table"><thead><tr><td style="min-width:72px"></td>';
  labels.forEach(l=>html+=`<th class="corr-label" style="text-align:center;white-space:nowrap;padding:4px 2px;font-size:0.6rem">${l}</th>`);
  html+='</tr></thead><tbody>';
  for(let i=0;i<n;i++){
    html+=`<tr><td class="corr-label" style="white-space:nowrap;padding-right:8px">${labels[i]}</td>`;
    for(let j=0;j<n;j++){
      const v=corr[i][j];
      const diag = i===j;
      const bg = diag ? 'var(--surface3)' : corrColor(v);
      const txt = diag ? 'var(--muted)' : textColor(v);
      html+=`<td style="padding:2px"><div class="corr-cell" style="background:${bg};color:${txt};font-weight:${diag?'400':'500'}">${v.toFixed(2)}</div></td>`;
    }
    html+='</tr>';
  }
  document.getElementById('corrMatrix').innerHTML=html+'</tbody></table>';
}

window.renderPerf = renderPerf;
window.renderCorrMatrix = renderCorrMatrix;
