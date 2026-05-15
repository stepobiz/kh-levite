// ============================================================
// AutoEngine loader
// ============================================================
async function ensureAuenLoaded() {
  if (auenLoaded) return;
  auenLoaded = true;
  await Promise.all([fetchNodeTypes(), fetchAttributeTypes(), fetchTags(), fetchAuenNodes()]);
}

// --- Section navigation ---
function activateSection(sectionId) {
  const valid = ['dashboard', 'devices', 'auen-node-types', 'auen-nodes', 'auen-tags', 'auen-attribute-types', 'topology', 'cfg', 'user-topology', 'user-devices'];
  const id = valid.includes(sectionId) ? sectionId : 'dashboard';
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });
  document.querySelectorAll('.section').forEach(s => {
    s.classList.toggle('active', s.id === id);
  });
  if (['auen-node-types', 'auen-nodes', 'auen-tags', 'auen-attribute-types'].includes(id)) {
    ensureAuenLoaded();
  }
  if (id === 'topology') {
    ensureAuenLoaded().then(() => {
      initTopologyRootSelect();
      renderTopology();
    });
  }
  if (id === 'user-topology') {
    ensureAuenLoaded().then(() => {
      initUserTopologyRootSelect();
      renderUserTopology();
    });
  }
  if (id === 'user-devices') {
    renderUserDevices();
    userDeviceSearch = document.getElementById('user-device-search')?.value.toLowerCase() ?? '';
  }
  if (id === 'cfg') {
    ensureCfgLoaded();
  }
  if (id === 'dashboard') {
    renderDashboardFeeds();
    initDashboard();
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateSection(btn.dataset.section);
      location.hash = btn.dataset.section;
    });
  });

  const initialSection = location.hash.slice(1) || 'dashboard';
  activateSection(initialSection);

  document.getElementById('device-form').addEventListener('submit', handleDeviceSubmit);
  document.getElementById('component-form').addEventListener('submit', handleComponentSubmit);
  document.getElementById('command-form').addEventListener('submit', handleCommandSubmit);
  document.getElementById('node-type-form').addEventListener('submit', handleNodeTypeSubmit);
  document.getElementById('attribute-type-form').addEventListener('submit', handleAttributeTypeSubmit);
  document.getElementById('node-form').addEventListener('submit', handleNodeSubmit);
  document.getElementById('tag-form').addEventListener('submit', handleTagSubmit);
  document.getElementById('set-value-form').addEventListener('submit', handleSetValueSubmit);
  document.getElementById('cfg-section-form').addEventListener('submit', handleCfgSectionSubmit);
  document.getElementById('cfg-config-form').addEventListener('submit', handleCfgConfigSubmit);
  document.getElementById('cfg-edit-value-form').addEventListener('submit', handleCfgEditValueSubmit);

  document.getElementById('device-search').addEventListener('input', e => {
    deviceSearch = e.target.value.toLowerCase();
    renderDevices();
  });

  document.getElementById('user-device-search').addEventListener('input', e => {
    userDeviceSearch = e.target.value.toLowerCase();
    renderUserDevices();
  });

  fetchDevices();
  fetchLogs();
  initRealtime();
});
