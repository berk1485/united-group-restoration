// United Group Restoration - Shared Frontend Utilities
// This file contains shared utilities; page-specific logic lives inline in each HTML file.

const UGR = {
  // API base URL
  apiBase: '',

  // Fetch with error handling
  async api(path, options = {}) {
    const res = await fetch(this.apiBase + path, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  // Format phone number display
  formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    return phone;
  },

  // Format date for display
  formatDate(str, opts = {}) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', ...opts
    });
  },

  // Escape HTML
  escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // Storage helpers
  get leadId() { return localStorage.getItem('ugr_lead_id'); },
  set leadId(v) { localStorage.setItem('ugr_lead_id', v); },
  get chatSession() { return localStorage.getItem('ugr_chat_session'); },
  set chatSession(v) { localStorage.setItem('ugr_chat_session', v); },

  // Show toast notification
  toast(message, type = 'info') {
    const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };
    const el = document.createElement('div');
    el.className = `fixed bottom-24 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium transition-all`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }
};

// Phone number auto-format
document.addEventListener('input', e => {
  if (e.target.type === 'tel') {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (val.length >= 6) e.target.value = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
    else if (val.length >= 3) e.target.value = `(${val.slice(0,3)}) ${val.slice(3)}`;
    else e.target.value = val;
  }
});

// Global error handler for fetch
window.addEventListener('unhandledrejection', e => {
  if (e.reason && e.reason.message && e.reason.message.includes('fetch')) {
    console.warn('Network request failed:', e.reason.message);
  }
});
