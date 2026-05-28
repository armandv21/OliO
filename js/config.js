// ── Configuration globale ────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL:      'https://cswadcooedwwhfbliyqp.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_y8qFuX9C81wb0TEjssnBxg_BqO6vO6d',
  API_URL:           'https://app-backend-k9i5.onrender.com',
};

// Client Supabase (disponible globalement)
window.supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Exposer pour compat legacy
window.CONFIG = CONFIG;
