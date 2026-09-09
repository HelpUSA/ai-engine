(function() {
  if (window.HelpUSWidgetLoaded) return;
  window.HelpUSWidgetLoaded = true;

  const scriptTag = document.currentScript;
  const widgetTitle = (scriptTag && scriptTag.getAttribute('data-title')) || 'HelpUS AI Assistant';
  const widgetSubtitle = (scriptTag && scriptTag.getAttribute('data-subtitle')) || 'Atendimento Central 24/7';
  const primaryColor = (scriptTag && scriptTag.getAttribute('data-primary-color')) || '#0284c7';

  // Inject styles
  const style = document.createElement('style');
  style.innerHTML = `
    .helpus-widget-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .helpus-widget-bubble:hover {
      transform: scale(1.08);
    }
    .helpus-widget-window {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #0f172a;
      color: white;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .helpus-widget-header {
      padding: 16px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .helpus-widget-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .helpus-msg {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
    }
    .helpus-msg-bot {
      background: #334155;
      color: #f8fafc;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .helpus-msg-user {
      background: ${primaryColor};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .helpus-widget-footer {
      padding: 12px 16px;
      background: #1e293b;
      border-top: 1px solid #334155;
      display: flex;
      gap: 8px;
    }
    .helpus-widget-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid #334155;
      color: white;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
    }
    .helpus-widget-send {
      background: ${primaryColor};
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'helpus-widget-bubble';
  bubble.innerHTML = '🤖';

  // Window
  const win = document.createElement('div');
  win.className = 'helpus-widget-window';
  win.style.display = 'none';

  win.innerHTML = `
    <div class="helpus-widget-header">
      <div>
        <div style="font-weight: bold; font-size: 14px;">${widgetTitle}</div>
        <div style="font-size: 11px; opacity: 0.7;">${widgetSubtitle}</div>
      </div>
      <button id="helpus-close-btn" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
    </div>
    <div className="helpus-widget-body" id="helpus-body">
      <div className="helpus-msg helpus-msg-bot">
        Olá! Seja bem-vindo à HelpUS Technology. Como posso te ajudar hoje?
      </div>
    </div>
    <div className="helpus-widget-footer">
      <input type="text" id="helpus-input" className="helpus-widget-input" placeholder="Digite sua mensagem..." />
      <button id="helpus-send-btn" className="helpus-widget-send">Enviar</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  let isOpen = false;
  bubble.onclick = () => {
    isOpen = !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';
  };

  document.getElementById('helpus-close-btn').onclick = () => {
    isOpen = false;
    win.style.display = 'none';
  };

  const bodyEl = document.getElementById('helpus-body');
  const inputEl = document.getElementById('helpus-input');
  const sendBtn = document.getElementById('helpus-send-btn');

  const sendMessage = async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    // User msg
    const userMsg = document.createElement('div');
    userMsg.className = 'helpus-msg helpus-msg-user';
    userMsg.innerText = text;
    bodyEl.appendChild(userMsg);
    inputEl.value = '';
    bodyEl.scrollTop = bodyEl.scrollHeight;

    // Call API
    try {
      const res = await fetch('https://agent.helpusbr.com/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      const botMsg = document.createElement('div');
      botMsg.className = 'helpus-msg helpus-msg-bot';
      botMsg.innerText = data.text || 'Obrigado pelo contato! Nossa equipe responderá em breve.';
      bodyEl.appendChild(botMsg);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } catch (e) {
      const botMsg = document.createElement('div');
      botMsg.className = 'helpus-msg helpus-msg-bot';
      botMsg.innerText = 'Obrigado por nos contatar! Acesse hub.helpusbr.com para mais informações.';
      bodyEl.appendChild(botMsg);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  };

  sendBtn.onclick = sendMessage;
  inputEl.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };
})();
