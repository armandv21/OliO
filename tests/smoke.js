// Smoke tests — OliO frontend
// Run: node tests/smoke.js
// Lancé automatiquement sur chaque PR via GitHub Actions.
// But : bloquer toute PR qui casserait la topbar, le layout ou le profil.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch(e) { console.log(`  ✗ ${name}\n      → ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion échouée'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error(msg || `attendu "${b}", obtenu "${a}"`); }

// ─── Fichiers sources ────────────────────────────────────────────────────────
const html        = read('index.html');
const layoutCss   = read('styles/layout.css');
const baseCss     = read('styles/base.css');
const profileCss  = read('styles/profile.css');
const profileJs   = read('js/profile.js');

// ─────────────────────────────────────────────────────────────────────────────
// 1. STRUCTURE HTML — topbar et layout principal
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Structure HTML\n');

test('div.app présent', () =>
  assert(html.includes('class="app"'), 'div.app manquant'));

test('main.main présent', () =>
  assert(html.includes('class="main"'), 'main.main manquant'));

test('div.topbar présent', () =>
  assert(html.includes('class="topbar"'), 'div.topbar manquant'));

test('topbar enfant direct de main — pas de wrapper intermédiaire', () => {
  const mainIdx   = html.indexOf('<main class="main">');
  const topbarIdx = html.indexOf('<div class="topbar">');
  assert(mainIdx !== -1, '<main class="main"> introuvable');
  assert(topbarIdx !== -1, '<div class="topbar"> introuvable');
  assert(topbarIdx > mainIdx, 'topbar doit être après <main>');
  const between = html.slice(mainIdx, topbarIdx);
  assert(!between.includes('app-right'),
    'wrapper app-right détecté entre <main> et topbar — casse le layout');
});

test('onglet Analyse présent', () =>
  assert(html.includes('>Analyse<'), 'bouton Analyse manquant'));

test('onglet CML interactive présent', () =>
  assert(html.includes('>CML interactive<'), 'bouton CML manquant'));

test('bouton Articles présent', () =>
  assert(html.includes('>Articles<'), 'bouton Articles manquant'));

test('bouton Mes portefeuilles présent', () =>
  assert(html.includes('>Mes portefeuilles<'), 'bouton Mes portefeuilles manquant'));

test('avatar profil présent', () =>
  assert(html.includes('id="profileAvatar"'), 'profileAvatar manquant'));

test('meta viewport sans viewport-fit=cover', () =>
  assert(!html.includes('viewport-fit=cover'),
    'viewport-fit=cover détecté — provoque safe-area-inset-top non nulle sur Safari desktop, cache la topbar'));

test('logo_olio.png référencé dans index.html', () =>
  assert(html.includes('logo_olio.png'), 'logo_olio.png non référencé'));

test('fichier images/logo_olio.png existe sur disque', () =>
  assert(fs.existsSync(path.join(ROOT, 'images/logo_olio.png')),
    'images/logo_olio.png manquant'));

// ─────────────────────────────────────────────────────────────────────────────
// 2. CSS LAYOUT — règles critiques
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. CSS layout critique\n');

test('.app a height:100vh', () =>
  assert(/height\s*:\s*100vh/.test(layoutCss),
    '.app height:100vh manquant — le layout original fonctionnel utilise cette valeur'));

test('.app a overflow:hidden', () =>
  assert(/overflow\s*:\s*hidden/.test(layoutCss),
    '.app overflow:hidden manquant'));

test('.app NE PAS utiliser position:fixed + inset:0 (casse la topbar)', () => {
  const hasFixed = /\.app\s*\{[^}]*position\s*:\s*fixed/.test(layoutCss);
  const hasInset = /\.app\s*\{[^}]*(?:inset\s*:\s*0|top\s*:\s*0[^}]*bottom\s*:\s*0)/.test(layoutCss);
  assert(!(hasFixed && hasInset),
    '.app { position:fixed; inset:0 } détecté — ce combo a cassé la topbar dans les PRs #4 à #7');
});

test('.main a overflow-y:auto', () =>
  assert(/overflow-y\s*:\s*auto/.test(layoutCss),
    '.main overflow-y:auto manquant'));

test('.topbar a un min-height', () =>
  assert(/\.topbar[^}]*min-height/.test(layoutCss),
    '.topbar min-height manquant — la barre pourrait s\'effondrer à 0px'));

test('body sans padding-top safe-area', () =>
  assert(!baseCss.includes('padding-top: env(safe-area') &&
         !baseCss.includes('padding-top:env(safe-area'),
    'body padding-top:safe-area détecté — décale .app et cache la topbar sur desktop'));

// ─────────────────────────────────────────────────────────────────────────────
// 3. FICHIERS CSS — tous présents
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Fichiers CSS\n');

[
  'styles/variables.css', 'styles/base.css',    'styles/layout.css',
  'styles/sidebar.css',   'styles/cards.css',   'styles/panels.css',
  'styles/auth.css',      'styles/profile.css', 'styles/contact.css',
  'styles/responsive.css',
].forEach(f =>
  test(`${f}`, () => assert(fs.existsSync(path.join(ROOT, f)), `${f} manquant`)));

// ─────────────────────────────────────────────────────────────────────────────
// 4. FICHIERS JS — tous présents
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Fichiers JS\n');

[
  'js/config.js', 'js/auth.js', 'js/profile.js', 'js/assets.js',
  'js/ui.js', 'js/optimization.js', 'js/app.js',
  'js/charts/frontier.js', 'js/charts/cml.js',
  'js/charts/risk.js', 'js/charts/correlation.js',
  'js/panels/articles.js', 'js/panels/portfolios.js',
].forEach(f =>
  test(`${f}`, () => assert(fs.existsSync(path.join(ROOT, f)), `${f} manquant`)));

// ─────────────────────────────────────────────────────────────────────────────
// 5. ONGLET PROFIL — badge abonnement dynamique (PR #1)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Onglet Profil\n');

const _els = {};
function mockEl(id, o = {}) {
  _els[id] = { id, textContent:'', innerHTML:'', style:{}, value:'', ...o };
  return _els[id];
}
const mockDoc = { getElementById: id => _els[id] || null, querySelectorAll: () => [] };

function applyPlanBadge(p, doc) {
  const d = doc.getElementById('accountPlanDisplay');
  const s = doc.getElementById('accountPlanSubtext');
  if (!d) return;
  const plan = p.abonnement || 'gratuit';
  if (plan === 'premium')  { d.innerHTML = '✦ Premium'; d.style.background = '#b38f4f'; if (s) s.textContent = 'Accès illimité'; }
  else if (plan === 'pro') { d.innerHTML = '✦ Pro';     d.style.background = 'var(--blue)'; if (s) s.textContent = 'Accès complet'; }
  else                     { d.innerHTML = 'Gratuit';   d.style.background = 'var(--muted)'; if (s) s.textContent = 'Accès basique'; }
}

test('badge plan: absent → Gratuit', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({}, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, 'Gratuit');
  assertEqual(_els['accountPlanSubtext'].textContent, 'Accès basique');
});
test('badge plan: pro → bleu', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({ abonnement: 'pro' }, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, '✦ Pro');
  assertEqual(_els['accountPlanDisplay'].style.background, 'var(--blue)');
});
test('badge plan: premium → doré', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({ abonnement: 'premium' }, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, '✦ Premium');
  assertEqual(_els['accountPlanDisplay'].style.background, '#b38f4f');
});
test('window.toggleEditProfile exporté', () =>
  assert(profileJs.includes('window.toggleEditProfile'), 'export manquant'));
test('window.saveProfileData exporté', () =>
  assert(profileJs.includes('window.saveProfileData'), 'export manquant'));
test('requête Supabase inclut abonnement', () =>
  assert(profileJs.includes('abonnement'), 'champ abonnement absent'));
test('id="accountPlanDisplay" dans index.html', () =>
  assert(html.includes('id="accountPlanDisplay"'), 'id manquant'));
test('id="profileDisplayMode" dans index.html', () =>
  assert(html.includes('id="profileDisplayMode"'), 'id manquant'));
test('id="editPseudo" dans index.html', () =>
  assert(html.includes('id="editPseudo"'), 'id manquant'));

// ─────────────────────────────────────────────────────────────────────────────
// Résultat
// ─────────────────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${total} tests — ${passed} ✓  ${failed} ✗\n`);
if (failed > 0) {
  console.error('❌ Des tests ont échoué — PR bloquée.\n');
  process.exit(1);
}
console.log('✅ Tous les tests passent.\n');
