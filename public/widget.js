(function () {
  if (window.__HELPUS_WIDGET_LOADED__) return;
  window.__HELPUS_WIDGET_LOADED__ = true;

  // Extract configuration from script tag
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var apiHost = currentScript.getAttribute('data-api-host') || window.HELPUS_WIDGET_API_HOST || 'http://localhost:4000';
  var primaryColor = currentScript.getAttribute('data-primary-color') || '#06b6d4';
  var title = currentScript.getAttribute('data-title') || 'HelpUS AI Assistant';
  var subtitle = currentScript.getAttribute('data-subtitle') || 'Atendimento Autônomo 24/7';
  var whatsappNumber = currentScript.getAttribute('data-whatsapp') || '5583999999999';

  // Inject Root Container
  var rootEl = document.createElement('div');
  rootEl.id = 'helpus-widget-root';
  document.body.appendChild(rootEl);

  var shadow = rootEl.attachShadow({ mode: 'open' });

  // CSS Styles inside Shadow DOM
  var styleTag = document.createElement('style');
  styleTag.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    
    .widget-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${primaryColor}, #3b82f6);
      box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .widget-fab:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 14px 30px -5px rgba(6, 182, 212, 0.6);
    }
    .widget-fab svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #ffffff;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .widget-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10b981;
      border: 2.5px solid #0f172a;
      border-radius: 50%;
    }

    .widget-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      background: #0f172a;
      color: #f8fafc;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999998;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .widget-header {
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, ${primaryColor}, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }
    .header-text h3 {
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
    }
    .header-text p {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .online-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      display: inline-block;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #94a3b8;
      transition: background 0.2s, color 0.2s;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .widget-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: radial-gradient(circle at top right, rgba(6, 182, 212, 0.05), transparent 40%);
    }

    .message {
      max-width: 85%;
      padding: 12px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message.bot {
      align-self: flex-start;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom-left-radius: 4px;
    }
    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, ${primaryColor}, #2563eb);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .audio-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      font-size: 11px;
      color: #38bdf8;
      cursor: pointer;
    }
    .audio-badge:hover {
      background: rgba(0, 0, 0, 0.4);
    }

    .typing-indicator {
      align-self: flex-start;
      padding: 10px 14px;
      background: #1e293b;
      border-radius: 16px;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .typing-dot {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .preset-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .preset-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 11px;
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-pill:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: ${primaryColor};
      color: #ffffff;
    }

    .widget-footer {
      padding: 12px 16px;
      background: #0f172a;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .input-box {
      flex: 1;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-box:focus {
      border-color: ${primaryColor};
    }
    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, ${primaryColor}, #3b82f6);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .send-btn:active {
      transform: scale(0.92);
    }
    .send-btn svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
    }
  `;

  shadow.appendChild(styleTag);

  // Widget HTML Structure
  var widgetHTML = `
    <div class="widget-fab" id="fabBtn" title="Atendimento com IA">
      <div class="widget-badge"></div>
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>

    <div class="widget-window" id="windowBox">
      <div class="widget-header">
        <div class="header-info">
          <div class="avatar-icon">H</div>
          <div class="header-text">
            <h3>${title}</h3>
            <p><span class="online-dot"></span> ${subtitle}</p>
          </div>
        </div>
        <div class="header-actions">
          <a class="icon-btn" id="waBtn" target="_blank" href="https://wa.me/${whatsappNumber}" title="WhatsApp Direct">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
          <button class="icon-btn" id="closeBtn">✕</button>
        </div>
      </div>

      <div class="widget-body" id="chatBody">
        <div class="message bot">
          Olá! Sou o assistente virtual da HelpUS com Inteligência Artificial e Voz Neural. Como posso te ajudar hoje?
        </div>
        <div class="preset-container" id="presets">
          <div class="preset-pill" data-msg="Quais os serviços oferecidos?">🚀 Serviços da HelpUS</div>
          <div class="preset-pill" data-msg="Como funciona a geração de voz?">🎙️ Geração de Voz</div>
          <div class="preset-pill" data-msg="Gostaria de solicitar um orçamento">💬 Falar com Atendente</div>
        </div>
      </div>

      <div class="widget-footer">
        <input type="text" class="input-box" id="msgInput" placeholder="Digite sua mensagem..." />
        <button class="send-btn" id="sendBtn">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  `;

  var wrapper = document.createElement('div');
  wrapper.innerHTML = widgetHTML;
  shadow.appendChild(wrapper);

  // Element References
  var fabBtn = shadow.getElementById('fabBtn');
  var windowBox = shadow.getElementById('windowBox');
  var closeBtn = shadow.getElementById('closeBtn');
  var chatBody = shadow.getElementById('chatBody');
  var msgInput = shadow.getElementById('msgInput');
  var sendBtn = shadow.getElementById('sendBtn');
  var presets = shadow.getElementById('presets');

  var isOpen = false;

  function toggleWindow() {
    isOpen = !isOpen;
    if (isOpen) {
      windowBox.classList.add('open');
      msgInput.focus();
    } else {
      windowBox.classList.remove('open');
    }
  }

  fabBtn.addEventListener('click', toggleWindow);
  closeBtn.addEventListener('click', toggleWindow);

  // Send Message Logic
  function appendMessage(text, sender, audioUrl) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + sender;
    msgDiv.textContent = text;

    if (audioUrl) {
      var audioBadge = document.createElement('div');
      audioBadge.className = 'audio-badge';
      audioBadge.innerHTML = '🔊 Ouvir áudio neural';
      audioBadge.onclick = function () {
        var audio = new Audio(apiHost + audioUrl);
        audio.play().catch(function(e) { console.log('Audio autoplay block:', e); });
      };
      msgDiv.appendChild(audioBadge);

      // Auto play audio for bot responses
      if (sender === 'bot') {
        var autoAudio = new Audio(apiHost + audioUrl);
        autoAudio.play().catch(function() {});
      }
    }

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    var typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function hideTyping() {
    var typingDiv = shadow.getElementById('typingIndicator');
    if (typingDiv) {
      typingDiv.remove();
    }
  }

  function handleSend(userText) {
    var text = userText || msgInput.value.trim();
    if (!text) return;

    if (presets) {
      presets.style.display = 'none';
    }

    appendMessage(text, 'user');
    msgInput.value = '';

    showTyping();

    fetch(apiHost + '/api/widget/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, generateAudio: true })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        if (data && data.text) {
          appendMessage(data.text, 'bot', data.audioUrl);
        } else {
          appendMessage('Desculpe, tive um problema ao processar. Tente novamente!', 'bot');
        }
      })
      .catch(function () {
        hideTyping();
        appendMessage('Olá! Nosso sistema está temporariamente off-line, mas você pode nos chamar diretamente no WhatsApp!', 'bot');
      });
  }

  sendBtn.addEventListener('click', function () { handleSend(); });
  msgInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleSend();
  });

  if (presets) {
    presets.addEventListener('click', function (e) {
      var target = e.target;
      if (target.classList.contains('preset-pill')) {
        var msg = target.getAttribute('data-msg');
        if (msg) handleSend(msg);
      }
    });
  }

})();
