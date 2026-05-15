// --- Node Types ---
async function _fetchNodeTypeEditFlag() {
  try {
    const res = await fetch('/api/cfg/configurations/allow_node_type_edit');
    if (res.ok) {
      const cfg = await res.json();
      nodeTypeEditAllowed = cfg.valBool !== false; // default true if config exists but not explicitly false
    } else {
      nodeTypeEditAllowed = true; // config not found → allow by default
    }
  } catch {
    nodeTypeEditAllowed = true;
  }
}

async function fetchNodeTypes() {
  setTableLoading('node-type-table');
  try {
    const [, data] = await Promise.all([
      _fetchNodeTypeEditFlag(),
      fetch('/api/auen/node-types').then(r => r.json()),
    ]);
    auenNodeTypes = data;
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
      <td>${esc(nt.valueType ?? 'boolean')}</td>
      <td class="actions">
        ${nodeTypeEditAllowed ? `
        <button title="Modifica" onclick="openNodeTypeModal(${nt.id})">&#x270F;&#xFE0F;</button>
        <button title="Elimina" onclick="deleteNodeType(${nt.id})">&#x1F5D1;&#xFE0F;</button>` : ''}
      </td>
    </tr>`).join('');
}

async function onNodeTypeCategoryChange() {
  const category = document.getElementById('nt-category-select').value;
  const row = document.getElementById('nt-value-type-row');
  const select = document.getElementById('nt-value-type-select');
  if (!category) {
    row.classList.remove('hidden');
    return;
  }
  try {
    const res = await fetch(`/api/auen/node-types/allowed-value-types/${category}`);
    const allowed = await res.json();
    if (!Array.isArray(allowed) || allowed.length === 0) {
      row.classList.add('hidden');
      select.value = 'boolean';
      return;
    }
    const current = select.value;
    const allOptions = ['boolean', 'number', 'string'];
    select.innerHTML = allOptions
      .filter(v => allowed.includes(v))
      .map(v => `<option value="${v}">${v}</option>`)
      .join('');
    select.value = allowed.includes(current) ? current : allowed[0];
    row.classList.remove('hidden');
  } catch {
    row.classList.remove('hidden');
  }
}

async function openNodeTypeModal(id = null) {
  const nt = id != null ? auenNodeTypes.find(x => x.id === id) : null;
  const form = document.getElementById('node-type-form');
  form.reset();
  form.recordId.value = nt?.id ?? '';
  form.name.value = nt?.name ?? '';
  form.iconSlug.value = nt?.iconSlug ?? '';
  form.category.value = nt?.category ?? '';
  await onNodeTypeCategoryChange();
  form.valueType.value = nt?.valueType ?? 'boolean';
  document.querySelector('#node-type-modal .modal-title').textContent =
    nt ? 'Modifica Node Type' : 'Nuovo Node Type';

  const attrsSection = document.getElementById('node-type-attrs-section');
  if (id != null) {
    attrsSection.classList.remove('hidden');
    _populateNtAttrTypeSelect();
    document.getElementById('nt-attr-type-select').value = '';
    document.getElementById('nt-attr-is-required').checked = false;
    await _loadNodeTypeAttrs(id);
  } else {
    attrsSection.classList.add('hidden');
    document.getElementById('node-type-attrs-list').innerHTML = '';
  }

  document.getElementById('node-type-modal').classList.add('show');
}

function _populateNtAttrTypeSelect() {
  const select = document.getElementById('nt-attr-type-select');
  select.innerHTML = '<option value="">— seleziona attributo —</option>' +
    auenAttributeTypes.map(at =>
      `<option value="${at.id}">${esc(at.code)} (${esc(at.dataType)})</option>`
    ).join('');
}

async function _loadNodeTypeAttrs(nodeTypeId) {
  try {
    const res = await fetch(`/api/auen/node-types/${nodeTypeId}/attributes`);
    const attrs = await res.json();
    renderNodeTypeAttributesList(nodeTypeId, attrs);
  } catch {
    showToast('Errore caricamento attributi del tipo', true);
  }
}

function renderNodeTypeAttributesList(nodeTypeId, attrs) {
  const container = document.getElementById('node-type-attrs-list');
  if (!container) return;
  if (attrs.length === 0) {
    container.innerHTML = '<p class="muted-text attr-empty">Nessun attributo associato</p>';
    return;
  }
  container.innerHTML = `
    <table class="attr-table">
      <thead><tr><th>Attributo</th><th>Data Type</th><th>Obbligatorio</th><th></th></tr></thead>
      <tbody>
        ${attrs.map(a => `
        <tr>
          <td>${esc(a.attribute?.code ?? `#${a.attributeId}`)}</td>
          <td>${esc(a.attribute?.dataType ?? '')}</td>
          <td style="text-align:center">
            <input type="checkbox" ${a.isRequired ? 'checked' : ''}
              onchange="toggleNodeTypeAttributeRequired(${nodeTypeId}, ${a.attributeId}, this.checked)" />
          </td>
          <td class="actions">
            <button type="button" title="Rimuovi"
              onclick="removeNodeTypeAttribute(${nodeTypeId}, ${a.attributeId})">&#x1F5D1;&#xFE0F;</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function addNodeTypeAttribute() {
  const nodeTypeId = document.getElementById('node-type-form').recordId.value;
  const attributeId = document.getElementById('nt-attr-type-select').value;
  const isRequired = document.getElementById('nt-attr-is-required').checked;
  if (!attributeId) { showToast('Seleziona un attributo', true); return; }
  try {
    const res = await fetch(`/api/auen/node-types/${nodeTypeId}/attributes/${attributeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRequired }),
    });
    if (res.ok) {
      document.getElementById('nt-attr-type-select').value = '';
      document.getElementById('nt-attr-is-required').checked = false;
      await _loadNodeTypeAttrs(Number(nodeTypeId));
    } else {
      showToast('Errore aggiunta attributo', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function removeNodeTypeAttribute(nodeTypeId, attributeId) {
  if (!confirm('Rimuovere questo attributo dal tipo?')) return;
  try {
    const res = await fetch(`/api/auen/node-types/${nodeTypeId}/attributes/${attributeId}`, { method: 'DELETE' });
    showToast(res.ok ? 'Attributo rimosso' : 'Errore rimozione', !res.ok);
    if (res.ok) await _loadNodeTypeAttrs(nodeTypeId);
  } catch {
    showToast('Errore di rete', true);
  }
}

async function toggleNodeTypeAttributeRequired(nodeTypeId, attributeId, isRequired) {
  try {
    const res = await fetch(`/api/auen/node-types/${nodeTypeId}/attributes/${attributeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRequired }),
    });
    if (!res.ok) showToast('Errore aggiornamento', true);
  } catch {
    showToast('Errore di rete', true);
  }
}

async function handleNodeTypeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const dto = {
    name: form.name.value,
    iconSlug: form.iconSlug.value || undefined,
    category: form.category.value,
    valueType: form.valueType.value,
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
        <button title="Modifica" onclick="openAttributeTypeModal(${at.id})">&#x270F;&#xFE0F;</button>
        <button title="Elimina" onclick="deleteAttributeType(${at.id})">&#x1F5D1;&#xFE0F;</button>
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
