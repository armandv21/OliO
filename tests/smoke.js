// Smoke tests — onglet Profil (profile tab changes)
// Run: node tests/smoke.js
'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion échouée');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

// ── Mock DOM minimal ──────────────────────────────────────────────
const _els = {};

function mockEl(id, overrides = {}) {
  _els[id] = { id, textContent: '', innerHTML: '', style: {}, value: '', ...overrides };
  return _els[id];
}

const mockDoc = {
  getElementById: id => _els[id] || null,
  querySelectorAll: () => [],
};

// ── Logique extraite de profile.js ────────────────────────────────

function applyPlanBadge(p, doc) {
  const planDisplay = doc.getElementById('accountPlanDisplay');
  const planSubtext  = doc.getElementById('accountPlanSubtext');
  if (!planDisplay) return;
  const userPlan = p.abonnement || 'gratuit';
  if (userPlan === 'premium') {
    planDisplay.innerHTML = '✦ Premium';
    planDisplay.style.background = '#b38f4f';
    if (planSubtext) planSubtext.textContent = 'Accès illimité';
  } else if (userPlan === 'pro') {
    planDisplay.innerHTML = '✦ Pro';
    planDisplay.style.background = 'var(--blue)';
    if (planSubtext) planSubtext.textContent = 'Accès complet';
  } else {
    planDisplay.innerHTML = 'Gratuit';
    planDisplay.style.background = 'var(--muted)';
    if (planSubtext) planSubtext.textContent = 'Accès basique';
  }
}

function formatDateFR(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function simulateToggleToEditMode(doc) {
  const displayMode = doc.getElementById('profileDisplayMode');
  const editMode    = doc.getElementById('profileEditMode');
  if (!displayMode || !editMode) throw new Error('éléments manquants');

  const pseudo = doc.getElementById('accPseudo').textContent;
  const nom    = doc.getElementById('accNom').textContent;
  const prenom = doc.getElementById('accPrenom').textContent;
  const date   = doc.getElementById('accDate').textContent;

  doc.getElementById('editPseudo').value = pseudo !== '—' ? pseudo : '';
  doc.getElementById('editNom').value    = nom    !== '—' ? nom    : '';
  doc.getElementById('editPrenom').value = prenom !== '—' ? prenom : '';

  if (date !== '—' && date.includes('/')) {
    const [d, m, y] = date.split('/');
    if (d && m && y) doc.getElementById('editDate').value = `${y}-${m}-${d}`;
  }

  displayMode.style.display = 'none';
  editMode.style.display    = 'block';
}

function simulateToggleToDisplayMode(doc) {
  doc.getElementById('profileDisplayMode').style.display = 'block';
  doc.getElementById('profileEditMode').style.display    = 'none';
  doc.getElementById('editProfileMsg').textContent       = '';
}

// ── TESTS ─────────────────────────────────────────────────────────
console.log('\nSmoke tests — onglet Profil\n');

// 1. Badge abonnement
console.log('1. Badge abonnement');

test('abonnement absent  → Gratuit / gris / Accès basique', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({}, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, 'Gratuit');
  assertEqual(_els['accountPlanDisplay'].style.background, 'var(--muted)');
  assertEqual(_els['accountPlanSubtext'].textContent, 'Accès basique');
});

test('abonnement=gratuit → Gratuit / gris / Accès basique', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({ abonnement: 'gratuit' }, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, 'Gratuit');
  assertEqual(_els['accountPlanSubtext'].textContent, 'Accès basique');
});

test('abonnement=pro     → ✦ Pro / bleu / Accès complet', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({ abonnement: 'pro' }, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, '✦ Pro');
  assertEqual(_els['accountPlanDisplay'].style.background, 'var(--blue)');
  assertEqual(_els['accountPlanSubtext'].textContent, 'Accès complet');
});

test('abonnement=premium → ✦ Premium / doré / Accès illimité', () => {
  mockEl('accountPlanDisplay'); mockEl('accountPlanSubtext');
  applyPlanBadge({ abonnement: 'premium' }, mockDoc);
  assertEqual(_els['accountPlanDisplay'].innerHTML, '✦ Premium');
  assertEqual(_els['accountPlanDisplay'].style.background, '#b38f4f');
  assertEqual(_els['accountPlanSubtext'].textContent, 'Accès illimité');
});

test('accountPlanDisplay absent → pas de crash', () => {
  const emptyDoc = { getElementById: () => null };
  applyPlanBadge({ abonnement: 'pro' }, emptyDoc); // ne doit pas lever
});

// 2. Format date
console.log('\n2. Formatage de la date');

test('2000-06-01 → 01/06/2000', () => {
  const r = formatDateFR('2000-06-01');
  assert(r.includes('/'), `pas de slash dans "${r}"`);
  const [d, m, y] = r.split('/');
  assertEqual(d, '01'); assertEqual(m, '06'); assertEqual(y, '2000');
});

test('null → —', () => assertEqual(formatDateFR(null), '—'));
test('chaîne vide → —', () => assertEqual(formatDateFR(''), '—'));

// 3. toggleEditProfile — passage en mode édition
console.log('\n3. Toggle mode édition');

test('passage en édition : champs pré-remplis + visibilité inversée', () => {
  mockEl('profileDisplayMode', { style: {} });
  mockEl('profileEditMode',    { style: { display: 'none' } });
  mockEl('accPseudo',  { textContent: 'educousso' });
  mockEl('accNom',     { textContent: 'Ducousso' });
  mockEl('accPrenom',  { textContent: 'Elise' });
  mockEl('accDate',    { textContent: '11/06/2005' });
  mockEl('editPseudo', { value: '' });
  mockEl('editNom',    { value: '' });
  mockEl('editPrenom', { value: '' });
  mockEl('editDate',   { value: '' });

  simulateToggleToEditMode(mockDoc);

  assertEqual(_els['editPseudo'].value, 'educousso');
  assertEqual(_els['editNom'].value,    'Ducousso');
  assertEqual(_els['editPrenom'].value, 'Elise');
  assertEqual(_els['editDate'].value,   '2005-06-11', 'date inversée pour input[type=date]');
  assertEqual(_els['profileDisplayMode'].style.display, 'none');
  assertEqual(_els['profileEditMode'].style.display,    'block');
});

test('passage en édition : champ date absent (—) → editDate vide', () => {
  mockEl('profileDisplayMode', { style: {} });
  mockEl('profileEditMode',    { style: {} });
  mockEl('accPseudo',  { textContent: 'foo' });
  mockEl('accNom',     { textContent: '—' });
  mockEl('accPrenom',  { textContent: '—' });
  mockEl('accDate',    { textContent: '—' });
  mockEl('editPseudo', { value: '' }); mockEl('editNom', { value: '' });
  mockEl('editPrenom', { value: '' }); mockEl('editDate', { value: '' });

  simulateToggleToEditMode(mockDoc);

  assertEqual(_els['editNom'].value,  '');
  assertEqual(_els['editDate'].value, '');
});

// 4. toggleEditProfile — retour en mode affichage
test('retour affichage : message d\'erreur effacé + visibilité restaurée', () => {
  mockEl('profileDisplayMode', { style: { display: 'none' } });
  mockEl('profileEditMode',    { style: { display: 'block' } });
  mockEl('editProfileMsg', { textContent: 'Erreur lors de la sauvegarde.' });

  simulateToggleToDisplayMode(mockDoc);

  assertEqual(_els['profileDisplayMode'].style.display, 'block');
  assertEqual(_els['profileEditMode'].style.display,    'none');
  assertEqual(_els['editProfileMsg'].textContent, '');
});

// 5. IDs requis présents dans index.html
console.log('\n4. Intégrité de index.html');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

[
  'accountPlanDisplay',
  'accountPlanSubtext',
  'profileDisplayMode',
  'profileEditMode',
  'editPseudo',
  'editNom',
  'editPrenom',
  'editDate',
  'editProfileMsg',
  'resetSuccess',
].forEach(id => {
  test(`id="${id}" présent`, () => assert(html.includes(`id="${id}"`), `id manquant : ${id}`));
});

// 6. Intégrité de profile.js
console.log('\n5. Intégrité de js/profile.js');
const profileJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'profile.js'), 'utf8');

test('window.toggleEditProfile exporté', () =>
  assert(profileJs.includes('window.toggleEditProfile'), 'export manquant'));

test('window.saveProfileData exporté', () =>
  assert(profileJs.includes('window.saveProfileData'), 'export manquant'));

test('requête Supabase inclut abonnement', () =>
  assert(profileJs.includes('abonnement'), 'champ abonnement absent de la requête'));

test('logique badge accountPlanDisplay présente', () =>
  assert(profileJs.includes('accountPlanDisplay'), 'logique badge absente'));

test('logique badge : cas gratuit présent', () =>
  assert(profileJs.includes("'gratuit'") || profileJs.includes('"gratuit"'), 'cas gratuit absent'));

test('logique badge : cas premium présent', () =>
  assert(profileJs.includes("'premium'") || profileJs.includes('"premium"'), 'cas premium absent'));

// ── Résultat ──────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${total} tests — ${passed} ✓  ${failed} ✗\n`);
if (failed > 0) process.exit(1);
