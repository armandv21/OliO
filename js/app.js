// ── Initialisation de l'application ──────────────────────────────────────────────
// Ce fichier orchestre le chargement initial et les event listeners top-level.
// Doit être chargé EN DERNIER (après tous les autres scripts).

// ── Vérification auth (early) ───────────────────────────────────────────────────

(function(){
  if(sessionStorage.getItem('mrkwtz_auth')==='1'){
    document.addEventListener('DOMContentLoaded',function(){
      var o=document.getElementById('authOverlay');
      if(o) o.classList.add('hidden');
    });
  }
})();


// ── Post-traitement visuel Plotly ────────────────────────────────────────────────

(function() {
  const _react = Plotly.react.bind(Plotly);
  Plotly.react = function(div, traces, layout, config) {
    const divId = typeof div === 'string' ? div : div?.id;
    if (divId === 'frontierChart' && Array.isArray(traces) && traces.length >= 2) {

      const ft = traces[1];
      if (ft && ft.x && ft.y && ft.x.length > 1) {
        const xs = ft.x, ys = ft.y;
        const filtX = [xs[0]], filtY = [ys[0]];
        for (let i = 1; i < xs.length; i++) {
          if (ys[i] >= ys[i-1]) { filtX.push(xs[i]); filtY.push(ys[i]); }
        }
        traces[1] = Object.assign({}, ft, { x: filtX, y: filtY });
      }

      const efX = traces[1].x, efY = traces[1].y;
      const efMaxVol = efX.length > 0 ? Math.max(...efX) : Infinity;

      const efPairs = efX.map((v,i) => ({ v, r: efY[i] })).sort((a,b) => a.v - b.v);
      function frontierRetAt(vol) {
        if (!efPairs.length) return 0;
        if (vol <= efPairs[0].v) return efPairs[0].r;
        if (vol >= efPairs[efPairs.length-1].v) return efPairs[efPairs.length-1].r;
        for (let i = 1; i < efPairs.length; i++) {
          if (vol <= efPairs[i].v) {
            const t = (vol - efPairs[i-1].v) / (efPairs[i].v - efPairs[i-1].v);
            return efPairs[i-1].r + t * (efPairs[i].r - efPairs[i-1].r);
          }
        }
        return efPairs[efPairs.length-1].r;
      }

      const st = traces[0];
      if (st && st.x && st.y) {
        const sc = st.marker?.color;
        const mn = Array.isArray(sc) ? Math.min(...sc) : 0;
        const mx_c = Array.isArray(sc) ? Math.max(...sc) : 1;
        const volMin = efPairs.length > 0 ? efPairs[0].v : 0;
        const volMax = efMaxVol;
        const volRange = volMax - volMin;
        const retAxis = efPairs.length > 0 ? efPairs[0].r : 0;
        const N_EXTRA = 8000;
        const extraX = [], extraY = [], extraC = [];
        let attempts = 0;
        while (extraX.length < N_EXTRA && attempts < N_EXTRA * 10) {
          attempts++;
          const u = Math.random();
          const t = 1 - Math.pow(1 - u, 1/2.5);
          const vol = volMin + t * volRange;
          const retTop = frontierRetAt(vol);
          const retBot = retAxis - (retTop - retAxis);
          if (retTop <= retBot) continue;
          const ret = retBot + Math.random() * (retTop - retBot);
          const sharpe = vol > 0 ? (ret - 3) / vol : 0;
          const norm = Math.min(1, Math.max(0, (sharpe - mn) / (mx_c - mn + 1e-9)));
          extraX.push(vol); extraY.push(ret); extraC.push(norm);
        }
        const keepIdx = [];
        const ox = st.x, oy = st.y;
        for (let i = 0; i < ox.length; i++) { if (ox[i] <= efMaxVol) keepIdx.push(i); }
        const realX = keepIdx.map(i => ox[i]);
        const realY = keepIdx.map(i => oy[i]);
        const realC = Array.isArray(sc) ? keepIdx.map(i => sc[i]) : [];
        traces[0] = Object.assign({}, st, {
          x: [...realX, ...extraX],
          y: [...realY, ...extraY],
          marker: Object.assign({}, st.marker, { color: [...realC, ...extraC], size: 2.5, opacity: 0.3 })
        });
      }

      const allX = [], allY = [];
      [0, 1, 3, 4].forEach(idx => {
        const tr = traces[idx];
        if (!tr || !tr.x || !tr.y) return;
        tr.x.forEach((v, i) => { if (v != null && tr.y[i] != null) { allX.push(v); allY.push(tr.y[i]); } });
      });

      if (allX.length > 0) {
        const xMin = Math.min(...allX), xMax = Math.max(...allX);
        const yMin = Math.min(...allY), yMax = Math.max(...allY);
        const xPad = (xMax - xMin) * 0.10;
        const yPad = (yMax - yMin) * 0.12;
        layout = Object.assign({}, layout, {
          xaxis: Object.assign({}, layout?.xaxis, { range: [xMin - xPad, xMax + xPad] }),
          yaxis: Object.assign({}, layout?.yaxis, { range: [yMin - yPad, yMax + yPad] })
        });
      }
    }
    return _react(div, traces, layout, config);
  };
})();


// ── Override contact (priorité sur script obfusqué) ──────────────────────────────────────

window.openContact = function() {
  const u = ['armand', 'villata'].join('.');
  const d = ['icloud', 'com'].join('.');
  const addr = u + String.fromCharCode(64) + d;
  const link = document.getElementById('contactMailLink');
  const addrEl = document.getElementById('contactMailAddr');
  if (link) link.href = 'mailto:' + addr;
  if (addrEl) addrEl.textContent = addr;
  document.getElementById('contactPopup').classList.add('active');
};
window.closeContact = function() {
  document.getElementById('contactPopup').classList.remove('active');
};
document.addEventListener('keydown', function(e) { if(e.key==='Escape') closeContact(); });
