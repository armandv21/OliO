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

  if (!email || !password || !pseudo) { 
    errDiv.textContent = 'Veuillez remplir au moins l\'email, le mot de passe et le pseudo.'; 
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
    errDiv.textContent = 'Veuillez remplir tous les champs.'; 
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
    if (profileWrap) profileWrap.style.display = 'block'; // Affiche le profil
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
