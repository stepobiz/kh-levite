// --- Tags ---
async function fetchTags() {
  try {
    const res = await fetch('/api/auen/tags');
    auenTags = await res.json();
  } catch {
    showToast('Errore caricamento tag', true);
    auenTags = [];
  }
  renderTags();
  populateNodeTagFilter();
}

function renderTags() {
  const tbody = document.querySelector('#tag-table tbody');
  if (!tbody) return;
  if (auenTags.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Nessun tag</td></tr>';
    return;
  }
  tbody.innerHTML = auenTags.map(t => `
    <tr>
      <td>${esc(t.id)}</td>
      <td>${esc(t.name)}</td>
      <td class="actions">
        <button title="Modifica" onclick="openTagModal(${t.id})">&#x270F;&#xFE0F;</button>
        <button title="Elimina" onclick="deleteTag(${t.id})">&#x1F5D1;&#xFE0F;</button>
      </td>
    </tr>`).join('');
}

function openTagModal(id = null) {
  const tag = id != null ? auenTags.find(t => t.id === id) : null;
  const form = document.getElementById('tag-form');
  form.reset();
  form.recordId.value = tag?.id ?? '';
  form.elements['tagName'].value = tag?.name ?? '';
  document.querySelector('#tag-modal .modal-title').textContent =
    tag ? 'Modifica Tag' : 'Nuovo Tag';
  document.getElementById('tag-modal').classList.add('show');
}

async function handleTagSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const dto = { name: form.elements['tagName'].value };
  try {
    const res = await fetch(id ? `/api/auen/tags/${id}` : '/api/auen/tags', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(id ? 'Tag aggiornato' : 'Tag creato');
      closeModal('tag-modal');
      await fetchTags();
    } else {
      showToast('Errore durante il salvataggio', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function deleteTag(id) {
  if (!confirm('Eliminare questo tag?')) return;
  try {
    const res = await fetch(`/api/auen/tags/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Tag eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) await fetchTags();
  } catch {
    showToast('Errore di rete', true);
  }
}

function populateNodeTagFilter() {
  const select = document.getElementById('node-filter-tag');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Tutti i tag</option>' +
    auenTags.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  select.value = current;
}

function onNodeTagFilterChange() {
  nodeFilterTagId = document.getElementById('node-filter-tag').value;
  renderAuenNodes();
}

function populateTagNodeSelect(currentNodeId) {
  const select = document.getElementById('tag-node-select');
  if (!select) return;
  const node = auenNodes.find(n => n.id === currentNodeId);
  const assignedIds = new Set((node?.tags || []).map(t => t.tagId));
  select.innerHTML = '<option value="">— seleziona tag —</option>' +
    auenTags
      .filter(t => !assignedIds.has(t.id))
      .map(t => `<option value="${t.id}">${esc(t.name)}</option>`)
      .join('');
}

function renderNodeTagsList(nodeId, tags) {
  const container = document.getElementById('node-tags-list');
  if (!container) return;
  if (tags.length === 0) {
    container.innerHTML = '<p class="muted-text attr-empty">Nessun tag assegnato</p>';
    return;
  }
  container.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">` +
    tags.map(t => `
      <span class="badge" style="background:#e0f2fe;color:#0369a1;padding:4px 8px">
        ${esc(t.tag?.name ?? t.tagId)}
        <button type="button" style="background:none;border:none;cursor:pointer;padding:0 0 0 4px;color:#0369a1"
          onclick="removeNodeTag(${nodeId}, ${t.tagId})">&#x2716;</button>
      </span>`).join('') +
    `</div>`;
}

async function addNodeTagFromModal() {
  const form = document.getElementById('node-form');
  const nodeId = Number(form.recordId.value);
  const tagId = Number(document.getElementById('tag-node-select').value);
  if (!tagId) { showToast('Seleziona un tag', true); return; }
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/tags/${tagId}`, { method: 'PUT' });
    if (res.ok) {
      await refreshNodeTags(nodeId);
    } else {
      showToast('Errore aggiunta tag', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function removeNodeTag(nodeId, tagId) {
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/tags/${tagId}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshNodeTags(nodeId);
    } else {
      showToast('Errore rimozione tag', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function refreshNodeTags(nodeId) {
  const res = await fetch(`/api/auen/nodes/${nodeId}`);
  if (!res.ok) return;
  const node = await res.json();
  const idx = auenNodes.findIndex(n => n.id === nodeId);
  if (idx !== -1) auenNodes[idx] = node;
  renderNodeTagsList(nodeId, node.tags || []);
  populateTagNodeSelect(nodeId);
  renderAuenNodes();
}
