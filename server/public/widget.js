(function () {
  if (window.SupportAIWidgetLoaded) return;
  window.SupportAIWidgetLoaded = true;

  // Read configuration from current script tag
  var scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var apiKey = scriptTag ? scriptTag.getAttribute('data-api-key') || scriptTag.getAttribute('data-key') || '' : '';
  var customUserId = scriptTag ? scriptTag.getAttribute('data-user-id') || '' : '';
  var customUserRole = scriptTag ? scriptTag.getAttribute('data-user-role') || scriptTag.getAttribute('data-role') || 'customer' : 'customer';
  var customBranchId = scriptTag ? scriptTag.getAttribute('data-branch-id') || '' : '';
  var customBackendUrl = scriptTag ? scriptTag.getAttribute('data-backend-url') : '';
  var defaultTheme = scriptTag ? scriptTag.getAttribute('data-theme') || 'dark' : 'dark';
  var defaultPosition = scriptTag ? scriptTag.getAttribute('data-position') || 'bottom-right' : 'bottom-right';

  var isEmbeddingOnly = scriptTag ? (
    scriptTag.getAttribute('data-embedding-only') === 'true' ||
    scriptTag.getAttribute('data-mode') === 'embedding-only' ||
    scriptTag.getAttribute('data-live-handoff') === 'false' ||
    scriptTag.getAttribute('data-support-communication') === 'false'
  ) : false;

  var backendUrl = (customBackendUrl || (scriptTag ? new URL(scriptTag.src).origin : window.location.origin)).replace(/\/+$/, '');

  if (!apiKey) {
    console.warn('[SupportAI Widget] Warning: Missing data-api-key attribute on script tag.');
  }

  // Custom Web Component Class using Shadow DOM
  class SupportAIWidgetElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this.state = {
        isOpen: false,
        sessionId: localStorage.getItem('__support_ai_session_' + apiKey) || null,
        botName: 'Knowledge AI',
        greeting: 'Hi! Ask me anything about our documentation and knowledge base.',
        accentColor: '#6366F1',
        theme: defaultTheme,
        position: defaultPosition,
        features: {
          fileUploads: !isEmbeddingOnly && scriptTag?.getAttribute('data-file-uploads') !== 'false',
          liveAgentHandoff: !isEmbeddingOnly && scriptTag?.getAttribute('data-live-handoff') !== 'false',
          embeddingOnly: isEmbeddingOnly
        },
        messages: [],
        loading: false,
        userInfo: null,
      };
    }

    connectedCallback() {
      this.renderShadowDOM();
      this.bindEvents();
      this.initHandshake();
      this.initProactiveTrigger();
    }

    initProactiveTrigger() {
      const delayAttr = scriptTag ? scriptTag.getAttribute('data-proactive-delay') : null;
      const msgAttr = scriptTag ? scriptTag.getAttribute('data-proactive-msg') : null;
      const delay = parseInt(delayAttr || '20', 10);
      if (delay > 0) {
        setTimeout(() => {
          if (!this.state.isOpen && this.state.messages.length === 0) {
            this.openWindow();
            if (msgAttr) {
              this.appendMessage({ text: msgAttr, isUser: false });
            }
          }
        }, delay * 1000);
      }
    }

    submitCsatRating(rating, comment = '') {
      if (!this.state.sessionId) return;
      fetch(backendUrl + '/api/v1/feedback/csat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ chatId: this.state.sessionId, rating, comment }),
      })
        .then((res) => res.json())
        .then(() => {
          this.appendMessage({ text: '⭐ Thank you for your feedback! Rating saved.', isUser: false });
        })
        .catch(() => {});
    }

    renderShadowDOM() {
      const { accentColor, position } = this.state;
      const isLeft = position.includes('left');

      const styleString = `
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .sai-trigger-bubble {
          position: fixed;
          bottom: 24px;
          ${isLeft ? 'left: 24px;' : 'right: 24px;'}
          z-index: 999999;
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: ${accentColor};
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          border: none;
          outline: none;
        }
        .sai-trigger-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
        }

        .sai-chat-window {
          position: fixed;
          bottom: 96px;
          ${isLeft ? 'left: 24px;' : 'right: 24px;'}
          z-index: 999999;
          width: 390px;
          max-width: calc(100vw - 32px);
          height: 600px;
          max-height: calc(100vh - 120px);
          border-radius: 20px;
          background: #0f172a;
          color: #f8fafc;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px) scale(0.96);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .sai-chat-window.sai-open {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        .sai-header {
          padding: 16px 20px;
          background: rgba(30, 41, 59, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sai-agent-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sai-online-badge {
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }
        .sai-bot-title {
          font-weight: 700;
          font-size: 15px;
        }
        .sai-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
          border-radius: 8px;
          padding: 2px 6px;
        }
        .sai-close-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }

        .sai-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sai-msg {
          max-width: 85%;
          padding: 12px 15px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.5;
          word-break: break-word;
        }
        .sai-msg-user {
          align-self: flex-end;
          background: ${accentColor};
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .sai-msg-ai {
          align-self: flex-start;
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom-left-radius: 4px;
        }

        @keyframes sai-pulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes sai-sparkle-spin {
          0% { transform: rotate(0deg) scale(0.9); }
          50% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(0.9); }
        }
        @keyframes sai-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .sai-msg-thinking {
          display: inline-flex !important;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)) !important;
          border: 1px solid rgba(99, 102, 241, 0.35) !important;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
          padding: 10px 14px !important;
        }
        .sai-thinking-sparkle {
          font-size: 13px;
          display: inline-block;
          animation: sai-sparkle-spin 3s infinite ease-in-out;
        }
        .sai-thinking-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.2px;
          background: linear-gradient(90deg, #e2e8f0, ${accentColor}, #e2e8f0);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sai-gradient-shift 3s infinite linear;
        }
        .sai-dots {
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
          margin-left: 2px;
        }
        .sai-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: ${accentColor};
          animation: sai-pulse 1.2s infinite ease-in-out;
        }
        .sai-dot:nth-child(1) { animation-delay: 0s; }
        .sai-dot:nth-child(2) { animation-delay: 0.2s; }
        .sai-dot:nth-child(3) { animation-delay: 0.4s; }

        .sai-citations {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .sai-citation-badge {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          text-decoration: none;
        }

        .sai-footer {
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.96);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sai-input {
          flex: 1;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 10px 14px;
          color: #ffffff;
          font-size: 13.5px;
          outline: none;
        }
        .sai-input:focus { border-color: ${accentColor}; }

        .sai-action-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sai-action-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); }

        .sai-send-btn {
          background: ${accentColor};
          color: #ffffff;
          border: none;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `;

      this.shadowRoot.innerHTML = `
        <style>${styleString}</style>

        <button class="sai-trigger-bubble" id="sai-trigger" title="Open Support Chat">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>

        <div class="sai-chat-window" id="sai-window">
          <div class="sai-header">
            <div class="sai-agent-profile">
              <span class="sai-online-badge"></span>
              <div>
                <div class="sai-bot-title" id="sai-bot-title">${this.state.botName}</div>
                <div style="font-size:11px;color:#94a3b8;">Support AI Assistant</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              ${this.state.features.liveAgentHandoff ? `
              <button id="sai-escalate" title="Request Live Support Agent" style="background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);color:#eab308;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;cursor:pointer;">
                ⚡ Live Agent
              </button>` : ''}
              <button class="sai-close-btn" id="sai-close">&times;</button>
            </div>
          </div>

          <div class="sai-body" id="sai-body"></div>

          <div class="sai-footer">
            <input type="file" id="sai-file-input" style="display:none;" />
            ${this.state.features.fileUploads ? `
            <button class="sai-action-btn" id="sai-attach-btn" title="Upload Attachment">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>` : ''}
            <input type="text" class="sai-input" id="sai-input" placeholder="Ask anything about our documentation..." />
            <button class="sai-send-btn" id="sai-send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      `;
    }

    bindEvents() {
      const root = this.shadowRoot;
      const trigger = root.getElementById('sai-trigger');
      const closeBtn = root.getElementById('sai-close');
      const sendBtn = root.getElementById('sai-send');
      const input = root.getElementById('sai-input');
      const attachBtn = root.getElementById('sai-attach-btn');
      const fileInput = root.getElementById('sai-file-input');
      const escalateBtn = root.getElementById('sai-escalate');

      trigger.addEventListener('click', () => this.toggleWindow());
      closeBtn.addEventListener('click', () => this.closeWindow());
      sendBtn.addEventListener('click', () => this.handleSendMessage());
      input.addEventListener('keydown', (e) => e.key === 'Enter' && this.handleSendMessage());

      if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
      }

      if (escalateBtn) {
        escalateBtn.addEventListener('click', () => this.handleEscalate());
      }
    }

    toggleWindow() {
      this.state.isOpen = !this.state.isOpen;
      const win = this.shadowRoot.getElementById('sai-window');
      if (this.state.isOpen) {
        win.classList.add('sai-open');
        this.shadowRoot.getElementById('sai-input').focus();
      } else {
        win.classList.remove('sai-open');
      }
    }

    openWindow() {
      this.state.isOpen = true;
      this.shadowRoot.getElementById('sai-window').classList.add('sai-open');
      this.shadowRoot.getElementById('sai-input').focus();
    }

    closeWindow() {
      this.state.isOpen = false;
      this.shadowRoot.getElementById('sai-window').classList.remove('sai-open');
    }

    // Step 2: Handshake & Config (/api/v1/widget/init)
    initHandshake() {
      if (!apiKey) return;
      fetch(backendUrl + '/api/v1/widget/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-user-id': customUserId,
          'x-user-role': customUserRole,
          'x-branch-id': customBranchId,
        },
        body: JSON.stringify({
          sessionId: this.state.sessionId,
          userId: customUserId,
          role: customUserRole,
          branchId: customBranchId,
          clientTimestamp: Date.now(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            this.state.botName = data.botName || 'Supernova AI';
            this.state.greeting = data.greeting || 'Hi! How can we help you today?';
            this.state.accentColor = data.accentColor || '#6366F1';
            this.state.features = data.features || { fileUploads: true, liveAgentHandoff: true };

            if (data.sessionId) {
              this.state.sessionId = data.sessionId;
              localStorage.setItem('__support_ai_session_' + apiKey, data.sessionId);
            }

            this.shadowRoot.getElementById('sai-bot-title').innerText = this.state.botName;
            this.renderMessages();
          }
        })
        .catch((err) => console.warn('[SupportAI Widget] Handshake notice:', err));
    }

    // Step 4: SSE Token Streaming (/api/v1/chat/stream)
    handleSendMessage(presetText) {
      const input = this.shadowRoot.getElementById('sai-input');
      const text = presetText || input.value.trim();
      if (!text || this.state.loading) return;

      if (!presetText) input.value = '';

      this.appendMessage({ text, isUser: true });
      this.state.loading = true;
      this.shadowRoot.getElementById('sai-send').disabled = true;

      // Call SSE Stream API
      fetch(backendUrl + '/api/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-user-id': customUserId,
          'x-user-role': customUserRole,
          'x-branch-id': customBranchId,
        },
        body: JSON.stringify({
          sessionId: this.state.sessionId,
          apiKey: apiKey,
          userId: customUserId,
          role: customUserRole,
          roleName: customUserRole,
          branchId: customBranchId,
          prompt: text,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Stream request failed');

          const aiMsgIndex = this.appendMessage({ text: '', isUser: false, isThinking: true, citations: [] });
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          const processBuffer = () => {
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop(); // keep last incomplete block

            for (const chunk of chunks) {
              if (!chunk.trim()) continue;

              let eventType = 'message';
              let dataText = '';

              const lines = chunk.split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('event:')) {
                  eventType = trimmed.substring(6).trim();
                } else if (trimmed.startsWith('data:')) {
                  dataText = trimmed.substring(5).trim();
                }
              }

              if (!dataText) continue;

              try {
                const payload = JSON.parse(dataText);

                if (eventType === 'metadata' && payload.sources) {
                  this.updateAIMessage(aiMsgIndex, { citations: payload.sources });
                } else if (eventType === 'token' && payload.text !== undefined) {
                  this.appendToAIMessage(aiMsgIndex, payload.text);
                } else if (eventType === 'handoff') {
                  this.appendMessage({
                    text: '⚡ Connecting to Human Support... A live agent has been notified.',
                    isUser: false,
                  });
                }
              } catch (e) {
                console.error('[Widget SSE Parse Error]', e);
              }
            }
          };

          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                this.state.loading = false;
                this.shadowRoot.getElementById('sai-send').disabled = false;
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              processBuffer();
              readStream();
            });
          };

          readStream();
        })
        .catch((err) => {
          console.warn('[SupportAI Widget] SSE Stream fallback activated:', err);
          const aiMsgIndex = this.appendMessage({ text: '', isUser: false, isThinking: true, citations: [] });

          fetch(backendUrl + '/api/v1/chat/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'x-user-id': customUserId,
              'x-branch-id': customBranchId,
            },
            body: JSON.stringify({
              chatId: this.state.sessionId,
              apiKey: apiKey,
              userId: customUserId,
              branchId: customBranchId,
              message: text,
            }),
          })
            .then((r) => r.json())
            .then((res) => {
              this.state.loading = false;
              this.shadowRoot.getElementById('sai-send').disabled = false;
              if (res.success && res.data) {
                if (res.data.chatId && !this.state.sessionId) {
                  this.state.sessionId = res.data.chatId;
                  localStorage.setItem('__support_ai_session_' + apiKey, res.data.chatId);
                }
                this.updateAIMessage(aiMsgIndex, {
                  text: res.data.answer || 'I am here to assist you.',
                  isThinking: false,
                  citations: res.data.citations || [],
                });
              } else {
                this.updateAIMessage(aiMsgIndex, {
                  text: res.message || 'Unable to connect to support assistant.',
                  isThinking: false,
                });
              }
            })
            .catch(() => {
              this.state.loading = false;
              this.shadowRoot.getElementById('sai-send').disabled = false;
              this.updateAIMessage(aiMsgIndex, {
                text: 'Unable to connect to support assistant. Please try again later.',
                isThinking: false,
              });
            });
        });
    }

    // Step 5: Multipart Upload (/api/v1/chat/upload)
    handleFileUpload(file) {
      if (!file || !apiKey) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', this.state.sessionId || '');
      formData.append('apiKey', apiKey);

      this.appendMessage({ text: `[Uploading file: ${file.name}...]`, isUser: true });

      fetch(backendUrl + '/api/v1/chat/upload', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            this.appendMessage({
              text: `📎 Attached file: ${res.data.filename}`,
              isUser: false,
            });
          }
        })
        .catch(() => {});
    }

    handleEscalate() {
      if (!this.state.sessionId) return;
      this.appendMessage({
        text: '⚡ Requesting live human support agent...',
        isUser: false,
      });

      fetch(backendUrl + '/api/v1/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ apiKey, chatId: this.state.sessionId }),
      }).catch(() => {});
    }

    appendMessage(msg) {
      this.state.messages.push(msg);
      this.renderMessages();
      return this.state.messages.length - 1;
    }

    appendToAIMessage(index, token) {
      if (this.state.messages[index]) {
        this.state.messages[index].isThinking = false;
        this.state.messages[index].text = (this.state.messages[index].text || '') + token;
        this.renderMessages();
      }
    }

    updateAIMessage(index, data) {
      if (this.state.messages[index]) {
        Object.assign(this.state.messages[index], data);
        this.renderMessages();
      }
    }

    renderMessages() {
      const body = this.shadowRoot.getElementById('sai-body');
      body.innerHTML = '';

      if (this.state.messages.length === 0) {
        const greetingDiv = document.createElement('div');
        greetingDiv.className = 'sai-msg sai-msg-ai';
        greetingDiv.innerText = this.state.greeting;
        body.appendChild(greetingDiv);
        return;
      }

      this.state.messages.forEach((m) => {
        if (!m.isUser && (!m.text || m.isThinking)) {
          const thinkDiv = document.createElement('div');
          thinkDiv.className = 'sai-msg sai-msg-ai sai-msg-thinking';
          thinkDiv.innerHTML = `
            <span class="sai-thinking-sparkle">✨</span>
            <span class="sai-thinking-label">AI is thinking</span>
            <span class="sai-dots">
              <span class="sai-dot"></span>
              <span class="sai-dot"></span>
              <span class="sai-dot"></span>
            </span>
          `;
          body.appendChild(thinkDiv);
          return;
        }

        const div = document.createElement('div');
        div.className = 'sai-msg ' + (m.isUser ? 'sai-msg-user' : 'sai-msg-ai');
        div.innerText = m.text;

        if (!m.isUser && m.citations && m.citations.length > 0) {
          const citationsDiv = document.createElement('div');
          citationsDiv.className = 'sai-citations';
          
          const primarySrc = m.citations[0];
          const badge = document.createElement('span');
          badge.className = 'sai-citation-badge';
          badge.innerText = '📄 ' + (primarySrc.title || primarySrc.documentName || 'Official Document');
          citationsDiv.appendChild(badge);

          if (m.citations.length > 1) {
            const extraContainer = document.createElement('span');
            extraContainer.style.display = 'none';
            extraContainer.style.gap = '4px';

            for (let k = 1; k < m.citations.length; k++) {
              const extraBadge = document.createElement('span');
              extraBadge.className = 'sai-citation-badge';
              extraBadge.innerText = '📄 ' + (m.citations[k].title || m.citations[k].documentName || 'Document');
              extraContainer.appendChild(extraBadge);
            }

            const toggleBtn = document.createElement('span');
            toggleBtn.className = 'sai-citation-badge';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.opacity = '0.85';
            toggleBtn.innerText = '+' + (m.citations.length - 1) + ' more';
            toggleBtn.onclick = function() {
              if (extraContainer.style.display === 'none') {
                extraContainer.style.display = 'inline-flex';
                toggleBtn.innerText = 'less';
              } else {
                extraContainer.style.display = 'none';
                toggleBtn.innerText = '+' + (m.citations.length - 1) + ' more';
              }
            };

            citationsDiv.appendChild(extraContainer);
            citationsDiv.appendChild(toggleBtn);
          }

          div.appendChild(citationsDiv);
        }

        body.appendChild(div);
      });

      body.scrollTop = body.scrollHeight;
    }
  }

  // Register Custom Web Component
  customElements.define('support-ai-widget', SupportAIWidgetElement);

  // Auto-inject <support-ai-widget> custom element into <body> if not present
  var widgetInstance = document.querySelector('support-ai-widget');
  if (!widgetInstance) {
    widgetInstance = document.createElement('support-ai-widget');
    document.body.appendChild(widgetInstance);
  }

  // Expose global JS SDK on window.SupportAI for zero-framework integrations (JS, Express, Python, HTML)
  window.SupportAI = {
    open: function () {
      if (widgetInstance && widgetInstance.openWindow) widgetInstance.openWindow();
    },
    close: function () {
      if (widgetInstance && widgetInstance.closeWindow) widgetInstance.closeWindow();
    },
    toggle: function () {
      if (widgetInstance && widgetInstance.toggleWindow) widgetInstance.toggleWindow();
    },
    sendMessage: function (text) {
      if (!text) return;
      if (widgetInstance) {
        if (!widgetInstance.state.isOpen) widgetInstance.openWindow();
        if (widgetInstance.handleSendMessage) widgetInstance.handleSendMessage(text);
      }
    },
    identifyUser: function (userInfo) {
      if (!userInfo) return;
      if (widgetInstance) {
        widgetInstance.state.userInfo = userInfo;
        if (userInfo.userId || userInfo.id) {
          customUserId = userInfo.userId || userInfo.id;
        }
        console.log('[SupportAI Widget] Identified User:', userInfo);
        // Refresh handshake context with updated identity
        if (widgetInstance.initHandshake) widgetInstance.initHandshake();
      }
    },
    init: function (config) {
      if (!config) return;
      if (config.apiKey) apiKey = config.apiKey;
      if (config.backendUrl) backendUrl = config.backendUrl.replace(/\/+$/, '');
      if (config.userId) customUserId = config.userId;
      if (config.branchId) customBranchId = config.branchId;
      if (widgetInstance && widgetInstance.initHandshake) widgetInstance.initHandshake();
    },
    submitCsat: function (rating, comment) {
      if (widgetInstance && widgetInstance.submitCsatRating) widgetInstance.submitCsatRating(rating, comment);
    },
    triggerProactive: function ({ delay = 1, message = 'Hi! How can we assist you today?' } = {}) {
      setTimeout(() => {
        if (widgetInstance) {
          if (!widgetInstance.state.isOpen) widgetInstance.openWindow();
          widgetInstance.appendMessage({ text: message, isUser: false });
        }
      }, (delay || 1) * 1000);
    },
  };
})();
