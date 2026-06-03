// ── Profil utilisateur ──────────────────────────────────────────────────────────
// Requires: config.js (window.supabaseClient), optimization.js (syncAllParams)


// ── PROFILE DROPDOWN ───────────────────────────────────────────────────────
let _profileLoaded = false;
let _profileData = null; // cache des données profil

function toggleProfileDropdown() {
  const dd = document.getElementById('profileDropdown');
  const av = document.getElementById('profileAvatar');
  const isOpen = dd.classList.contains('open');
  if (isOpen) {
    dd.classList.remove('open');
    av.classList.remove('active');
  } else {
    dd.classList.add('open');
    av.classList.add('active');
    if (!_profileLoaded) loadProfileInfo();
    else _populateAccountPane(_profileData);
    _syncProfileSimRange();
  }
}

// Fermer si clic ailleurs
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('profileWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('profileDropdown')?.classList.remove('open');
    document.getElementById('profileAvatar')?.classList.remove('active');
  }
});

function switchProfileTab(tabId, btn) {
  document.querySelectorAll('.profile-dd-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.profile-dd-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = document.getElementById('pane-' + tabId);
  if (pane) pane.classList.add('active');
}

// ── Préférences locales ──
function saveProfilePref(key, val) {
  try { localStorage.setItem('mrkwtz_pref_' + key, val); } catch(e) {}
}
function loadProfilePrefs() {
  try {
    const langue = localStorage.getItem('mrkwtz_pref_langue') || 'fr';
    const devise = localStorage.getItem('mrkwtz_pref_devise') || 'eur';
    const el = document.getElementById('pref-langue');
    const ed = document.getElementById('pref-devise');
    if (el) el.value = langue;
    if (ed) ed.value = devise;
  } catch(e) {}
}

// ── Curseur simulations (sync avec le paramètre global) ──
function _syncProfileSimRange() {
  const globalSim = document.getElementById('homeSimInput');
  const profileRange = document.getElementById('profileSimRange');
  const profileVal = document.getElementById('profileSimVal');
  const val = globalSim ? parseInt(globalSim.value) || 6000 : 6000;
  if (profileRange) profileRange.value = val;
  if (profileVal) profileVal.textContent = val.toLocaleString('fr-FR');
}

function onProfileSimChange(val) {
  const v = parseInt(val);
  const profileVal = document.getElementById('profileSimVal');
  if (profileVal) profileVal.textContent = v.toLocaleString('fr-FR');
  if (typeof syncAllParams === 'function') syncAllParams('sim', v);
}

// ── Charger les infos profil depuis Supabase ──
async function loadProfileInfo() {
  _profileLoaded = true;
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const email = user.email || '';
    const { data: profile } = await window.supabaseClient
      .from('data')
      .select('pseudo, nom, prenom, date_naissance, abonnement')
      .eq('id', user.id)
      .single();
    _profileData = { ...profile, email };
    _applyProfileToUI(_profileData);
    _populateAccountPane(_profileData);
    loadProfilePrefs();
  } catch(e) { /* silencieux */ }
}

function _applyProfileToUI(p) {
  if (!p) return;
  const pseudo = p?.pseudo || p?.prenom || (p?.email || '').split('@')[0] || '?';
  const initials = pseudo.slice(0, 2).toUpperCase();
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('profileAvatar', initials);
  setEl('profileAvatarLg', initials);
  setEl('profileDdName', pseudo);
  setEl('profileDdEmail', p.email || '');
}

function _populateAccountPane(p) {
  if (!p) return;
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
  setEl('accPseudo', p.pseudo);
  setEl('accNom', p.nom);
  setEl('accPrenom', p.prenom);
  setEl('accEmail', p.email);
  if (p.date_naissance) {
    try {
      const d = new Date(p.date_naissance);
      setEl('accDate', d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    } catch(e) { setEl('accDate', p.date_naissance); }
  } else { setEl('accDate', '—'); }

  const planDisplay = document.getElementById('accountPlanDisplay');
  const planSubtext = document.getElementById('accountPlanSubtext');
  if (planDisplay) {
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
  // Show upgrade button only for free users
  const upgradeBtn = document.getElementById('btnUpgradePro');
  if (upgradeBtn) upgradeBtn.style.display = (!p.abonnement || p.abonnement === 'gratuit') ? 'block' : 'none';
}

// ── Réinitialisation mot de passe ──
async function sendPasswordReset() {
  const btn = document.querySelector('.profile-reset-btn');
  const success = document.getElementById('resetSuccess');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user?.email) throw new Error('no email');
    await window.supabaseClient.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin });
    if (success) success.style.display = 'block';
    setTimeout(() => { if (success) success.style.display = 'none'; }, 5000);
  } catch(e) { /* silencieux */ }
  finally { setTimeout(() => { if (btn) { btn.disabled = false; btn.style.opacity = '1'; } }, 3000); }
}

// ── Charger au login (onAuthStateChange) ──
window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    _profileLoaded = false; _profileData = null;
    setTimeout(async () => {
      try {
        const user = session.user;
        const email = user.email || '';
        const { data: profile } = await window.supabaseClient
          .from('data').select('pseudo, nom, prenom, date_naissance, abonnement').eq('id', user.id).single();
        _profileData = { ...profile, email };
        _applyProfileToUI(_profileData);
        _profileLoaded = true;
      } catch(e) {}
    }, 400);
  }
});

window.toggleEditProfile = function() {
  const displayMode = document.getElementById('profileDisplayMode');
  const editMode = document.getElementById('profileEditMode');
  if (!displayMode || !editMode) return;

  if (displayMode.style.display === 'none') {
    displayMode.style.display = 'block';
    editMode.style.display = 'none';
    document.getElementById('editProfileMsg').textContent = '';
  } else {
    const currentPseudo = document.getElementById('accPseudo').textContent;
    const currentNom = document.getElementById('accNom').textContent;
    const currentPrenom = document.getElementById('accPrenom').textContent;
    const currentDate = document.getElementById('accDate').textContent;
    document.getElementById('editPseudo').value = currentPseudo !== '—' ? currentPseudo : '';
    document.getElementById('editNom').value = currentNom !== '—' ? currentNom : '';
    document.getElementById('editPrenom').value = currentPrenom !== '—' ? currentPrenom : '';
    if (currentDate !== '—' && currentDate.includes('/')) {
      const parts = currentDate.split('/');
      if (parts.length === 3) document.getElementById('editDate').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    displayMode.style.display = 'none';
    editMode.style.display = 'block';
  }
};

window.saveProfileData = async function() {
  const msgDiv = document.getElementById('editProfileMsg');
  msgDiv.style.color = 'var(--muted)';
  msgDiv.textContent = 'Enregistrement en cours...';

  const newPseudo = document.getElementById('editPseudo').value.trim();
  const newNom = document.getElementById('editNom').value.trim();
  const newPrenom = document.getElementById('editPrenom').value.trim();
  const newDate = document.getElementById('editDate').value;

  try {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Utilisateur non connecté.');
    const { error } = await window.supabaseClient
      .from('data')
      .update({ pseudo: newPseudo, nom: newNom, prenom: newPrenom, date_naissance: newDate || null })
      .eq('id', user.id);
    if (error) throw error;

    document.getElementById('accPseudo').textContent = newPseudo || '—';
    document.getElementById('accNom').textContent = newNom || '—';
    document.getElementById('accPrenom').textContent = newPrenom || '—';
    if (newDate) {
      const d = new Date(newDate);
      document.getElementById('accDate').textContent = d.toLocaleDateString('fr-FR');
    } else {
      document.getElementById('accDate').textContent = '—';
    }
    if (_profileData) { _profileData.pseudo = newPseudo; _profileData.nom = newNom; _profileData.prenom = newPrenom; }
    _applyProfileToUI({ ..._profileData, pseudo: newPseudo });

    msgDiv.style.color = 'var(--teal)';
    msgDiv.textContent = 'Modifications enregistrées avec succès !';
    setTimeout(() => window.toggleEditProfile(), 1200);
  } catch(err) {
    msgDiv.style.color = 'var(--rose-lt)';
    msgDiv.textContent = 'Erreur lors de la sauvegarde.';
  }
};

// Expose globally for HTML onclick
// ── VÉRIFICATION DE L'ABONNEMENT PREMIUM ──
window.isUserPremium = function() {
    if (!_profileData || !_profileData.abonnement) return false;
    const plan = _profileData.abonnement.toLowerCase();
    return plan === 'premium' || plan === 'pro'; 
};
window.toggleProfileDropdown = toggleProfileDropdown;
window.switchProfileTab = switchProfileTab;
window.saveProfilePref = saveProfilePref;
window.loadProfilePrefs = loadProfilePrefs;
window.loadProfileInfo = loadProfileInfo;
window.sendPasswordReset = sendPasswordReset;
window.onProfileSimChange = onProfileSimChange;
