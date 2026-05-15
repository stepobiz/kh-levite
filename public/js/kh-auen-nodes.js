// --- Nodes ---
async function fetchAuenNodes() {
  const reloadBtn = document.getElementById('node-reload-btn');
  if (reloadBtn) { reloadBtn.disabled = true; reloadBtn.textContent = '↻ …'; }
  setTableLoading('auen-node-table');
  try {
    const res = await fetch('/api/auen/nodes');
    auenNodes = await res.json();
  } catch {
    showToast('Errore caricamento nodi', true);
    auenNodes = [];
  }
  renderAuenNodes();
  if (reloadBtn) { reloadBtn.disabled = false; reloadBtn.textContent = '↻ Aggiorna'; }
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
    (byParent[parentId] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id).forEach(n => {
      rows.push({ node: n, depth });
      if (!collapsedNodes.has(n.id)) walk(n.id, depth + 1);
    });
  }
  walk('root', 0);
  return rows;
}

function toggleNodeCollapse(nodeId) {
  if (collapsedNodes.has(nodeId)) collapsedNodes.delete(nodeId);
  else collapsedNodes.add(nodeId);
  renderAuenNodes();
}

function expandAllNodes() {
  collapsedNodes.clear();
  renderAuenNodes();
}

function collapseAllNodes() {
  auenNodes.forEach(n => {
    if (auenNodes.some(c => c.parentId === n.id)) collapsedNodes.add(n.id);
  });
  renderAuenNodes();
}

async function refreshSingleNode(nodeId) {
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}`);
    if (!res.ok) return;
    const updated = await res.json();
    const idx = auenNodes.findIndex(n => n.id === nodeId);
    if (idx !== -1) auenNodes[idx] = updated;
    renderAuenNodes();
  } catch {
    showToast('Errore aggiornamento nodo', true);
  }
}

function renderAuenNodes() {
  const tbody = document.querySelector('#auen-node-table tbody');
  if (!tbody) return;

  // Se c'è filtro tag: tengo solo i nodi root che matchano + tutti i loro discendenti
  let visibleIds = null;
  if (nodeFilterTagId) {
    visibleIds = new Set();
    const matchingParents = auenNodes.filter(n =>
      (n.tags || []).some(t => String(t.tagId) === nodeFilterTagId) && !n.parentId
    );
    function collectDescendants(nodeId) {
      visibleIds.add(nodeId);
      auenNodes.filter(c => c.parentId === nodeId).forEach(c => collectDescendants(c.id));
    }
    matchingParents.forEach(p => collectDescendants(p.id));
  }

  const filtered = visibleIds ? auenNodes.filter(n => visibleIds.has(n.id)) : auenNodes;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">Nessun nodo</td></tr>';
    return;
  }
  const rows = buildNodeTree(filtered);
  tbody.innerHTML = rows.map(({ node: n, depth }) => {
    const indent = depth * 20;
    const prefix = depth > 0 ? '└ ' : '';
    const inTransition = n.desiredValue !== n.actualValue;
    const trClass = inTransition ? ' class="node-transitioning"' : '';
    const vt = n.type?.valueType ?? 'boolean';
    const desiredCell = `<span class="mono-val">${formatNodeValue(n.desiredValue, vt)}</span>`
      + (n.desiredValueUpdatedAt ? `<br><span class="muted-text">${fmtNodeTs(n.desiredValueUpdatedAt)}</span>` : '');
    const actualCell = `<span class="mono-val${inTransition ? ' val-pending' : ''}">${formatNodeValue(n.actualValue, vt)}</span>`
      + (n.actualValueUpdatedAt ? `<br><span class="muted-text">${fmtNodeTs(n.actualValueUpdatedAt)}</span>` : '');
    const codeDisplay = n.code ?? `#${n.id}`;
    const tagBadges = (n.tags || []).map(t =>
      `<span class="badge" style="background:#e0f2fe;color:#0369a1;margin-left:4px">${esc(t.tag?.name ?? t.tagId)}</span>`
    ).join('');
    const hasChildren = auenNodes.some(c => c.parentId === n.id);
    const collapseBtn = hasChildren
      ? `<button class="btn-collapse-node" onclick="toggleNodeCollapse(${n.id})" title="${collapsedNodes.has(n.id) ? 'Espandi' : 'Comprimi'}">${collapsedNodes.has(n.id) ? '+' : '−'}</button>`
      : '<span style="display:inline-block;width:20px"></span>';
    return `<tr${trClass}>
      <td><span style="padding-left:${indent}px">${collapseBtn}${esc(prefix)}${esc(codeDisplay)}</span>${tagBadges}</td>
      <td>${esc(n.description ?? '—')}</td>
      <td>${esc(n.type?.name ?? '—')}</td>
      <td>${n.type ? categoryBadge(n.type.category) : ''}</td>
      <td>${desiredCell}</td>
      <td>${actualCell}</td>
      <td class="actions">
        <button title="Aggiorna" onclick="refreshSingleNode(${n.id})">&#x21BB;</button>
        <button title="Aggiungi figlio" onclick="openChildNodeModal(${n.id})">&#x2795;</button>
        <button title="Clona sottoalbero" onclick="cloneAuenNode(${n.id})">&#x2398;</button>
        <button title="Modifica" onclick="openNodeModal(${n.id})">&#x270F;&#xFE0F;</button>
        <button title="Elimina" onclick="deleteNode(${n.id})">&#x1F5D1;&#xFE0F;</button>
        ${n.type?.category === 'node_manual_target' ? `<button title="Imposta valore" onclick="openSetValueModal(${n.id})">&#x26A1;</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function _buildParentOptions(nodes, parentId, depth) {
  const children = nodes.filter(n => (n.parentId ?? null) === parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  const lines = [];
  const prefix = depth > 0 ? '  '.repeat(depth) + '└ ' : '';
  children.forEach(n => {
    lines.push(`<option value="${n.id}">${prefix}${esc(n.code ?? `#${n.id}`)}</option>`);
    lines.push(..._buildParentOptions(nodes, n.id, depth + 1));
  });
  return lines;
}

async function openNodeModal(id = null) {
  const node = id != null ? auenNodes.find(n => n.id === id) : null;

  const typeSelect = document.getElementById('node-type-select');
  typeSelect.innerHTML = '<option value="">— seleziona —</option>' +
    auenNodeTypes.map(nt =>
      `<option value="${nt.id}">${esc(nt.name)} (${esc(nt.category)})</option>`
    ).join('');

  const parentSelect = document.getElementById('node-parent-select');
  parentSelect.innerHTML = '<option value="">— nessuno (radice) —</option>' +
    _buildParentOptions(auenNodes.filter(n => n.id !== id), null, 0).join('');

  const form = document.getElementById('node-form');
  form.reset();
  form.recordId.value = node?.id ?? '';
  form.code.value = node?.code ?? '';
  form.description.value = node?.description ?? '';
  form.typeId.value = node?.typeId ?? '';
  form.parentId.value = node?.parentId ?? '';
  const isLogicalChk = document.getElementById('node-is-logical');
  if (isLogicalChk) isLogicalChk.checked = node?.isLogical ?? false;
  const isFakeNode = node?.type?.category === 'fake';
  const isLogicalRow = isLogicalChk?.closest('.form-row');
  if (isLogicalRow) isLogicalRow.style.display = isFakeNode ? 'none' : '';

  await _populateIotComponentSearch(form, node);

  document.getElementById('node-type-select').disabled = id != null && !nodeTypeEditAllowed;

  document.getElementById('node-modal-title').textContent =
    node ? `Modifica — ${node.code ?? `#${node.id}`}` : 'Nuovo Nodo';

  const attrSection = document.getElementById('node-attributes-section');
  const attrHint = document.getElementById('node-attributes-hint');
  const tagSection = document.getElementById('node-tags-section');
  const createAttrsSection = document.getElementById('node-create-attrs-section');
  if (node) {
    attrSection.classList.remove('hidden');
    tagSection.classList.remove('hidden');
    attrHint.classList.add('hidden');
    createAttrsSection.classList.add('hidden');
    document.getElementById('node-create-attrs-list').innerHTML = '';
    renderNodeAttributesList(node.id, node.attributes || []);
    populateAttrTypeSelect();
    document.getElementById('attr-type-select').value = '';
    document.getElementById('attr-value-input').value = '';
    document.getElementById('attr-value-input').classList.remove('hidden');
    const attrNodeSel = document.getElementById('attr-node-select');
    attrNodeSel.classList.add('hidden');
    attrNodeSel.value = '';
    renderNodeTagsList(node.id, node.tags || []);
    populateTagNodeSelect(node.id);
  } else {
    attrSection.classList.add('hidden');
    tagSection.classList.add('hidden');
    attrHint.classList.add('hidden');
    createAttrsSection.classList.add('hidden');
    document.getElementById('node-create-attrs-list').innerHTML = '';
  }

  const deleteBtn = document.getElementById('node-delete-btn');
  if (deleteBtn) deleteBtn.classList.toggle('hidden', id == null);

  document.getElementById('node-modal').classList.add('show');
}

async function openChildNodeModal(parentId) {
  await openNodeModal(null);
  const form = document.getElementById('node-form');
  form.elements['parentId'].value = String(parentId);
  document.getElementById('node-parent-select').disabled = true;
  const parent = auenNodes.find(n => n.id === parentId);
  document.getElementById('node-modal-title').textContent =
    `Nuovo figlio di ${esc(parent?.code ?? `#${parentId}`)}`;
}

function populateAttrTypeSelect() {
  const select = document.getElementById('attr-type-select');
  select.innerHTML = '<option value="">— seleziona attributo —</option>' +
    auenAttributeTypes.map(at =>
      `<option value="${at.id}">${esc(at.code)} (${esc(at.dataType)})</option>`
    ).join('');
}

function onAttrTypeChange() {
  const attrTypeId = Number(document.getElementById('attr-type-select').value);
  const at = auenAttributeTypes.find(x => x.id === attrTypeId);
  const isNodeType = at?.dataType === 'auen_node';
  const input = document.getElementById('attr-value-input');
  const nodeSelect = document.getElementById('attr-node-select');
  if (isNodeType) {
    input.classList.add('hidden');
    nodeSelect.classList.remove('hidden');
    populateAttrNodeSelect();
  } else {
    nodeSelect.classList.add('hidden');
    nodeSelect.value = '';
    input.classList.remove('hidden');
    input.value = '';
  }
}

function populateAttrNodeSelect() {
  const currentNodeId = Number(document.getElementById('node-form').recordId.value);
  const select = document.getElementById('attr-node-select');
  select.innerHTML = '<option value="">— seleziona nodo —</option>' +
    _buildParentOptions(auenNodes.filter(n => n.id !== currentNodeId), null, 0).join('');
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
        ${attributes.map(a => {
          const displayValue = a.attribute?.dataType === 'auen_node'
            ? esc(auenNodes.find(n => n.id === Number(a.value))?.code ?? a.value)
            : esc(a.value);
          return `
          <tr>
            <td>${esc(a.attribute?.code ?? `#${a.attributeId}`)}</td>
            <td id="aval-${a.attributeId}"
                data-raw="${esc(a.value)}"
                data-dtype="${esc(a.attribute?.dataType ?? '')}">
              <code>${displayValue}</code>
            </td>
            <td class="actions">
              <button type="button" id="aedit-${a.attributeId}" title="Modifica"
                onclick="editNodeAttr(${nodeId}, ${a.attributeId})">&#x270F;&#xFE0F;</button>
              <button type="button" id="asave-${a.attributeId}" title="Salva" class="hidden"
                onclick="saveNodeAttr(${nodeId}, ${a.attributeId})">&#x1F4BE;</button>
              <button type="button" title="Rimuovi"
                onclick="removeNodeAttribute(${nodeId}, ${a.attributeId})">&#x1F5D1;&#xFE0F;</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function editNodeAttr(nodeId, attrId) {
  const valCell = document.getElementById(`aval-${attrId}`);
  const rawValue = valCell.dataset.raw;
  const dataType = valCell.dataset.dtype;

  if (dataType === 'auen_node') {
    const opts = _buildParentOptions(auenNodes.filter(n => n.id !== nodeId), null, 0).join('');
    valCell.innerHTML =
      `<select id="aval-input-${attrId}" class="attr-inline-input">` +
      `<option value="">— seleziona —</option>${opts}</select>`;
    document.getElementById(`aval-input-${attrId}`).value = rawValue;
  } else {
    valCell.innerHTML =
      `<input id="aval-input-${attrId}" class="attr-inline-input" value="${esc(rawValue)}" />`;
  }

  document.getElementById(`aedit-${attrId}`).classList.add('hidden');
  document.getElementById(`asave-${attrId}`).classList.remove('hidden');
}

async function saveNodeAttr(nodeId, attrId) {
  const value = document.getElementById(`aval-input-${attrId}`)?.value ?? '';
  if (!value) { showToast('Inserisci un valore', true); return; }
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/attributes/${attrId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      await refreshNodeAttributes(nodeId);
    } else {
      showToast('Errore salvataggio attributo', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function addNodeAttribute() {
  const form = document.getElementById('node-form');
  const nodeId = form.recordId.value;
  const attributeId = document.getElementById('attr-type-select').value;
  const nodeSelect = document.getElementById('attr-node-select');
  const isNodeType = !nodeSelect.classList.contains('hidden');
  const value = isNodeType
    ? nodeSelect.value
    : document.getElementById('attr-value-input').value;
  if (!attributeId) { showToast('Seleziona un attributo', true); return; }
  if (!value) { showToast('Inserisci un valore', true); return; }
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/attributes/${attributeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      document.getElementById('attr-type-select').value = '';
      document.getElementById('attr-value-input').value = '';
      document.getElementById('attr-value-input').classList.remove('hidden');
      nodeSelect.classList.add('hidden');
      nodeSelect.value = '';
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

function _iotDeviceName(comp) {
  if (!comp) return '?';
  // Prefer nested device (included by the mapper), fall back to devicesList lookup
  if (comp.device?.deviceName) return comp.device.deviceName;
  const dev = devicesList.find(d => d.id === comp.deviceId);
  return dev?.deviceName ?? String(comp.deviceId ?? '?');
}

function _iotCompLabel(comp) {
  return `${comp.componentName ?? `#${comp.id}`} (${_iotDeviceName(comp)})`;
}

async function _ensureComponentsLoaded() {
  if (componentsList.length > 0) return;
  // Devices must be loaded first
  if (devicesList.length === 0) {
    try {
      const res = await fetch('/api/iot/devices');
      devicesList = res.ok ? await res.json() : [];
    } catch { devicesList = []; }
  }
  await fetchComponents();
}

async function _populateIotComponentSearch(form, node) {
  const section = document.getElementById('node-iot-component-section');
  const searchInput = document.getElementById('node-iot-component-search');
  const hiddenInput = document.getElementById('node-iot-component-id');
  if (!section || !searchInput || !hiddenInput) return;

  const category = node?.type?.category ?? '';
  const isLogical = node?.isLogical ?? false;
  const show = !isLogical && (category.startsWith('in_') || category.startsWith('out_') || category.startsWith('proxy_'));
  section.classList.toggle('hidden', !show);

  if (show) await _ensureComponentsLoaded();

  if (node?.iotComponentId) {
    const comp = componentsList.find(c => c.id === node.iotComponentId);
    searchInput.value = comp ? _iotCompLabel(comp) : `#${node.iotComponentId}`;
    hiddenInput.value = String(node.iotComponentId);
  } else {
    searchInput.value = '';
    hiddenInput.value = '';
  }
  document.getElementById('node-iot-component-dropdown')?.classList.add('hidden');
}

function _renderIotDropdown(items) {
  const dropdown = document.getElementById('node-iot-component-dropdown');
  if (!dropdown) return;
  if (items.length === 0) {
    dropdown.innerHTML = '<li class="iot-search-empty">Nessun risultato</li>';
    dropdown.classList.remove('hidden');
    return;
  }
  dropdown.innerHTML = items.map(c => {
    const label = _iotCompLabel(c);
    return `<li class="iot-search-item" onmousedown="selectIotComponent(${c.id}, '${esc(label)}')">
      <span class="iot-item-name">${esc(c.componentName ?? `#${c.id}`)}</span>
      <span class="iot-item-device">${esc(_iotDeviceName(c))}</span>
    </li>`;
  }).join('') + '<li class="iot-search-clear" onmousedown="clearIotComponent()">— Nessuno —</li>';
  dropdown.classList.remove('hidden');
}

function onIotComponentSearch() {
  const query = (document.getElementById('node-iot-component-search')?.value ?? '').toLowerCase();
  const hiddenInput = document.getElementById('node-iot-component-id');
  if (hiddenInput) hiddenInput.value = '';

  const filtered = componentsList.filter(c =>
    !query ||
    (c.componentName ?? '').toLowerCase().includes(query) ||
    _iotDeviceName(c).toLowerCase().includes(query) ||
    String(c.id).includes(query)
  ).slice(0, 15);

  _renderIotDropdown(filtered);
}

function onIotComponentSearchFocus() {
  // Show all components on focus (even before user types)
  const filtered = componentsList.slice(0, 15);
  _renderIotDropdown(filtered);
}

function selectIotComponent(id, label) {
  const searchInput = document.getElementById('node-iot-component-search');
  const hiddenInput = document.getElementById('node-iot-component-id');
  if (searchInput) searchInput.value = label;
  if (hiddenInput) hiddenInput.value = String(id);
  document.getElementById('node-iot-component-dropdown')?.classList.add('hidden');
}

function clearIotComponent() {
  const searchInput = document.getElementById('node-iot-component-search');
  const hiddenInput = document.getElementById('node-iot-component-id');
  if (searchInput) searchInput.value = '';
  if (hiddenInput) hiddenInput.value = '';
  document.getElementById('node-iot-component-dropdown')?.classList.add('hidden');
}

async function onNodeTypeSelectChange() {
  const typeId = Number(document.getElementById('node-type-select').value);
  const nt = auenNodeTypes.find(t => t.id === typeId);
  const cat = nt?.category ?? '';
  const isFake = cat === 'fake';

  const isLogicalChk = document.getElementById('node-is-logical');
  const isLogicalRow = isLogicalChk?.closest('.form-row');
  if (isLogicalRow) isLogicalRow.style.display = isFake ? 'none' : '';

  const isLogical = isFake ? true : (isLogicalChk?.checked ?? false);
  const iotSection = document.getElementById('node-iot-component-section');
  if (iotSection) {
    const show = !isLogical && (cat.startsWith('in_') || cat.startsWith('out_') || cat.startsWith('proxy_'));
    iotSection.classList.toggle('hidden', !show);
    if (!show) {
      document.getElementById('node-iot-component-search').value = '';
      document.getElementById('node-iot-component-id').value = '';
    }
  }

  const isNewNode = !document.getElementById('node-form').recordId.value;
  if (isNewNode) {
    await _loadNodeTypeAttrsForCreate(typeId || null, cat);
  }
}

async function _loadNodeTypeAttrsForCreate(typeId, category) {
  const section = document.getElementById('node-create-attrs-section');
  const listEl = document.getElementById('node-create-attrs-list');

  if (!typeId) {
    section.classList.add('hidden');
    listEl.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`/api/auen/node-types/${typeId}/attributes`);
    const attrs = await res.json();

    const required = attrs.filter(a => a.isRequired);
    const optional = attrs.filter(a => !a.isRequired);

    let html = '';

    if (category === 'out_thermostat') {
      html += `<p class="muted-text" style="margin:0 0 10px;font-size:12px">
        &#x2139;&#xFE0F; Verranno creati automaticamente 2 nodi child: <strong>Setpoint</strong>, <strong>Sensore temperatura</strong>.
      </p>`;
    }

    if (required.length === 0 && optional.length === 0) {
      html += '<p class="muted-text attr-empty">Nessun attributo previsto per questo tipo</p>';
    } else {
      required.forEach(a => { html += _attrInputRow(a, true); });
      optional.forEach(a => { html += _attrInputRow(a, false); });
    }

    listEl.innerHTML = html;
    section.classList.remove('hidden');
  } catch {
    section.classList.add('hidden');
    listEl.innerHTML = '';
  }
}

function _attrInputRow(a, isRequired) {
  const code = esc(a.attribute?.code ?? `#${a.attributeId}`);
  const dataType = a.attribute?.dataType ?? 'string';
  const reqMark = isRequired ? '<span class="required">*</span>' : '';
  const inputId = `node-create-attr-${a.attributeId}`;
  let input;
  if (dataType === 'boolean') {
    input = `<select id="${inputId}" data-attr-id="${a.attributeId}" data-required="${isRequired}">
      <option value="">— seleziona —</option>
      <option value="1">ON (1)</option>
      <option value="0">OFF (0)</option>
    </select>`;
  } else if (dataType === 'number') {
    input = `<input id="${inputId}" type="number" step="any" placeholder="0" data-attr-id="${a.attributeId}" data-required="${isRequired}" />`;
  } else {
    input = `<input id="${inputId}" type="text" data-attr-id="${a.attributeId}" data-required="${isRequired}" />`;
  }
  return `<div class="form-row"><label>${code} ${reqMark}</label>${input}</div>`;
}

function onIsLogicalChange() {
  onNodeTypeSelectChange();
}

async function handleNodeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.recordId.value;
  const cloneFromId = cloningFromNodeId;
  cloningFromNodeId = null;
  const parentIdVal = form.elements['parentId'].value;
  const iotComponentIdVal = document.getElementById('node-iot-component-id')?.value;
  const isLogical = document.getElementById('node-is-logical')?.checked ?? false;
  const dto = {
    code: form.elements['code'].value,
    description: form.elements['description'].value || null,
    typeId: Number(form.elements['typeId'].value),
    parentId: parentIdVal ? Number(parentIdVal) : null,
    iotComponentId: iotComponentIdVal ? Number(iotComponentIdVal) : null,
    isLogical,
  };

  if (!id && !cloneFromId) {
    const attrInputs = document.querySelectorAll('#node-create-attrs-list [data-attr-id]');
    const attributes = [];
    for (const el of attrInputs) {
      const val = el.value;
      if (val !== '') attributes.push({ attributeId: Number(el.dataset.attrId), value: val });
    }
    const requiredInputs = [...attrInputs].filter(el => el.dataset.required === 'true');
    const missingRequired = requiredInputs.filter(el => el.value === '');
    if (missingRequired.length > 0) {
      showToast('Compila tutti gli attributi obbligatori', true);
      return;
    }
    if (attributes.length > 0) dto.attributes = attributes;
  }
  let url, method;
  if (cloneFromId != null) {
    url = `/api/auen/nodes/${cloneFromId}/clone`;
    method = 'POST';
  } else if (id) {
    url = `/api/auen/nodes/${id}`;
    method = 'PATCH';
  } else {
    url = '/api/auen/nodes';
    method = 'POST';
  }
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (res.ok) {
      showToast(cloneFromId != null ? 'Nodo clonato' : (id ? 'Nodo aggiornato' : 'Nodo creato'));
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

async function deleteNodeFromModal() {
  const id = Number(document.getElementById('node-form').recordId.value);
  if (!id) return;
  const node = auenNodes.find(n => n.id === id);
  if (!confirm(`Eliminare il nodo "${node?.code ?? '#' + id}" e tutti i suoi figli?`)) return;
  try {
    const res = await fetch(`/api/auen/nodes/${id}`, { method: 'DELETE' });
    showToast(res.ok ? 'Nodo eliminato' : 'Errore eliminazione', !res.ok);
    if (res.ok) {
      closeModal('node-modal');
      await fetchAuenNodes();
      renderTopology();
    }
  } catch {
    showToast('Errore di rete', true);
  }
}

async function cloneAuenNode(id) {
  const node = auenNodes.find(n => n.id === id);
  if (!node) { showToast('Nodo non trovato', true); return; }

  await openNodeModal(null);
  cloningFromNodeId = id;

  const form = document.getElementById('node-form');
  form.elements['code'].value = node.code ?? '';
  form.elements['description'].value = node.description ?? '';
  form.elements['typeId'].value = String(node.typeId);
  form.elements['parentId'].value = node.parentId != null ? String(node.parentId) : '';
  document.getElementById('node-modal-title').textContent = `Clone di ${esc(node.code ?? `#${node.id}`)}`;
}

// --- Set Value Modal (KL-39) ---
function openSetValueModal(nodeId) {
  const node = auenNodes.find(n => n.id === nodeId);
  if (!node) return;
  const form = document.getElementById('set-value-form');
  form.reset();
  form.nodeId.value = nodeId;
  document.getElementById('set-value-modal-title').textContent = `Imposta valore — ${node.code ?? '#' + nodeId}`;
  const container = document.getElementById('set-value-field-container');
  const vt = node.type?.valueType ?? 'boolean';
  if (vt === 'boolean') {
    container.innerHTML = `<label>Valore</label><select name="setValue"><option value="1">ON (1)</option><option value="0">OFF (0)</option></select>`;
  } else if (vt === 'number') {
    container.innerHTML = `<label>Valore</label><input name="setValue" type="number" step="any" required />`;
  } else {
    container.innerHTML = `<label>Valore</label><input name="setValue" type="text" required />`;
  }
  document.getElementById('set-value-modal').classList.add('show');
}

async function handleSetValueSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const nodeId = form.nodeId.value;
  const value = form.elements['setValue'].value;
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      showToast('Valore impostato');
      closeModal('set-value-modal');
      await refreshSingleNode(Number(nodeId));
    } else {
      showToast('Errore impostazione valore', true);
    }
  } catch {
    showToast('Errore di rete', true);
  }
}
