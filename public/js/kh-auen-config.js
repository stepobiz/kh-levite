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

function openNodeTypeModal(id = null) {
  const nt = id != null ? auenNodeTypes.find(x => x.id === id) : null;
  const form = document.getElementById('node-type-form');
  form.reset();
  form.recordId.value = nt?.id ?? '';
  form.name.value = nt?.name ?? '';
  form.iconSlug.value = nt?.iconSlug ?? '';
  form.category.value = nt?.category ?? '';
  form.valueType.value = nt?.valueType ?? 'boolean';
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
