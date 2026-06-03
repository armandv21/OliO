// ── Stripe Checkout ────────────────────────────────────────────────
// Requires: config.js (window.supabaseClient, window.CONFIG)

window.upgradeToPro = async function() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    if (typeof openAuthModal === 'function') openAuthModal();
    return;
  }

  const btn = document.getElementById('btnUpgradePro');
  if (btn) { btn.disabled = true; btn.textContent = 'Redirection vers Stripe…'; }

  try {
    const resp = await fetch(`${window.CONFIG.API_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (!resp.ok) throw new Error('Erreur serveur');
    const { url } = await resp.json();
    window.location.href = url;
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '✦ Passer à la version Pro'; }
    alert('Erreur lors de la redirection vers le paiement. Réessayez.');
  }
};

// Handle return from Stripe Checkout
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    window.history.replaceState({}, '', window.location.pathname);
    // Wait 2s for webhook to process, then refresh profile
    setTimeout(async () => {
      if (typeof loadProfileInfo === 'function') {
        window._profileLoaded = false;
        await loadProfileInfo();
      }
      _showStripeToast('✦ Bienvenue dans la version Pro !', 'var(--teal)');
    }, 2000);
  } else if (params.get('payment') === 'cancel') {
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

function _showStripeToast(msg, bg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${bg};color:white;padding:13px 20px;border-radius:8px;font-size:0.82rem;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.25);letter-spacing:0.02em;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 4500);
}
