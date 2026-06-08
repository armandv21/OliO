// OliO Copilot — Groq-powered financial assistant
(function () {
  var BACKEND = 'https://app-backend-k9i5.onrender.com';
  var conversation = [];
  var isOpen = false;
  var isLoading = false;

  function getUserProfile() {
    if (window._profileData) {
      return {
        pseudo: window._profileData.pseudo || '',
        abonnement: window._profileData.abonnement || 'gratuit',
      };
    }
    return null;
  }

  function createWidget() {
    var fab = document.createElement('button');
    fab.id = 'copilotFab';
    fab.title = 'Copilote OliO';
    fab.setAttribute('aria-label', 'Ouvrir le copilote OliO');
    fab.innerHTML = '&#9672;';
    fab.style.cssText = [
      'position:fixed', 'bottom:76px', 'right:24px',
      'width:46px', 'height:46px', 'border-radius:50%',
      'background:var(--blue)', 'color:white', 'border:none',
      'font-size:1.2rem', 'cursor:pointer', 'z-index:8900',
      'box-shadow:0 4px 16px rgba(0,0,0,0.20)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'transition:transform 0.18s, box-shadow 0.18s',
      'font-family:var(--font-sans)'
    ].join(';');
    fab.onmouseover = function () { this.style.transform = 'scale(1.08)'; };
    fab.onmouseout = function () { this.style.transform = ''; };
    fab.onclick = toggleCopilot;
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.id = 'copilotPanel';
    panel.style.cssText = [
      'position:fixed', 'bottom:132px', 'right:24px',
      'width:360px', 'max-height:520px',
      'background:var(--surface)', 'border:1px solid var(--border)',
      'border-radius:16px', 'box-shadow:0 8px 32px rgba(0,0,0,0.16)',
      'z-index:8900', 'display:none', 'flex-direction:column',
      'font-family:var(--font-sans)', 'overflow:hidden'
    ].join(';');
    panel.innerHTML = [
      '<div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:space-between;background:var(--blue);border-radius:15px 15px 0 0;">',
        '<div style="display:flex;align-items:center;gap:10px;">',
          '<span style="color:white;font-size:1.1rem;">&#9672;</span>',
          '<div>',
            '<div style="color:white;font-weight:600;font-size:0.85rem;letter-spacing:0.02em;">Copilote OliO</div>',
            '<div style="color:rgba(255,255,255,0.72);font-size:0.62rem;">Finance · App · Risque</div>',
          '</div>',
        '</div>',
        '<button onclick="window._copilotClose()" style="background:none;border:none;color:rgba(255,255,255,0.85);cursor:pointer;font-size:1rem;padding:4px;line-height:1;">&#x2715;</button>',
      '</div>',
      '<div id="copilotMessages" style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:180px;max-height:360px;">',
        '<div style="background:var(--surface2);padding:11px 13px;border-radius:10px 10px 10px 2px;font-size:0.79rem;color:var(--ink);line-height:1.55;max-width:88%;">',
          'Bonjour ! Je suis le copilote OliO. Posez-moi vos questions sur les concepts financiers, la navigation dans l’app, l’analyse d’entreprises ou votre profil de risque.',
        '</div>',
      '</div>',
      '<div style="padding:10px 14px;border-top:1px solid var(--border);">',
        '<div style="display:flex;gap:7px;">',
          '<input id="copilotInput" type="text" placeholder="Posez votre question…"',
            ' style="flex:1;padding:9px 12px;background:var(--bg);border:1px solid var(--border2);border-radius:8px;font-family:var(--font-sans);font-size:0.79rem;color:var(--ink);outline:none;"',
            ' onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();window._copilotSend();}"/>',
          '<button id="copilotSendBtn" onclick="window._copilotSend()"',
            ' style="padding:9px 13px;background:var(--blue);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:opacity 0.15s;flex-shrink:0;">',
            '&#8594;',
          '</button>',
        '</div>',
        '<div style="font-size:0.59rem;color:var(--muted);margin-top:5px;text-align:center;">Propulsé par Groq · Llama 3.3 70B</div>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);
  }

  function toggleCopilot() {
    isOpen = !isOpen;
    var panel = document.getElementById('copilotPanel');
    if (!panel) return;
    panel.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      var inp = document.getElementById('copilotInput');
      if (inp) inp.focus();
    }
  }

  function buildMsgEl(role, content) {
    var el = document.createElement('div');
    var isBot = role === 'assistant';
    el.style.cssText = [
      'padding:11px 13px',
      'border-radius:' + (isBot ? '10px 10px 10px 2px' : '10px 10px 2px 10px'),
      'font-size:0.79rem', 'line-height:1.55', 'max-width:88%', 'word-break:break-word',
      'background:' + (isBot ? 'var(--surface2)' : 'var(--blue)'),
      'color:' + (isBot ? 'var(--ink)' : 'white'),
      'align-self:' + (isBot ? 'flex-start' : 'flex-end')
    ].join(';');
    el.textContent = content;
    return el;
  }

  function appendMessage(role, content) {
    var container = document.getElementById('copilotMessages');
    if (!container) return null;
    var el = buildMsgEl(role, content);
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  async function sendMessage() {
    if (isLoading) return;
    var input = document.getElementById('copilotInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    appendMessage('user', msg);
    conversation.push({ role: 'user', content: msg });

    isLoading = true;
    var sendBtn = document.getElementById('copilotSendBtn');
    if (sendBtn) sendBtn.disabled = true;
    var loadingEl = appendMessage('assistant', '…');

    try {
      var resp = await fetch(BACKEND + '/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation: conversation.slice(0, -1),
          user_profile: getUserProfile(),
        }),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();
      if (loadingEl) loadingEl.textContent = data.reply;
      conversation.push({ role: 'assistant', content: data.reply });
      if (conversation.length > 20) conversation = conversation.slice(-20);
    } catch (e) {
      if (loadingEl) {
        loadingEl.textContent = 'Désolé, une erreur est survenue. Vérifiez votre connexion et réessayez.';
        loadingEl.style.color = 'var(--rose-lt)';
      }
      conversation.pop();
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    var container = document.getElementById('copilotMessages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  window._copilotClose = function () {
    isOpen = false;
    var panel = document.getElementById('copilotPanel');
    if (panel) panel.style.display = 'none';
  };
  window._copilotSend = sendMessage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
