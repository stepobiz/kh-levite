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
          <button class="accordion-toggle" title="Componenti" onclick="toggleAccordion(${d.id})">&#x25B6;</button>
          <button title="Modifica" onclick="openDeviceModal(${d.id})">&#x270F;&#xFE0F;</button>
          <button title="Elimina" onclick="deleteDevice(${d.id})">&#x1F5D1;&#xFE0F;</button>
        </td>
      </tr>
      <tr class="accordion-row" id="accordion-${d.id}">
        <td colspan="7">
          <div class="accordion-content">
            <div class="accordion-toolbar">
              <span class="accordion-label">${esc(d.deviceName || d.ipAddress)} — Componenti</span>
              <button class="btn-primary btn-sm" onclick="openComponentModal(null, ${d.id})">&#xFF0B; Componente</button>
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
        <tr><th>ID</th><th>Nome</th><th>HW Index</th><th>HW Addr</th><th>Nodo</th><th>Stato</th><th>Azioni</th></tr>
      </thead>
      <tbody>
        ${components.map(c => {
          const nodeLabel = c.linkedNode
            ? `<span class="badge badge-cat-node" style="font-size:11px">${esc(c.linkedNode.code ?? '#' + c.linkedNode.id)}</span>`
            : `<span class="muted-text">—</span>`;
          return `<tr>
          <td>${esc(c.id)}</td>
          <td>${esc(c.componentName)}</td>
          <td>${esc(c.hardwareIndex)}</td>
          <td>${esc(c.hardwareAddress)}</td>
          <td>${nodeLabel}</td>
          <td id="status-${c.id}" class="status-cell"><span class="muted-text">—</span></td>
          <td class="actions">
            <button title="Invia comando"
              data-cid="${c.id}" data-did="${deviceId}" data-cname="${esc(c.componentName || '')}"
              onclick="openCommandModal(this)">&#x26A1;</button>
            <button title="Modifica" onclick="openComponentModal(${c.id}, ${deviceId})">&#x270F;&#xFE0F;</button>
            <button title="Elimina" onclick="deleteComponent(${c.id}, ${deviceId})">&#x1F5D1;&#xFE0F;</button>
          </td>
        </tr>`;
        }).join('')}
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
  if (!tbody) return;

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

// --- Component statuses ---
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
  const log = componentLatest[componentId];
  const html = !log
    ? '<span class="muted-text">—</span>'
    : (() => {
        const dirClass = log.direction === 'READ' ? 'dir-read' : 'dir-write';
        const date = log.createdAt ? new Date(log.createdAt).toLocaleString('it-IT') : '';
        return `<span class="status-value">${esc(log.value)}</span> ` +
               `<span class="badge ${dirClass}">${esc(log.direction)}</span>` +
               `<br><span class="muted-text">${esc(date)}</span>`;
      })();
  const adminCell = document.getElementById(`status-${componentId}`);
  if (adminCell) adminCell.innerHTML = html;
  const userCell = document.getElementById(`user-status-${componentId}`);
  if (userCell) userCell.innerHTML = html;
}

// ============================================================
// UTENTE — User device view (read-only + send command)
// ============================================================

function renderUserDevices() {
  const tbody = document.querySelector('#user-device-table tbody');
  if (!tbody) return;
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
    if (!userDeviceSearch) return true;
    return (
      (d.deviceName || '').toLowerCase().includes(userDeviceSearch) ||
      (d.ipAddress || '').toLowerCase().includes(userDeviceSearch) ||
      (d.macAddress || '').toLowerCase().includes(userDeviceSearch)
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
          <button class="accordion-toggle" title="Componenti" onclick="toggleUserAccordion(${d.id})">&#x25B6;</button>
        </td>
      </tr>
      <tr class="accordion-row" id="user-accordion-${d.id}">
        <td colspan="7">
          <div class="accordion-content">
            <div class="accordion-toolbar">
              <span class="accordion-label">${esc(d.deviceName || d.ipAddress)} — Componenti</span>
            </div>
            <div id="user-accordion-body-${d.id}" class="accordion-body">
              <p class="loading-cell">Caricamento...</p>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function toggleUserAccordion(deviceId) {
  const row = document.getElementById(`user-accordion-${deviceId}`);
  if (!row) return;
  const isOpen = row.classList.contains('open');
  const toggleBtn = row.previousElementSibling?.querySelector('.accordion-toggle');
  if (isOpen) {
    row.classList.remove('open');
    if (toggleBtn) toggleBtn.textContent = '▶';
  } else {
    row.classList.add('open');
    if (toggleBtn) toggleBtn.textContent = '▼';
    await loadUserAccordionComponents(deviceId);
  }
}

async function loadUserAccordionComponents(deviceId) {
  const body = document.getElementById(`user-accordion-body-${deviceId}`);
  if (!body) return;
  body.innerHTML = '<p class="loading-cell">Caricamento...</p>';
  try {
    const res = await fetch(`/api/iot/devices/${deviceId}/components`);
    const components = await res.json();
    deviceComponents[deviceId] = components;
    renderUserAccordionComponents(deviceId, components);
    loadComponentStatuses(deviceId, components);
  } catch {
    body.innerHTML = '<p class="loading-cell">Errore caricamento componenti</p>';
  }
}

function renderUserAccordionComponents(deviceId, components) {
  const body = document.getElementById(`user-accordion-body-${deviceId}`);
  if (!body) return;
  if (components.length === 0) {
    body.innerHTML = '<p class="empty-cell">Nessun componente per questo dispositivo</p>';
    return;
  }
  body.innerHTML = `
    <table class="accordion-table">
      <thead>
        <tr><th>ID</th><th>Nome</th><th>HW Index</th><th>Nodo</th><th>Stato</th><th>Azioni</th></tr>
      </thead>
      <tbody>
        ${components.map(c => {
          const nodeLabel = c.linkedNode
            ? `<span class="badge badge-cat-node" style="font-size:11px">${esc(c.linkedNode.code ?? '#' + c.linkedNode.id)}</span>`
            : `<span class="muted-text">—</span>`;
          const statusId = `user-status-${c.id}`;
          return `<tr>
          <td>${esc(c.id)}</td>
          <td>${esc(c.componentName)}</td>
          <td>${esc(c.hardwareIndex)}</td>
          <td>${nodeLabel}</td>
          <td id="${statusId}" class="status-cell"><span class="muted-text">—</span></td>
          <td class="actions">
            <button title="Invia comando"
              data-cid="${c.id}" data-did="${deviceId}" data-cname="${esc(c.componentName || '')}"
              onclick="openCommandModal(this)">&#x26A1;</button>
          </td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  // Render cached statuses in user cells
  components.forEach(c => {
    const log = componentLatest[c.id];
    if (!log) return;
    const cell = document.getElementById(`user-status-${c.id}`);
    if (!cell) return;
    const dirClass = log.direction === 'READ' ? 'dir-read' : 'dir-write';
    const date = log.createdAt ? new Date(log.createdAt).toLocaleString('it-IT') : '';
    cell.innerHTML =
      `<span class="status-value">${esc(log.value)}</span> ` +
      `<span class="badge ${dirClass}">${esc(log.direction)}</span>` +
      `<br><span class="muted-text">${esc(date)}</span>`;
  });
}

async function reloadUserStatuses() {
  const openRows = document.querySelectorAll('#user-device-table-container .accordion-row.open');
  if (openRows.length === 0) { showToast('Nessun accordion aperto'); return; }
  const btn = document.getElementById('user-reload-statuses-btn');
  if (btn) btn.disabled = true;
  try {
    await Promise.all([...openRows].map(row => {
      const deviceId = Number(row.id.replace('user-accordion-', ''));
      return loadComponentStatuses(deviceId, deviceComponents[deviceId] || []);
    }));
    showToast('Stati aggiornati');
  } finally {
    if (btn) btn.disabled = false;
  }
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
