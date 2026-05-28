// ── Graphique frontière efficiente ────────────────────────────────────────────
// Requires: optimization.js (appState, plotLayout, TOOLBAR)

function renderFrontier() {
  const r = appState.results;
  document.getElementById('frontierCard').style.display = 'block';
  const mn=Math.min(...r.simSharpes), mx=Math.max(...r.simSharpes);
  const sharpeNorm=r.simSharpes.map(s=>(s-mn)/(mx-mn+1e-9));
  const cmlMaxVol=Math.max(...r.simVols)*1.15;
  const cmlX=Array.from({length:80},(_,i)=>i/79*cmlMaxVol*100);
  const slope=(r.tangentStats.ret-appState.rf)/r.tangentStats.vol;
  const cmlY=cmlX.map(x=>(appState.rf+slope*(x/100))*100);

  const traces=[
    {x:r.simVols.map(v=>v*100),y:r.simRets.map(v=>v*100),mode:'markers',type:'scatter',
     marker:{size:3.5,opacity:0.45,color:sharpeNorm,colorscale:[['0','#c4bdb0'],['0.5','#3466a0'],['1','#1a5c52']]},
     hovertemplate:'Vol. : %{x:.2f} %<br>Rend. : %{y:.2f} %<extra>Simulation</extra>'},
    {x:r.efVols.map(v=>v*100),y:r.efRets.map(v=>v*100),mode:'lines',type:'scatter',
     line:{color:'#1e3a5f',width:2.5},
     hovertemplate:'<b>Frontière efficiente</b><br>Vol. : %{x:.2f} %<br>Rend. : %{y:.2f} %<extra></extra>'},
    {x:cmlX,y:cmlY,mode:'lines',type:'scatter',line:{color:'#c4820a',width:1.8,dash:'dot'},
     hovertemplate:'Vol. : %{x:.2f} %<br>Rend. : %{y:.2f} %<extra>CML</extra>'},
    {x:[r.tangentStats.vol*100],y:[r.tangentStats.ret*100],mode:'markers',type:'scatter',
     marker:{size:14,color:'#c4820a',symbol:'star',line:{color:'white',width:1.5}},
     hovertemplate:`<b>Portefeuille tangent</b><br>Vol. : ${(r.tangentStats.vol*100).toFixed(2)} %<br>Rend. : ${(r.tangentStats.ret*100).toFixed(2)} %<br>Sharpe : ${r.tangentStats.sharpe.toFixed(2)}<extra></extra>`},
    {x:[r.minVarStats.vol*100],y:[r.minVarStats.ret*100],mode:'markers',type:'scatter',
     marker:{size:11,color:'#1a5c52',symbol:'diamond',line:{color:'white',width:1.5}},
     hovertemplate:`<b>Variance minimale</b><br>Vol. : ${(r.minVarStats.vol*100).toFixed(2)} %<br>Rend. : ${(r.minVarStats.ret*100).toFixed(2)} %<extra></extra>`},
    {x:[0],y:[appState.rf*100],mode:'markers',type:'scatter',
     marker:{size:9,color:'#7a1f2e',symbol:'circle',line:{color:'white',width:1.5}},
     hovertemplate:`Taux sans risque : ${(appState.rf*100).toFixed(2)} %<extra></extra>`},
  ];

  Plotly.react('frontierChart', traces, plotLayout(), TOOLBAR);

  document.getElementById('frontierLegend').innerHTML = `
    <div class="legend-title">Légende</div>
    <div class="legend-item"><div class="legend-line" style="background:#1e3a5f"></div>Frontière efficiente</div>
    <div class="legend-item"><div class="legend-line-dashed" style="color:#c4820a;width:22px"></div>Capital Market Line</div>
    <div class="legend-item"><span style="color:#c4820a;font-size:14px;line-height:1">★</span>Portefeuille tangent</div>
    <div class="legend-item"><span style="color:#1a5c52;font-size:14px;line-height:1">◆</span>Variance minimale</div>
    <div class="legend-item"><span style="color:#7a1f2e;font-size:14px;line-height:1">●</span>Taux sans risque</div>
    <div class="legend-item" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
      <div style="width:22px;height:8px;background:linear-gradient(90deg,#c4bdb0,#3466a0,#1a5c52);border-radius:2px;flex-shrink:0"></div>Ratio de Sharpe
    </div>`;
}

window.renderFrontier = renderFrontier;
