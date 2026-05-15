// Topology page: renders node subtree as an SVG tree diagram

const NODE_W = 180;
const NODE_H = 80;
const H_GAP = 30;
const V_GAP = 65;

// Module-level set updated on each full render — used by updateTopoValues for in-place stroke update
let topoConnectedSourceIds = new Set();
let _lastTopoRootId = null;

// Shared helper — called also from kh-realtime.js for in-place updates
// Logical nodes: dashed grey. Boolean nodes: green/red border, yellow solid blink when desired≠actual.
// Thermal nodes: orange(heat)/blue(cool)/grey(off) border.
function _topoRectAttrs(nodeId, desiredValue, actualValue, vt) {
  if (vt === 'thermal') {
    if (desiredValue !== actualValue) return { stroke: '#eab308', dash: '5,3', blink: true };
    if (actualValue === 'heat') return { stroke: '#f97316', dash: null, blink: false };
    if (actualValue === 'cool') return { stroke: '#0ea5e9', dash: null, blink: false };
    return { stroke: '#94a3b8', dash: null, blink: false };
  }
  const node = auenNodes.find(n => n.id === nodeId);
  if (node?.isLogical) return { stroke: '#94a3b8', dash: '5,3', blink: false };
  const cat = node?.type?.category ?? '';
  if (cat === 'fake' || cat.startsWith('node_')) return { stroke: '#cbd5e1', dash: null, blink: false };
  if (vt === 'boolean') {
    if (desiredValue !== actualValue) return { stroke: '#eab308', dash: null, blink: true };
    if (actualValue === '1') return { stroke: '#16a34a', dash: null, blink: false };
    return { stroke: '#dc2626', dash: null, blink: false };
  }
  return { stroke: '#cbd5e1', dash: null, blink: false };
}

// Returns SVG text content (may contain <tspan>) for a value label
function _topoValSvg(val, vt, label) {
  if (vt === 'boolean') {
    const color = val === '1' ? '#16a34a' : '#dc2626';
    return `${esc(label)}<tspan fill="${color}" font-size="14">&#x25CF;</tspan>`;
  }
  if (vt === 'thermal') {
    const color = val === 'heat' ? '#f97316' : val === 'cool' ? '#0ea5e9' : '#94a3b8';
    return `${esc(label)}<tspan fill="${color}" font-weight="bold">${esc(val ?? '—')}</tspan>`;
  }
  return esc(label + _topoPlainVal(val, vt));
}

function _applyTopoRectAttrs(rectEl, attrs) {
  if (!rectEl) return;
  rectEl.setAttribute('stroke', attrs.stroke);
  if (attrs.dash) rectEl.setAttribute('stroke-dasharray', attrs.dash);
  else rectEl.removeAttribute('stroke-dasharray');
  rectEl.classList.toggle('topo-blink', attrs.blink);
}

function toggleTopoNode(nodeId) {
  if (collapsedTopoNodes.has(nodeId)) collapsedTopoNodes.delete(nodeId);
  else collapsedTopoNodes.add(nodeId);
  renderTopology();
}

function expandAllTopoNodes() {
  collapsedTopoNodes.clear();
  renderTopology();
}

function collapseAllTopoNodes() {
  const followConnected = document.getElementById('topology-follow-connected')?.checked ?? false;
  auenNodes.forEach(n => {
    if (topoNodeHasChildren(n, followConnected)) collapsedTopoNodes.add(n.id);
  });
  renderTopology();
}

function topoNodeHasChildren(node, followConnected) {
  if (!node) return false;
  if (auenNodes.some(c => c.parentId === node.id)) return true;
  if (followConnected) {
    const cat = node.type?.category ?? '';
    if (cat.startsWith('proxy_')) {
      const sourceAttr = (node.attributes || []).find(a => a.attribute?.code === 'source_node_id');
      if (sourceAttr && Number(sourceAttr.value)) return true;
    }
  }
  return false;
}

function initTopologyRootSelect() {
  const sel = document.getElementById('topology-root-select');
  if (!sel) return;
  const current = sel.value;
  const roots = auenNodes.filter(n => !n.parentId);
  sel.innerHTML = '<option value="">— seleziona root —</option>' +
    roots.map(n => `<option value="${n.id}">${esc(n.code ?? '#' + n.id)}</option>`).join('');
  if (current) sel.value = current;
}

function _topoPlainVal(value, vt) {
  if (vt === 'boolean') return value === '1' ? 'ON' : 'OFF';
  return value ?? '—';
}

function _topoValColor(value, vt) {
  if (vt === 'boolean') return value === '1' ? '#16a34a' : '#dc2626';
  if (vt === 'thermal') {
    if (value === 'heat') return '#f97316';
    if (value === 'cool') return '#0ea5e9';
    return '#94a3b8';
  }
  return '#374151';
}

function _fmtTopoTs(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT');
}

async function deleteTopoNode(nodeId) {
  const node = auenNodes.find(n => n.id === nodeId);
  if (!confirm(`Eliminare il nodo "${node?.code ?? '#' + nodeId}" e tutti i suoi figli?`)) return;
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Nodo eliminato');
      await fetchAuenNodes();
      renderTopology();
    } else {
      showToast('Errore eliminazione', true);
    }
  } catch { showToast('Errore di rete', true); }
}

// In-place value update — called by interval, no layout change
async function updateTopoValues() {
  const topoActive = document.getElementById('topology')?.classList.contains('active');
  const userTopoActive = document.getElementById('user-topology')?.classList.contains('active');
  if (!topoActive && !userTopoActive) return;
  if (topoActive && !document.getElementById('topology-canvas')?.querySelector('svg')) return;
  try {
    const res = await fetch('/api/auen/nodes');
    if (!res.ok) return;
    const fresh = await res.json();
    let needsFull = false;

    fresh.forEach(updated => {
      const idx = auenNodes.findIndex(n => n.id === updated.id);
      if (idx === -1) { needsFull = true; return; }
      const old = auenNodes[idx];
      if (old.desiredValue === updated.desiredValue && old.actualValue === updated.actualValue) return;

      auenNodes[idx] = { ...old, ...updated };
      const vt = updated.type?.valueType ?? 'boolean';

      const desiredEl = document.getElementById('topo-desired-' + updated.id);
      const actualEl  = document.getElementById('topo-actual-'  + updated.id);
      const rectEl    = document.getElementById('topo-rect-'    + updated.id);
      const valsGroup = document.getElementById('topo-vals-'    + updated.id);

      if (desiredEl) desiredEl.innerHTML = _topoValSvg(updated.desiredValue, vt, 'D: ');
      if (actualEl) {
        actualEl.innerHTML = _topoValSvg(updated.actualValue, vt, 'A: ');
        if (vt !== 'boolean') actualEl.setAttribute('fill', _topoValColor(updated.actualValue, vt));
        else actualEl.removeAttribute('fill');
      }
      if (rectEl) {
        _applyTopoRectAttrs(rectEl, _topoRectAttrs(updated.id, updated.desiredValue, updated.actualValue, vt));
      }
      if (valsGroup) {
        const titleEl = valsGroup.querySelector('title');
        if (titleEl) titleEl.textContent =
          `D: ${_fmtTopoTs(updated.desiredValueUpdatedAt)}\nA: ${_fmtTopoTs(updated.actualValueUpdatedAt)}`;
      }
    });

    if (!needsFull) needsFull = auenNodes.some(n => !fresh.find(f => f.id === n.id));
    if (needsFull && topoActive) renderTopology();
    if (userTopoActive) renderUserTopology();
  } catch {}
}

function renderTopology() {
  initTopologyRootSelect();
  const rootId = Number(document.getElementById('topology-root-select')?.value);
  const followConnected = document.getElementById('topology-follow-connected')?.checked ?? false;
  const canvas = document.getElementById('topology-canvas');
  if (!canvas) return;
  if (!rootId) {
    canvas.innerHTML = '<p class="muted-text" style="padding:16px">Seleziona un nodo radice.</p>';
    topoConnectedSourceIds = new Set();
    _lastTopoRootId = null;
    return;
  }

  // When root changes: collapse all nodes that have children (except root itself)
  if (rootId !== _lastTopoRootId) {
    collapsedTopoNodes.clear();
    auenNodes
      .filter(n => n.id !== rootId && auenNodes.some(c => c.parentId === n.id))
      .forEach(n => collapsedTopoNodes.add(n.id));
    _lastTopoRootId = rootId;
  }

  const positions = {};
  const positionedIds = new Set();
  const connectedEdges = [];
  let maxX = 0, maxY = 0;

  function layoutTree(nodeId, depth, xOffset) {
    if (positionedIds.has(nodeId)) return 0;
    positionedIds.add(nodeId);

    const node = auenNodes.find(n => n.id === nodeId);
    const collapsed = collapsedTopoNodes.has(nodeId);
    const childIds = [];

    if (!collapsed) {
      auenNodes
        .filter(n => n.parentId === nodeId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
        .forEach(n => childIds.push(n.id));

      if (followConnected && node) {
        const cat = node.type?.category ?? '';
        if (cat.startsWith('proxy_')) {
          const sourceAttr = (node.attributes || []).find(a => a.attribute?.code === 'source_node_id');
          const sourceId = sourceAttr ? Number(sourceAttr.value) : null;
          if (sourceId && !isNaN(sourceId)) {
            connectedEdges.push({ fromId: nodeId, toId: sourceId });
            if (!positionedIds.has(sourceId) && !childIds.includes(sourceId)) {
              childIds.push(sourceId);
            }
          }
        }
      }
    }

    let totalWidth = 0;
    childIds.forEach(cId => {
      const w = layoutTree(cId, depth + 1, xOffset + totalWidth);
      totalWidth += w + H_GAP;
    });
    if (totalWidth > 0) totalWidth -= H_GAP;

    const myWidth = Math.max(NODE_W, totalWidth);
    const x = xOffset + (myWidth - NODE_W) / 2;
    const y = depth * (NODE_H + V_GAP);
    positions[nodeId] = { x, y };
    maxX = Math.max(maxX, x + NODE_W);
    maxY = Math.max(maxY, y + NODE_H);
    return myWidth;
  }

  layoutTree(rootId, 0, 0);
  topoConnectedSourceIds = new Set(connectedEdges.map(e => e.toId));
  maxX += 20; maxY += 28;

  const parentEdgeElems = [];
  const connEdgeElems = [];
  const nodeElems = [];

  // Structural parent-child edges (solid grey)
  positionedIds.forEach(nId => {
    const pos = positions[nId];
    if (!pos) return;
    auenNodes
      .filter(c => c.parentId === nId && positions[c.id] && !topoConnectedSourceIds.has(c.id))
      .forEach(c => {
        const cp = positions[c.id];
        parentEdgeElems.push(`<line x1="${pos.x + NODE_W / 2}" y1="${pos.y + NODE_H + 8}" x2="${cp.x + NODE_W / 2}" y2="${cp.y}" stroke="#e2e8f0" stroke-width="1.5"/>`);
      });
  });

  // Connected edges (dashed blue)
  connectedEdges.forEach(({ fromId, toId }) => {
    const fp = positions[fromId];
    const tp = positions[toId];
    if (!fp || !tp) return;
    connEdgeElems.push(`<line x1="${fp.x + NODE_W / 2}" y1="${fp.y + NODE_H + 8}" x2="${tp.x + NODE_W / 2}" y2="${tp.y}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="6,3" marker-end="url(#arrowBlue)" opacity="0.8"/>`);
  });

  // Node rectangles
  positionedIds.forEach(nId => {
    const node = auenNodes.find(n => n.id === nId);
    if (!node) return;
    const pos = positions[nId];
    if (!pos) return;

    const vt = node.type?.valueType ?? 'boolean';
    const cat = node.type?.category ?? '';
    const isFake = cat === 'fake';
    const isOut = cat.startsWith('out_');
    const isProxy = cat.startsWith('proxy_');
    let fillColor = '#fff';
    if (cat.startsWith('in_')) fillColor = '#f0fdf4';
    else if (cat.startsWith('out_')) fillColor = '#eff6ff';
    else if (cat.startsWith('proxy_')) fillColor = '#fff7ed';
    else if (cat === 'fake') fillColor = '#f8fafc';
    else fillColor = '#f9fafb';

    const ra = _topoRectAttrs(nId, node.desiredValue, node.actualValue, vt);
    const strokeColor = ra.stroke;
    const strokeDashAttr = ra.dash ? ` stroke-dasharray="${ra.dash}"` : '';
    const blinkClass = ra.blink ? ' class="topo-blink"' : '';

    const codeTxt = esc((node.code ?? '').substring(0, 18));
    const typeTxt = esc((node.type?.name ?? '').substring(0, 24));
    const showDesired = !isFake && (isOut || isProxy);
    const showActual  = !isFake;
    const desiredSvg = showDesired ? _topoValSvg(node.desiredValue, vt, 'D: ') : '';
    const actualSvg  = showActual  ? _topoValSvg(node.actualValue,  vt, 'A: ') : '';
    const actualFill = vt === 'boolean' ? '' : ` fill="${_topoValColor(node.actualValue, vt)}"`;
    const titleTs = `D: ${_fmtTopoTs(node.desiredValueUpdatedAt)}\nA: ${_fmtTopoTs(node.actualValueUpdatedAt)}`;

    const setValueBtn = cat === 'node_manual_target'
      ? `<text x="${NODE_W - 6}" y="14" text-anchor="end" font-size="13" fill="#3b82f6" style="cursor:pointer" onclick="event.stopPropagation();openSetValueModal(${node.id})" title="Imposta valore">&#x26A1;</text>`
      : '';

    const canHaveChildren = ['out_logic_or', 'out_logic_and', 'out_thermostat', 'fake'].includes(cat);
    const addChildBtn = canHaveChildren
      ? `<text x="${NODE_W - 6}" y="73" text-anchor="end" font-size="11" fill="#94a3b8" style="cursor:pointer" onclick="event.stopPropagation();openChildNodeModal(${node.id})" title="Aggiungi figlio">+</text>`
      : '';

    const hasChildren = topoNodeHasChildren(node, followConnected);
    const isCollapsed = collapsedTopoNodes.has(nId);
    const collapseBtn = hasChildren ? `
      <g onclick="event.stopPropagation();toggleTopoNode(${nId})" style="cursor:pointer">
        <circle cx="${NODE_W / 2}" cy="${NODE_H}" r="8" fill="#f8fafc" stroke="${strokeColor}" stroke-width="1.5"/>
        <text x="${NODE_W / 2}" y="${NODE_H + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#64748b" pointer-events="none">${isCollapsed ? '+' : '&#x2212;'}</text>
      </g>` : '';

    // Order arrows — show only when node has siblings
    const siblings = auenNodes.filter(n => (n.parentId ?? null) === (node.parentId ?? null))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
    const sibIdx = siblings.findIndex(s => s.id === nId);
    const isFirst = sibIdx === 0;
    const isLast = sibIdx === siblings.length - 1;
    const hasSiblings = siblings.length > 1;
    const arrowLeft = hasSiblings && !isFirst
      ? `<text x="2" y="${NODE_H / 2 + 4}" font-size="14" fill="#94a3b8" style="cursor:pointer" onclick="event.stopPropagation();reorderTopoNode(${nId},'up')" title="Sposta a sinistra">&#x2039;</text>`
      : '';
    const arrowRight = hasSiblings && !isLast
      ? `<text x="${NODE_W - 4}" y="${NODE_H / 2 + 4}" text-anchor="end" font-size="14" fill="#94a3b8" style="cursor:pointer" onclick="event.stopPropagation();reorderTopoNode(${nId},'down')" title="Sposta a destra">&#x203A;</text>`
      : '';

    nodeElems.push(`
      <g transform="translate(${pos.x},${pos.y})" style="cursor:pointer" onclick="openNodeModal(${node.id})">
        <rect id="topo-rect-${nId}"${blinkClass} width="${NODE_W}" height="${NODE_H}" rx="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"${strokeDashAttr}/>
        <text x="${NODE_W / 2}" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"><tspan>${codeTxt}</tspan><tspan fill="#94a3b8" font-size="9" font-weight="400"> #${nId}</tspan></text>
        <text x="${NODE_W / 2}" y="25" text-anchor="middle" font-size="9" fill="#64748b">${typeTxt}</text>
        <g id="topo-vals-${nId}">
          <title>${esc(titleTs)}</title>
          <text id="topo-desired-${nId}" x="${NODE_W / 2}" y="41" text-anchor="middle" font-size="10" fill="#374151"${showDesired ? '' : ' visibility="hidden"'}>${desiredSvg}</text>
          <text id="topo-actual-${nId}"  x="${NODE_W / 2}" y="57" text-anchor="middle" font-size="11" font-weight="600"${actualFill}${showActual ? '' : ' visibility="hidden"'}>${actualSvg}</text>
        </g>
        <text x="6" y="14" font-size="12" fill="#94a3b8" style="cursor:pointer" onclick="event.stopPropagation();cloneAuenNode(${node.id})" title="Clona nodo">&#x2398;</text>
        ${setValueBtn}
        ${addChildBtn}
        ${collapseBtn}
        ${arrowLeft}
        ${arrowRight}
      </g>`);
  });

  const defs = connectedEdges.length > 0 ? `<defs>
    <marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" opacity="0.8"/>
    </marker>
  </defs>` : '';

  canvas.innerHTML = `<svg width="${maxX}" height="${maxY}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    ${parentEdgeElems.join('\n')}
    ${connEdgeElems.join('\n')}
    ${nodeElems.join('\n')}
  </svg>`;
}

// ============================================================
// UTENTE — User topology (read-only + set-value on node_manual_target)
// ============================================================

let _lastUserTopoRootId = null;

function initUserTopologyRootSelect() {
  const sel = document.getElementById('user-topology-root-select');
  if (!sel) return;
  const current = sel.value;
  const roots = auenNodes.filter(n => !n.parentId);
  sel.innerHTML = '<option value="">— seleziona root —</option>' +
    roots.map(n => `<option value="${n.id}">${esc(n.code ?? '#' + n.id)}</option>`).join('');
  if (current) sel.value = current;
}

function expandAllUserTopoNodes() {
  collapsedUserTopoNodes.clear();
  renderUserTopology();
}

function collapseAllUserTopoNodes() {
  const followConnected = document.getElementById('user-topology-follow-connected')?.checked ?? false;
  auenNodes.forEach(n => {
    if (topoNodeHasChildren(n, followConnected)) collapsedUserTopoNodes.add(n.id);
  });
  renderUserTopology();
}

function toggleUserTopoNode(nodeId) {
  if (collapsedUserTopoNodes.has(nodeId)) collapsedUserTopoNodes.delete(nodeId);
  else collapsedUserTopoNodes.add(nodeId);
  renderUserTopology();
}

function renderUserTopology() {
  initUserTopologyRootSelect();
  const rootId = Number(document.getElementById('user-topology-root-select')?.value);
  const followConnected = document.getElementById('user-topology-follow-connected')?.checked ?? false;
  const canvas = document.getElementById('user-topology-canvas');
  if (!canvas) return;
  if (!rootId) {
    canvas.innerHTML = '<p class="muted-text" style="padding:16px">Seleziona un nodo radice.</p>';
    _lastUserTopoRootId = null;
    return;
  }

  if (rootId !== _lastUserTopoRootId) {
    collapsedUserTopoNodes.clear();
    auenNodes
      .filter(n => n.id !== rootId && auenNodes.some(c => c.parentId === n.id))
      .forEach(n => collapsedUserTopoNodes.add(n.id));
    _lastUserTopoRootId = rootId;
  }

  const positions = {};
  const positionedIds = new Set();
  const connectedEdges = [];
  let maxX = 0, maxY = 0;

  function layoutTree(nodeId, depth, xOffset) {
    if (positionedIds.has(nodeId)) return 0;
    positionedIds.add(nodeId);
    const node = auenNodes.find(n => n.id === nodeId);
    const collapsed = collapsedUserTopoNodes.has(nodeId);
    const childIds = [];

    if (!collapsed) {
      auenNodes
        .filter(n => n.parentId === nodeId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
        .forEach(n => childIds.push(n.id));

      if (followConnected && node) {
        const cat = node.type?.category ?? '';
        if (cat.startsWith('proxy_')) {
          const sourceAttr = (node.attributes || []).find(a => a.attribute?.code === 'source_node_id');
          const sourceId = sourceAttr ? Number(sourceAttr.value) : null;
          if (sourceId && !isNaN(sourceId)) {
            connectedEdges.push({ fromId: nodeId, toId: sourceId });
            if (!positionedIds.has(sourceId) && !childIds.includes(sourceId)) childIds.push(sourceId);
          }
        }
      }
    }

    let totalWidth = 0;
    childIds.forEach(cId => {
      const w = layoutTree(cId, depth + 1, xOffset + totalWidth);
      totalWidth += w + H_GAP;
    });
    if (totalWidth > 0) totalWidth -= H_GAP;

    const myWidth = Math.max(NODE_W, totalWidth);
    const x = xOffset + (myWidth - NODE_W) / 2;
    const y = depth * (NODE_H + V_GAP);
    positions[nodeId] = { x, y };
    maxX = Math.max(maxX, x + NODE_W);
    maxY = Math.max(maxY, y + NODE_H);
    return myWidth;
  }

  layoutTree(rootId, 0, 0);
  const userConnectedSourceIds = new Set(connectedEdges.map(e => e.toId));
  maxX += 20; maxY += 28;

  const parentEdgeElems = [];
  const connEdgeElems = [];
  const nodeElems = [];

  positionedIds.forEach(nId => {
    const pos = positions[nId];
    if (!pos) return;
    auenNodes
      .filter(c => c.parentId === nId && positions[c.id] && !userConnectedSourceIds.has(c.id))
      .forEach(c => {
        const cp = positions[c.id];
        parentEdgeElems.push(`<line x1="${pos.x + NODE_W / 2}" y1="${pos.y + NODE_H + 8}" x2="${cp.x + NODE_W / 2}" y2="${cp.y}" stroke="#e2e8f0" stroke-width="1.5"/>`);
      });
  });

  connectedEdges.forEach(({ fromId, toId }) => {
    const fp = positions[fromId];
    const tp = positions[toId];
    if (!fp || !tp) return;
    connEdgeElems.push(`<line x1="${fp.x + NODE_W / 2}" y1="${fp.y + NODE_H + 8}" x2="${tp.x + NODE_W / 2}" y2="${tp.y}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="6,3" marker-end="url(#userArrowBlue)" opacity="0.8"/>`);
  });

  positionedIds.forEach(nId => {
    const node = auenNodes.find(n => n.id === nId);
    if (!node) return;
    const pos = positions[nId];
    if (!pos) return;

    const vt = node.type?.valueType ?? 'boolean';
    const cat = node.type?.category ?? '';
    const isFake = cat === 'fake';
    const isOut = cat.startsWith('out_');
    const isProxy = cat.startsWith('proxy_');
    let fillColor = '#fff';
    if (cat.startsWith('in_')) fillColor = '#f0fdf4';
    else if (isOut) fillColor = '#eff6ff';
    else if (isProxy) fillColor = '#fff7ed';
    else if (isFake) fillColor = '#f8fafc';
    else fillColor = '#f9fafb';

    const ra = _topoRectAttrs(nId, node.desiredValue, node.actualValue, vt);
    const strokeColor = ra.stroke;
    const strokeDashAttr = ra.dash ? ` stroke-dasharray="${ra.dash}"` : '';
    const blinkClass = ra.blink ? ' class="topo-blink"' : '';

    const codeTxt = esc((node.code ?? '').substring(0, 18));
    const typeTxt = esc((node.type?.name ?? '').substring(0, 24));
    const showDesired = !isFake && (isOut || isProxy);
    const showActual  = !isFake;
    const desiredSvg = showDesired ? _topoValSvg(node.desiredValue, vt, 'D: ') : '';
    const actualSvg  = showActual  ? _topoValSvg(node.actualValue,  vt, 'A: ') : '';
    const actualFill = vt === 'boolean' ? '' : ` fill="${_topoValColor(node.actualValue, vt)}"`;
    const titleTs = `D: ${_fmtTopoTs(node.desiredValueUpdatedAt)}\nA: ${_fmtTopoTs(node.actualValueUpdatedAt)}`;

    const setValueBtn = cat === 'node_manual_target'
      ? `<text x="${NODE_W - 6}" y="14" text-anchor="end" font-size="13" fill="#3b82f6" style="cursor:pointer" onclick="event.stopPropagation();openSetValueModal(${node.id})" title="Imposta valore">&#x26A1;</text>`
      : '';

    const hasChildren = topoNodeHasChildren(node, followConnected);
    const isCollapsed = collapsedUserTopoNodes.has(nId);
    const collapseBtn = hasChildren ? `
      <g onclick="event.stopPropagation();toggleUserTopoNode(${nId})" style="cursor:pointer">
        <circle cx="${NODE_W / 2}" cy="${NODE_H}" r="8" fill="#f8fafc" stroke="${strokeColor}" stroke-width="1.5"/>
        <text x="${NODE_W / 2}" y="${NODE_H + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="#64748b" pointer-events="none">${isCollapsed ? '+' : '&#x2212;'}</text>
      </g>` : '';

    nodeElems.push(`
      <g transform="translate(${pos.x},${pos.y})">
        <rect${blinkClass} width="${NODE_W}" height="${NODE_H}" rx="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"${strokeDashAttr}/>
        <text x="${NODE_W / 2}" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"><tspan>${codeTxt}</tspan><tspan fill="#94a3b8" font-size="9" font-weight="400"> #${nId}</tspan></text>
        <text x="${NODE_W / 2}" y="25" text-anchor="middle" font-size="9" fill="#64748b">${typeTxt}</text>
        <g>
          <title>${esc(titleTs)}</title>
          <text x="${NODE_W / 2}" y="41" text-anchor="middle" font-size="10" fill="#374151"${showDesired ? '' : ' visibility="hidden"'}>${desiredSvg}</text>
          <text x="${NODE_W / 2}" y="57" text-anchor="middle" font-size="11" font-weight="600"${actualFill}${showActual ? '' : ' visibility="hidden"'}>${actualSvg}</text>
        </g>
        ${setValueBtn}
        ${collapseBtn}
      </g>`);
  });

  const defs = connectedEdges.length > 0 ? `<defs>
    <marker id="userArrowBlue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" opacity="0.8"/>
    </marker>
  </defs>` : '';

  canvas.innerHTML = `<svg width="${maxX}" height="${maxY}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    ${parentEdgeElems.join('\n')}
    ${connEdgeElems.join('\n')}
    ${nodeElems.join('\n')}
  </svg>`;
}

async function reorderTopoNode(nodeId, direction) {
  try {
    const res = await fetch(`/api/auen/nodes/${nodeId}/order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      await fetchAuenNodes();
      renderTopology();
    } else {
      showToast('Errore riordinamento', true);
    }
  } catch { showToast('Errore di rete', true); }
}
