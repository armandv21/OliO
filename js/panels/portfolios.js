// ── Panneau Portefeuilles ────────────────────────────────────────────────────
// Requires: config.js (window.supabaseClient), optimization.js (appState, portfolioStats)


window.toggleEditProfile = function() {
    const displayMode = document.getElementById('profileDisplayMode');
    const editMode = document.getElementById('profileEditMode');
    
    if (!displayMode || !editMode) {
        console.error("Erreur : Les zones du profil sont introuvables.");
        return;
    }

    if (displayMode.style.display === 'none') {
        // Mode affichage
        displayMode.style.display = 'block';
        editMode.style.display = 'none';
        document.getElementById('editProfileMsg').textContent = '';
    } else {
        // Mode édition : on récupère ce qui est écrit à l'écran pour pré-remplir
        const currentPseudo = document.getElementById('accPseudo').textContent;
        const currentNom = document.getElementById('accNom').textContent;
        const currentPrenom = document.getElementById('accPrenom').textContent;
        const currentDate = document.getElementById('accDate').textContent;

        document.getElementById('editPseudo').value = (currentPseudo !== '—') ? currentPseudo : '';
        document.getElementById('editNom').value = (currentNom !== '—') ? currentNom : '';
        document.getElementById('editPrenom').value = (currentPrenom !== '—') ? currentPrenom : '';
        
        // Pour la date, il faut inverser le format (JJ/MM/AAAA vers AAAA-MM-JJ) pour l'input
        if (currentDate !== '—' && currentDate.includes('/')) {
            const parts = currentDate.split('/');
            if (parts.length === 3) {
                document.getElementById('editDate').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
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
        if (userError || !user) throw new Error("Utilisateur non connecté.");

        const { error } = await window.supabaseClient
            .from('data')
            .update({
                pseudo: newPseudo,
                nom: newNom,
                prenom: newPrenom,
                date_naissance: newDate || null
            })
            .eq('id', user.id);

        if (error) throw error;

        // Mise à jour de l'affichage directement à l'écran
        document.getElementById('accPseudo').textContent = newPseudo || '—';
        document.getElementById('accNom').textContent = newNom || '—';
        document.getElementById('accPrenom').textContent = newPrenom || '—';
        
        if (newDate) {
            const d = new Date(newDate);
            document.getElementById('accDate').textContent = d.toLocaleDateString('fr-FR');
        } else {
            document.getElementById('accDate').textContent = '—';
        }

        // Mettre à jour l'icône en haut si elle existe
        const topbarName = document.getElementById('topbarUserName');
        if (topbarName && newPseudo) topbarName.textContent = newPseudo;

        msgDiv.style.color = 'var(--teal)';
        msgDiv.textContent = 'Modifications enregistrées avec succès !';
        
        setTimeout(() => {
            toggleEditProfile();
        }, 1200);

    } catch (error) {
        console.error("Erreur d'enregistrement:", error);
        msgDiv.style.color = 'var(--rose-lt)';
        msgDiv.textContent = 'Erreur lors de la sauvegarde.';
    }
};


// ── SAUVEGARDE DE PORTEFEUILLE (POPUP) ──
let _tempPortfolioData = null;

window.openSavePortfolio = function(source) {
    // 1. Déterminer quel tableau lire (cmlAllocTable ou allocTable)
    let targetId = 'allocTable'; 
    if (source) {
        targetId = source + 'AllocTable'; 
    }

    const tableContainer = document.getElementById(targetId) || document.getElementById('allocTable');
    
    if (!tableContainer) {
        alert("Erreur technique : zone de résultats introuvable.");
        return;
    }

    // 2. Extraire les données du tableau
    const rows = tableContainer.querySelectorAll('tr'); 
    const composition = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const ticker = cells[0].textContent.trim();
            let weightText = cells[1].textContent.trim();
            
            if (ticker && weightText) {
                weightText = weightText.replace('%', '').replace(',', '.').trim();
                const weight = parseFloat(weightText);
                
                if (!isNaN(weight)) {
                    composition.push({ ticker: ticker, weight: weight / 100 });
                }
            }
        }
    });

    if (composition.length === 0) {
        alert("Aucune donnée détectée. Faites d'abord un calcul de portefeuille.");
        return;
    }

    // 3. Ouvrir le pop-up et vider l'input (avec LE BON ID : savePortfolioName)
    _tempPortfolioData = composition;
    
    const popup = document.getElementById('savePortfolioPopup');
    if (popup) {
        popup.style.display = 'flex'; // ou block selon ton affichage
        popup.classList.remove('hidden'); 
    }
    
    const inputField = document.getElementById('savePortfolioName');
    if (inputField) {
        inputField.value = '';
        inputField.focus();
    }
};

window.applyPortfolio = function(composition) {
    if (!composition || composition.length === 0) {
        console.error("Composition vide ou invalide");
        return;
    }

    // 1. On vide la sélection actuelle dans la mémoire de l'app
    if (typeof appState !== 'undefined' && appState.selected) {
        appState.selected.clear();
    }

    // 2. On récupère toutes les checkboxes de la page
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    let matchedCount = 0;

    // On prépare une liste propre des tickers du portefeuille (en MAJUSCULES)
    const portfolioTickers = composition.map(c => c.ticker.toUpperCase().trim());

    allCheckboxes.forEach(cb => {
        const cbValue = cb.value.toUpperCase().trim();
        
        // On vérifie si cette checkbox fait partie du portefeuille
        const isMatch = portfolioTickers.includes(cbValue);

        if (isMatch) {
            cb.checked = true;
            matchedCount++;
            
            // On l'ajoute à la mémoire globale
            if (typeof appState !== 'undefined') appState.selected.add(cb.value);
            
            // --- CRUCIAL : ON DÉCLENCHE L'ÉVÉNEMENT CHANGE ---
            // Sans ça, le moteur de calcul croit que rien n'est sélectionné
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Mise à jour visuelle de la ligne (couleur bleue)
            const row = cb.closest('.asset-item, .home-asset-row');
            if (row) row.classList.add('selected');
        } else {
            cb.checked = false;
            const row = cb.closest('.asset-item, .home-asset-row');
            if (row) row.classList.remove('selected');
        }
    });

    // 3. Mise à jour des compteurs de l'interface
    const totalSelected = (typeof appState !== 'undefined') ? appState.selected.size : matchedCount;
    if (document.getElementById('selectedCount')) document.getElementById('selectedCount').textContent = totalSelected;
    if (document.getElementById('homeSelectedCount')) document.getElementById('homeSelectedCount').textContent = totalSelected;

    // 4. Navigation : On ferme le panneau Archive et on va sur l'onglet CML
    if (typeof closeFullPanel === 'function') closeFullPanel('portefeuilles');
    
    const cmlBtn = document.querySelector("button[onclick*='cml']");
    if (cmlBtn && typeof switchTab === 'function') {
        switchTab('cml', cmlBtn);
    }

    // 5. LANCEMENT DU CALCUL
    // On attend 800ms pour laisser le temps à l'interface de se stabiliser
    setTimeout(() => {
        if (typeof runOptimization === 'function') {
            console.log("Actualisation : Lancement du calcul pour", Array.from(appState.selected));
            runOptimization();
        } else {
            console.error("Fonction runOptimization non trouvée");
        }
    }, 800);
};

window.closeSavePortfolio = function() {
    const popup = document.getElementById('savePortfolioPopup');
    if (popup) {
        popup.style.display = 'none';
        popup.classList.add('hidden');
    }
    const inputField = document.getElementById('savePortfolioName');
    if (inputField) {
        inputField.value = '';
        inputField.style.borderColor = ''; // On remet la bordure normale
    }
    const msgDiv = document.getElementById('savePortfolioMsg');
    if (msgDiv) {
        msgDiv.textContent = ''; // On efface le message précédent
    }
    _tempPortfolioData = null;
};

window.confirmSavePortfolio = async function() {
    const inputField = document.getElementById('savePortfolioName');
    if (!inputField) return;

    // 1. On crée dynamiquement la zone de message si elle n'existe pas
    let msgDiv = document.getElementById('savePortfolioMsg');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'savePortfolioMsg';
        msgDiv.style.fontSize = '0.8rem';
        msgDiv.style.marginTop = '-10px';
        msgDiv.style.marginBottom = '15px';
        msgDiv.style.textAlign = 'center';
        msgDiv.style.fontWeight = '600';
        inputField.parentElement.after(msgDiv);
    }

    const name = inputField.value.trim();
    
    // On remet la bordure normale par défaut
    inputField.style.borderColor = 'var(--border2)';

    if (!name) {
        msgDiv.style.color = 'var(--rose-lt, #ff4d4f)';
        msgDiv.textContent = "Veuillez donner un nom à votre portefeuille.";
        return;
    }

    msgDiv.style.color = 'var(--muted)';
    msgDiv.textContent = "Vérification et enregistrement...";

    try {
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        
        if (userError || !user) {
            msgDiv.style.color = 'var(--rose-lt, #ff4d4f)';
            msgDiv.textContent = "Vous devez être connecté.";
            return;
        }

        // --- NOUVEAUTÉ 1 : VÉRIFICATION DE LA LIMITE DE 20 ---
        // On demande à Supabase de compter exactement combien de portefeuilles possède cet utilisateur
        const { count, error: countError } = await window.supabaseClient
            .from('portfolio')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) throw countError;

        if (count >= 20) {
            msgDiv.style.color = 'var(--rose-lt, #ff4d4f)';
            msgDiv.textContent = "Limite atteinte (20 portefeuilles maximum).";
            inputField.style.borderColor = 'var(--rose-lt, #ff4d4f)';
            return; // On bloque l'enregistrement
        }
        // ----------------------------------------------------

        // --- NOUVEAUTÉ 2 : VÉRIFICATION DES DOUBLONS (déjà présent) ---
        const { data: existingPortfolios, error: searchError } = await window.supabaseClient
            .from('portfolio')
            .select('id')
            .eq('user_id', user.id)
            .ilike('nom', name); 

        if (searchError) throw searchError;

        if (existingPortfolios && existingPortfolios.length > 0) {
            msgDiv.style.color = 'var(--rose-lt, #ff4d4f)';
            msgDiv.textContent = "Vous avez déjà un portefeuille avec ce nom.";
            inputField.style.borderColor = 'var(--rose-lt, #ff4d4f)'; 
            return; 
        }
        // ----------------------------------------------

        // Nettoyage final pour être certain de n'avoir que le ticker court (ex: AMZN)
        const finalComposition = _tempPortfolioData.map(item => {
            const match = item.ticker.match(/\(([^)]+)\)/);
            return {
                ticker: match ? match[1].trim() : item.ticker.trim(),
                weight: item.weight
            };
        });

        const { error } = await window.supabaseClient
            .from('portfolio')
            .insert([
                { 
                    user_id: user.id, 
                    nom: name, 
                    composition: finalComposition // On utilise la version nettoyée
                }
            ]);
        // Succès
        msgDiv.style.color = 'var(--teal, #20c997)';
        msgDiv.textContent = "✓ Portefeuille enregistré !";
        inputField.style.borderColor = 'var(--teal, #20c997)';
        
        setTimeout(() => {
            closeSavePortfolio();
        }, 1500);

    } catch (err) {
        console.error("Erreur lors de la sauvegarde:", err);
        msgDiv.style.color = 'var(--rose-lt, #ff4d4f)';
        msgDiv.textContent = "Erreur de connexion.";
    }
};

// ── GESTION DE L'AFFICHAGE "MES PORTEFEUILLES" ──

window.showPortfolioDetails = function(nom, composition) {
    document.getElementById('detailsPfName').textContent = nom;
    const tbody = document.getElementById('detailsPfBody');
    tbody.innerHTML = ''; // On vide l'ancien tableau

    // On remplit le tableau avec l'archive
    composition.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        
        const tdTicker = document.createElement('td');
        tdTicker.style.padding = '12px 0';
        tdTicker.style.fontFamily = 'var(--font-sans)';
        tdTicker.style.fontWeight = '600';
        tdTicker.style.color = 'var(--ink)';
        tdTicker.textContent = item.ticker;

        const tdWeight = document.createElement('td');
        tdWeight.style.padding = '12px 0';
        tdWeight.style.textAlign = 'right';
        tdWeight.style.fontFamily = 'var(--font-sans)';
        tdWeight.style.color = 'var(--ink2)';
        // On reconvertit le nombre en pourcentage lisible (0.15 -> 15.00%)
        tdWeight.textContent = (item.weight * 100).toFixed(2) + ' %';

        tr.appendChild(tdTicker);
        tr.appendChild(tdWeight);
        tbody.appendChild(tr);
    });

    // On configure le gros bouton bleu du pop-up pour qu'il lance le recalcul
    const btnApply = document.getElementById('btnDetailsApply');
    btnApply.onclick = function() {
        closePortfolioDetails();
        applyPortfolio(composition);
    };

    // On affiche le pop-up
    const popup = document.getElementById('detailsPortfolioPopup');
    popup.classList.remove('hidden');
    popup.style.display = 'flex';
};

window.closePortfolioDetails = function() {
    const popup = document.getElementById('detailsPortfolioPopup');
    if (popup) {
        popup.classList.add('hidden');
        popup.style.display = 'none';
    }
};

window.loadMyPortfolios = async function() {
    const container = document.getElementById('myPortfoliosList');
    if (!container) return;

    container.innerHTML = '<div style="color:var(--muted);text-align:center;padding:40px;font-size:0.9rem;">Chargement...</div>';

    try {
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        if (userError || !user) {
            container.innerHTML = '<div style="color:var(--rose-lt);text-align:center;padding:40px;">Connectez-vous pour voir vos portefeuilles.</div>';
            return;
        }

        const { data: portfolios, error } = await window.supabaseClient
            .from('portfolio')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false });

        if (error) throw error;

        if (!portfolios || portfolios.length === 0) {
            container.innerHTML = `<div class="fullscreen-empty"><div class="fullscreen-empty-icon">◈</div><div class="fullscreen-empty-title">Aucun portefeuille sauvegardé</div></div>`;
            return;
        }

        container.innerHTML = '';
        portfolios.forEach(pf => renderPortfolioCard(pf, container));

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="color:var(--rose-lt);text-align:center;padding:40px;">Erreur de chargement.</div>';
    }
};

// ── RENDER ONE PORTFOLIO CARD (accordion) ──────────────────────────
 function renderPortfolioCard(pf, container) {
    const numAssets = pf.composition ? pf.composition.length : 0;
    const safeName = (pf.nom || '').replace(/'/g, "\\'");
    const pfId = 'pf_' + pf.id;
    const detailId = 'pfDetail_' + pf.id;
    const safeComp = JSON.stringify(pf.composition || []).replace(/"/g,'&quot;');

    const createdStr = pf.created_at
        ? new Date(pf.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
        : '';

    // Composition table (toujours visible dans le dépliant)
    const compRows = (pf.composition || [])
        .filter(c => c.ticker && c.ticker.toLowerCase() !== 'total')
        .map(c => {
        let nm = null, isin = '';
        for (const cat of (window.ASSETS_DATA||[])) {
            const it = cat.items.find(i => i.ticker === c.ticker);
            if (it) { nm = it.name; isin = it.isin || ''; break; }
        }
        const displayName = nm || c.ticker; // fallback to ticker only if not found
        const displayTicker = nm ? c.ticker : ''; // show ticker separately only if name found
        const cid = `pfAC_${pf.id}_${c.ticker.replace(/[^a-zA-Z0-9]/g,'_')}`;
        return `<tr style="border-bottom:1px solid var(--surface2);cursor:pointer;" onclick="pfToggleAssetChart('${c.ticker}','${cid}',this)">
            <td style="padding:7px 0;">
              <div style="font-size:0.78rem;color:var(--ink2);font-weight:500;">${displayName}${displayTicker ? ' <span style=\"font-size:0.64rem;color:var(--muted2);font-weight:400;\">' + displayTicker + '</span>' : ''}</div>
              <div style="font-size:0.6rem;color:var(--muted2);letter-spacing:0.04em;margin-top:1px;">${isin}</div>
            </td>
            <td style="padding:7px 0;font-family:var(--font-serif);font-weight:600;color:var(--amber);text-align:right;vertical-align:top;">${(c.weight*100).toFixed(1)}%</td>
          </tr>
          <tr id="${cid}_row" style="display:none;">
            <td colspan="2" style="padding:0 0 10px;">
              <div id="${cid}" style="height:200px;"></div>
              <div style="display:flex;align-items:center;gap:12px;padding:6px 2px 0;">
                <span style="font-size:0.65rem;color:var(--muted)">1m</span>
                <input type="range" id="${cid}_rng" min="1" max="60" value="24" style="flex:1;accent-color:var(--blue);"
                  oninput="pfUpdateAssetChart('${c.ticker}','${cid}',+this.value,document.getElementById('${cid}_log').checked)">
                <span style="font-size:0.65rem;color:var(--muted)">5a</span>
                <span id="${cid}_lbl" style="font-size:0.68rem;font-weight:700;color:var(--blue);min-width:28px;">2a</span>
                <label style="display:flex;align-items:center;gap:4px;font-size:0.68rem;color:var(--muted);cursor:pointer;">
                  <input type="checkbox" id="${cid}_log" style="accent-color:var(--blue);"
                    onchange="pfUpdateAssetChart('${c.ticker}','${cid}',+document.getElementById('${cid}_rng').value,this.checked)">
                  Log
                </label>
              </div>
            </td>
          </tr>`;
    }).join('');

    const card = document.createElement('div');
    card.id = pfId;
    card.style.cssText = 'border:1px solid var(--border);border-radius:10px;margin-bottom:12px;background:var(--surface);overflow:hidden;';

    card.innerHTML = `
      <div onclick="pfToggleDetail('${pfId}','${detailId}')"
           style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;cursor:pointer;gap:14px;">
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
            <div style="font-family:var(--font-serif);font-weight:700;color:var(--ink);font-size:1rem;">${pf.nom}</div>
            <div style="font-size:0.6rem;color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;">${numAssets} actifs${createdStr ? ' · ' + createdStr : ''}</div>
          </div>
          <div id="${pfId}_hstats" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:2px;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <button onclick="event.stopPropagation();pfSuivi('${pf.id}',${safeComp})"
            style="font-family:var(--font-sans);font-size:0.7rem;font-weight:600;letter-spacing:0.06em;
                   text-transform:uppercase;background:var(--blue);color:white;border:none;
                   border-radius:6px;padding:7px 13px;cursor:pointer;transition:background 0.15s;"
            onmouseover="this.style.background='var(--blue-lt)'"
            onmouseout="this.style.background='var(--blue)'">Suivi ➔</button>
          <button onclick="event.stopPropagation();deletePortfolio('${pf.id}','${safeName}')"
            style="width:28px;height:28px;background:none;border:1px solid var(--border);color:var(--muted);
                   border-radius:6px;cursor:pointer;font-size:1rem;font-weight:300;
                   display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
            onmouseover="this.style.borderColor='var(--rose-lt)';this.style.color='var(--rose)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'"
            title="Supprimer">×</button>
          <span id="${pfId}_arrow" style="color:var(--muted);font-size:0.75rem;transition:transform 0.2s;display:inline-block;">▼</span>
        </div>
      </div>
      <div id="${detailId}" style="display:none;border-top:1px solid var(--border);">
        <div style="padding:16px 20px 22px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            <tbody>${compRows}</tbody>
          </table>
          <div id="${detailId}_stats" style="color:var(--muted);font-size:0.78rem;">Calcul des statistiques…</div>
        </div>
      </div>
    `;

    card._pfComp = pf.composition;
    card._pfCreated = pf.created_at;
    container.appendChild(card);

    // Fetch stats en arrière-plan dès la création (peuple header + détail)
    pfFetchStats(pfId, detailId, pf.composition, pf.created_at);
}

// ── TOGGLE ACCORDION ──────────────────────────────────────────────
window.pfToggleDetail = function(pfId, detailId) {
    const detail = document.getElementById(detailId);
    const arrow = document.getElementById(pfId + '_arrow');
    if (!detail) return;
    const isOpen = detail.style.display !== 'none';
    detail.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
};

// ── LOAD DETAIL: fetch prices, compute stats, render ─────────────
// ── FETCH STATS : alimente header (visible) + détail (dépliant) ──
async function pfFetchStats(pfId, detailId, composition, createdAt) {
    if (!composition || composition.length === 0) return;

    const tickers = composition.map(c => c.ticker);
    const weights = composition.map(c => c.weight);
    const rf = parseFloat(document.getElementById('rfInput')?.value || document.getElementById('rfRange')?.value || 3) / 100;

    // ── 1. Supabase (source principale) ──────────────────────────────
    let priceMap = {};      // 5y complet → stats théoriques
    let realPriceMap = {};  // depuis création → perf réalisée
    const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
    const daysSinceCreation = createdMs > 0 ? (Date.now() - createdMs) / 86400000 : 0;
    const realInterval = daysSinceCreation <= 60 ? '1d' : '1wk';

    // Supabase : fetch toutes les données disponibles pour les tickers
    try {
        const { data: sbData, error: sbError } = await window.supabaseClient
            .from('stock_prices')
            .select('ticker, price_date, close_price')
            .in('ticker', tickers)
            .order('price_date', { ascending: true });

        if (!sbError && sbData && sbData.length > 0) {
            // Grouper par ticker
            const byTicker = {};
            sbData.forEach(row => {
                if (!byTicker[row.ticker]) byTicker[row.ticker] = [];
                byTicker[row.ticker].push({ date: row.price_date, p: parseFloat(row.close_price) });
            });

            // Pour chaque ticker dans la DB
            tickers.forEach(t => {
                const rows = byTicker[t];
                if (!rows || rows.length < 10) return;

                // Prix complets (5y max) → stats théoriques
                const allPrices = rows.slice(-252*5).map(r => r.p).filter(v => v > 0);
                if (allPrices.length >= 10) priceMap[t] = allPrices;

                // Prix depuis création → perf réalisée
                const afterCreation = createdMs > 0
                    ? rows.filter(r => new Date(r.date).getTime() >= createdMs)
                    : rows.slice(-2);
                const realPrices = (afterCreation.length >= 2 ? afterCreation : rows.slice(-2))
                    .map(r => r.p).filter(v => v > 0);
                if (realPrices.length >= 2) realPriceMap[t] = realPrices;
            });
        }
    } catch(e) { console.warn('pfFetchStats Supabase:', e); }

    const available = tickers.filter(t => priceMap[t]);
    if (available.length === 0) {
        const statsEl = document.getElementById(detailId + '_stats');
        if (statsEl) statsEl.innerHTML = '<span style="color:var(--muted)">Données de marché non disponibles.</span>';
        return;
    }

    // ── Calculs sur l'historique complet (5y) → stats théoriques ─
    const minLen = Math.min(...available.map(t => priceMap[t].length));
    const aligned = {};
    available.forEach(t => { aligned[t] = priceMap[t].slice(-minLen); });

    const rets2d = available.map(t => {
        const p = aligned[t], r = [];
        for (let i=1;i<p.length;i++) r.push((p[i]-p[i-1])/p[i-1]);
        return r;
    });
    const nWeeks = rets2d[0].length;

    const avW = available.map(t => weights[tickers.indexOf(t)] || 0);
    const wSum = avW.reduce((s,v)=>s+v,0);
    const wNorm = wSum > 0 ? avW.map(w=>w/wSum) : avW.map(()=>1/available.length);

    // Stats théoriques (poids saisis × historique 5y)
    const thRets = [];
    for (let t=0;t<nWeeks;t++) {
        let r=0; available.forEach((_,i)=>{ r+=wNorm[i]*rets2d[i][t]; }); thRets.push(r);
    }
    const thMean = thRets.reduce((s,v)=>s+v,0)/nWeeks;
    const thVar  = thRets.reduce((s,v)=>s+(v-thMean)**2,0)/(nWeeks-1);
    const thAnnRet = thMean * 52;
    const thAnnVol = Math.sqrt(thVar * 52);
    const thSharpe = thAnnVol > 0 ? (thAnnRet - rf) / thAnnVol : 0;

    // ── Perf réalisée depuis création ─────────────────────────────
    const realAvail = available.filter(t => realPriceMap[t] && realPriceMap[t].length >= 2);
    let cumRet = 0;
    let annVolReal = null, sharpeReal = null;

    if (realAvail.length > 0) {
        const rMinLen = Math.min(...realAvail.map(t => realPriceMap[t].length));
        const rAligned = {};
        realAvail.forEach(t => { rAligned[t] = realPriceMap[t].slice(-rMinLen); });
        const rNorm = realAvail.map(t => {
            const w = weights[tickers.indexOf(t)] || 0;
            const s = realAvail.reduce((acc, t2) => acc + (weights[tickers.indexOf(t2)] || 0), 0);
            return s > 0 ? w / s : 1 / realAvail.length;
        });
        const rRets = [];
        for (let i=1;i<rMinLen;i++) {
            let r=0; realAvail.forEach((t,k)=>{ r+=rNorm[k]*(rAligned[t][i]-rAligned[t][i-1])/rAligned[t][i-1]; }); rRets.push(r);
        }
        // Rendement cumulé brut — pas d'annualisation
        cumRet = rRets.reduce((cum,r)=>cum*(1+r),1) - 1;
        // Vol et Sharpe annualisés seulement si suffisamment de points (>= 20)
        const annFactor = realInterval === '1d' ? 252 : 52;
        if (rRets.length >= 20) {
            const rMean = rRets.reduce((s,v)=>s+v,0)/rRets.length;
            const rVar  = rRets.reduce((s,v)=>s+(v-rMean)**2,0)/(rRets.length-1);
            annVolReal = Math.sqrt(rVar * annFactor);
            sharpeReal = annVolReal > 0 ? (rMean * annFactor - rf) / annVolReal : 0;
        }
    }


    // Portefeuille tangent analytique — utilise toutes les données (5y) pour être robuste
    const n = available.length;
    const meanRets = rets2d.map(r=>r.reduce((s,v)=>s+v,0)/r.length);
    const covM = Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
        const ri=rets2d[i],rj=rets2d[j],mi=meanRets[i],mj=meanRets[j];
        return ri.reduce((s,v,t)=>s+(v-mi)*(rj[t]-mj),0)/(nWeeks-1);
    }));
    const rfW = rf/52;
    const exMu = meanRets.map(m=>m-rfW);
    const trace=covM.reduce((s,_,i)=>s+covM[i][i],0);
    const lam=1e-6*trace/n;
    const covReg=covM.map((row,i)=>row.map((v,j)=>i===j?v+lam:v));

    function invertM(M) {
        const n=M.length,A=M.map(r=>[...r]),I=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
        for(let c=0;c<n;c++){
            let mx=c; for(let r=c+1;r<n;r++) if(Math.abs(A[r][c])>Math.abs(A[mx][c]))mx=r;
            [A[c],A[mx]]=[A[mx],A[c]];[I[c],I[mx]]=[I[mx],I[c]];
            const piv=A[c][c]; if(Math.abs(piv)<1e-14)return null;
            for(let j=0;j<n;j++){A[c][j]/=piv;I[c][j]/=piv;}
            for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<n;j++){A[r][j]-=f*A[c][j];I[r][j]-=f*I[c][j];}}
        }
        return I;
    }

    const sigInv = invertM(covReg);
    let bestW;
    if (sigInv) {
        const wRaw = sigInv.map(row=>row.reduce((s,v,j)=>s+v*exMu[j],0));
        const wPos = wRaw.map(v=>Math.max(0,v));
        const wPS = wPos.reduce((s,v)=>s+v,0);
        bestW = wPS>1e-10 ? wPos.map(v=>v/wPS) : Array(n).fill(1/n);
    } else { bestW=Array(n).fill(1/n); }

    let tRet=0,tVar=0;
    for(let i=0;i<n;i++){tRet+=bestW[i]*meanRets[i]*52;for(let j=0;j<n;j++)tVar+=bestW[i]*bestW[j]*covM[i][j]*52;}
    const tVol=Math.sqrt(Math.max(0,tVar));
    const tSharpe=tVol>0?(tRet-rf)/tVol:0;

    // ── Formatage ─────────────────────────────────────────────────
    const fmtPct = v=>(v>=0?'+':'')+(v*100).toFixed(1)+'%';
    const colR   = v=>v>=0?'var(--teal)':'var(--rose)';

    // Header : rendement cumulé + vol + sharpe depuis création
    // (sur les données réelles filtrées depuis createdAt)
    const hstats = document.getElementById(pfId + '_hstats');
    if (hstats) {
        const hs = (label, val, color) =>
            `<span style="font-size:0.68rem;color:var(--muted)">${label} </span>` +
            `<span style="font-family:var(--font-serif);font-size:0.78rem;font-weight:700;color:${color}">${val}</span>`;
        hstats.innerHTML =
            `<span>${hs('Perf.', fmtPct(cumRet), colR(cumRet))}</span>` +
            `<span style="color:var(--surface3)">|</span>` +
            `<span>${hs('Vol.', annVolReal !== null ? (annVolReal*100).toFixed(1)+'%' : '—', 'var(--amber)')}</span>` +
            `<span style="color:var(--surface3)">|</span>` +
            `<span>${hs('Sharpe', sharpeReal !== null ? sharpeReal.toFixed(2) : '—', 'var(--blue)')}</span>`;
    }

    // Detail stats
    const kpi = (label, val, color) =>
        `<div style="flex:1;min-width:80px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:11px 14px;">
           <div style="font-size:0.58rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:5px">${label}</div>
           <div style="font-family:var(--font-serif);font-size:0.95rem;font-weight:700;color:${color}">${val}</div>
         </div>`;

    const statsEl = document.getElementById(detailId + '_stats');
    if (statsEl) statsEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <!-- Performance visée (stats théoriques sur 5y avec les poids saisis) -->
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;">
          <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
                      color:var(--blue);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">
            Performance visée
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${kpi('Rend. ann. visé', fmtPct(thAnnRet), colR(thAnnRet))}
            ${kpi('Volatilité', (thAnnVol*100).toFixed(1)+'%', 'var(--amber)')}
            ${kpi('Sharpe', thSharpe.toFixed(2), 'var(--blue)')}
          </div>
        </div>
        <!-- Portefeuille tangent actuel -->
        <div style="background:var(--surface);border:1.5px solid var(--border2);border-radius:10px;padding:14px 16px;">
          <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
                      color:var(--teal);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">
            Portefeuille tangent actuel
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${kpi('Rend. ann.', fmtPct(tRet), colR(tRet))}
            ${kpi('Volatilité', (tVol*100).toFixed(1)+'%', 'var(--amber)')}
            ${kpi('Sharpe', tSharpe.toFixed(2), 'var(--teal)')}
          </div>
        </div>
      </div>
    `;
}


// ── SUIVI : graphe perf depuis création ───────────────────────────
window.pfSuivi = async function(pfId, composition) {
    if (!composition || composition.length === 0) return;

    // Build a floating panel inside myPortfoliosList area
    let panel = document.getElementById('pfSuiviPanel');
    if (panel) panel.remove();

    const container = document.getElementById('myPortfoliosList');
    panel = document.createElement('div');
    panel.id = 'pfSuiviPanel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,0.45);z-index:600;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    panel.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
                  width:min(860px,95vw);max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-family:var(--font-serif);font-weight:700;color:var(--ink);font-size:1rem;">Suivi de performance</div>
            <div style="font-size:0.7rem;color:var(--muted);margin-top:2px;">Performance historique du portefeuille</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--muted);">
              <span>Échelle</span>
              <select id="pfSuiviScale" onchange="pfSuiviUpdateScale()"
                style="padding:4px 8px;background:var(--surface2);border:1px solid var(--border);
                       border-radius:5px;font-family:var(--font-sans);font-size:0.72rem;color:var(--ink);outline:none;">
                <option value="linear">Linéaire</option>
                <option value="log">Logarithmique</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--muted);">
              <span>Période</span>
              <select id="pfSuiviPeriod" onchange="pfSuiviUpdatePeriod()"
                style="padding:4px 8px;background:var(--surface2);border:1px solid var(--border);
                       border-radius:5px;font-family:var(--font-sans);font-size:0.72rem;color:var(--ink);outline:none;">
                <option value="1y">1 an</option>
                <option value="2y" selected>2 ans</option>
                <option value="5y">5 ans</option>
              </select>
            </div>
            <button onclick="document.getElementById('pfSuiviPanel').remove()"
              style="width:30px;height:30px;border-radius:50%;background:none;border:1px solid var(--border);
                     cursor:pointer;font-size:0.85rem;color:var(--muted);display:flex;align-items:center;justify-content:center;">✕</button>
          </div>
        </div>
        <div style="padding:20px 24px;">
          <div id="pfSuiviChartDiv" style="height:360px;"></div>
          <div id="pfSuiviStats" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;"></div>
          <div id="pfSuiviLoading" style="text-align:center;padding:40px;color:var(--muted);font-size:0.85rem;">Chargement des données…</div>
        </div>
      </div>`;

    document.body.appendChild(panel);
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });

    // Store for re-render
    window._pfSuiviComp = composition;
    await pfSuiviDraw(composition, '2y', 'linear');
};

window.pfSuiviUpdateScale = function() {
    const scale = document.getElementById('pfSuiviScale')?.value || 'linear';
    const period = document.getElementById('pfSuiviPeriod')?.value || '2y';
    if (window._pfSuiviComp) pfSuiviDraw(window._pfSuiviComp, period, scale);
};
window.pfSuiviUpdatePeriod = function() {
    const scale = document.getElementById('pfSuiviScale')?.value || 'linear';
    const period = document.getElementById('pfSuiviPeriod')?.value || '2y';
    if (window._pfSuiviComp) pfSuiviDraw(window._pfSuiviComp, period, scale);
};

async function pfSuiviDraw(composition, period, scale) {
    const loadingEl = document.getElementById('pfSuiviLoading');
    const chartDiv = document.getElementById('pfSuiviChartDiv');
    const statsDiv = document.getElementById('pfSuiviStats');
    if (!chartDiv) return;

    if (loadingEl) loadingEl.style.display = 'block';
    if (chartDiv) chartDiv.style.opacity = '0.3';

    const tickers = composition.map(c => c.ticker);
    const weights = composition.map(c => c.weight);
    const rf = parseFloat(document.getElementById('rfInput')?.value || document.getElementById('rfRange')?.value || 3) / 100;

    // ── 1. Supabase (source principale) ──────────────────────────────
    const priceMap = {};
    const tsMap = {};
    const numYears = parseFloat(String(period).replace('y','')) || 2;
    const daysNeededSuivi = Math.round(numYears * 252);

    try {
        const { data: sbData, error: sbError } = await window.supabaseClient
            .from('stock_prices')
            .select('ticker, price_date, close_price')
            .in('ticker', tickers)
            .order('price_date', { ascending: true });

        if (!sbError && sbData && sbData.length > 0) {
            const byTicker = {};
            sbData.forEach(row => {
                if (!byTicker[row.ticker]) byTicker[row.ticker] = [];
                byTicker[row.ticker].push(row);
            });
            tickers.forEach(t => {
                const rows = (byTicker[t] || []).slice(-daysNeededSuivi);
                if (rows.length < 5) return;
                priceMap[t] = rows.map(r => parseFloat(r.close_price)).filter(v => v > 0);
                // Timestamps synthétiques hebdo à partir des dates
                tsMap[t] = rows.map(r => Math.floor(new Date(r.price_date).getTime()/1000));
            });
        }
    } catch(e) { console.warn('pfSuiviDraw Supabase:', e); }

    const available = tickers.filter(t => priceMap[t] && priceMap[t].length >= 5);
    if (available.length === 0) {
        if (loadingEl) loadingEl.innerHTML = 'Données non disponibles.';
        return;
    }

    // Align on common length (most recent)
    const minLen = Math.min(...available.map(t => priceMap[t].length));
    const aligned = {};
    const tsAligned = {};
    available.forEach(t => {
        aligned[t] = priceMap[t].slice(-minLen);
        tsAligned[t] = tsMap[t].slice(-minLen);
    });
    // Use dates from first available ticker
    const refTicker = available[0];
    const dates = tsAligned[refTicker].map(ts => new Date(ts*1000).toISOString().slice(0,10));

    // Normalize weights
    const wSum = available.reduce((s,t) => s + (weights[tickers.indexOf(t)]||0), 0);
    const wNorm = available.map(t => wSum > 0 ? (weights[tickers.indexOf(t)]||0)/wSum : 1/available.length);

    // Cumulative portfolio performance (base 100)
    const pfCum = [100];
    for (let i = 1; i < minLen; i++) {
        let weekRet = 0;
        available.forEach((t, idx) => {
            const prev = aligned[t][i-1], curr = aligned[t][i];
            weekRet += wNorm[idx] * ((curr - prev) / prev);
        });
        pfCum.push(pfCum[pfCum.length-1] * (1 + weekRet));
    }

    // Benchmark: equal weight portfolio
    const eqCum = [100];
    const eqW = 1/available.length;
    for (let i = 1; i < minLen; i++) {
        let weekRet = 0;
        available.forEach(t => {
            weekRet += eqW * ((aligned[t][i]-aligned[t][i-1])/aligned[t][i-1]);
        });
        eqCum.push(eqCum[eqCum.length-1] * (1+weekRet));
    }

    // Perf stats
    const totalRet = (pfCum[pfCum.length-1] - 100) / 100;
    const weeklyRets = [];
    for (let i=1;i<pfCum.length;i++) weeklyRets.push((pfCum[i]-pfCum[i-1])/pfCum[i-1]);
    const meanWR = weeklyRets.reduce((s,v)=>s+v,0)/weeklyRets.length;
    const varWR = weeklyRets.reduce((s,v)=>s+(v-meanWR)**2,0)/(weeklyRets.length-1);
    const annVol = Math.sqrt(varWR*52);
    const annRet = meanWR*52;
    const sharpe = annVol>0?(annRet-rf)/annVol:0;

    // Max drawdown
    let peak=pfCum[0], maxDD=0;
    pfCum.forEach(v => { peak=Math.max(peak,v); maxDD=Math.max(maxDD,(peak-v)/peak); });

    // Draw chart
    if (loadingEl) loadingEl.style.display = 'none';
    if (chartDiv) chartDiv.style.opacity = '1';

    const traces = [
        {
            x: dates, y: pfCum,
            name: 'Mon portefeuille',
            mode: 'lines', type: 'scatter',
            line: { color: '#1e3a5f', width: 2.5 },
            hovertemplate: '%{x}<br><b>%{y:.1f}</b><extra>Mon portefeuille</extra>'
        },
        {
            x: dates, y: eqCum,
            name: 'Équipondéré',
            mode: 'lines', type: 'scatter',
            line: { color: '#c4820a', width: 1.5, dash: 'dot' },
            hovertemplate: '%{x}<br><b>%{y:.1f}</b><extra>Équipondéré</extra>'
        }
    ];

    const layout = {
        paper_bgcolor: 'transparent', plot_bgcolor: '#faf8f4',
        font: { color: '#3d3830', family: 'DM Sans, sans-serif', size: 11 },
        yaxis: {
            title: { text: 'Valeur (base 100)', font: { size: 10, color: '#8a8278' } },
            type: scale === 'log' ? 'log' : 'linear',
            gridcolor: '#e4dfd5', gridwidth: 1, zeroline: false,
            tickfont: { size: 10, color: '#8a8278' }, linecolor: '#d4cfc5',
        },
        xaxis: {
            gridcolor: '#e4dfd5', zeroline: false,
            tickfont: { size: 10, color: '#8a8278' }, linecolor: '#d4cfc5',
        },
        legend: { orientation: 'h', y: -0.15, font: { size: 10 } },
        margin: { l: 56, r: 20, t: 12, b: 48 },
        hovermode: 'x unified',
        showlegend: true,
    };

    Plotly.react('pfSuiviChartDiv', traces, layout, { responsive: true, displayModeBar: false });

    // Stats bar
    const fmtPct = v => (v>=0?'+':'')+(v*100).toFixed(1)+'%';
    const colR = v => v>=0?'var(--teal)':'var(--rose)';
    const kpi = (label, val, color) =>
        `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;flex:1;min-width:80px;">
           <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:3px">${label}</div>
           <div style="font-family:var(--font-serif);font-weight:700;font-size:0.95rem;color:${color}">${val}</div>
         </div>`;

    if (statsDiv) statsDiv.innerHTML =
        kpi('Performance totale', fmtPct(totalRet), colR(totalRet)) +
        kpi('Rendement annualisé', fmtPct(annRet), colR(annRet)) +
        kpi('Volatilité annualisée', (annVol*100).toFixed(1)+'%', 'var(--amber)') +
        kpi('Ratio de Sharpe', sharpe.toFixed(2), 'var(--blue)') +
        kpi('Max Drawdown', '-'+(maxDD*100).toFixed(1)+'%', 'var(--rose)');
}

window.deletePortfolio = async function(id, nom) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le portefeuille "${nom}" ?`)) return;
    try {
        const { error } = await window.supabaseClient.from('portfolio').delete().eq('id', id);
        if (error) throw error;
        loadMyPortfolios();
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Impossible de supprimer le portefeuille. Vérifiez votre connexion.");
    }
};



// ════════════════════════════════════════════════════════════
// SAISIE MANUELLE DE PORTEFEUILLE — JS
// ════════════════════════════════════════════════════════════
(function() {

  // --- Helpers ---
  function el(id) { return document.getElementById(id); }
  function mpGetTotal() { return parseFloat(el('mpTotalAmount').value) || 0; }

  // Flat list of all assets from ASSETS_DATA
  function mpAllAssets() {
    var list = [];
    (window.ASSETS_DATA || []).forEach(function(cat) {
      cat.items.forEach(function(item) {
        list.push({ ticker: item.ticker, name: item.name });
      });
    });
    return list;
  }

  // State: [{ticker, name, pct, amount}]
  var _rows = [];

  // --- Open / Close ---
  window.openManualPortfolio = function() {
    _rows = mpAllAssets().map(function(a) {
      return { ticker: a.ticker, name: a.name, pct: 0, amount: 0 };
    });
    el('mpTotalAmount').value = '10000';
    el('mpSearch').value = '';
    mpRenderTable('');
    mpUpdateSummary();
    el('manualPortfolioModal').classList.add('active');
  };

  function closeMP() {
    el('manualPortfolioModal').classList.remove('active');
  }

  // --- Wire up static buttons (event delegation) ---
  document.addEventListener('DOMContentLoaded', function() {

    // Open button in panel
    var openBtn = el('btnSaisirPortefeuille');
    if (openBtn) openBtn.addEventListener('click', window.openManualPortfolio);

    // Close / cancel / reset / confirm
    var closeBtn = el('mpCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeMP);

    var cancelBtn = el('mpCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeMP);

    var resetBtn = el('mpResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', function() {
      _rows.forEach(function(r) { r.pct = 0; r.amount = 0; });
      el('mpTotalAmount').value = '10000';
      mpRenderTable(el('mpSearch').value.toLowerCase());
      mpUpdateSummary();
    });

    var confirmBtn = el('mpConfirmBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', mpConfirm);

    // Total amount change
    var totalInp = el('mpTotalAmount');
    if (totalInp) totalInp.addEventListener('input', function() {
      var total = mpGetTotal();
      _rows.forEach(function(r) {
        r.amount = total > 0 ? Math.round(total * r.pct / 100 * 100) / 100 : 0;
        var amtEl = el('mpAmt_' + r.ticker);
        if (amtEl) amtEl.value = r.amount > 0 ? r.amount.toFixed(2) : '';
      });
      mpUpdateSummary();
    });

    // Search filter
    var searchInp = el('mpSearch');
    if (searchInp) searchInp.addEventListener('input', function() {
      mpRenderTable(this.value.toLowerCase().trim());
    });

    // Close on backdrop click
    var modal = el('manualPortfolioModal');
    if (modal) modal.addEventListener('click', function(e) {
      if (e.target === modal) closeMP();
    });

    // Esc key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMP();
    });
  });

  // ── INPUT HANDLERS ──────────────────────────────────────────────

  // % changed → recalculate amount only for that row (NO re-render)
  window.mpOnPctChange = function(ticker) {
    var row = _rows.find(function(r) { return r.ticker === ticker; });
    if (!row) return;
    var rawVal = el('mpPct_' + ticker).value;
    var v = parseFloat(rawVal);
    if (isNaN(v)) { row.pct = 0; row.amount = 0; }
    else { row.pct = Math.max(0, Math.min(100, v)); }
    var total = mpGetTotal();
    row.amount = total > 0 ? Math.round(total * row.pct / 100 * 100) / 100 : 0;
    // Update ONLY the amount sibling cell — don't touch the pct input (user is typing)
    var amtEl = el('mpAmt_' + ticker);
    if (amtEl && document.activeElement !== amtEl) {
      amtEl.value = row.amount > 0 ? row.amount.toFixed(2) : '';
    }
    mpUpdateSummary();
    mpUpdateRowHighlight(ticker, row);
  };

  // € changed → recalculate total + all pcts (NO re-render)
  window.mpOnAmtChange = function(ticker) {
    var row = _rows.find(function(r) { return r.ticker === ticker; });
    if (!row) return;
    var rawVal = el('mpAmt_' + ticker).value;
    var v = parseFloat(rawVal);
    row.amount = isNaN(v) ? 0 : Math.max(0, v);
    var newTotal = _rows.reduce(function(s, r) { return s + r.amount; }, 0);
    // Update total field
    var totalEl = el('mpTotalAmount');
    if (totalEl && document.activeElement !== totalEl) {
      totalEl.value = newTotal > 0 ? (Math.round(newTotal * 100) / 100).toFixed(2) : '0';
    }
    // Recalculate all pcts — skip currently focused input to avoid cursor jump
    _rows.forEach(function(r) {
      r.pct = newTotal > 0 ? Math.round(r.amount / newTotal * 10000) / 100 : 0;
      var pctEl = el('mpPct_' + r.ticker);
      if (pctEl && document.activeElement !== pctEl) {
        pctEl.value = r.pct > 0 ? r.pct.toFixed(2) : '';
      }
      mpUpdateRowHighlight(r.ticker, r);
    });
    mpUpdateSummary();
  };

  function mpUpdateRowHighlight(ticker, row) {
    var tr = el('mpPct_' + ticker);
    if (tr) {
      var parentTr = tr.closest('tr');
      if (parentTr) {
        parentTr.style.background = (row.pct > 0 || row.amount > 0) ? 'rgba(26,92,82,0.05)' : '';
      }
    }
  }

  // ── SUMMARY ─────────────────────────────────────────────────────
  function mpUpdateSummary() {
    var total = _rows.reduce(function(s, r) { return s + r.pct; }, 0);
    var pctEl = el('mpTotalPct');
    var barEl = el('mpProgressBar');
    var msgEl = el('mpValidationMsg');
    if (!pctEl) return;

    pctEl.textContent = total.toFixed(1).replace('.', ',') + ' %';
    barEl.style.width = Math.min(100, total) + '%';

    if (total > 100.5) {
      barEl.style.background = 'var(--rose-lt)';
      pctEl.style.color = 'var(--rose)';
      if (msgEl) { msgEl.textContent = 'Dépassement de 100 % (' + total.toFixed(1) + ' %)'; msgEl.style.color = 'var(--rose)'; }
    } else if (total >= 99.5) {
      barEl.style.background = 'var(--teal)';
      pctEl.style.color = 'var(--teal)';
      if (msgEl) { msgEl.textContent = 'Portefeuille complet ✓'; msgEl.style.color = 'var(--teal)'; }
    } else if (total > 0) {
      barEl.style.background = 'var(--amber-lt)';
      pctEl.style.color = 'var(--amber)';
      var rem = (100 - total).toFixed(1).replace('.', ',');
      if (msgEl) { msgEl.textContent = rem + ' % non alloués'; msgEl.style.color = 'var(--muted)'; }
    } else {
      barEl.style.background = 'var(--surface3)';
      pctEl.style.color = 'var(--muted)';
      if (msgEl) { msgEl.textContent = ''; }
    }
  }

  // ── RENDER TABLE (full build — only called on open/reset/filter) ─
  function mpRenderTable(filter) {
    var tbody = el('mpAssetBody');
    if (!tbody) return;
    var inpBase = 'width:80px;padding:5px 8px;background:var(--bg);border:1px solid var(--border);' +
      'border-radius:5px;font-family:var(--font-sans);font-size:0.78rem;color:var(--ink);' +
      'text-align:right;outline:none;box-sizing:border-box;';
    var html = '';
    var q = (filter || '').toLowerCase();

    _rows.forEach(function(row) {
      if (q && row.name.toLowerCase().indexOf(q) === -1 && row.ticker.toLowerCase().indexOf(q) === -1) return;
      var active = row.pct > 0 || row.amount > 0;
      var pctVal = row.pct > 0 ? row.pct.toFixed(2) : '';
      var amtVal = row.amount > 0 ? row.amount.toFixed(2) : '';
      // Use data-ticker + event delegation to avoid oninput quoting issues
      html += '<tr data-ticker="' + row.ticker + '" style="border-bottom:1px solid var(--surface2);' +
        (active ? 'background:rgba(26,92,82,0.05)' : '') + '">' +
        '<td style="padding:7px 12px">' +
          '<span style="font-weight:600;color:var(--ink)">' + row.name + '</span>' +
          '<span style="font-size:0.63rem;color:var(--muted2);margin-left:6px">' + row.ticker + '</span>' +
        '</td>' +
        '<td style="padding:5px 12px;text-align:right">' +
          '<input id="mpPct_' + row.ticker + '" data-role="pct" data-ticker="' + row.ticker + '"' +
          ' type="number" min="0" max="100" step="0.01"' +
          ' value="' + pctVal + '" placeholder="0" style="' + inpBase + '">' +
        '</td>' +
        '<td style="padding:5px 12px;text-align:right">' +
          '<input id="mpAmt_' + row.ticker + '" data-role="amt" data-ticker="' + row.ticker + '"' +
          ' type="number" min="0" step="0.01"' +
          ' value="' + amtVal + '" placeholder="0" style="' + inpBase + '">' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html || '<tr><td colspan="3" style="padding:20px;text-align:center;color:var(--muted);font-size:0.8rem">Aucun actif trouvé</td></tr>';

    // Attach events via delegation on tbody (avoids oninput quoting issues)
    tbody.addEventListener('input', function(e) {
      var inp = e.target;
      var t = inp.dataset.ticker;
      var role = inp.dataset.role;
      if (!t || !role) return;
      if (role === 'pct') window.mpOnPctChange(t);
      else if (role === 'amt') window.mpOnAmtChange(t);
    }, { capture: false });
  }

  // ── SAVE — store data then open existing save popup ─────────────
  function mpConfirm() {
    var active = _rows.filter(function(r) { return r.pct > 0.001; });
    var msgEl = el('mpValidationMsg');
    if (active.length === 0) {
      if (msgEl) { msgEl.textContent = 'Saisissez au moins une pondération.'; msgEl.style.color = 'var(--rose)'; }
      return;
    }
    // Build composition [{ticker, weight}] — same format as the rest of the app
    var composition = active.map(function(r) {
      return { ticker: r.ticker, weight: Math.round(r.pct / 100 * 10000) / 10000 };
    });

    // Write to the shared let variable (same script block — direct assignment works)
    _tempPortfolioData = composition;

    // Close entry modal
    closeMP();

    // Open the name popup exactly as openSavePortfolio / closeSavePortfolio do
    // (they use style.display + hidden class, NOT .active)
    var popup = el('savePortfolioPopup');
    if (popup) {
      popup.style.display = 'flex';
      popup.classList.remove('hidden');
    }
    var inp = el('savePortfolioName');
    if (inp) { inp.value = ''; inp.style.borderColor = ''; inp.focus(); }
    var msg = el('savePortfolioMsg');
    if (msg) { msg.textContent = ''; }
  }

})();


// ── GRAPHE COURS D'UN ACTIF ─────────────────────────────────────
window.pfToggleAssetChart = function(ticker, chartId, row) {
    const chartRow = document.getElementById(chartId + '_row');
    if (!chartRow) return;
    const isOpen = chartRow.style.display !== 'none';
    chartRow.style.display = isOpen ? 'none' : 'table-row';
    if (!isOpen) {
        row.style.background = 'rgba(30,58,95,0.04)';
        pfUpdateAssetChart(ticker, chartId, 24, false);
    } else {
        row.style.background = '';
    }
};

window.pfUpdateAssetChart = async function(ticker, chartId, months, logScale) {
    const chartDiv = document.getElementById(chartId);
    const lbl = document.getElementById(chartId + '_lbl');
    if (!chartDiv) return;

    // Update label
    if (lbl) {
        if (months < 3) lbl.textContent = months + 'm';
        else if (months < 12) lbl.textContent = months + 'm';
        else lbl.textContent = (months/12).toFixed(months%12===0?0:1) + 'a';
    }

    // Map months → Yahoo range string
    const rangeStr = months <= 1 ? '1mo' : months <= 3 ? '3mo' : months <= 6 ? '6mo'
        : months <= 12 ? '1y' : months <= 24 ? '2y' : months <= 36 ? '3y' : '5y';
    const interval = months <= 3 ? '1d' : '1wk';

    // Fetch via backend or proxies
    const API_URL = 'https://app-backend-k9i5.onrender.com';
    let dates = [], prices = [];

    try {
        // Try backend first
        const r = await fetch(
            `${API_URL}/api/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${rangeStr}`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (r.ok) {
            const d = await r.json();
            const res = d?.chart?.result?.[0];
            const ts = res?.timestamp || [];
            const cl = res?.indicators?.adjclose?.[0]?.adjclose || res?.indicators?.quote?.[0]?.close || [];
            ts.forEach((t, i) => { if (cl[i] != null) { dates.push(new Date(t*1000).toISOString().slice(0,10)); prices.push(cl[i]); } });
        }
    } catch {}

    // Fallback proxies
    if (prices.length < 5) {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${rangeStr}&interval=${interval}&includePrePost=false`;
        const proxies = [
            u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        ];
        try {
            const result = await Promise.any(proxies.map(p =>
                fetch(p(yahooUrl), { signal: AbortSignal.timeout(8000) }).then(async r => {
                    if (!r.ok) throw 0;
                    const d = await r.json();
                    const res = d?.chart?.result?.[0];
                    if (!res) throw 0;
                    return res;
                })
            ));
            const ts = result.timestamp || [];
            const cl = result?.indicators?.adjclose?.[0]?.adjclose || result?.indicators?.quote?.[0]?.close || [];
            dates = []; prices = [];
            ts.forEach((t, i) => { if (cl[i] != null) { dates.push(new Date(t*1000).toISOString().slice(0,10)); prices.push(cl[i]); } });
        } catch {}
    }

    if (prices.length < 2) {
        chartDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.78rem;">Données non disponibles</div>';
        return;
    }

    // Color: positive = teal, negative = rose
    const isPos = prices[prices.length-1] >= prices[0];
    const lineColor = isPos ? '#1a5c52' : '#b03045';
    const fillColor = isPos ? 'rgba(26,92,82,0.08)' : 'rgba(176,48,69,0.08)';

    const trace = {
        x: dates, y: prices,
        mode: 'lines', type: 'scatter',
        line: { color: lineColor, width: 2 },
        fill: 'tozeroy', fillcolor: fillColor,
        hovertemplate: '%{x}<br><b>%{y:.2f}</b><extra></extra>'
    };

    const layout = {
        paper_bgcolor: 'transparent', plot_bgcolor: '#faf8f4',
        font: { family: 'DM Sans,sans-serif', size: 10, color: '#8a8278' },
        margin: { l: 52, r: 8, t: 8, b: 28 },
        yaxis: {
            type: logScale ? 'log' : 'linear',
            gridcolor: '#e4dfd5', zeroline: false,
            tickfont: { size: 9 }, linecolor: '#d4cfc5'
        },
        xaxis: { gridcolor: '#e4dfd5', zeroline: false, tickfont: { size: 9 }, linecolor: '#d4cfc5' },
        showlegend: false, hovermode: 'x unified',
    };

    Plotly.react(chartId, [trace], layout, { responsive: true, displayModeBar: false });
};



// Additional window exposure handled inline in script
