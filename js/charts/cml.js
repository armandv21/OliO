// ── Graphique Capital Market Line ───────────────────────────────────────────
// Requires: optimization.js (appState, plotLayout, TOOLBAR, clearCMLResults)

function renderCML() {
  clearCMLResults();
  const r = appState.results;
  document.getElementById('cmlCard').style.display = 'block';
  const exp=appState.cmlExposure;
  const mixRet=(1-exp)*appState.rf+exp*r.tangentStats.ret;
  const mixVol=Math.abs(exp)*r.tangentStats.vol;
  updateCMLControls(exp,mixRet,mixVol);

  const xT=r.tangentStats.vol*100, xMax=r.tangentStats.vol*2.2*100;
  const slope=(r.tangentStats.ret-appState.rf)/r.tangentStats.vol;
  const xSafe=Array.from({length:50},(_,i)=>i/49*xT);
  const ySafe=xSafe.map(x=>(appState.rf+slope*x/100)*100);
  const xLev=Array.from({length:50},(_,i)=>xT+i/49*(xMax-xT));
  const yLev=xLev.map(x=>(appState.rf+slope*x/100)*100);

  const traces=[
    {x:r.efVols.map(v=>v*100),y:r.efRets.map(v=>v*100),mode:'lines',type:'scatter',
     line:{color:'rgba(30,58,95,0.2)',width:1.5},hoverinfo:'skip'},
    {x:xSafe,y:ySafe,mode:'lines',type:'scatter',line:{color:'#1a5c52',width:2.5},
     hovertemplate:'Vol. : %{x:.2f} %<br>Rend. : %{y:.2f} %<extra>CML sans levier</extra>'},
    {x:xLev,y:yLev,mode:'lines',type:'scatter',line:{color:'#7a1f2e',width:2.5,dash:'dot'},
     hovertemplate:'Vol. : %{x:.2f} %<br>Rend. : %{y:.2f} %<extra>CML avec levier</extra>'},
    {x:[r.tangentStats.vol*100],y:[r.tangentStats.ret*100],mode:'markers',type:'scatter',
     marker:{size:14,color:'#c4820a',symbol:'star',line:{color:'white',width:1.5}},
     hovertemplate:`<b>Portefeuille tangent</b><br>Sharpe : ${r.tangentStats.sharpe.toFixed(2)}<extra></extra>`},
    {x:[0],y:[appState.rf*100],mode:'markers',type:'scatter',
     marker:{size:9,color:'#7a1f2e',symbol:'circle',line:{color:'white',width:1.5}}},
    {x:[mixVol*100],y:[mixRet*100],mode:'markers',type:'scatter',
     marker:{size:18,color:'white',symbol:'circle',line:{color:exp>1?'#7a1f2e':'#1a5c52',width:3}},
     hovertemplate:`<b>Votre portefeuille</b><br>Rend. : ${(mixRet*100).toFixed(2)} %<br>Vol. : ${(mixVol*100).toFixed(2)} %<br>Exposition : ${(exp*100).toFixed(0)} %<extra></extra>`},
  ];

  const layout = plotLayout(); layout.dragmode = false;
  Plotly.react('cmlChart', traces, layout, TOOLBAR);

  document.getElementById('cmlLegend').innerHTML = `
    <div class="legend-title">Légende</div>
    <div class="legend-item"><div class="legend-line" style="background:#1a5c52"></div>CML — sans levier</div>
    <div class="legend-item"><div class="legend-line-dashed" style="color:#7a1f2e;width:22px"></div>CML — avec levier</div>
    <div class="legend-item"><span style="color:#c4820a;font-size:14px">★</span>Portefeuille tangent</div>
    <div class="legend-item"><span style="color:#7a1f2e;font-size:14px">●</span>Taux sans risque</div>
    <div class="legend-item" style="margin-top:4px">
      <div style="width:16px;height:16px;border-radius:50%;border:3px solid #1a5c52;background:white;flex-shrink:0"></div>Votre portefeuille
    </div>`;

  setupDraggablePoint();
  renderCMLAlloc();
}

function updateCMLControls(exp, mixRet, mixVol) {
  const mixSharpe = mixVol>0?(mixRet-appState.rf)/mixVol:0;
  const retInp = document.getElementById('mixRetInp');
  const volInp = document.getElementById('mixVolInp');
  if(retInp && document.activeElement !== retInp) { retInp.value = (mixRet*100).toFixed(2); retInp.style.color = mixRet>=0?'var(--teal)':'var(--rose)'; }
  if(volInp && document.activeElement !== volInp) { volInp.value = (mixVol*100).toFixed(2); }
  document.getElementById('mixSharpe').textContent = mixSharpe.toFixed(2);
  updateCMLBarLabels(exp);
}

let isDragging = false;
function setupDraggablePoint() {
  const chartDiv = document.getElementById('cmlChart');
  if(chartDiv._draggableSetup) return;
  chartDiv._draggableSetup = true;
  chartDiv.addEventListener('mousedown', e => {
    const coords=getPlotCoords(e.clientX,e.clientY);
    if(!coords) return; isDragging=true; snapToCML(coords.x); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if(!isDragging) return;
    const coords=getPlotCoords(e.clientX,e.clientY);
    if(coords) snapToCML(coords.x); e.preventDefault();
  });
  document.addEventListener('mouseup', ()=>{isDragging=false;});
  chartDiv.addEventListener('touchstart', e=>{
    const t=e.touches[0];const coords=getPlotCoords(t.clientX,t.clientY);
    if(!coords)return;isDragging=true;snapToCML(coords.x);e.preventDefault();
  },{passive:false});
  document.addEventListener('touchmove', e=>{
    if(!isDragging)return;const t=e.touches[0];
    const coords=getPlotCoords(t.clientX,t.clientY);if(coords)snapToCML(coords.x);e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',()=>{isDragging=false;});
  chartDiv.style.cursor = 'crosshair';
}

function getPlotCoords(clientX, clientY) {
  const chartDiv=document.getElementById('cmlChart');
  const fl=chartDiv._fullLayout; if(!fl) return null;
  const rect=chartDiv.getBoundingClientRect();
  const l=fl.margin.l+rect.left, t=fl.margin.t+rect.top;
  const w=fl.xaxis._length, h=fl.yaxis._length;
  const px=clientX-l, py=clientY-t;
  if(px<0||px>w||py<0||py>h) return null;
  return {
    x:fl.xaxis.range[0]+(px/w)*(fl.xaxis.range[1]-fl.xaxis.range[0]),
    y:fl.yaxis.range[1]+(py/h)*(fl.yaxis.range[0]-fl.yaxis.range[1]),
  };
}

function snapToCML(xVol_pct) {
  const r=appState.results; if(!r) return;
  const maxVol=r.tangentStats.vol*2.2;
  const clampedVol=Math.max(0,Math.min(xVol_pct/100,maxVol));
  const exp=clampedVol/r.tangentStats.vol;
  appState.cmlExposure=exp;
  clearCMLResults();
  const mixRet=(1-exp)*appState.rf+exp*r.tangentStats.ret;
  const mixVol=Math.abs(exp)*r.tangentStats.vol;
  updateCMLControls(exp,mixRet,mixVol);
  Plotly.restyle('cmlChart',{x:[[mixVol*100]],y:[[mixRet*100]],'marker.line.color':[exp>1?'#7a1f2e':'#1a5c52']},[5]);
  renderCMLAlloc();
}

function renderCMLAlloc() {
  const r=appState.results; const exp=appState.cmlExposure;
  const alloc=r.tangentW.map((w,i)=>({name:r.allNames[i],ticker:r.available[i],wT:w,wTot:w*exp}))
    .sort((a,b)=>b.wTot-a.wTot).filter(a=>a.wT>0.005);
  const rfPart   = Math.max(0, (1-exp)*100);
  const levPart  = Math.max(0, (exp-1)*100);
  const hasRf    = rfPart  > 0.05;
  const hasLev   = levPart > 0.05;
  let html = `<table class="alloc-table"><thead><tr><th>Actif</th><th style="text-align:right">Poids tangent</th><th style="text-align:right">Exposition totale</th></tr></thead><tbody>`;
  if (hasRf) html += `<tr><td><strong>Trésorerie</strong><br><span style="color:var(--muted2);font-size:0.65rem">Cash / Rf</span></td><td style="text-align:right;color:var(--teal)">—</td><td style="text-align:right;color:var(--teal)">${rfPart.toFixed(1)} %</td></tr>`;
  for(const a of alloc) html += `<tr><td><strong>${a.name}</strong><br><span style="color:var(--muted2);font-size:0.65rem">${a.ticker}</span></td><td style="text-align:right;color:var(--amber)">${(a.wT*100).toFixed(1)} %</td><td style="text-align:right;color:var(--blue)">${(a.wTot*100).toFixed(1)} %</td></tr>`;
  if (hasLev) html += `<tr><td><strong>Emprunt</strong><br><span style="color:var(--muted2);font-size:0.65rem">Levier financier</span></td><td style="text-align:right;color:var(--rose)">—</td><td style="text-align:right;color:var(--rose)">−${levPart.toFixed(1)} %</td></tr>`;
  html += `<tr style="border-top:1px solid var(--border);font-weight:600"><td>Total</td><td style="text-align:right;color:var(--muted)">${(exp<=1?exp*100:100).toFixed(0)} %</td><td style="text-align:right;color:var(--ink)">${(exp*100).toFixed(0)} %</td></tr>`;
  document.getElementById('cmlAllocTable').innerHTML = html + '</tbody></table>';
  const pieLabels = alloc.map(a => a.name);
  const pieValues = alloc.map(a => Math.abs(a.wTot) * 100);
  const pieColors = alloc.map((_,i) => `hsl(${200+i*22},40%,${45+i%3*8}%)`);
  if (hasRf) { pieLabels.unshift('Trésorerie'); pieValues.unshift(rfPart); pieColors.unshift('#1a5c52'); }
  if (hasLev) { pieLabels.push('Emprunt'); pieValues.push(levPart); pieColors.push('#7a1f2e'); }
  Plotly.react('cmlPieChart', [{
    type:'pie', labels:pieLabels, values:pieValues, hole:0.42,
    marker:{colors:pieColors, line:{color:'white',width:1}},
    textinfo:'percent', hovertemplate:'<b>%{label}</b><br>%{value:.1f} %<extra></extra>',
    textfont:{color:'white',size:10}
  }], {
    paper_bgcolor:'transparent', plot_bgcolor:'transparent',
    showlegend:false, margin:{l:10,r:10,t:10,b:10},
    font:{color:'#3d3830',family:'DM Sans, sans-serif'}
  }, {responsive:true, displayModeBar:false});
}

window.renderCML = renderCML;
window.snapToCML = snapToCML;
window.renderCMLAlloc = renderCMLAlloc;
window.updateCMLControls = updateCMLControls;
