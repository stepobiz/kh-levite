// --- Realtime WebSocket client (socket.io) ---
let realtimeSocket = null;
let realtimeUnseen = 0;
const REALTIME_MAX_EVENTS = 100;
let realtimeEvents = [];

function initRealtime() {
  realtimeSocket = io({ transports: ['websocket'] });

  realtimeSocket.on('telemetry.update', (data) => {
    _onTelemetryUpdate(data);
  });

  realtimeSocket.on('node.update', (data) => {
    _onNodeUpdate(data);
  });

  realtimeSocket.on('process.update', (data) => {
    onDashboardProcessUpdate(data);
  });

  realtimeSocket.on('connect', () => {
    _setRealtimeStatus(true);
    resetTelemetryPreload();
    _ensureDashboardMapsLoaded().then(() => _preloadTelemetryFeed()).catch(() => {});
  });

  realtimeSocket.on('disconnect', () => {
    _setRealtimeStatus(false);
  });
}

function _setRealtimeStatus(connected) {
  const dot = document.getElementById('realtime-dot');
  if (dot) {
    dot.classList.toggle('connected', connected);
    dot.title = connected ? 'Live: connesso' : 'Live: disconnesso';
  }
}

function _onTelemetryUpdate(data) {
  // data: { id, componentId, value, direction, createdAt }
  const exists = allLogs.some(l => l.id === data.id);
  if (!exists) allLogs.unshift(data);

  onDashboardTelemetryUpdate(data);

  _pushRealtimeEvent({
    type: 'telemetry',
    label: `Comp #${data.componentId} → ${data.value} [${data.direction}]`,
    ts: data.createdAt,
  });
}

function _onNodeUpdate(data) {
  // data: { nodeId, desiredValue, actualValue, desiredValueUpdatedAt, actualValueUpdatedAt }
  onDashboardNodeUpdate(data);

  const idx = auenNodes.findIndex(n => n.id === data.nodeId);
  if (idx === -1) return;

  const old = auenNodes[idx];
  const changed = old.desiredValue !== data.desiredValue || old.actualValue !== data.actualValue;
  if (!changed) return;

  auenNodes[idx] = {
    ...old,
    desiredValue: data.desiredValue,
    actualValue: data.actualValue,
    desiredValueUpdatedAt: data.desiredValueUpdatedAt,
    actualValueUpdatedAt: data.actualValueUpdatedAt,
  };

  // Re-render user topology if visible
  if (document.getElementById('user-topology')?.classList.contains('active')) {
    renderUserTopology();
  }

  // Update admin topology SVG in-place if visible
  if (document.getElementById('topology')?.classList.contains('active')) {
    const vt = auenNodes[idx].type?.valueType ?? 'boolean';
    const desiredEl = document.getElementById('topo-desired-' + data.nodeId);
    const actualEl  = document.getElementById('topo-actual-'  + data.nodeId);
    const rectEl    = document.getElementById('topo-rect-'    + data.nodeId);
    const valsGroup = document.getElementById('topo-vals-'    + data.nodeId);

    if (desiredEl) desiredEl.innerHTML = _topoValSvg(data.desiredValue, vt, 'D: ');
    if (actualEl) {
      actualEl.innerHTML = _topoValSvg(data.actualValue, vt, 'A: ');
      if (vt !== 'boolean') actualEl.setAttribute('fill', _topoValColor(data.actualValue, vt));
      else actualEl.removeAttribute('fill');
    }
    if (rectEl) {
      _applyTopoRectAttrs(rectEl, _topoRectAttrs(data.nodeId, data.desiredValue, data.actualValue, vt));
    }
    if (valsGroup) {
      const titleEl = valsGroup.querySelector('title');
      if (titleEl) titleEl.textContent =
        `D: ${_fmtTopoTs(data.desiredValueUpdatedAt)}\nA: ${_fmtTopoTs(data.actualValueUpdatedAt)}`;
    }
  }

  _pushRealtimeEvent({
    type: 'node',
    label: `Nodo #${data.nodeId} D:${data.desiredValue ?? '—'} A:${data.actualValue ?? '—'}`,
    ts: new Date().toISOString(),
  });
}

function _pushRealtimeEvent(evt) {
  realtimeEvents.unshift(evt);
  if (realtimeEvents.length > REALTIME_MAX_EVENTS) realtimeEvents.length = REALTIME_MAX_EVENTS;

  const panel = document.getElementById('realtime-panel');
  if (!panel?.classList.contains('open')) {
    realtimeUnseen++;
    _updateRealtimeBadge();
  } else {
    _renderRealtimeEvents();
  }
}

function _updateRealtimeBadge() {
  const badge = document.getElementById('realtime-badge');
  if (!badge) return;
  badge.textContent = realtimeUnseen > 0 ? (realtimeUnseen > 99 ? '99+' : realtimeUnseen) : '';
  badge.style.display = realtimeUnseen > 0 ? 'flex' : 'none';
}

function toggleRealtimePanel() {
  const panel = document.getElementById('realtime-panel');
  if (!panel) return;
  const opening = !panel.classList.contains('open');
  panel.classList.toggle('open', opening);
  if (opening) {
    realtimeUnseen = 0;
    _updateRealtimeBadge();
    _renderRealtimeEvents();
  }
}

function _renderRealtimeEvents() {
  const list = document.getElementById('realtime-event-list');
  if (!list) return;
  if (realtimeEvents.length === 0) {
    list.innerHTML = '<li class="realtime-empty">Nessun evento ancora</li>';
    return;
  }
  list.innerHTML = realtimeEvents.map(e => {
    const ts = e.ts ? new Date(e.ts).toLocaleTimeString('it-IT') : '';
    const icon = e.type === 'node' ? '&#x26A1;' : '&#x1F4E1;';
    return `<li class="realtime-event realtime-${esc(e.type)}">${icon} <span class="re-label">${esc(e.label)}</span><span class="re-ts">${esc(ts)}</span></li>`;
  }).join('');
}
