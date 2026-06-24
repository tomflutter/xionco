const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const quickSuggestions = document.getElementById('quick-suggestions');

let conversationHistory = [];
let isLoading = false;

function getTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(content, role) {
  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${role === 'user' ? 'user-wrapper' : 'bot-wrapper'}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role === 'user' ? 'user-msg' : 'bot-msg'}`;

  if (role === 'assistant') {
    // Parse markdown-like formatting
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
      .split('\n')
      .map(line => {
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<li>${line.slice(2)}</li>`;
        }
        return line ? `<p>${line}</p>` : '';
      })
      .join('');
    msgDiv.innerHTML = formatted;
  } else {
    msgDiv.textContent = content;
  }

  const timeDiv = document.createElement('div');
  timeDiv.className = 'msg-time';
  timeDiv.textContent = getTime();

  const inner = document.createElement('div');
  inner.appendChild(msgDiv);
  inner.appendChild(timeDiv);

  wrapper.appendChild(avatar);
  wrapper.appendChild(inner);

  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function addTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-wrapper bot-wrapper';
  wrapper.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🤖';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    indicator.appendChild(dot);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(indicator);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || isLoading) return;

  // Hide suggestions
  if (quickSuggestions) quickSuggestions.style.display = 'none';

  // Add user message to UI
  addMessage(message, 'user');
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Add to history
  conversationHistory.push({ role: 'user', content: message });

  // Set loading state
  isLoading = true;
  sendBtn.disabled = true;
  addTypingIndicator();

  try {
    const response = await fetch('/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: conversationHistory.slice(-10)
      })
    });

    const data = await response.json();
    removeTypingIndicator();

    if (data.success) {
      addMessage(data.reply, 'assistant');
      conversationHistory.push({ role: 'assistant', content: data.reply });
    } else {
      // Show API key warning if needed
      if (data.error && data.error.includes('GROQ_API_KEY')) {
        document.getElementById('api-warning').style.display = 'block';
      }
      addErrorMessage(data.error || 'Terjadi kesalahan tidak diketahui.');
    }
  } catch (err) {
    removeTypingIndicator();
    addErrorMessage('Gagal terhubung ke server. Periksa koneksi Anda.');
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

function addErrorMessage(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-wrapper bot-wrapper';
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '⚠️';
  const msg = document.createElement('div');
  msg.className = 'msg error-msg';
  msg.textContent = text;
  wrapper.appendChild(avatar);
  wrapper.appendChild(msg);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function sendSuggestion(text) {
  chatInput.value = text;
  sendMessage();
}

function clearChat() {
  if (!confirm('Hapus semua percakapan?')) return;
  conversationHistory = [];
  // Keep only the first welcome message
  const msgs = chatMessages.querySelectorAll('.msg-wrapper');
  msgs.forEach((m, i) => { if (i > 0) m.remove(); });
  if (quickSuggestions) quickSuggestions.style.display = 'flex';
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// Focus input on load
window.addEventListener('load', () => chatInput.focus());
