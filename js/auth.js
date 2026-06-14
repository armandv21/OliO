// ── Authentification (Supabase) ─────────────────────────────────────────────
// Requires: config.js (window.supabaseClient)

// --- FONCTIONS D'AUTHENTIFICATION ---
window.toggleAuthView = function(view) {
  const loginView = document.getElementById('loginView');
  const signupView = document.getElementById('signupView');
  const errDiv = document.getElementById('authError');
  errDiv.textContent = ''; 

  if (view === 'signup') {
    loginView.style.display = 'none';   
    signupView.style.display = 'block'; 
  } else {
    signupView.style.display = 'none';  
    loginView.style.display = 'block';  
  }
};

window.doSignup = async function() {
  const errDiv = document.getElementById('authError');
  errDiv.style.color = 'var(--rose-lt)';
  errDiv.textContent = '';

  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPass').value;
  const pseudo = document.getElementById('signupPseudo').value.trim();
  const nom = document.getElementById('signupNom').value.trim();
  const prenom = document.getElementById('signupPrenom').value.trim();
  const dateNaissance = document.getElementById('signupDate').value;

// 🌟 GESTION DE L'ERREUR CONTEXTUELLE DES CGU 🌟
  const cguCheckbox = document.getElementById('cgu-checkbox');
  const cguError = document.getElementById('cguError');
  
  // On réinitialise l'affichage au cas où
  if (cguError) cguError.style.display = 'none';
  if (cguCheckbox) {
      cguCheckbox.style.boxShadow = 'none';
      cguCheckbox.style.border = 'none';
  }

  if (cguCheckbox && !cguCheckbox.checked) {
    // 1. Affiche le message rouge
    if (cguError) cguError.style.display = 'block';
    
    // 2. La touche "Pro" : Un halo rouge translucide doux
    cguCheckbox.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.25)";
    cguCheckbox.style.borderRadius = "3px"; // Arrondit légèrement le halo pour suivre la case
    
    // (Optionnel) On tente de colorer la bordure pour les navigateurs qui l'acceptent
    cguCheckbox.style.border = "1px solid #ef4444"; 
    
    return; // On arrête tout, pas d'inscription
  }

  // Vérification des autres champs standards (affichés en haut)
  if (!email || !password || !pseudo) { 
    errDiv.textContent = "Veuillez renseigner tous les champs obligatoires pour finaliser votre inscription."; 
    return; 
  }

  const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
    email: email,
    password: password,
  });

  if (authError) {
    errDiv.textContent = 'Erreur inscription : ' + authError.message;
    return;
  }

  if (authData.user) {
    const { error: profileError } = await window.supabaseClient
      .from('data') 
      .insert([{ 
        id: authData.user.id,
        pseudo: pseudo,
        nom: nom,
        prenom: prenom,
        date_naissance: dateNaissance || null
      }]);
    if (profileError) console.error("Erreur d'insertion dans la table data:", profileError);
  }

  errDiv.style.color = 'var(--teal)'; 
  errDiv.textContent = 'Compte créé ! Redirection vers la connexion...';
  document.getElementById('signupPass').value = '';
  
  setTimeout(() => {
    toggleAuthView('login');
    document.getElementById('loginEmail').value = email;
    errDiv.textContent = '';
  }, 2000);
};

window.doLogin = async function() {
  const errDiv = document.getElementById('authError');
  const identifier = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  
  errDiv.style.color = 'var(--rose-lt)'; 
  errDiv.textContent = '';

  if (!identifier || !password) { 
    errDiv.textContent = 'Veuillez compléter tous les champs.'; 
    return; 
  }

  let finalEmail = identifier;

  if (!identifier.includes('@')) {
    const { data: emailData, error: rpcError } = await window.supabaseClient
        .rpc('get_email_by_pseudo', { search_pseudo: identifier });
    if (rpcError || !emailData) {
        errDiv.textContent = 'Identifiant ou mot de passe incorrect.';
        return;
    }
    finalEmail = emailData; 
  }

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email: finalEmail,
    password: password,
  });

  if (error) {
    errDiv.textContent = 'Identifiant ou mot de passe incorrect.';
  } else {
    sessionStorage.setItem('mrkwtz_auth', '1');
    updateAuthUI(true);
    document.getElementById('authOverlay').classList.add('hidden');
  }
};


document.addEventListener('keydown', function(e) {
  const authOverlay = document.getElementById('authOverlay');
  const loginView = document.getElementById('loginView');
  if (e.key === 'Enter' && !authOverlay.classList.contains('hidden')) {
    if (loginView.style.display !== 'none') doLogin();
    else doSignup();
  }
});


// --- GESTION DE L'AFFICHAGE MODALE ---
window.openAuthModal = function() {
  document.getElementById('authOverlay').classList.remove('hidden');
};

window.closeAuthModal = function() {
  document.getElementById('authOverlay').classList.add('hidden');
};

// --- GESTION DU MENU HAUT (Bouton Connexion vs Profil) ---
window.updateAuthUI = function(isLoggedIn) {
  const loginBtn = document.getElementById('btnTopLogin');
  const profileWrap = document.getElementById('profileWrap');
  
  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none'; // Cache le bouton connexion
    if (profileWrap) profileWrap.style.display = 'flex'; // Affiche le profil
  } else {
    if (loginBtn) loginBtn.style.display = 'block'; // Affiche le bouton connexion
    if (profileWrap) profileWrap.style.display = 'none'; // Cache le profil
  }
};

window.doLogout = async function() {
  await window.supabaseClient.auth.signOut(); 
  sessionStorage.removeItem('mrkwtz_auth');
  
  // On met à jour l'interface (retour au mode gratuit)
  updateAuthUI(false);
  
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('authError').textContent = '';
  toggleAuthView('login');
  
  // Optionnel : tu pourrais ajouter un window.location.reload() ici 
  // si tu veux vider le graphique quand l'utilisateur se déconnecte.
};

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await window.supabaseClient.auth.getSession();
    if (data.session) {
      sessionStorage.setItem('mrkwtz_auth', '1');
      updateAuthUI(true); // Passe en mode connecté
      loadProfileInfo();
    } else {
      updateAuthUI(false); // Mode visiteur
    }
});

// Fait disparaître l'alerte instantanément dès que l'utilisateur coche la case
document.getElementById('cgu-checkbox')?.addEventListener('change', function() {
  if (this.checked) {
    document.getElementById('cguError').style.display = 'none';
    this.style.boxShadow = 'none';
    this.style.border = 'none';
  }
});

// --- GESTION DYNAMIQUE DES PANNEAUX LÉGAUX (CGU) ---
window.openCgu = async function() {
  const panel = document.getElementById('panelCgu');
  const body = document.getElementById('panelCguBody');
  
  if (panel && body) {
    // 🌟 INTELLIGENT : On ne télécharge le fichier que s'il est vide
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p style="text-align:center; color:var(--muted); font-style:italic;">Chargement des CGU...</p>';
      try {
        const response = await fetch('cgu-content.html');
        body.innerHTML = await response.text();
      } catch (err) {
        body.innerHTML = '<p style="color:var(--rose-lt); text-align:center;">Erreur lors du chargement des conditions générales.</p>';
      }
    }
    
    panel.classList.add('active', 'open');
    panel.style.display = 'block';
    panel.style.zIndex = '12000';
  }
};

window.closeCgu = function() {
  const panel = document.getElementById('panelCgu');
  if (panel) {
    panel.classList.remove('active', 'open');
    panel.style.display = 'none';
  }
};

// --- GESTION DYNAMIQUE DES PANNEAUX LÉGAUX (CONFIDENTIALITÉ) ---
window.openPrivacy = async function() {
  const panel = document.getElementById('panelPrivacy');
  const body = document.getElementById('panelPrivacyBody');
  
  if (panel && body) {
    // On ne télécharge le fichier que s'il est vide
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p style="text-align:center; color:var(--muted); font-style:italic;">Chargement de la politique...</p>';
      try {
        const response = await fetch('privacy-content.html');
        body.innerHTML = await response.text();
      } catch (err) {
        body.innerHTML = '<p style="color:var(--rose-lt); text-align:center;">Erreur lors du chargement de la politique de confidentialité.</p>';
      }
    }
    
    panel.classList.add('active', 'open');
    panel.style.display = 'block';
    panel.style.zIndex = '12000';
  }
};

window.closePrivacy = function() {
  const panel = document.getElementById('panelPrivacy');
  if (panel) {
    panel.classList.remove('active', 'open');
    panel.style.display = 'none';
  }
};

// --- RETIRER L'ERREUR INSTANTANÉMENT QUAND ON COCHE LA CASE ---
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'cgu-checkbox') {
    if (e.target.checked) {
      const errorMsg = document.getElementById('cguError');
      if (errorMsg) errorMsg.style.display = 'none';
      e.target.style.boxShadow = 'none';
      e.target.style.border = 'none';
    }
  }
});