// --- Dashboard state ---
const DASHBOARD_PROCESSES = [
  { id: 'logic_engine',        label: 'Logic Engine' },
  { id: 'sync_engine',         label: 'Sync Engine' },
  { id: 'telemetry_processor', label: 'Telemetry Processor' },
];
const DASHBOARD_MAX_FEED = 200;

const _dbProcessStats = {};   // processId → { last, recentDurations[] }
const _dbNodeFeed = [];
const _dbTelemetryFeed = [];
let _dbNodeUnseen = 0;
let _dbTelemetryUnseen = 0;
let _telemetryPreloadDone = false;

// ── Init ─────────────────────────────────────────────────────────────────────

async function initDashboard() {
  await _ensureDashboardMapsLoaded();
  await Promise.all([
    ...DASHBOARD_PROCESSES.map(p => _loadProcessStats(p.id)),
    _preloadTelemetryFeed(),
  ]);
  _startAgoInterval();
}

let _agoIntervalId = null;
function _startAgoInterval() {
  if (_agoIntervalId) return;
  _agoIntervalId = setInterval(() => {
    DASHBOARD_PROCESSES.forEach(p => {
      const st = _dbProcessStats[p.id];
      if (!st?.last?.startedAt) return;
      _setText(`pb-${p.id}-ago`, _fmtAgo(new Date(st.last.startedAt)));
    });
  }, 1000);
}

async function _ensureDashboardMapsLoaded() {
  const loads = [];
  if (!auenNodes.length) {
    loads.push(fetch('/api/auen/nodes').then(r => r.json()).then(d => { if (Array.isArray(d)) auenNodes = d; }).catch(() => {}));
  }
  if (!Array.isArray(componentsList) || !componentsList.length) {
    loads.push(fetch('/api/iot/components').then(r => r.json()).then(d => { if (Array.isArray(d)) componentsList = d; }).catch(() => {}));
  }
  if (!devicesList.length) {
    loads.push(fetch('/api/iot/devices').then(r => r.json()).then(d => { if (Array.isArray(d)) devicesList = d; }).catch(() => {}));
  }
  if (loads.length) await Promise.all(loads);
}

async function _preloadTelemetryFeed() {
  if (_telemetryPreloadDone) return;
  _telemetryPreloadDone = true;
  try {
    const res = await fetch('/api/iot/telemetry-logs?limit=50');
    if (!res.ok) throw new Error('not ok');
    const logs = await res.json();
    logs.forEach(l => {
      if (!_dbTelemetryFeed.some(e => e.id === l.id)) {
        _dbTelemetryFeed.push({ ...l, _ts: new Date(l.createdAt || Date.now()) });
      }
    });
    _dbTelemetryFeed.sort((a, b) => new Date(b._ts) - new Date(a._ts));
    if (_dbTelemetryFeed.length > DASHBOARD_MAX_FEED) _dbTelemetryFeed.length = DASHBOARD_MAX_FEED;
  } catch { _telemetryPreloadDone = false; }

  try {
    const telList = document.getElementById('db-telemetry-list');
    if (telList) {
      telList.innerHTML = _dbTelemetryFeed.length === 0
        ? '<li class="feed-empty">Nessun log ancora</li>'
        : _dbTelemetryFeed.map(e => _buildTelemetryFeedHtml(e)).join('');
    }
  } catch {}
}

function resetTelemetryPreload() {
  _telemetryPreloadDone = false;
}

async function _loadProcessStats(processId) {
  try {
    const res = await fetch(`/api/infra/process-stats/${processId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!_dbProcessStats[processId]) {
      _dbProcessStats[processId] = { last: null, recentDurations: [], rollingAvg: null };
    }
    const last = data.lastCycle;
    _dbProcessStats[processId].last = last;
    if (data.last100Avg?.avgDurationMs != null) {
      _dbProcessStats[processId].rollingAvg = Math.round(data.last100Avg.avgDurationMs);
    }
    _renderProcessBox(processId);
  } catch {}
}

// ── process.update handler ───────────────────────────────────────────────────

function onDashboardProcessUpdate(data) {
  // data: { processName, startedAt, endedAt, durationMs, itemsProcessed, status }
  const id = data.processName;
  if (!_dbProcessStats[id]) {
    _dbProcessStats[id] = { last: null, recentDurations: [], rollingAvg: null };
  }
  const st = _dbProcessStats[id];
  st.last = { ...data, itemCount: data.itemsProcessed };

  st.recentDurations.push(data.durationMs);
  if (st.recentDurations.length > 100) st.recentDurations.shift();
  const sum = st.recentDurations.reduce((a, b) => a + b, 0);
  st.rollingAvg = Math.round(sum / st.recentDurations.length);

  _renderProcessBox(id);
}

function _renderProcessBox(processId) {
  const st = _dbProcessStats[processId];
  if (!st?.last) return;

  const { last, rollingAvg } = st;
  const ok = last.status === 'success';

  _setText(`pb-${processId}-status`,    ok ? 'OK' : 'ERR');
  _setClass(`pb-${processId}-status`,   'process-box-badge ' + (ok ? 'badge-ok' : 'badge-err'));
  _setText(`pb-${processId}-duration`,  last.durationMs + ' ms');
  _setText(`pb-${processId}-started`,   last.startedAt ? new Date(last.startedAt).toLocaleTimeString('it-IT') : '—');
  _setText(`pb-${processId}-ago`,       last.startedAt ? _fmtAgo(new Date(last.startedAt)) : '—');
  _setText(`pb-${processId}-items`,     last.itemCount ?? last.itemsProcessed ?? '—');
  _setText(`pb-${processId}-avg`,       rollingAvg != null ? rollingAvg + ' ms' : '—');

  const box = document.getElementById('pbox-' + processId);
  if (box) {
    box.classList.toggle('process-box-ok',  ok);
    box.classList.toggle('process-box-err', !ok);
  }
}

// ── node.update feed ─────────────────────────────────────────────────────────

function onDashboardNodeUpdate(data) {
  // data: { nodeId, desiredValue, actualValue, desiredValueUpdatedAt, actualValueUpdatedAt }
  _dbNodeFeed.unshift({ ...data, _ts: new Date() });
  if (_dbNodeFeed.length > DASHBOARD_MAX_FEED) _dbNodeFeed.length = DASHBOARD_MAX_FEED;

  const dashActive = document.getElementById('dashboard')?.classList.contains('active');
  if (!dashActive) {
    _dbNodeUnseen++;
    _updateFeedBadge('db-node-badge', _dbNodeUnseen);
  } else {
    _renderNodeFeedItem(_dbNodeFeed[0], true);
  }
}

// ── telemetry.update feed ────────────────────────────────────────────────────

function onDashboardTelemetryUpdate(data) {
  // data: { id, componentId, value, direction, createdAt }
  if (_dbTelemetryFeed.some(e => e.id === data.id)) return;
  _dbTelemetryFeed.unshift({ ...data, _ts: new Date(data.createdAt || Date.now()) });
  if (_dbTelemetryFeed.length > DASHBOARD_MAX_FEED) _dbTelemetryFeed.length = DASHBOARD_MAX_FEED;

  const dashActive = document.getElementById('dashboard')?.classList.contains('active');
  if (!dashActive) {
    _dbTelemetryUnseen++;
    _updateFeedBadge('db-telemetry-badge', _dbTelemetryUnseen);
  } else {
    _renderTelemetryFeedItem(_dbTelemetryFeed[0], true);
  }
}

// ── Full render (called on section open) ────────────────────────────────────

function renderDashboardFeeds() {
  _dbNodeUnseen = 0;
  _dbTelemetryUnseen = 0;
  _updateFeedBadge('db-node-badge', 0);
  _updateFeedBadge('db-telemetry-badge', 0);

  const nodeList = document.getElementById('db-node-list');
  const telList  = document.getElementById('db-telemetry-list');
  if (nodeList) {
    nodeList.innerHTML = _dbNodeFeed.length === 0
      ? '<li class="feed-empty">Nessun aggiornamento ancora</li>'
      : _dbNodeFeed.map(e => _buildNodeFeedHtml(e)).join('');
  }
  if (telList) {
    telList.innerHTML = _dbTelemetryFeed.length === 0
      ? '<li class="feed-empty">Nessun log ancora</li>'
      : _dbTelemetryFeed.map(e => _buildTelemetryFeedHtml(e)).join('');
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _renderNodeFeedItem(item, prepend = false) {
  const list = document.getElementById('db-node-list');
  if (!list) return;
  const emptyEl = list.querySelector('.feed-empty');
  if (emptyEl) emptyEl.remove();
  const li = document.createElement('li');
  li.className = 'feed-item feed-node';
  li.innerHTML = _buildNodeFeedHtml(item);
  if (prepend) {
    list.insertAdjacentHTML('afterbegin', _buildNodeFeedHtml(item));
    if (list.children.length > DASHBOARD_MAX_FEED) list.lastElementChild.remove();
  }
}

function _renderTelemetryFeedItem(item, prepend = false) {
  const list = document.getElementById('db-telemetry-list');
  if (!list) return;
  const emptyEl = list.querySelector('.feed-empty');
  if (emptyEl) emptyEl.remove();
  if (prepend) {
    list.insertAdjacentHTML('afterbegin', _buildTelemetryFeedHtml(item));
    if (list.children.length > DASHBOARD_MAX_FEED) list.lastElementChild.remove();
  }
}

function _buildNodeFeedHtml(e) {
  const ts = e._ts ? new Date(e._ts).toLocaleTimeString('it-IT') : '';
  const node = auenNodes.find(n => n.id === e.nodeId);
  const label = node?.code ?? `#${e.nodeId}`;
  const vt = node?.type?.valueType ?? 'boolean';
  const fmtVal = (val) => vt === 'boolean'
    ? (val === '1' ? '<span style="color:#16a34a">&#9679;</span>' : '<span style="color:#1e293b">&#9679;</span>')
    : esc(String(val ?? '—'));
  return `<li class="feed-item feed-node">
    <span class="feed-ts">${esc(ts)}</span>
    <span class="feed-label">${esc(label)}</span>
    <span class="feed-val">D:${fmtVal(e.desiredValue)}</span>
    <span class="feed-val">A:${fmtVal(e.actualValue)}</span>
  </li>`;
}

function _buildTelemetryFeedHtml(e) {
  const ts = e._ts ? new Date(e._ts).toLocaleTimeString('it-IT') : '';
  const comp = componentsList.find(c => c.id === e.componentId);
  const dev = comp ? devicesList.find(d => d.id === comp.deviceId) : null;
  const deviceName = dev?.deviceName ?? (comp?.deviceId != null ? `#${comp.deviceId}` : '?');
  const compName = comp?.componentName ?? `#${e.componentId}`;
  const dirClass = e.direction === 'WRITE' ? 'feed-dir-write' : 'feed-dir-read';
  return `<li class="feed-item feed-telemetry">
    <span class="feed-ts">${esc(ts)}</span>
    <span class="feed-label">${esc(deviceName)} / ${esc(compName)}</span>
    <span class="feed-val">${esc(e.value)}</span>
    <span class="feed-dir ${dirClass}">${esc(e.direction)}</span>
  </li>`;
}

function _updateFeedBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = count > 0 ? (count > 99 ? '99+' : String(count)) : '';
  el.style.display = count > 0 ? 'flex' : 'none';
}

function _fmtAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s fa`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m fa`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m fa`;
}

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function _setClass(id, cls) {
  const el = document.getElementById(id);
  if (el) el.className = cls;
}
