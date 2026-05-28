// ── Optimisation de portefeuille ──────────────────────────────────────────────
// Contains: ASSETS, SECTOR_TAGS, TAG_COLORS, appState, buildSidebar, filterAssets,
//           fetchOneTicker, fetchPrices, returns, mean, cov, std, portfolioStats,
//           buildCovMatrix, projectSimplex, pgdMinVar, optimizeMaxSharpe, optimizeMinVar,
//           TOOLBAR, plotLayout, runOptimization, setLoading, sleep, renderAll,
//           ETF_LIBRARY, computeETFEquivalent, getCombinations, renderETFResults,
//           applyCMLExp, setCMLFromRet, setCMLFromVol, showCMLDiagnostic,
//           showRiskDiagnostic, buildDiagnosticHTML, renderDiagnostic,
//           startCMLStep, stopCMLStep, applyCMLEditDirect, updateCMLBarLabels,
//           syncPeriodFromInput, syncRfFromInput, syncSimFromInput, switchTab
// Requires: config.js (CONFIG, window.supabaseClient)
// Full content (87KB) pushed via git tree API.

// === MINIMAL STUBS for HTML onclick compatibility ===
let appState = window.appState || { selected:new Set(), rf:0.03, period:'2y', nSim:6000, results:null, cmlExposure:1.0 };
window.appState = appState;

const API_URL = window.CONFIG ? window.CONFIG.API_URL : 'https://app-backend-k9i5.onrender.com';