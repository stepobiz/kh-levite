async function fetchCycleStats() {
  try {
    const res = await fetch('/api/infra/process-stats/logic_engine');
    if (!res.ok) return;
    const data = await res.json();
    _renderCycleStats(data);
  } catch {}
}

async function fetchSyncStats() {
  try {
    const res = await fetch('/api/infra/process-stats/sync_engine');
    if (!res.ok) return;
    const data = await res.json();
    _renderSyncStats(data);
  } catch {}
}

function _renderCycleStats(data) {
  const { lastCycle, last100Avg, slowestLast24h } = data;

  const durationEl = document.getElementById('cs-last-duration');
  const statusEl   = document.getElementById('cs-last-status');
  if (durationEl && lastCycle) {
    durationEl.textContent = lastCycle.durationMs + ' ms';
    if (statusEl) {
      statusEl.textContent = lastCycle.status === 'success' ? 'OK' : 'ERR';
      statusEl.className = 'cycle-stat-badge ' + (lastCycle.status === 'success' ? 'badge-ok' : 'badge-err');
    }
  }

  const avgEl  = document.getElementById('cs-avg-duration');
  const rateEl = document.getElementById('cs-success-rate');
  if (avgEl && last100Avg) {
    avgEl.textContent = last100Avg.avgDurationMs + ' ms';
    if (rateEl) {
      const pct = Math.round(last100Avg.successRate * 100);
      rateEl.textContent = pct + '%';
      rateEl.className = 'cycle-stat-badge ' + (pct >= 95 ? 'badge-ok' : pct >= 80 ? 'badge-warn' : 'badge-err');
    }
  }

  const slowEl = document.getElementById('cs-slowest');
  if (slowEl) {
    slowEl.textContent = slowestLast24h ? (slowestLast24h.durationMs + ' ms') : '—';
  }
}

function _renderSyncStats(data) {
  const { lastCycle, last100Avg, slowestLast24h } = data;

  const durationEl = document.getElementById('sync-last-duration');
  const statusEl   = document.getElementById('sync-last-status');
  if (durationEl && lastCycle) {
    durationEl.textContent = lastCycle.durationMs + ' ms';
    if (statusEl) {
      statusEl.textContent = lastCycle.status === 'success' ? 'OK' : 'ERR';
      statusEl.className = 'cycle-stat-badge ' + (lastCycle.status === 'success' ? 'badge-ok' : 'badge-err');
    }
  }

  const avgEl  = document.getElementById('sync-avg-duration');
  const rateEl = document.getElementById('sync-success-rate');
  if (avgEl && last100Avg) {
    avgEl.textContent = last100Avg.avgDurationMs + ' ms';
    if (rateEl) {
      const pct = Math.round(last100Avg.successRate * 100);
      rateEl.textContent = pct + '%';
      rateEl.className = 'cycle-stat-badge ' + (pct >= 95 ? 'badge-ok' : pct >= 80 ? 'badge-warn' : 'badge-err');
    }
  }

  const slowEl = document.getElementById('sync-slowest');
  if (slowEl) {
    slowEl.textContent = slowestLast24h ? (slowestLast24h.durationMs + ' ms') : '—';
  }
}
