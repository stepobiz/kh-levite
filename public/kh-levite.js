// --- State ---
let devicesList = [];
let componentsList = [];
let allLogs = [];
let logPage = 0;
const LOG_PAGE_SIZE = 50;
let deviceSearch = '';
let logFilterComponentId = '';
let logFilterDirection = '';
const deviceComponents = {};
const componentLatest = {};

// --- AutoEngine state ---
let auenNodeTypes = [];
let auenAttributeTypes = [];
let auenNodes = [];
let auenLoaded = false;

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

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateSection(btn.dataset.section);
      location.hash = btn.dataset.section;
    });
  });

  const initialSection = location.hash.slice(1) || 'devices';
  activateSection(initialSection);

  document.getElementById('device-form').addEventListener('submit', handleDeviceSubmit);
  document.getElementById('component-form').addEventListener('submit', handleComponentSubmit);
  document.getElementById('command-form').addEventListener('submit', handleCommandSubmit);
  document.getElementById('node-type-form').addEventListener('submit', handleNodeTypeSubmit);
  document.getElementById('attribute-type-form').addEventListener('submit', handleAttributeTypeSubmit);
  document.getElementById('node-form').addEventListener('submit', handleNodeSubmit);

  document.getElementById('device-search').addEventListener('input', e => {
    deviceSearch = e.target.value.toLowerCase();
    renderDevices();
  });

  document.getElementById('log-filter-component').addEventListener('change', e => {
    logFilterComponentId = e.target.value;
    logPage = 0;
    renderLogs();
  });

  document.getElementById('log-filter-direction').addEventListener('change', e => {
    logFilterDirection = e.target.value;
    logPage = 0;
    renderLogs();
  });

  fetchDevices();
  fetchLogs();

  setInterval(fetchLogs, 20000);
});

// --- Section navigation ---
function activateSection(sectionId) {
  const valid = ['devices', 'logs', 'auen-node-types', 'auen-nodes', 'auen-attribute-types'];
  const id = valid.includes(sectionId) ? sectionId : 'devices';
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });
  document.querySelectorAll('.section').forEach(s => {
    s.classList.toggle('active', s.id === id);
  });
  if (['auen-node-types', 'auen-nodes', 'auen-attribute-types'].includes(id)) {
    ensureAuenLoaded();
  }
}

// --- Devices ---
async function fetchDevices() {
  setTableLoading('device-table');
  try {
    const res = await fetch('/api/iot/devices');
    devicesList = await res.json();
  } catch {
    showToast('Errore caricamento dispositivi', true);
    devicesList = [];
  }
  renderDevices();
  renderLogs();
  await fetchComponents();
}

function renderDevices() {
  const tbody = document.querySelector('#device-table tbody');
  const now = Date.now();

  const deviceLastSeen = {};
  allLogs.forEach(l => {
    const comp = componentsList.find(c => c.id === l.componentId);
    if (!comp) return;
    const ts = new Date(l.createdAt).getTime();
    if (!deviceLastSeen[comp.deviceId] || ts > deviceLastSeen[comp.deviceId]) {
      deviceLastSeen[comp.deviceId] = ts;
    }
  });

  const filtered = devicesList.filter(d => {
    if (!deviceSearch) return true;
    return (
      (d.deviceName || '').toLowerCase().includes(deviceSearch) ||
      (d.ipAddress || '').toLowerCase().includes(deviceSearch) ||
      (d.macAddress || '').toLowerCase().includes(deviceSearch)
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Nessun dispositivo trovato</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(d => {
    const lastSeen = deviceLastSeen[d.id];
    const isOnline = lastSeen && (now - lastSeen) < 60000;
    const statusBadge = `<span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">${isOnline ? 'Online' : 'Offline'}</span>`;
    return `
      <tr class="device-row">
        <td>${esc(d.id)}</td>
        <td>${esc(d.deviceName)}</td>
        <td>${esc(d.macAddress)}</td>
        <td>${esc(d.ipAddress)}</td>
        <td>${esc(d.driver)}</td>
        <td>${statusBadge}</td>
        <td class="actions">
          <button class="accordion-toggle" title="Componenti" onclick="toggleAccordion(${d.id})">▶</button>
          <button title="Modifica" onclick="openDeviceModal(${d.id})">✏️</button>
          <button title="Elimina" onclick="deleteDevice(${d.id})">🗑️</button>
        </td>
      </tr>
      <tr class="accordion-row" id="accordion-${d.id}">
        <td colspan="7">
          <div class="accordion-content">
            <div class="accordion-toolbar">
              <span class="accordion-label">${esc(d.deviceName || d.ipAddress)} — Componenti</span>
              <button class="btn-primary btn-sm" onclick="openComponentModal(null, ${d.id})">＋ Componente</button>
            </div>
            <div id="accordion-body-${d.id}" class="accordion-body">
              <p class="loading-cell">Caricamento...</p>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function toggleAccordion(deviceId) {
  const row = document.getElementById(`accordion-${deviceId}`);
  if (!row) return;
  const isOpen = row.classList.contains('open');
  const toggleBtn = row.previousElementSibling?.querySelector('.accordion-toggle');

  if (isOpen) {
    row.classList.remove('open');
    if (toggleBtn) toggleBtn.textContent = '▶';
  } else {
    row.classList.add('open');
    if (toggleBtn) toggleBtn.textContent = '▼';
    await loadAccordionComponents(deviceId);
  }
}

async function loadAccordionComponents(deviceId) {
  const body = document.getElementById(`accordion-body-${deviceId}`);
  if (!body) return;
  body.innerHTML = '<p class="loading-cell">Caricamento...</p>';
  try {
    const res = await fetch(`/api/iot/devices/${deviceId}/components`);
    const components = await res.json();
    deviceComponents[deviceId] = components;
    renderAccordionComponents(deviceId, components);
    loadComponentStatuses(deviceId, components);
  } catch {
    body.innerHTML = '<p class="loading-cell">Errore caricamento componenti</p>';
  }
}

function renderAccordionComponents(deviceId, components) {
  const body = document.getElementById(`accordion-body-${deviceId}`);
  if (!body) return;
  if (components.length === 0) {
    body.innerHTML = '<p class="empty-cell">Nessun componente per questo dispositivo</p>';
    return;
  }
  body.innerHTML = `
    <table class="accordion-table">
      <thead>
        <tr><th>ID</th><th>Nome</th><th>HW Index</th><th>HW Addr</th><th>Stato</th><th>Azioni</th></tr>
      </thead>
      <tbody>
        ${components.map(c => `<tr>
          <td>${esc(c.id)}</td>
          <td>${esc(c.componentName)}</td>
          <td>${esc(c.hardwareIndex)}</td>
          <td>${esc(c.hardwareAddress)}</td>
          <td id="status-${c.id}" class="status-cell"><span class="muted-text">—</span></td>
          <td class="actions">
            <button title="Invia comando"
              data-cid="${c.id}" data-did="${deviceId}" data-cname="${esc(c.componentName || '')}"
              onclick="openCommandModal(this)">⚡</button>
            <button title="Modifica" onclick="openComponentModal(${c.id}, ${deviceId})">✏️</button>
            <button title="Elimina" onclick="deleteComponent(${c.id}, ${deviceId})">🗑️</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function openDeviceModal(id = null) {
  const device = id != null ? devicesList.find(d => d.id === id) : null;
  const form = document.getElementById('device-form');
  form.reset();
  form.recordId.value = device?.id ?? '';
  form.deviceName.value = device?.deviceName ?? '';
  form.macAddress.value = device?.macAddress ?? '';
  form.ipAddress.value = device?.ipAddress ?? '';
  form.protocol.value = device?.driver ?? '';
  document.querySelector('#device-modal .modal-title').textContent =
    device ? 'Modifica dispositivo' : 'Nuovo dispositivo';
  document.getElementById('device-modal').classList.add('show');
}

async function handleDeviceSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const dto = {
    deviceName: form.deviceName.value || undefined,
    macAddress: form.macAddress.value || undefined,
    ipAddress: form.ipAddress.value,
    driver: form.protocol.value || undefined,
  };
  try {
    const res = await fetch(id ? `/api/iot/devices/${id}` : '/api/iot/devices', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Dispositivo aggiornato' : 'Dispositivo creato');
      closeModal('device-modal');
      fetchDevices();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteDevice(id) {
  if (!confirm('Eliminare questo dispositivo e tutti i suoi componenti?')) return;
  try {
    const res = await fetch(`/api/iot/devices/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Dispositivo eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) fetchDevices();
  } catch {
    showToast('Errore di rete', true);
  }
}

// --- Components ---
async function fetchComponents() {
  try {
    const results = await Promise.all(
      devicesList.map(d => fetch(`/api/iot/devices/${d.id}/components`).then(r => r.json()))
    );
    componentsList = results.flat();
  } catch {
    componentsList = [];
  }
  renderLogs();
  populateComponentFilter();
}

function openComponentModal(id = null, deviceId = null) {
  let component = null;
  if (id != null) {
    if (deviceId != null && deviceComponents[deviceId]) {
      component = deviceComponents[deviceId].find(c => c.id === id);
    }
    if (!component) component = componentsList.find(c => c.id === id);
  }
  const resolvedDeviceId = deviceId ?? component?.deviceId;
  const form = document.getElementById('component-form');
  form.reset();
  form.recordId.value = component?.id ?? '';
  form.deviceId.value = resolvedDeviceId ?? '';
  form.componentName.value = component?.componentName ?? '';
  form.hardwareAddress.value = component?.hardwareAddress ?? '';
  form.hardwareIndex.value = component?.hardwareIndex ?? '';
  document.querySelector('#component-modal .modal-title').textContent =
    component ? 'Modifica componente' : 'Nuovo componente';
  document.getElementById('component-modal').classList.add('show');
}

async function handleComponentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const deviceId = form.deviceId.value;
  const dto = {
    componentName: form.componentName.value || undefined,
    hardwareAddress: form.hardwareAddress.value || undefined,
    hardwareIndex: Number(form.hardwareIndex.value),
  };
  const url = id
    ? `/api/iot/devices/${deviceId}/components/${id}`
    : `/api/iot/devices/${deviceId}/components`;
  try {
    const res = await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Componente aggiornato' : 'Componente creato');
      closeModal('component-modal');
      if (deviceId) await loadAccordionComponents(Number(deviceId));
      fetchComponents();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteComponent(id, deviceId) {
  if (!confirm('Eliminare questo componente?')) return;
  try {
    const res = await fetch(`/api/iot/devices/${deviceId}/components/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Componente eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) {
      if (deviceId) await loadAccordionComponents(deviceId);
      fetchComponents();
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

function populateComponentFilter() {
  const select = document.getElementById('log-filter-component');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">Tutti i componenti</option>';
  componentsList.forEach(c => {
    const opt = document.createElement('option');
    opt.value = String(c.id);
    opt.textContent = c.componentName ? `${c.componentName} (#${c.id})` : `Componente #${c.id}`;
    select.appendChild(opt);
  });
  select.value = currentVal;
}

// --- Logs ---
async function fetchLogs() {
  setTableLoading('log-table');
  try {
    const res = await fetch('/api/iot/telemetry-logs');
    allLogs = await res.json();
    allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    showToast('Errore caricamento log', true);
    allLogs = [];
  }
  const el = document.getElementById('log-last-refresh');
  if (el) el.textContent = `Aggiornato alle ${new Date().toLocaleTimeString('it-IT')}`;
  renderLogs();
  renderDevices();
}

function renderLogs() {
  const filtered = allLogs.filter(l => {
    if (logFilterComponentId && String(l.componentId) !== logFilterComponentId) return false;
    if (logFilterDirection && l.direction !== logFilterDirection) return false;
    return true;
  });

  const total = filtered.length;
  const maxPage = Math.max(0, Math.ceil(total / LOG_PAGE_SIZE) - 1);
  if (logPage > maxPage) logPage = maxPage;

  const pageLogs = filtered.slice(logPage * LOG_PAGE_SIZE, (logPage + 1) * LOG_PAGE_SIZE);
  const tbody = document.querySelector('#log-table tbody');

  if (pageLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Nessun log trovato</td></tr>';
  } else {
    tbody.innerHTML = pageLogs.map(l => {
      const comp = componentsList.find(c => c.id === l.componentId);
      const device = comp ? devicesList.find(d => d.id === comp.deviceId) : null;
      const dirClass = l.direction === 'READ' ? 'dir-read' : 'dir-write';
      const date = l.createdAt ? new Date(l.createdAt).toLocaleString('it-IT') : '';
      return `<tr>
        <td>${esc(l.id)}</td>
        <td>${esc(comp?.componentName ?? `#${l.componentId}`)}</td>
        <td>${device ? esc(device.deviceName ? `${device.deviceName} (${device.ipAddress})` : device.ipAddress) : ''}</td>
        <td>${esc(l.value)}</td>
        <td><span class="badge ${dirClass}">${esc(l.direction)}</span></td>
        <td>${esc(date)}</td>
      </tr>`;
    }).join('');
  }

  const info = document.getElementById('log-page-info');
  if (info) {
    info.textContent = total === 0
      ? 'Nessun log'
      : `${logPage * LOG_PAGE_SIZE + 1}–${Math.min((logPage + 1) * LOG_PAGE_SIZE, total)} di ${total}`;
  }
  const prevBtn = document.getElementById('log-prev');
  const nextBtn = document.getElementById('log-next');
  if (prevBtn) prevBtn.disabled = logPage === 0;
  if (nextBtn) nextBtn.disabled = logPage >= maxPage;
}

function logPrevPage() {
  if (logPage > 0) { logPage--; renderLogs(); }
}

function logNextPage() {
  logPage++;
  renderLogs();
}

// --- Command modal ---
function openCommandModal(btn) {
  const componentId = btn.dataset.cid;
  const deviceId = btn.dataset.did;
  const name = btn.dataset.cname;
  const form = document.getElementById('command-form');
  form.reset();
  form.componentId.value = componentId;
  form.deviceId.value = deviceId;
  document.getElementById('command-modal-title').textContent =
    `Comando — ${name || `#${componentId}`}`;
  const errEl = document.getElementById('command-modal-error');
  errEl.textContent = '';
  errEl.classList.add('hidden');
  document.getElementById('command-modal').classList.add('show');
}

async function handleCommandSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const componentId = form.componentId.value;
  const deviceId = form.deviceId.value;
  const value = form.commandValue.value;
  const errEl = document.getElementById('command-modal-error');
  errEl.classList.add('hidden');
  try {
    const res = await fetch(
      `/api/iot/devices/${deviceId}/components/${componentId}/command`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      }
    );
    if (res.ok) {
      closeModal('command-modal');
      showToast('Comando inviato');
    } else {
      errEl.textContent = `Errore ${res.status}: ${res.statusText}`;
      errEl.classList.remove('hidden');
    }
  } catch {
    errEl.textContent = 'Errore di rete';
    errEl.classList.remove('hidden');
  }
}

// --- Component statuses (KL-16) ---
async function loadComponentStatuses(deviceId, components) {
  await Promise.all(components.map(async c => {
    try {
      const res = await fetch(
        `/api/iot/devices/${deviceId}/components/${c.id}/telemetry/latest`
      );
      componentLatest[c.id] = res.status === 404 ? null : (res.ok ? await res.json() : null);
    } catch {
      // leave previous value unchanged
    }
    renderComponentStatus(c.id);
  }));
}

function renderComponentStatus(componentId) {
  const cell = document.getElementById(`status-${componentId}`);
  if (!cell) return;
  const log = componentLatest[componentId];
  if (!log) {
    cell.innerHTML = '<span class="muted-text">—</span>';
    return;
  }
  const dirClass = log.direction === 'READ' ? 'dir-read' : 'dir-write';
  const date = log.createdAt ? new Date(log.createdAt).toLocaleString('it-IT') : '';
  cell.innerHTML =
    `<span class="status-value">${esc(log.value)}</span> ` +
    `<span class="badge ${dirClass}">${esc(log.direction)}</span>` +
    `<br><span class="muted-text">${esc(date)}</span>`;
}

async function reloadAllStatuses() {
  const openRows = document.querySelectorAll('.accordion-row.open');
  if (openRows.length === 0) { showToast('Nessun accordion aperto'); return; }
  const btn = document.getElementById('reload-statuses-btn');
  if (btn) btn.disabled = true;
  try {
    await Promise.all([...openRows].map(row => {
      const deviceId = Number(row.id.replace('accordion-', ''));
      return loadComponentStatuses(deviceId, deviceComponents[deviceId] || []);
    }));
    showToast('Stati aggiornati');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// --- Modals ---
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// ============================================================
// AutoEngine
// ============================================================

async function ensureAuenLoaded() {
  if (auenLoaded) return;
  auenLoaded = true;
  await Promise.all([fetchNodeTypes(), fetchAttributeTypes(), fetchAuenNodes()]);
}

// --- Category badge helper ---
function categoryBadge(category) {
  const isInput = category && category.startsWith('in_');
  return `<span class="badge ${isInput ? 'badge-cat-in' : 'badge-cat-out'}">${esc(category)}</span>`;
}

// --- Node Types ---
async function fetchNodeTypes() {
  setTableLoading('node-type-table');
  try {
    const res = await fetch('/api/auen/node-types');
    auenNodeTypes = await res.json();
  } catch {
    showToast('Errore caricamento node types', true);
    auenNodeTypes = [];
  }
  renderNodeTypes();
}

function renderNodeTypes() {
  const tbody = document.querySelector('#node-type-table tbody');
  if (!tbody) return;
  if (auenNodeTypes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessun node type</td></tr>';
    return;
  }
  tbody.innerHTML = auenNodeTypes.map(nt => `
    <tr>
      <td>${esc(nt.id)}</td>
      <td>${esc(nt.name)}</td>
      <td>${esc(nt.iconSlug ?? '—')}</td>
      <td>${categoryBadge(nt.category)}</td>
      <td class="actions">
        <button title="Modifica" onclick="openNodeTypeModal(${nt.id})">✏️</button>
        <button title="Elimina" onclick="deleteNodeType(${nt.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openNodeTypeModal(id = null) {
  const nt = id != null ? auenNodeTypes.find(x => x.id === id) : null;
  const form = document.getElementById('node-type-form');
  form.reset();
  form.recordId.value = nt?.id ?? '';
  form.name.value = nt?.name ?? '';
  form.iconSlug.value = nt?.iconSlug ?? '';
  form.category.value = nt?.category ?? '';
  document.querySelector('#node-type-modal .modal-title').textContent =
    nt ? 'Modifica Node Type' : 'Nuovo Node Type';
  document.getElementById('node-type-modal').classList.add('show');
}

async function handleNodeTypeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const dto = {
    name: form.name.value,
    iconSlug: form.iconSlug.value || undefined,
    category: form.category.value,
  };
  try {
    const res = await fetch(id ? `/api/auen/node-types/${id}` : '/api/auen/node-types', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Node type aggiornato' : 'Node type creato');
      closeModal('node-type-modal');
      await fetchNodeTypes();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteNodeType(id) {
  if (!confirm('Eliminare questo node type?')) return;
  try {
    const res = await fetch(`/api/auen/node-types/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Node type eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) fetchNodeTypes();
  } catch {
    showToast('Errore di rete', true);
  }
}

// --- Attribute Types ---
async function fetchAttributeTypes() {
  setTableLoading('attribute-type-table');
  try {
    const res = await fetch('/api/auen/attribute-types');
    auenAttributeTypes = await res.json();
  } catch {
    showToast('Errore caricamento attribute types', true);
    auenAttributeTypes = [];
  }
  renderAttributeTypes();
}

function renderAttributeTypes() {
  const tbody = document.querySelector('#attribute-type-table tbody');
  if (!tbody) return;
  if (auenAttributeTypes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessun attribute type</td></tr>';
    return;
  }
  tbody.innerHTML = auenAttributeTypes.map(at => `
    <tr>
      <td>${esc(at.id)}</td>
      <td><code>${esc(at.code)}</code></td>
      <td>${esc(at.description ?? '—')}</td>
      <td>${esc(at.dataType)}</td>
      <td class="actions">
        <button title="Modifica" onclick="openAttributeTypeModal(${at.id})">✏️</button>
        <button title="Elimina" onclick="deleteAttributeType(${at.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openAttributeTypeModal(id = null) {
  const at = id != null ? auenAttributeTypes.find(x => x.id === id) : null;
  const form = document.getElementById('attribute-type-form');
  form.reset();
  form.recordId.value = at?.id ?? '';
  form.code.value = at?.code ?? '';
  form.description.value = at?.description ?? '';
  form.dataType.value = at?.dataType ?? '';
  document.querySelector('#attribute-type-modal .modal-title').textContent =
    at ? 'Modifica Attribute Type' : 'Nuovo Attribute Type';
  document.getElementById('attribute-type-modal').classList.add('show');
}

async function handleAttributeTypeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const dto = {
    code: form.code.value,
    description: form.description.value || undefined,
    dataType: form.dataType.value,
  };
  try {
    const res = await fetch(id ? `/api/auen/attribute-types/${id}` : '/api/auen/attribute-types', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Attribute type aggiornato' : 'Attribute type creato');
      closeModal('attribute-type-modal');
      await fetchAttributeTypes();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteAttributeType(id) {
  if (!confirm('Eliminare questo attribute type?')) return;
  try {
    const res = await fetch(`/api/auen/attribute-types/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Attribute type eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) fetchAttributeTypes();
  } catch {
    showToast('Errore di rete', true);
  }
}

// --- Nodes ---
async function fetchAuenNodes() {
  setTableLoading('auen-node-table');
  try {
    const res = await fetch('/api/auen/nodes');
    auenNodes = await res.json();
  } catch {
    showToast('Errore caricamento nodi', true);
    auenNodes = [];
  }
  renderAuenNodes();
}

function buildNodeTree(nodes) {
  const nodeIds = new Set(nodes.map(n => n.id));
  const byParent = {};
  nodes.forEach(n => {
    const pid = (!n.parentId || !nodeIds.has(n.parentId)) ? 'root' : n.parentId;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(n);
  });
  const rows = [];
  function walk(parentId, depth) {
    (byParent[parentId] || []).sort((a, b) => a.id - b.id).forEach(n => {
      rows.push({ node: n, depth });
      walk(n.id, depth + 1);
    });
  }
  walk('root', 0);
  return rows;
}

function renderAuenNodes() {
  const tbody = document.querySelector('#auen-node-table tbody');
  if (!tbody) return;
  if (auenNodes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Nessun nodo</td></tr>';
    return;
  }
  const rows = buildNodeTree(auenNodes);
  tbody.innerHTML = rows.map(({ node: n, depth }) => {
    const indent = depth * 20;
    const prefix = depth > 0 ? '└ ' : '';
    return `<tr>
      <td><span style="padding-left:${indent}px">${esc(prefix)}${esc(n.code)}</span></td>
      <td>${esc(n.description ?? '—')}</td>
      <td>${esc(n.type?.name ?? '—')}</td>
      <td>${n.type ? categoryBadge(n.type.category) : ''}</td>
      <td class="mono-val">${esc(n.desiredValue)}</td>
      <td class="mono-val">${esc(n.actualValue)}</td>
      <td class="actions">
        <button title="Modifica" onclick="openNodeModal(${n.id})">✏️</button>
        <button title="Elimina" onclick="deleteNode(${n.id})">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function openNodeModal(id = null) {
  const node = id != null ? auenNodes.find(n => n.id === id) : null;

  const typeSelect = document.getElementById('node-type-select');
  typeSelect.innerHTML = '<option value="">— seleziona —</option>' +
    auenNodeTypes.map(nt =>
      `<option value="${nt.id}">${esc(nt.name)} (${esc(nt.category)})</option>`
    ).join('');

  const parentSelect = document.getElementById('node-parent-select');
  parentSelect.innerHTML = '<option value="">— nessuno (radice) —</option>' +
    auenNodes
      .filter(n => n.id !== id)
      .sort((a, b) => a.id - b.id)
      .map(n => `<option value="${n.id}">${esc(n.code)}</option>`)
      .join('');

  const form = document.getElementById('node-form');
  form.reset();
  form.recordId.value = node?.id ?? '';
  form.code.value = node?.code ?? '';
  form.description.value = node?.description ?? '';
  form.typeId.value = node?.typeId ?? '';
  form.parentId.value = node?.parentId ?? '';

  document.getElementById('node-modal-title').textContent =
    node ? `Modifica — ${node.code}` : 'Nuovo Nodo';

  const attrSection = document.getElementById('node-attributes-section');
  const attrHint = document.getElementById('node-attributes-hint');
  if (node) {
    attrSection.classList.remove('hidden');
    attrHint.classList.add('hidden');
    renderNodeAttributesList(node.id, node.attributes || []);
    populateAttrTypeSelect();
    document.getElementById('attr-value-input').value = '';
    document.getElementById('attr-type-select').value = '';
  } else {
    attrSection.classList.add('hidden');
    attrHint.classList.remove('hidden');
  }

  document.getElementById('node-modal').classList.add('show');
}

function populateAttrTypeSelect() {
  const select = document.getElementById('attr-type-select');
  select.innerHTML = '<option value="">— seleziona attributo —</option>' +
    auenAttributeTypes.map(at =>
      `<option value="${at.id}">${esc(at.code)} (${esc(at.dataType)})</option>`
    ).join('');
}

function renderNodeAttributesList(nodeId, attributes) {
  const container = document.getElementById('node-attributes-list');
  if (!container) return;
  if (attributes.length === 0) {
    container.innerHTML = '<p class="muted-text attr-empty">Nessun attributo</p>';
    return;
  }
  container.innerHTML = `
    <table class="attr-table">
      <thead><tr><th>Attributo</th><th>Valore</th><th></th></tr></thead>
      <tbody>
        ${attributes.map(a => `
          <tr>
            <td>${esc(a.attribute?.code ?? `#${a.attributeId}`)}</td>
            <td><code>${esc(a.value)}</code></td>
            <td class="actions">
              <button type="button" title="Rimuovi"
                onclick="removeNodeAttribute(${nodeId}, ${a.attributeId})">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function addNodeAttribute() {
  const form = document.getElementById('node-form');
  const nodeId = form.recordId.value;
  const attributeId = document.getElementById('attr-type-select').value;
  const value = document.getElementById('attr-value-input').value;
  if (!attributeId) { showToast('Seleziona un attributo', true); return; }
  if (!value) { showToast('Inserisci un valore', true); return; }
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/attributes/${attributeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      document.getElementById('attr-value-input').value = '';
      document.getElementById('attr-type-select').value = '';
      await refreshNodeAttributes(Number(nodeId));
    } else {
      showToast('Errore aggiunta attributo', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function removeNodeAttribute(nodeId, attributeId) {
  if (!confirm('Rimuovere questo attributo?')) return;
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/attributes/${attributeId}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshNodeAttributes(nodeId);
    } else {
      showToast('Errore rimozione attributo', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function refreshNodeAttributes(nodeId) {
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/attributes`);
    const attributes = await res.json();
    renderNodeAttributesList(nodeId, attributes);
    const node = auenNodes.find(n => n.id === nodeId);
    if (node) node.attributes = attributes;
  } catch {
    showToast('Errore aggiornamento attributi', true);
  }
}

async function handleNodeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const parentIdVal = form.parentId.value;
  const dto = {
    code: form.code.value,
    description: form.description.value || undefined,
    typeId: Number(form.typeId.value),
    parentId: parentIdVal ? Number(parentIdVal) : null,
  };
  try {
    const res = await fetch(id ? `/api/auen/nodes/${id}` : '/api/auen/nodes', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Nodo aggiornato' : 'Nodo creato');
      closeModal('node-modal');
      await fetchAuenNodes();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteNode(id) {
  if (!confirm('Eliminare questo nodo?')) return;
  try {
    const res = await fetch(`/api/auen/nodes/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Nodo eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) await fetchAuenNodes();
  } catch {
    showToast('Errore di rete', true);
  }
}
