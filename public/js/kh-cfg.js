// --- Configuration module ---

async function ensureCfgLoaded() {
  if (cfgLoaded) return;
  cfgLoaded = true;
  await Promise.all([fetchCfgSections(), fetchCfgConfigurations()]);
}

async function fetchCfgSections() {
  try {
    const res = await fetch('/api/cfg/sections');
    cfgSections = await res.json();
  } catch { cfgSections = []; }
  renderCfgSections();
  // refresh section select in config modal
  const sel = document.getElementById('cfg-config-section-select');
  if (sel) _populateCfgSectionSelect(sel);
}

async function fetchCfgConfigurations() {
  try {
    const res = await fetch('/api/cfg/configurations');
    cfgConfigurations = await res.json();
  } catch { cfgConfigurations = []; }
  renderCfgConfigurations();
}

// --- Sections ---
function renderCfgSections() {
  const tbody = document.querySelector('#cfg-section-table tbody');
  if (!tbody) return;
  if (!cfgSections.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Nessuna sezione</td></tr>';
    return;
  }
  tbody.innerHTML = cfgSections.map(s => `
    <tr>
      <td><code>${esc(s.code)}</code></td>
      <td>${esc(s.name)}</td>
      <td class="actions">
        <button title="Modifica" onclick="openCfgSectionModal(${s.id})">&#x270F;&#xFE0F;</button>
        <button title="Elimina" onclick="deleteCfgSection(${s.id})">&#x1F5D1;&#xFE0F;</button>
      </td>
    </tr>`).join('');
}

function openCfgSectionModal(id = null) {
  const section = id != null ? cfgSections.find(s => s.id === id) : null;
  const form = document.getElementById('cfg-section-form');
  form.reset();
  form.elements['recordId'].value = section?.id ?? '';
  form.elements['code'].value = section?.code ?? '';
  form.elements['name'].value = section?.name ?? '';
  document.getElementById('cfg-section-modal-title').textContent = section ? 'Modifica Sezione' : 'Nuova Sezione';
  document.getElementById('cfg-section-modal').classList.add('show');
}

async function handleCfgSectionSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.elements['recordId'].value;
  const dto = { code: form.elements['code'].value, name: form.elements['name'].value };
  try {
    const res = await fetch(id ? `/api/cfg/sections/${id}` : '/api/cfg/sections', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Sezione aggiornata' : 'Sezione creata');
      closeModal('cfg-section-modal');
      await fetchCfgSections();
    } else {
      showToast('Errore salvataggio sezione', true);
    }
  } catch { showToast('Errore di rete', true); }
}

async function deleteCfgSection(id) {
  if (!confirm('Eliminare questa sezione?')) return;
  try {
    const res = await fetch(`/api/cfg/sections/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Sezione eliminata' : 'Errore eliminazione', !res.ok);
    if (res.ok) await fetchCfgSections();
  } catch { showToast('Errore di rete', true); }
}

// --- Configurations ---
function renderCfgConfigurations() {
  const container = document.getElementById('cfg-config-list');
  if (!container) return;

  // Capture which sections are currently closed before re-rendering
  const closedSections = new Set();
  container.querySelectorAll('.accordion').forEach(acc => {
    const label = acc.querySelector('.accordion-header > span:first-child')?.textContent?.trim();
    const content = acc.querySelector('.accordion-content');
    if (label && content && !content.classList.contains('open')) closedSections.add(label);
  });

  if (!cfgConfigurations.length) {
    container.innerHTML = '<p class="muted-text" style="padding:12px">Nessuna configurazione</p>';
    return;
  }

  // Group by section
  const bySectionId = {};
  cfgConfigurations.forEach(c => {
    const key = c.sectionId ?? '__none__';
    if (!bySectionId[key]) bySectionId[key] = [];
    bySectionId[key].push(c);
  });

  const html = [];

  // Sections with configs
  cfgSections.forEach(s => {
    const items = bySectionId[s.id] || [];
    if (!items.length) return;
    html.push(`
      <div class="accordion">
        <button class="accordion-header" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
          <span>${esc(s.name)}</span>
          <span class="accordion-chevron">&#x25BE;</span>
        </button>
        <div class="accordion-content open">
          <div class="accordion-body">
            ${_cfgTable(items)}
          </div>
        </div>
      </div>`);
  });

  // Configs without section
  const noSection = bySectionId['__none__'] || [];
  if (noSection.length) {
    html.push(`
      <div class="accordion">
        <button class="accordion-header" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
          <span>— Senza sezione —</span>
          <span class="accordion-chevron">&#x25BE;</span>
        </button>
        <div class="accordion-content open">
          <div class="accordion-body">
            ${_cfgTable(noSection)}
          </div>
        </div>
      </div>`);
  }

  container.innerHTML = html.join('');

  // Restore closed state
  if (closedSections.size > 0) {
    container.querySelectorAll('.accordion').forEach(acc => {
      const label = acc.querySelector('.accordion-header > span:first-child')?.textContent?.trim();
      if (label && closedSections.has(label)) {
        acc.querySelector('.accordion-header')?.classList.add('open');
        acc.querySelector('.accordion-content')?.classList.remove('open');
      }
    });
  }
}

function _cfgTable(items) {
  return `<table class="data-table">
    <thead><tr><th>Codice</th><th>Nome</th><th>Tipo</th><th>Valore</th><th></th></tr></thead>
    <tbody>
      ${items.map(c => `
        <tr>
          <td><code>${esc(c.code)}</code></td>
          <td>${esc(c.name)}${c.isSystem ? ' <span class="badge badge-system">SYS</span>' : ''}${c.description ? `<br><span class="muted-text">${esc(c.description)}</span>` : ''}</td>
          <td><span class="badge">${esc(c.dataType)}</span></td>
          <td id="cfgval-${esc(c.code)}">${_cfgDisplayValue(c)}</td>
          <td class="actions">
            <button title="Modifica valore" onclick="openCfgEditValueModal('${esc(c.code)}')">&#x270F;&#xFE0F;</button>
            ${!c.isSystem ? `
            <button title="Modifica (admin)" onclick="openCfgAdminModal('${esc(c.code)}')">&#x2699;&#xFE0F;</button>
            <button title="Elimina" onclick="deleteCfgConfig('${esc(c.code)}')">&#x1F5D1;&#xFE0F;</button>` : ''}
          </td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

function _cfgDisplayValue(c) {
  switch (c.dataType) {
    case 'boolean': return c.valBool === true
      ? '<span style="color:#16a34a;font-weight:600">ON</span>'
      : '<span style="color:#dc2626;font-weight:600">OFF</span>';
    case 'integer': return c.valInt != null ? `<code>${c.valInt}</code>` : '<span class="muted-text">—</span>';
    case 'float':   return c.valFloat != null ? `<code>${c.valFloat}</code>` : '<span class="muted-text">—</span>';
    case 'text':    return c.valText != null ? `<code>${esc(c.valText)}</code>` : '<span class="muted-text">—</span>';
    default:        return '<span class="muted-text">—</span>';
  }
}

// --- Create/Edit configuration (full form) ---
function _populateCfgSectionSelect(sel) {
  const current = sel.value;
  sel.innerHTML = '<option value="">— Nessuna sezione —</option>' +
    cfgSections.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  if (current) sel.value = current;
}

function onCfgDataTypeChange() {
  const dt = document.getElementById('cfg-config-data-type').value;
  document.getElementById('cfg-val-int').classList.toggle('hidden', dt !== 'integer');
  document.getElementById('cfg-val-float').classList.toggle('hidden', dt !== 'float');
  document.getElementById('cfg-val-bool').classList.toggle('hidden', dt !== 'boolean');
  document.getElementById('cfg-val-text').classList.toggle('hidden', dt !== 'text');
}

function openCfgConfigModal() {
  const form = document.getElementById('cfg-config-form');
  form.reset();
  form.elements['recordCode'].value = '';
  document.getElementById('cfg-config-code').disabled = false;
  _populateCfgSectionSelect(document.getElementById('cfg-config-section-select'));
  onCfgDataTypeChange();
  document.getElementById('cfg-config-modal-title').textContent = 'Nuova Configurazione';
  form.querySelector('[type=submit]').textContent = 'Crea';
  document.getElementById('cfg-config-modal').classList.add('show');
}

function openCfgAdminModal(code) {
  const cfg = cfgConfigurations.find(c => c.code === code);
  if (!cfg) return;
  const form = document.getElementById('cfg-config-form');
  form.reset();
  form.elements['recordCode'].value = code;
  form.elements['code'].value = cfg.code;
  form.elements['name'].value = cfg.name;
  form.elements['description'].value = cfg.description ?? '';
  _populateCfgSectionSelect(document.getElementById('cfg-config-section-select'));
  form.elements['sectionId'].value = cfg.sectionId ?? '';
  form.elements['dataType'].value = cfg.dataType;
  onCfgDataTypeChange();
  if (cfg.dataType === 'integer') form.elements['valInt'].value = cfg.valInt ?? '';
  if (cfg.dataType === 'float')   form.elements['valFloat'].value = cfg.valFloat ?? '';
  if (cfg.dataType === 'boolean') form.elements['valBool'].value = cfg.valBool === true ? 'true' : 'false';
  if (cfg.dataType === 'text')    form.elements['valText'].value = cfg.valText ?? '';
  document.getElementById('cfg-config-code').disabled = true;
  document.getElementById('cfg-config-modal-title').textContent = `Admin — ${cfg.code}`;
  form.querySelector('[type=submit]').textContent = 'Salva';
  document.getElementById('cfg-config-modal').classList.add('show');
}

async function handleCfgConfigSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const recordCode = form.elements['recordCode'].value;
  const dt = form.elements['dataType'].value;
  const dto = {
    code: form.elements['code'].value,
    name: form.elements['name'].value,
    description: form.elements['description'].value || null,
    sectionId: form.elements['sectionId'].value ? Number(form.elements['sectionId'].value) : null,
    dataType: dt,
    valInt:   dt === 'integer' ? (Number(form.elements['valInt'].value) || null) : null,
    valFloat: dt === 'float'   ? (parseFloat(form.elements['valFloat'].value) || null) : null,
    valBool:  dt === 'boolean' ? form.elements['valBool'].value === 'true' : null,
    valText:  dt === 'text'    ? (form.elements['valText'].value || null) : null,
  };
  const isEdit = !!recordCode;
  try {
    const res = await fetch(
      isEdit ? `/api/cfg/configurations/${encodeURIComponent(recordCode)}` : '/api/cfg/configurations',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      }
    );
    if (res.ok) {
      showToast(isEdit ? 'Configurazione aggiornata' : 'Configurazione creata');
      closeModal('cfg-config-modal');
      await fetchCfgConfigurations();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Errore salvataggio configurazione', true);
    }
  } catch { showToast('Errore di rete', true); }
}

// --- Edit value only ---
function openCfgEditValueModal(code) {
  const cfg = cfgConfigurations.find(c => c.code === code);
  if (!cfg) return;
  const form = document.getElementById('cfg-edit-value-form');
  form.reset();
  form.elements['code'].value = code;
  document.getElementById('cfg-edit-value-modal-title').textContent =
    `Valore — ${cfg.code}`;
  document.getElementById('cfg-edit-value-name').textContent = cfg.name;

  const container = document.getElementById('cfg-edit-value-field');
  switch (cfg.dataType) {
    case 'integer':
      container.innerHTML = `<label>Valore (intero)</label><input name="val" type="number" step="1" value="${cfg.valInt ?? ''}" required/>`;
      break;
    case 'float':
      container.innerHTML = `<label>Valore (decimale)</label><input name="val" type="number" step="any" value="${cfg.valFloat ?? ''}" required/>`;
      break;
    case 'boolean':
      container.innerHTML = `<label>Valore</label><select name="val">
        <option value="true"${cfg.valBool === true ? ' selected' : ''}>ON</option>
        <option value="false"${cfg.valBool === false ? ' selected' : ''}>OFF</option>
      </select>`;
      break;
    case 'text':
      container.innerHTML = `<label>Valore (testo)</label><input name="val" type="text" value="${esc(cfg.valText ?? '')}" required/>`;
      break;
  }
  document.getElementById('cfg-edit-value-modal').classList.add('show');
}

async function handleCfgEditValueSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const code = form.elements['code'].value;
  const cfg = cfgConfigurations.find(c => c.code === code);
  if (!cfg) return;
  const rawVal = form.elements['val'].value;
  const dto = {};
  if (cfg.dataType === 'integer') dto.valInt   = parseInt(rawVal, 10) || null;
  else if (cfg.dataType === 'float')   dto.valFloat = parseFloat(rawVal) || null;
  else if (cfg.dataType === 'boolean') dto.valBool  = rawVal === 'true';
  else if (cfg.dataType === 'text')    dto.valText  = rawVal;
  try {
    const res = await fetch(`/api/cfg/configurations/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast('Valore aggiornato');
      closeModal('cfg-edit-value-modal');
      // Update local state and patch just the value cell — no full re-render
      const idx = cfgConfigurations.findIndex(c => c.code === code);
      if (idx !== -1) {
        const updated = { ...cfgConfigurations[idx], ...dto };
        cfgConfigurations[idx] = updated;
        const cell = document.getElementById('cfgval-' + code);
        if (cell) cell.innerHTML = _cfgDisplayValue(updated);
      }
    } else {
      showToast('Errore aggiornamento', true);
    }
  } catch { showToast('Errore di rete', true); }
}

async function deleteCfgConfig(code) {
  if (!confirm(`Eliminare la configurazione "${code}"?`)) return;
  try {
    const res = await fetch(`/api/cfg/configurations/${encodeURIComponent(code)}`, { method: 'DELETE' });
    showToast(res.ok ? 'Configurazione eliminata' : 'Errore eliminazione', !res.ok);
    if (res.ok) await fetchCfgConfigurations();
  } catch { showToast('Errore di rete', true); }
}
