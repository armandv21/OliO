// OliO Copilot — Groq-powered financial assistant with autopilot mode
(function () {
  var BACKEND = 'https://app-backend-k9i5.onrender.com';
  var conversation = [];
  var isOpen = false;
  var isLoading = false;
  var isAutopilot = false;

  // ── Safe markdown renderer (escapes HTML first) ───────────────────────────
  function renderMd(raw) {
    var s = raw
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    s = s.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:3px;font-size:0.88em">$1</code>');
    s = s.replace(/(^|\n)(\d+)\. /g, '$1<span style="color:var(--blue);font-weight:700">$2.</span> ');
    s = s.replace(/(^|\n)[*\-] /g, '$1<span style="color:var(--blue);font-weight:700">&bull;</span> ');
    // Yahoo Finance links → OliO internal asset sheet (openAssetSheet)
    s = s.replace(/https?:\/\/finance\.yahoo\.com\/quote\/([^/?&\s<"']+)/g, function (_, ticker) {
      var escaped = ticker.replace(/'/g, "\\'");
      return '<a href="#" onclick="if(window.openAssetSheet){window.openAssetSheet(\'' + escaped + '\',\'' + escaped + '\',\'\');}return false;" style="display:inline-flex;align-items:center;gap:3px;color:var(--blue);text-decoration:none;font-weight:700;font-size:0.82em;padding:2px 7px;border-radius:10px;border:1.5px solid var(--blue);background:transparent;cursor:pointer">&#x1F4CA;&nbsp;' + ticker + '</a>';
    });
    s = s.replace(/\n\n+/g, '<br><br>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  function getUserProfile() {
    if (window._profileData) {
      return { pseudo: window._profileData.pseudo || '', abonnement: window._profileData.abonnement || 'gratuit' };
    }
    return null;
  }

  function bubbleStyle(role, isAction) {
    if (isAction) {
      return 'padding:10px 13px;border-radius:12px;font-size:0.78rem;line-height:1.6;max-width:90%;word-break:break-word;background:rgba(34,197,94,0.08);color:var(--ink);align-self:flex-start;border:1.5px solid rgba(34,197,94,0.25)';
    }
    if (role === 'bot') {
      return 'padding:10px 13px;border-radius:4px 14px 14px 14px;font-size:0.78rem;line-height:1.6;max-width:90%;word-break:break-word;background:var(--surface2);color:var(--ink);align-self:flex-start';
    }
    return 'padding:10px 13px;border-radius:14px 4px 14px 14px;font-size:0.78rem;line-height:1.6;max-width:80%;word-break:break-word;background:var(--blue);color:white;align-self:flex-end';
  }

  function appendMsg(role, html, isAction) {
    var container = document.getElementById('copilotMessages');
    if (!container) return null;
    var el = document.createElement('div');
    el.style.cssText = bubbleStyle(role === 'assistant' ? 'bot' : role, isAction);
    el.innerHTML = html;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function createWidget() {
    // FAB
    var fab = document.createElement('button');
    fab.id = 'copilotFab';
    fab.title = 'Copilote OliO';
    fab.setAttribute('aria-label', 'Ouvrir le copilote OliO');
    fab.innerHTML = '&#9672;';
    fab.style.cssText = 'position:fixed;bottom:76px;right:24px;width:46px;height:46px;border-radius:50%;background:var(--blue);color:white;border:none;font-size:1.2rem;cursor:pointer;z-index:8900;box-shadow:0 4px 16px rgba(0,0,0,0.20);display:flex;align-items:center;justify-content:center;transition:transform 0.18s;font-family:var(--font-sans)';
    fab.onmouseover = function () { this.style.transform = 'scale(1.08)'; };
    fab.onmouseout = function () { this.style.transform = ''; };
    fab.onclick = toggleCopilot;
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'copilotPanel';
    panel.style.cssText = 'position:fixed;bottom:132px;right:24px;width:380px;max-height:560px;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,0.18);z-index:8900;display:none;flex-direction:column;font-family:var(--font-sans);overflow:hidden';

    // Build panel HTML (apostrophes use HTML entity &#39; to avoid JS string breakage)
    var headerHtml = '<div id="copilotHeader" style="padding:13px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--blue);border-radius:17px 17px 0 0;flex-shrink:0">'
      + '<div style="display:flex;align-items:center;gap:9px">'
        + '<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;color:white">&#9672;</div>'
        + '<div>'
          + '<div style="color:white;font-weight:700;font-size:0.88rem">Copilote OliO</div>'
          + '<div id="copilotSubtitle" style="color:rgba(255,255,255,0.65);font-size:0.65rem;margin-top:1px">Finance &middot; App &middot; Risque</div>'
        + '</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:7px">'
        + '<button id="copilotAutoBtn" onclick="window._copilotToggleAuto()" title="Mode Autopilote" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.75);cursor:pointer;font-size:0.6rem;padding:4px 9px;border-radius:12px;font-family:var(--font-sans);font-weight:700;letter-spacing:0.06em;transition:all 0.15s">&#9889;&nbsp;AUTO</button>'
        + '<button onclick="window._copilotClose()" style="background:rgba(255,255,255,0.12);border:none;color:rgba(255,255,255,0.75);cursor:pointer;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem" onmouseover="this.style.background=\'rgba(255,255,255,0.22)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.12)\'">&#x2715;</button>'
      + '</div>'
    + '</div>';

    var welcomeHtml = '<div id="copilotMessages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px;max-height:400px">'
      + '<div style="' + bubbleStyle('bot') + '">'
        + 'Bonjour ! Je suis le copilote OliO. Posez-moi vos questions sur les concepts financiers, la navigation dans l&#39;app ou votre profil de risque.'
        + '<div style="margin-top:8px;padding:8px 10px;background:rgba(0,0,0,0.04);border-radius:7px;font-size:0.72rem;color:var(--muted);line-height:1.45">'
          + '<strong style="color:var(--ink)">&#9889; Mode Autopilote</strong><br>'
          + 'Activez AUTO pour que je construise votre portefeuille interactivement et lance les simulations directement dans l&#39;app.'
        + '</div>'
      + '</div>'
    + '</div>';

    var inputHtml = '<div style="padding:12px 14px;border-top:1px solid var(--border);background:var(--surface);flex-shrink:0">'
      + '<div style="display:flex;gap:8px;align-items:center">'
        + '<input id="copilotInput" type="text" placeholder="Posez votre question…" style="flex:1;padding:9px 13px;background:var(--bg);border:1.5px solid var(--border2);border-radius:10px;font-family:var(--font-sans);font-size:0.8rem;color:var(--ink);outline:none;transition:border-color 0.15s" onfocus="this.style.borderColor=\'var(--blue)\'" onblur="this.style.borderColor=\'var(--border2)\'" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();window._copilotSend();}"/>'
        + '<button id="copilotSendBtn" onclick="window._copilotSend()" style="width:36px;height:36px;flex-shrink:0;background:var(--blue);color:white;border:none;border-radius:10px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:opacity 0.15s">&#8594;</button>'
      + '</div>'
      + '<div style="font-size:0.58rem;color:var(--muted);margin-top:6px;text-align:center;letter-spacing:0.02em">Propulsé par Groq &middot; Llama 3.3 70B</div>'
    + '</div>';

    panel.innerHTML = headerHtml + welcomeHtml + inputHtml;
    document.body.appendChild(panel);
  }

  function toggleCopilot() {
    isOpen = !isOpen;
    var panel = document.getElementById('copilotPanel');
    if (!panel) return;
    panel.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) { var inp = document.getElementById('copilotInput'); if (inp) inp.focus(); }
  }

  function toggleAutopilot() {
    isAutopilot = !isAutopilot;
    var btn = document.getElementById('copilotAutoBtn');
    var subtitle = document.getElementById('copilotSubtitle');
    if (btn) {
      btn.style.background = isAutopilot ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)';
      btn.style.color = isAutopilot ? 'white' : 'rgba(255,255,255,0.75)';
      btn.style.borderColor = isAutopilot ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
    }
    if (subtitle) subtitle.textContent = isAutopilot ? '⚡ Autopilote actif' : 'Finance · App · Risque';
    if (isAutopilot) {
      appendMsg('assistant', '⚡ <strong>Mode Autopilote activé.</strong><br>Dites-moi quel portefeuille vous souhaitez créer. Je vais vous poser quelques questions pour affiner la sélection, puis lancer la simulation directement dans l&#39;app.');
    }
  }

  // ── Render quick-reply chips ──────────────────────────────────────────────
  function renderQuickReplies(buttons) {
    var container = document.getElementById('copilotMessages');
    if (!container) return;
    var old = container.querySelector('.cml-qr');
    if (old) old.remove();

    var wrap = document.createElement('div');
    wrap.className = 'cml-qr';
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 4px 0;align-self:flex-start;max-width:95%';

    buttons.forEach(function (btn) {
      var b = document.createElement('button');
      b.textContent = btn.label;
      b.style.cssText = 'padding:5px 12px;border-radius:20px;font-size:0.71rem;cursor:pointer;border:1.5px solid var(--blue);background:transparent;color:var(--blue);font-family:var(--font-sans);font-weight:600;transition:all 0.12s';
      b.onmouseover = function () { this.style.background = 'var(--blue)'; this.style.color = 'white'; };
      b.onmouseout = function () { this.style.background = 'transparent'; this.style.color = 'var(--blue)'; };
      b.onclick = function () {
        var qr = container.querySelector('.cml-qr');
        if (qr) qr.remove();
        if (btn.value) {
          var inp = document.getElementById('copilotInput');
          if (inp) inp.value = btn.value;
          window._copilotSend();
        } else {
          var inp = document.getElementById('copilotInput');
          if (inp) inp.focus();
        }
      };
      wrap.appendChild(b);
    });

    var other = document.createElement('button');
    other.textContent = 'Autre…';
    other.style.cssText = 'padding:5px 12px;border-radius:20px;font-size:0.71rem;cursor:pointer;border:1.5px solid var(--border2);background:transparent;color:var(--muted);font-family:var(--font-sans);transition:all 0.12s';
    other.onclick = function () {
      var qr = container.querySelector('.cml-qr');
      if (qr) qr.remove();
      var inp = document.getElementById('copilotInput');
      if (inp) inp.focus();
    };
    wrap.appendChild(other);

    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  // ── Render QCM questionnaire ──────────────────────────────────────────────
  function renderQuestionnaire(action) {
    var container = document.getElementById('copilotMessages');
    if (!container) return;

    var intro = document.createElement('div');
    intro.style.cssText = bubbleStyle('bot');
    intro.innerHTML = action.intro || 'Quelques questions pour votre portefeuille :';
    container.appendChild(intro);

    var form = document.createElement('div');
    form.id = 'copilotQcmForm';
    form.style.cssText = 'display:flex;flex-direction:column;gap:11px;background:var(--surface2);border-radius:12px;padding:14px;max-width:95%;align-self:flex-start';

    var selections = {};

    (action.questions || []).forEach(function (q, qi) {
      selections[qi] = { chips: new Set(), custom: '' };

      var qDiv = document.createElement('div');

      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.73rem;font-weight:700;color:var(--ink);margin-bottom:5px';
      lbl.textContent = q.label;
      qDiv.appendChild(lbl);

      var chipsDiv = document.createElement('div');
      chipsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:5px';

      (q.options || []).forEach(function (opt) {
        var chip = document.createElement('button');
        chip.textContent = opt;
        var baseStyle = 'padding:4px 10px;border-radius:20px;font-size:0.68rem;cursor:pointer;border:1.5px solid var(--border2);background:var(--bg);color:var(--ink);font-family:var(--font-sans);transition:all 0.12s';
        chip.style.cssText = baseStyle;
        chip.dataset.selected = '0';
        chip.onclick = function () {
          if (!q.multi) {
            chipsDiv.querySelectorAll('button').forEach(function (c) {
              c.dataset.selected = '0';
              c.style.cssText = baseStyle;
              selections[qi].chips.delete(c.textContent);
            });
          }
          if (chip.dataset.selected === '1') {
            chip.dataset.selected = '0';
            chip.style.cssText = baseStyle;
            selections[qi].chips.delete(opt);
          } else {
            chip.dataset.selected = '1';
            chip.style.background = 'var(--blue)';
            chip.style.borderColor = 'var(--blue)';
            chip.style.color = 'white';
            chip.style.fontWeight = '700';
            selections[qi].chips.add(opt);
          }
        };
        chipsDiv.appendChild(chip);
      });
      qDiv.appendChild(chipsDiv);

      var customInp = document.createElement('input');
      customInp.type = 'text';
      customInp.placeholder = 'Autre…';
      customInp.style.cssText = 'width:100%;box-sizing:border-box;padding:5px 9px;font-size:0.68rem;border:1px solid var(--border2);border-radius:7px;background:var(--bg);color:var(--ink);font-family:var(--font-sans);outline:none';
      customInp.oninput = function () { selections[qi].custom = this.value; };
      qDiv.appendChild(customInp);

      form.appendChild(qDiv);
    });

    var submitBtn = document.createElement('button');
    submitBtn.textContent = 'Construire mon portefeuille →';
    submitBtn.style.cssText = 'margin-top:4px;padding:9px 16px;background:var(--blue);color:white;border:none;border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:700;font-family:var(--font-sans);width:100%;transition:opacity 0.15s';
    submitBtn.onmouseover = function () { this.style.opacity = '0.85'; };
    submitBtn.onmouseout = function () { this.style.opacity = '1'; };
    submitBtn.onclick = function () {
      var parts = [];
      (action.questions || []).forEach(function (q, qi) {
        var sel = Array.from(selections[qi].chips);
        var custom = selections[qi].custom.trim();
        var val = sel.length ? sel.join(', ') : '';
        if (custom) val = val ? val + ', ' + custom : custom;
        if (!val) val = 'Non précisé';
        parts.push(q.label + ' : ' + val);
      });
      form.remove();
      var inp = document.getElementById('copilotInput');
      if (inp) { inp.value = parts.join(' | '); }
      window._copilotSend();
    };
    form.appendChild(submitBtn);
    container.appendChild(form);
    container.scrollTop = container.scrollHeight;
  }

  // ── Execute save action ───────────────────────────────────────────────────
  function executeSaveAction(action) {
    if (typeof window.openSavePortfolio === 'function') {
      window.openSavePortfolio('cml');
      setTimeout(function () {
        var ni = document.getElementById('savePortfolioName');
        if (ni) { ni.value = action.name || ''; ni.focus(); }
      }, 300);
    } else {
      // Fallback: direct Supabase save not possible from here — just open dialog
      appendMsg('assistant', 'Pour enregistrer, cliquez sur le bouton <strong>Enregistrer le portefeuille</strong> dans l&#39;onglet CML.');
    }
  }

  // ── Execute portfolio launch action ───────────────────────────────────────
  async function executePortfolioAction(action) {
    var tickers = action.tickers || [];
    if (tickers.length === 0) return;

    if (typeof appState !== 'undefined') {
      if (action.period) appState.period = action.period;
      if (action.rf !== undefined) appState.rf = action.rf;
    }
    var pmap = { '1y': 1, '2y': 2, '5y': 5 };
    var pInput = document.getElementById('homePeriodInput');
    if (pInput && action.period) pInput.value = pmap[action.period] || 2;
    var rfInput = document.getElementById('homeRfInput');
    if (rfInput && action.rf !== undefined) rfInput.value = (action.rf * 100).toFixed(1);

    // Show follow-up message before closing
    appendMsg('assistant',
      '&#x23F3; Simulation en cours dans l&#39;app&hellip; Revenez me parler une fois les r&eacute;sultats affich&eacute;s pour <strong>discuter du niveau de risque</strong> et <strong>enregistrer le portefeuille</strong>.'
    );

    await new Promise(function (r) { setTimeout(r, 2200); });
    window._copilotClose();
    await new Promise(function (r) { setTimeout(r, 300); });

    if (typeof window.applyPortfolio === 'function') {
      var w = 1 / tickers.length;
      window.applyPortfolio(tickers.map(function (t) { return { ticker: t, weight: w }; }));
    } else {
      if (typeof appState !== 'undefined') appState.selected.clear();
      document.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        var hit = tickers.indexOf(cb.value) !== -1;
        cb.checked = hit;
        if (hit) {
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          if (typeof appState !== 'undefined') appState.selected.add(cb.value);
        }
      });
      var sc = document.getElementById('selectedCount');
      if (sc) sc.textContent = tickers.length;
      setTimeout(function () { if (typeof runOptimization === 'function') runOptimization(); }, 800);
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    if (isLoading) return;
    var input = document.getElementById('copilotInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    var container = document.getElementById('copilotMessages');
    if (container) { var oldQr = container.querySelector('.cml-qr'); if (oldQr) oldQr.remove(); }

    appendMsg('user', renderMd(msg));
    conversation.push({ role: 'user', content: msg });

    isLoading = true;
    var sendBtn = document.getElementById('copilotSendBtn');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }

    var typing = appendMsg('assistant', '<span style="opacity:0.4;letter-spacing:3px">• • •</span>');

    try {
      var resp = await fetch(BACKEND + '/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation: conversation.slice(0, -1),
          user_profile: getUserProfile(),
          autopilot: isAutopilot,
        }),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();

      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);

      if (data.action && data.action.type === 'launch_portfolio') {
        var tickers = data.action.tickers || [];
        var html = '⚡ <strong>Lancement !</strong><br>'
          + renderMd(data.reply)
          + '<div style="margin-top:8px;padding:7px 10px;background:rgba(34,197,94,0.1);border-radius:7px;font-size:0.72rem;font-weight:600;color:var(--ink)">'
          + '✓ ' + tickers.join(' &middot; ')
          + '</div>';
        appendMsg('assistant', html, true);
        conversation.push({ role: 'assistant', content: data.reply });
        if (conversation.length > 20) conversation = conversation.slice(-20);
        await executePortfolioAction(data.action);
      } else if (data.action && data.action.type === 'quick_replies') {
        appendMsg('assistant', renderMd(data.reply));
        conversation.push({ role: 'assistant', content: data.reply });
        if (conversation.length > 20) conversation = conversation.slice(-20);
        if (data.action.buttons && data.action.buttons.length) renderQuickReplies(data.action.buttons);
      } else if (data.action && data.action.type === 'questions') {
        conversation.push({ role: 'assistant', content: data.reply });
        if (conversation.length > 20) conversation = conversation.slice(-20);
        renderQuestionnaire(data.action);
      } else if (data.action && data.action.type === 'save_portfolio') {
        appendMsg('assistant', renderMd(data.reply), true);
        conversation.push({ role: 'assistant', content: data.reply });
        if (conversation.length > 20) conversation = conversation.slice(-20);
        executeSaveAction(data.action);
      } else {
        appendMsg('assistant', renderMd(data.reply));
        conversation.push({ role: 'assistant', content: data.reply });
        if (conversation.length > 20) conversation = conversation.slice(-20);
      }
    } catch (e) {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      appendMsg('assistant', '<span style="color:var(--rose-lt)">Désolé, une erreur est survenue. Vérifiez votre connexion et réessayez.</span>');
      conversation.pop();
    }

    isLoading = false;
    if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
    var c = document.getElementById('copilotMessages');
    if (c) c.scrollTop = c.scrollHeight;
  }

  window._copilotClose = function () {
    isOpen = false;
    var p = document.getElementById('copilotPanel');
    if (p) p.style.display = 'none';
  };
  window._copilotSend = sendMessage;
  window._copilotToggleAuto = toggleAutopilot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
