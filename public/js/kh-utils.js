// --- XSS-safe escape ---
function esc(val) {
  if (val == null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Toast ---
function showToast(msg, isError = false) {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className = isError ? 'message-error' : 'message-success';
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// --- Loading placeholder ---
function setTableLoading(tableId) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (tbody) tbody.innerHTML = '<tr><td colspan="99" class="loading-cell">Caricamento...</td></tr>';
}

// --- Modals ---
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'node-modal') {
    cloningFromNodeId = null;
    document.getElementById('node-type-select').disabled = false;
    document.getElementById('node-parent-select').disabled = false;
  }
}

// --- Value display helper (KL-37, KL-39) ---
function formatNodeValue(value, valueType) {
  if (valueType === 'boolean') {
    return value === '1'
      ? '<span style="color:#16a34a;font-size:16px" title="ON">&#x25CF;</span>'
      : '<span style="color:#1e293b;font-size:16px" title="OFF">&#x25CF;</span>';
  }
  return esc(value);
}

// --- Category badge helper ---
function categoryBadge(category) {
  let cls = 'badge-cat-node';
  if (category && category.startsWith('in_')) cls = 'badge-cat-in';
  else if (category && category.startsWith('out_')) cls = 'badge-cat-out';
  else if (category && category.startsWith('proxy_')) cls = 'badge-cat-proxy';
  else if (category === 'fake') cls = 'badge-cat-fake';
  return `<span class="badge ${cls}">${esc(category)}</span>`;
}

// --- Timestamp formatter ---
function fmtNodeTs(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('it-IT');
}
