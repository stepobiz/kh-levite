const API_BASE = "http://172.17.127.201:3000";

// ---- Messaggi globali ----
const messageEl = document.getElementById("message");

function setMessage(text, type = "") {
  messageEl.textContent = text || "";
  messageEl.className = "";
  if (type === "success") messageEl.classList.add("message-success");
  else if (type === "error") messageEl.classList.add("message-error");
}

// ---- Sezioni & NAV ----
const navButtons = document.querySelectorAll(".nav-btn");
const sections = {
  "devices": document.getElementById("section-devices"),
  "rooms": document.getElementById("section-rooms"),
  "zones": document.getElementById("section-zones"),
  "settings": document.getElementById("section-settings"),
  "setpoint-profiles": document.getElementById("section-setpoint-profiles"),
  "overrides": document.getElementById("section-overrides"),
  "event-windows": document.getElementById("section-event-windows"),
  "sensor-readings": document.getElementById("section-sensor-readings"),
  "command-logs": document.getElementById("section-command-logs"),
  "locks": document.getElementById("section-locks"),
  "audit-logs": document.getElementById("section-audit-logs"),
};

const loadedFlags = {
  devices: false,
  rooms: false,
  zones: false,
  settings: false,
  "setpoint-profiles": false,
  overrides: false,
  "event-windows": false,
  "sensor-readings": false,
  "command-logs": false,
  locks: false,
  "audit-logs": false,
};

function setActiveSection(key) {
  Object.values(sections).forEach(sec => sec.classList.remove("active"));
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === key);
  });
  const section = sections[key];
  if (section) section.classList.add("active");
  setMessage("");
  loadSectionData(key);
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => setActiveSection(btn.dataset.section));
});

// ---- helper fetch JSON ----
async function fetchJson(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      if (data && data.message) {
        detail = Array.isArray(data.message) ? data.message.join(", ") : String(data.message);
      } else if (data && data.error) {
        detail = String(data.error);
      }
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || "HTTP " + res.status);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---- CACHE ----
let devicesCache = [];
let roomsCache = [];
let zonesCache = [];
let settingsCache = [];
let setpointProfilesCache = [];
let overridesCache = [];
let eventWindowsCache = [];
let sensorReadingsCache = [];
let commandLogsCache = [];
let locksCache = [];
let auditLogsCache = [];

// ======================================================
// DISPOSITIVI
// ======================================================
const devicesTbody = document.getElementById("devicesTbody");
const btnReloadDevices = document.getElementById("btnReloadDevices");
const btnAddDevice = document.getElementById("btnAddDevice");

const deviceModalBackdrop = document.getElementById("deviceModalBackdrop");
const deviceModalTitle = document.getElementById("deviceModalTitle");
const deviceModalErrorEl = document.getElementById("deviceModalError");
const deviceModalClose = document.getElementById("deviceModalClose");
const deviceModalCancel = document.getElementById("deviceModalCancel");
const deviceForm = document.getElementById("deviceForm");

const deviceIdInput = document.getElementById("deviceId");
const deviceNameInput = document.getElementById("deviceName");
const deviceTypeInput = document.getElementById("deviceType");
const deviceIpInput = document.getElementById("deviceIp");
const deviceChannelInput = document.getElementById("deviceChannel");
const deviceRoleInput = document.getElementById("deviceRole");
const deviceEnabledInput = document.getElementById("deviceEnabled");
const deviceConfigInput = document.getElementById("deviceConfig");

function setDeviceModalError(text) {
  deviceModalErrorEl.textContent = text || "";
}

function openDeviceModal(mode, device) {
  setDeviceModalError("");
  if (mode === "create") {
    deviceModalTitle.textContent = "Nuovo dispositivo";
    deviceIdInput.value = "";
    deviceNameInput.value = "";
    deviceTypeInput.value = "";
    deviceIpInput.value = "";
    deviceChannelInput.value = "";
    deviceRoleInput.value = "";
    deviceEnabledInput.value = "true";
    deviceConfigInput.value = "";
  } else if (mode === "edit" && device) {
    deviceModalTitle.textContent = "Modifica dispositivo #" + device.id;
    deviceIdInput.value = device.id ?? "";
    deviceNameInput.value = device.name ?? "";
    deviceTypeInput.value = device.type ?? "";
    deviceIpInput.value = device.ip ?? "";
    deviceChannelInput.value = device.channel ?? "";
    deviceRoleInput.value = device.role ?? "";
    deviceEnabledInput.value = device.enabled ? "true" : "false";
    deviceConfigInput.value = device.config ?? "";
  }
  deviceModalBackdrop.classList.add("show");
}

function closeDeviceModal() {
  deviceModalBackdrop.classList.remove("show");
  setDeviceModalError("");
}

async function loadDevices() {
  try {
    setMessage("Caricamento dispositivi...");
    const data = await fetchJson("/admin/devices");
    devicesCache = Array.isArray(data) ? data : [];
    renderDevices();
    loadedFlags.devices = true;
    setMessage("Dispositivi caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento dispositivi: " + e.message, "error");
  }
}

function renderDevices() {
  devicesTbody.innerHTML = "";
  if (!devicesCache.length) {
    devicesTbody.innerHTML = '<tr><td colspan="8">Nessun dispositivo.</td></tr>';
    return;
  }
  devicesCache.forEach(d => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(d.id);
    cell(d.name);
    cell(d.type);
    cell(d.ip);
    cell(d.channel);
    cell(d.role);
    cell(d.enabled ? "Sì" : "No");

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = d.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = d.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);

    devicesTbody.appendChild(tr);
  });
}

devicesTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const device = devicesCache.find(d => String(d.id) === String(id));
  if (!device) return;

  if (action === "edit") {
    openDeviceModal("edit", device);
  } else if (action === "delete") {
    if (!confirm("Eliminare il dispositivo #" + device.id + "?")) return;
    try {
      setMessage("Cancellazione dispositivo...");
      await fetchJson("/admin/devices/" + device.id, { method: "DELETE" });
      setMessage("Dispositivo cancellato.", "success");
      loadDevices();
    } catch (err) {
      setMessage("Errore cancellazione dispositivo: " + err.message, "error");
    }
  }
});

btnReloadDevices.addEventListener("click", loadDevices);
btnAddDevice.addEventListener("click", () => openDeviceModal("create"));
deviceModalClose.addEventListener("click", closeDeviceModal);
deviceModalCancel.addEventListener("click", closeDeviceModal);
deviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = deviceIdInput.value;
  const payload = {
    name: deviceNameInput.value.trim(),
    type: deviceTypeInput.value.trim(),
    ip: deviceIpInput.value.trim() || undefined,
    channel: deviceChannelInput.value ? Number(deviceChannelInput.value) : undefined,
    role: deviceRoleInput.value.trim() || undefined,
    enabled: deviceEnabledInput.value === "true",
    config: deviceConfigInput.value.trim() || undefined,
  };
  if (!payload.name || !payload.type) {
    setDeviceModalError("Nome e Tipo sono obbligatori.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento dispositivo..." : "Creazione dispositivo...");
    if (id) {
      await fetchJson("/admin/devices/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/devices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Dispositivo salvato.", "success");
    closeDeviceModal();
    loadDevices();
  } catch (err) {
    setDeviceModalError(err.message);
    setMessage("Errore salvataggio dispositivo.", "error");
  }
});

// ======================================================
// STANZE
// ======================================================
const roomsTbody = document.getElementById("roomsTbody");
const btnReloadRooms = document.getElementById("btnReloadRooms");
const btnAddRoom = document.getElementById("btnAddRoom");

const roomModalBackdrop = document.getElementById("roomModalBackdrop");
const roomModalTitle = document.getElementById("roomModalTitle");
const roomModalErrorEl = document.getElementById("roomModalError");
const roomModalClose = document.getElementById("roomModalClose");
const roomModalCancel = document.getElementById("roomModalCancel");
const roomForm = document.getElementById("roomForm");

const roomIdInput = document.getElementById("roomId");
const roomCodeInput = document.getElementById("roomCode");
const roomNameInput = document.getElementById("roomName");
const roomKindInput = document.getElementById("roomKind");
const roomFloorInput = document.getElementById("roomFloor");
const roomCalendarIdInput = document.getElementById("roomCalendarId");
const roomDistributionZoneCodeInput = document.getElementById("roomDistributionZoneCode");
const roomSetpointProfileCodeInput = document.getElementById("roomSetpointProfileCode");
const roomTempSensorDeviceIdInput = document.getElementById("roomTempSensorDeviceId");
const roomEnabledInput = document.getElementById("roomEnabled");

function setRoomModalError(text) {
  roomModalErrorEl.textContent = text || "";
}

function openRoomModal(mode, room) {
  setRoomModalError("");
  if (mode === "create") {
    roomModalTitle.textContent = "Nuova stanza";
    roomIdInput.value = "";
    roomCodeInput.value = "";
    roomNameInput.value = "";
    roomKindInput.value = "";
    roomFloorInput.value = "";
    roomCalendarIdInput.value = "";
    roomDistributionZoneCodeInput.value = "";
    roomSetpointProfileCodeInput.value = "";
    roomTempSensorDeviceIdInput.value = "";
    roomEnabledInput.value = "true";
  } else if (mode === "edit" && room) {
    roomModalTitle.textContent = "Modifica stanza #" + room.id;
    roomIdInput.value = room.id ?? "";
    roomCodeInput.value = room.code ?? "";
    roomNameInput.value = room.name ?? "";
    roomKindInput.value = room.kind ?? "";
    roomFloorInput.value = room.floor ?? "";
    roomCalendarIdInput.value = room.calendarId ?? "";
    roomDistributionZoneCodeInput.value = room.distributionZoneCode ?? "";
    roomSetpointProfileCodeInput.value = room.setpointProfileCode ?? "";
    roomTempSensorDeviceIdInput.value = room.tempSensorDeviceId ?? "";
    roomEnabledInput.value = room.enabled ? "true" : "false";
  }
  roomModalBackdrop.classList.add("show");
}

function closeRoomModal() {
  roomModalBackdrop.classList.remove("show");
  setRoomModalError("");
}

async function loadRooms() {
  try {
    setMessage("Caricamento stanze...");
    const data = await fetchJson("/admin/rooms");
    roomsCache = Array.isArray(data) ? data : [];
    renderRooms();
    loadedFlags.rooms = true;
    setMessage("Stanze caricate.", "success");
  } catch (e) {
    setMessage("Errore caricamento stanze: " + e.message, "error");
  }
}

function renderRooms() {
  roomsTbody.innerHTML = "";
  if (!roomsCache.length) {
    roomsTbody.innerHTML = '<tr><td colspan="8">Nessuna stanza.</td></tr>';
    return;
  }
  roomsCache.forEach(r => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(r.id);
    cell(r.code);
    cell(r.name);
    cell(r.kind);
    cell(r.floor);
    cell(r.calendarId);
    cell(r.enabled ? "Sì" : "No");

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = r.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = r.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);

    roomsTbody.appendChild(tr);
  });
}

roomsTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const room = roomsCache.find(r => String(r.id) === String(id));
  if (!room) return;

  if (action === "edit") {
    openRoomModal("edit", room);
  } else if (action === "delete") {
    if (!confirm("Eliminare la stanza #" + room.id + " (" + (room.name || room.code) + ")?")) return;
    try {
      setMessage("Cancellazione stanza...");
      await fetchJson("/admin/rooms/" + room.id, { method: "DELETE" });
      setMessage("Stanza cancellata.", "success");
      loadRooms();
    } catch (err) {
      setMessage("Errore cancellazione stanza: " + err.message, "error");
    }
  }
});

btnReloadRooms.addEventListener("click", loadRooms);
btnAddRoom.addEventListener("click", () => openRoomModal("create"));
roomModalClose.addEventListener("click", closeRoomModal);
roomModalCancel.addEventListener("click", closeRoomModal);
roomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = roomIdInput.value;
  const payload = {
    code: roomCodeInput.value.trim(),
    name: roomNameInput.value.trim() || undefined,
    kind: roomKindInput.value.trim() || undefined,
    floor: roomFloorInput.value.trim() || undefined,
    calendarId: roomCalendarIdInput.value.trim() || undefined,
    distributionZoneCode: roomDistributionZoneCodeInput.value.trim() || undefined,
    setpointProfileCode: roomSetpointProfileCodeInput.value.trim() || undefined,
    tempSensorDeviceId: roomTempSensorDeviceIdInput.value
      ? Number(roomTempSensorDeviceIdInput.value)
      : undefined,
    enabled: roomEnabledInput.value === "true",
  };
  if (!payload.code) {
    setRoomModalError("Il codice è obbligatorio.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento stanza..." : "Creazione stanza...");
    if (id) {
      await fetchJson("/admin/rooms/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/rooms", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Stanza salvata.", "success");
    closeRoomModal();
    loadRooms();
  } catch (err) {
    setRoomModalError(err.message);
    setMessage("Errore salvataggio stanza.", "error");
  }
});

// ======================================================
// ZONE
// ======================================================
const zonesTbody = document.getElementById("zonesTbody");
const btnReloadZones = document.getElementById("btnReloadZones");
const btnAddZone = document.getElementById("btnAddZone");

const zoneModalBackdrop = document.getElementById("zoneModalBackdrop");
const zoneModalTitle = document.getElementById("zoneModalTitle");
const zoneModalErrorEl = document.getElementById("zoneModalError");
const zoneModalClose = document.getElementById("zoneModalClose");
const zoneModalCancel = document.getElementById("zoneModalCancel");
const zoneForm = document.getElementById("zoneForm");

const zoneIdInput = document.getElementById("zoneId");
const zoneCodeInput = document.getElementById("zoneCode");
const zoneNameInput = document.getElementById("zoneName");
const zoneDescriptionInput = document.getElementById("zoneDescription");
const zoneEnabledInput = document.getElementById("zoneEnabled");

function setZoneModalError(text) {
  zoneModalErrorEl.textContent = text || "";
}

function openZoneModal(mode, zone) {
  setZoneModalError("");
  if (mode === "create") {
    zoneModalTitle.textContent = "Nuova zona";
    zoneIdInput.value = "";
    zoneCodeInput.value = "";
    zoneNameInput.value = "";
    zoneDescriptionInput.value = "";
    zoneEnabledInput.value = "true";
  } else if (mode === "edit" && zone) {
    zoneModalTitle.textContent = "Modifica zona " + zone.code;
    zoneIdInput.value = zone.id ?? "";
    zoneCodeInput.value = zone.code ?? "";
    zoneNameInput.value = zone.name ?? "";
    zoneDescriptionInput.value = zone.description ?? "";
    zoneEnabledInput.value = zone.enabled ? "true" : "false";
  }
  zoneModalBackdrop.classList.add("show");
}

function closeZoneModal() {
  zoneModalBackdrop.classList.remove("show");
  setZoneModalError("");
}

async function loadZones() {
  try {
    setMessage("Caricamento zone...");
    const data = await fetchJson("/admin/zones");
    zonesCache = Array.isArray(data) ? data : [];
    renderZones();
    loadedFlags.zones = true;
    setMessage("Zone caricate.", "success");
  } catch (e) {
    setMessage("Errore caricamento zone: " + e.message, "error");
  }
}

function renderZones() {
  zonesTbody.innerHTML = "";
  if (!zonesCache.length) {
    zonesTbody.innerHTML = '<tr><td colspan="6">Nessuna zona.</td></tr>';
    return;
  }
  zonesCache.forEach(z => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(z.id);
    cell(z.code);
    cell(z.name);
    cell(z.description);
    cell(z.enabled ? "Sì" : "No");

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = z.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = z.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);

    zonesTbody.appendChild(tr);
  });
}

zonesTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const zone = zonesCache.find(z => String(z.id) === String(id));
  if (!zone) return;

  if (action === "edit") {
    openZoneModal("edit", zone);
  } else if (action === "delete") {
    if (!confirm("Eliminare la zona " + zone.code + "?")) return;
    try {
      setMessage("Cancellazione zona...");
      await fetchJson("/admin/zones/" + zone.id, { method: "DELETE" });
      setMessage("Zona cancellata.", "success");
      loadZones();
    } catch (err) {
      setMessage("Errore cancellazione zona: " + err.message, "error");
    }
  }
});

btnReloadZones.addEventListener("click", loadZones);
btnAddZone.addEventListener("click", () => openZoneModal("create"));
zoneModalClose.addEventListener("click", closeZoneModal);
zoneModalCancel.addEventListener("click", closeZoneModal);
zoneForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = zoneIdInput.value;
  const payload = {
    code: zoneCodeInput.value.trim(),
    name: zoneNameInput.value.trim() || undefined,
    description: zoneDescriptionInput.value.trim() || undefined,
    enabled: zoneEnabledInput.value === "true",
  };
  if (!payload.code) {
    setZoneModalError("Il codice è obbligatorio.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento zona..." : "Creazione zona...");
    if (id) {
      await fetchJson("/admin/zones/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/zones", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Zona salvata.", "success");
    closeZoneModal();
    loadZones();
  } catch (err) {
    setZoneModalError(err.message);
    setMessage("Errore salvataggio zona.", "error");
  }
});

// ======================================================
// SETTINGS
// ======================================================
const settingsTbody = document.getElementById("settingsTbody");
const btnReloadSettings = document.getElementById("btnReloadSettings");
const btnAddSetting = document.getElementById("btnAddSetting");

const settingModalBackdrop = document.getElementById("settingModalBackdrop");
const settingModalTitle = document.getElementById("settingModalTitle");
const settingModalErrorEl = document.getElementById("settingModalError");
const settingModalClose = document.getElementById("settingModalClose");
const settingModalCancel = document.getElementById("settingModalCancel");
const settingForm = document.getElementById("settingForm");
const settingKeyInput = document.getElementById("settingKey");
const settingValueInput = document.getElementById("settingValue");

function setSettingModalError(text) {
  settingModalErrorEl.textContent = text || "";
}

function openSettingModal(mode, setting) {
  setSettingModalError("");
  if (mode === "create") {
    settingModalTitle.textContent = "Nuova impostazione";
    settingKeyInput.value = "";
    settingValueInput.value = "";
    settingKeyInput.disabled = false;
  } else if (mode === "edit" && setting) {
    settingModalTitle.textContent = "Modifica impostazione " + setting.key;
    settingKeyInput.value = setting.key;
    settingValueInput.value = setting.value ?? "";
    settingKeyInput.disabled = true;
  }
  settingModalBackdrop.classList.add("show");
}

function closeSettingModal() {
  settingModalBackdrop.classList.remove("show");
  setSettingModalError("");
}

async function loadSettings() {
  try {
    setMessage("Caricamento impostazioni...");
    const data = await fetchJson("/admin/settings");
    settingsCache = Array.isArray(data) ? data : [];
    renderSettings();
    loadedFlags.settings = true;
    setMessage("Impostazioni caricate.", "success");
  } catch (e) {
    setMessage("Errore caricamento impostazioni: " + e.message, "error");
  }
}

function renderSettings() {
  settingsTbody.innerHTML = "";
  if (!settingsCache.length) {
    settingsTbody.innerHTML = '<tr><td colspan="3">Nessuna impostazione.</td></tr>';
    return;
  }
  settingsCache.forEach(s => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(s.key);
    cell(s.value);
    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.key = s.key;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.key = s.key;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);
    settingsTbody.appendChild(tr);
  });
}

settingsTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const key = btn.dataset.key;
  const setting = settingsCache.find(s => s.key === key);
  if (!setting) return;

  if (action === "edit") {
    openSettingModal("edit", setting);
  } else if (action === "delete") {
    if (!confirm("Eliminare l'impostazione " + key + "?")) return;
    try {
      setMessage("Cancellazione impostazione...");
      await fetchJson("/admin/settings/" + encodeURIComponent(key), { method: "DELETE" });
      setMessage("Impostazione cancellata.", "success");
      loadSettings();
    } catch (err) {
      setMessage("Errore cancellazione impostazione: " + err.message, "error");
    }
  }
});

btnReloadSettings.addEventListener("click", loadSettings);
btnAddSetting.addEventListener("click", () => openSettingModal("create"));
settingModalClose.addEventListener("click", closeSettingModal);
settingModalCancel.addEventListener("click", closeSettingModal);

settingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = settingKeyInput.value.trim();
  const value = settingValueInput.value.trim();
  if (!key) {
    setSettingModalError("La chiave è obbligatoria.");
    return;
  }
  if (!value) {
    setSettingModalError("Il valore è obbligatorio.");
    return;
  }
  try {
    setMessage("Salvataggio impostazione...");
    await fetchJson("/admin/settings/" + encodeURIComponent(key), {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    setMessage("Impostazione salvata.", "success");
    closeSettingModal();
    loadSettings();
  } catch (err) {
    setSettingModalError(err.message);
    setMessage("Errore salvataggio impostazione.", "error");
  }
});

// ======================================================
// SETPOINT PROFILES
// ======================================================
const setpointProfilesTbody = document.getElementById("setpointProfilesTbody");
const btnReloadSetpointProfiles = document.getElementById("btnReloadSetpointProfiles");
const btnAddSetpointProfile = document.getElementById("btnAddSetpointProfile");

const setpointProfileModalBackdrop = document.getElementById("setpointProfileModalBackdrop");
const setpointProfileModalTitle = document.getElementById("setpointProfileModalTitle");
const setpointProfileModalErrorEl = document.getElementById("setpointProfileModalError");
const setpointProfileModalClose = document.getElementById("setpointProfileModalClose");
const setpointProfileModalCancel = document.getElementById("setpointProfileModalCancel");
const setpointProfileForm = document.getElementById("setpointProfileForm");

const setpointProfileIdInput = document.getElementById("setpointProfileId");
const setpointProfileCodeInput = document.getElementById("setpointProfileCode");
const setpointProfileNameInput = document.getElementById("setpointProfileName");
const setpointProfileDescriptionInput = document.getElementById("setpointProfileDescription");
const setpointProfileEventTempInput = document.getElementById("setpointProfileEventTemp");
const setpointProfileEcoTempInput = document.getElementById("setpointProfileEcoTemp");

function setSetpointProfileModalError(text) {
  setpointProfileModalErrorEl.textContent = text || "";
}

function openSetpointProfileModal(mode, profile) {
  setSetpointProfileModalError("");
  if (mode === "create") {
    setpointProfileModalTitle.textContent = "Nuovo profilo setpoint";
    setpointProfileIdInput.value = "";
    setpointProfileCodeInput.value = "";
    setpointProfileNameInput.value = "";
    setpointProfileDescriptionInput.value = "";
    setpointProfileEventTempInput.value = "";
    setpointProfileEcoTempInput.value = "";
  } else if (mode === "edit" && profile) {
    setpointProfileModalTitle.textContent = "Modifica profilo #" + profile.id;
    setpointProfileIdInput.value = profile.id ?? "";
    setpointProfileCodeInput.value = profile.code ?? "";
    setpointProfileNameInput.value = profile.name ?? "";
    setpointProfileDescriptionInput.value = profile.description ?? "";
    setpointProfileEventTempInput.value = profile.eventTemp ?? "";
    setpointProfileEcoTempInput.value = profile.ecoTemp ?? "";
  }
  setpointProfileModalBackdrop.classList.add("show");
}

function closeSetpointProfileModal() {
  setpointProfileModalBackdrop.classList.remove("show");
  setSetpointProfileModalError("");
}

async function loadSetpointProfiles() {
  try {
    setMessage("Caricamento profili setpoint...");
    const data = await fetchJson("/admin/setpoint-profiles");
    setpointProfilesCache = Array.isArray(data) ? data : [];
    renderSetpointProfiles();
    loadedFlags["setpoint-profiles"] = true;
    setMessage("Profili caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento profili: " + e.message, "error");
  }
}

function renderSetpointProfiles() {
  setpointProfilesTbody.innerHTML = "";
  if (!setpointProfilesCache.length) {
    setpointProfilesTbody.innerHTML = '<tr><td colspan="6">Nessun profilo.</td></tr>';
    return;
  }
  setpointProfilesCache.forEach(p => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(p.id);
    cell(p.code);
    cell(p.name);
    cell(p.eventTemp);
    cell(p.ecoTemp);
    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = p.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = p.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);
    setpointProfilesTbody.appendChild(tr);
  });
}

setpointProfilesTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const profile = setpointProfilesCache.find(p => String(p.id) === String(id));
  if (!profile) return;

  if (action === "edit") {
    openSetpointProfileModal("edit", profile);
  } else if (action === "delete") {
    if (!confirm("Eliminare il profilo " + (profile.code || profile.id) + "?")) return;
    try {
      setMessage("Cancellazione profilo...");
      await fetchJson("/admin/setpoint-profiles/" + profile.id, { method: "DELETE" });
      setMessage("Profilo cancellato.", "success");
      loadSetpointProfiles();
    } catch (err) {
      setMessage("Errore cancellazione profilo: " + err.message, "error");
    }
  }
});

btnReloadSetpointProfiles.addEventListener("click", loadSetpointProfiles);
btnAddSetpointProfile.addEventListener("click", () => openSetpointProfileModal("create"));
setpointProfileModalClose.addEventListener("click", closeSetpointProfileModal);
setpointProfileModalCancel.addEventListener("click", closeSetpointProfileModal);

setpointProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = setpointProfileIdInput.value;
  const payload = {
    code: setpointProfileCodeInput.value.trim(),
    name: setpointProfileNameInput.value.trim() || undefined,
    description: setpointProfileDescriptionInput.value.trim() || undefined,
    eventTemp: setpointProfileEventTempInput.value
      ? Number(setpointProfileEventTempInput.value)
      : undefined,
    ecoTemp: setpointProfileEcoTempInput.value
      ? Number(setpointProfileEcoTempInput.value)
      : undefined,
  };
  if (!payload.code) {
    setSetpointProfileModalError("Il codice è obbligatorio.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento profilo..." : "Creazione profilo...");
    if (id) {
      await fetchJson("/admin/setpoint-profiles/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/setpoint-profiles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Profilo salvato.", "success");
    closeSetpointProfileModal();
    loadSetpointProfiles();
  } catch (err) {
    setSetpointProfileModalError(err.message);
    setMessage("Errore salvataggio profilo.", "error");
  }
});

// ======================================================
// OVERRIDES
// ======================================================
const overridesTbody = document.getElementById("overridesTbody");
const btnReloadOverrides = document.getElementById("btnReloadOverrides");
const btnAddOverride = document.getElementById("btnAddOverride");

const overrideModalBackdrop = document.getElementById("overrideModalBackdrop");
const overrideModalTitle = document.getElementById("overrideModalTitle");
const overrideModalErrorEl = document.getElementById("overrideModalError");
const overrideModalClose = document.getElementById("overrideModalClose");
const overrideModalCancel = document.getElementById("overrideModalCancel");
const overrideForm = document.getElementById("overrideForm");

const overrideIdInput = document.getElementById("overrideId");
const overrideRoomIdInput = document.getElementById("overrideRoomId");
const overrideScopeInput = document.getElementById("overrideScope");
const overrideKindInput = document.getElementById("overrideKind");
const overrideTargetTempInput = document.getElementById("overrideTargetTemp");
const overrideStartsAtInput = document.getElementById("overrideStartsAt");
const overrideExpiresAtInput = document.getElementById("overrideExpiresAt");
const overrideCreatedByInput = document.getElementById("overrideCreatedBy");

function setOverrideModalError(text) {
  overrideModalErrorEl.textContent = text || "";
}

function openOverrideModal(mode, ovr) {
  setOverrideModalError("");
  if (mode === "create") {
    overrideModalTitle.textContent = "Nuovo override";
    overrideIdInput.value = "";
    overrideRoomIdInput.value = "";
    overrideScopeInput.value = "ROOM";
    overrideKindInput.value = "SETPOINT";
    overrideTargetTempInput.value = "";
    overrideStartsAtInput.value = "";
    overrideExpiresAtInput.value = "";
    overrideCreatedByInput.value = "";
  } else if (mode === "edit" && ovr) {
    overrideModalTitle.textContent = "Modifica override #" + ovr.id;
    overrideIdInput.value = ovr.id ?? "";
    overrideRoomIdInput.value = ovr.roomId ?? "";
    overrideScopeInput.value = ovr.scope ?? "";
    overrideKindInput.value = ovr.kind ?? "";
    overrideTargetTempInput.value = ovr.targetTemp ?? "";
    overrideStartsAtInput.value = ovr.startsAt ? ovr.startsAt.slice(0, 16) : "";
    overrideExpiresAtInput.value = ovr.expiresAt ? ovr.expiresAt.slice(0, 16) : "";
    overrideCreatedByInput.value = ovr.createdBy ?? "";
  }
  overrideModalBackdrop.classList.add("show");
}

function closeOverrideModal() {
  overrideModalBackdrop.classList.remove("show");
  setOverrideModalError("");
}

async function loadOverrides() {
  try {
    setMessage("Caricamento overrides...");
    const data = await fetchJson("/admin/overrides");
    overridesCache = Array.isArray(data) ? data : [];
    renderOverrides();
    loadedFlags.overrides = true;
    setMessage("Overrides caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento overrides: " + e.message, "error");
  }
}

function renderOverrides() {
  overridesTbody.innerHTML = "";
  if (!overridesCache.length) {
    overridesTbody.innerHTML = '<tr><td colspan="9">Nessun override.</td></tr>';
    return;
  }
  overridesCache.forEach(o => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(o.id);
    cell(o.roomId);
    cell(o.scope);
    cell(o.kind);
    cell(o.targetTemp);
    cell(o.startsAt);
    cell(o.expiresAt);
    cell(o.createdBy);
    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = o.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = o.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);
    overridesTbody.appendChild(tr);
  });
}

overridesTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const ovr = overridesCache.find(o => String(o.id) === String(id));
  if (!ovr) return;

  if (action === "edit") {
    openOverrideModal("edit", ovr);
  } else if (action === "delete") {
    if (!confirm("Eliminare l'override #" + ovr.id + "?")) return;
    try {
      setMessage("Cancellazione override...");
      await fetchJson("/admin/overrides/" + ovr.id, { method: "DELETE" });
      setMessage("Override cancellato.", "success");
      loadOverrides();
    } catch (err) {
      setMessage("Errore cancellazione override: " + err.message, "error");
    }
  }
});

btnReloadOverrides.addEventListener("click", loadOverrides);
btnAddOverride.addEventListener("click", () => openOverrideModal("create"));
overrideModalClose.addEventListener("click", closeOverrideModal);
overrideModalCancel.addEventListener("click", closeOverrideModal);

overrideForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = overrideIdInput.value;
  const payload = {
    roomId: overrideRoomIdInput.value ? Number(overrideRoomIdInput.value) : undefined,
    scope: overrideScopeInput.value.trim() || undefined,
    kind: overrideKindInput.value.trim() || undefined,
    targetTemp: overrideTargetTempInput.value
      ? Number(overrideTargetTempInput.value)
      : undefined,
    startsAt: overrideStartsAtInput.value || undefined,
    expiresAt: overrideExpiresAtInput.value || undefined,
    createdBy: overrideCreatedByInput.value.trim() || undefined,
  };
  if (!payload.roomId) {
    setOverrideModalError("Room ID è obbligatorio.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento override..." : "Creazione override...");
    if (id) {
      await fetchJson("/admin/overrides/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/overrides", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Override salvato.", "success");
    closeOverrideModal();
    loadOverrides();
  } catch (err) {
    setOverrideModalError(err.message);
    setMessage("Errore salvataggio override.", "error");
  }
});

// ======================================================
// EVENT WINDOWS
// ======================================================
const eventWindowsTbody = document.getElementById("eventWindowsTbody");
const btnReloadEventWindows = document.getElementById("btnReloadEventWindows");
const btnAddEventWindow = document.getElementById("btnAddEventWindow");

const eventWindowModalBackdrop = document.getElementById("eventWindowModalBackdrop");
const eventWindowModalTitle = document.getElementById("eventWindowModalTitle");
const eventWindowModalErrorEl = document.getElementById("eventWindowModalError");
const eventWindowModalClose = document.getElementById("eventWindowModalClose");
const eventWindowModalCancel = document.getElementById("eventWindowModalCancel");
const eventWindowForm = document.getElementById("eventWindowForm");

const eventWindowIdInput = document.getElementById("eventWindowId");
const eventWindowRoomIdInput = document.getElementById("eventWindowRoomId");
const eventWindowCalendarIdInput = document.getElementById("eventWindowCalendarId");
const eventWindowTitleInput = document.getElementById("eventWindowTitle");
const eventWindowStartInput = document.getElementById("eventWindowStart");
const eventWindowEndInput = document.getElementById("eventWindowEnd");
const eventWindowKindInput = document.getElementById("eventWindowKind");

function setEventWindowModalError(text) {
  eventWindowModalErrorEl.textContent = text || "";
}

function openEventWindowModal(mode, w) {
  setEventWindowModalError("");
  if (mode === "create") {
    eventWindowModalTitle.textContent = "Nuova finestra evento";
    eventWindowIdInput.value = "";
    eventWindowRoomIdInput.value = "";
    eventWindowCalendarIdInput.value = "";
    eventWindowTitleInput.value = "";
    eventWindowStartInput.value = "";
    eventWindowEndInput.value = "";
    eventWindowKindInput.value = "EVENT";
  } else if (mode === "edit" && w) {
    eventWindowModalTitle.textContent = "Modifica finestra #" + w.id;
    eventWindowIdInput.value = w.id ?? "";
    eventWindowRoomIdInput.value = w.roomId ?? "";
    eventWindowCalendarIdInput.value = w.calendarId ?? "";
    eventWindowTitleInput.value = w.title ?? "";
    eventWindowStartInput.value = w.start ? w.start.slice(0, 16) : "";
    eventWindowEndInput.value = w.end ? w.end.slice(0, 16) : "";
    eventWindowKindInput.value = w.kind ?? "";
  }
  eventWindowModalBackdrop.classList.add("show");
}

function closeEventWindowModal() {
  eventWindowModalBackdrop.classList.remove("show");
  setEventWindowModalError("");
}

async function loadEventWindows() {
  try {
    setMessage("Caricamento finestre evento...");
    const data = await fetchJson("/admin/event-windows");
    eventWindowsCache = Array.isArray(data) ? data : [];
    renderEventWindows();
    loadedFlags["event-windows"] = true;
    setMessage("Finestre evento caricate.", "success");
  } catch (e) {
    setMessage("Errore caricamento finestre evento: " + e.message, "error");
  }
}

function renderEventWindows() {
  eventWindowsTbody.innerHTML = "";
  if (!eventWindowsCache.length) {
    eventWindowsTbody.innerHTML = '<tr><td colspan="7">Nessuna finestra evento.</td></tr>';
    return;
  }
  eventWindowsCache.forEach(w => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(w.id);
    cell(w.roomId);
    cell(w.calendarId);
    cell(w.title);
    cell(w.start);
    cell(w.end);
    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifica";
    editBtn.className = "btn-secondary";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = w.id;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = w.id;

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);
    eventWindowsTbody.appendChild(tr);
  });
}

eventWindowsTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const w = eventWindowsCache.find(x => String(x.id) === String(id));
  if (!w) return;

  if (action === "edit") {
    openEventWindowModal("edit", w);
  } else if (action === "delete") {
    if (!confirm("Eliminare la finestra #" + w.id + "?")) return;
    try {
      setMessage("Cancellazione finestra evento...");
      await fetchJson("/admin/event-windows/" + w.id, { method: "DELETE" });
      setMessage("Finestra cancellata.", "success");
      loadEventWindows();
    } catch (err) {
      setMessage("Errore cancellazione finestra: " + err.message, "error");
    }
  }
});

btnReloadEventWindows.addEventListener("click", loadEventWindows);
btnAddEventWindow.addEventListener("click", () => openEventWindowModal("create"));
eventWindowModalClose.addEventListener("click", closeEventWindowModal);
eventWindowModalCancel.addEventListener("click", closeEventWindowModal);

eventWindowForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = eventWindowIdInput.value;
  const payload = {
    roomId: eventWindowRoomIdInput.value ? Number(eventWindowRoomIdInput.value) : undefined,
    calendarId: eventWindowCalendarIdInput.value.trim() || undefined,
    title: eventWindowTitleInput.value.trim() || undefined,
    start: eventWindowStartInput.value || undefined,
    end: eventWindowEndInput.value || undefined,
    kind: eventWindowKindInput.value.trim() || undefined,
  };
  if (!payload.roomId) {
    setEventWindowModalError("Room ID è obbligatorio.");
    return;
  }
  try {
    setMessage(id ? "Aggiornamento finestra..." : "Creazione finestra...");
    if (id) {
      await fetchJson("/admin/event-windows/" + id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/admin/event-windows", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setMessage("Finestra salvata.", "success");
    closeEventWindowModal();
    loadEventWindows();
  } catch (err) {
    setEventWindowModalError(err.message);
    setMessage("Errore salvataggio finestra.", "error");
  }
});

// ======================================================
// SENSOR READINGS (solo lista + create debug)
// ======================================================
const sensorReadingsTbody = document.getElementById("sensorReadingsTbody");
const btnReloadSensorReadings = document.getElementById("btnReloadSensorReadings");
const btnAddSensorReading = document.getElementById("btnAddSensorReading");

const sensorReadingModalBackdrop = document.getElementById("sensorReadingModalBackdrop");
const sensorReadingModalErrorEl = document.getElementById("sensorReadingModalError");
const sensorReadingModalClose = document.getElementById("sensorReadingModalClose");
const sensorReadingModalCancel = document.getElementById("sensorReadingModalCancel");
const sensorReadingForm = document.getElementById("sensorReadingForm");

const sensorReadingDeviceIdInput = document.getElementById("sensorReadingDeviceId");
const sensorReadingKindInput = document.getElementById("sensorReadingKind");
const sensorReadingValueInput = document.getElementById("sensorReadingValue");
const sensorReadingTsInput = document.getElementById("sensorReadingTs");

function setSensorReadingModalError(text) {
  sensorReadingModalErrorEl.textContent = text || "";
}

function openSensorReadingModal() {
  setSensorReadingModalError("");
  sensorReadingDeviceIdInput.value = "";
  sensorReadingKindInput.value = "TEMP";
  sensorReadingValueInput.value = "";
  sensorReadingTsInput.value = "";
  sensorReadingModalBackdrop.classList.add("show");
}

function closeSensorReadingModal() {
  sensorReadingModalBackdrop.classList.remove("show");
  setSensorReadingModalError("");
}

async function loadSensorReadings() {
  try {
    setMessage("Caricamento letture sensori...");
    const data = await fetchJson("/admin/sensor-readings");
    sensorReadingsCache = Array.isArray(data) ? data : [];
    renderSensorReadings();
    loadedFlags["sensor-readings"] = true;
    setMessage("Letture sensori caricate.", "success");
  } catch (e) {
    setMessage("Errore caricamento letture sensori: " + e.message, "error");
  }
}

function renderSensorReadings() {
  sensorReadingsTbody.innerHTML = "";
  if (!sensorReadingsCache.length) {
    sensorReadingsTbody.innerHTML = '<tr><td colspan="5">Nessuna lettura.</td></tr>';
    return;
  }
  sensorReadingsCache.forEach(r => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(r.id);
    cell(r.deviceId);
    cell(r.kind);
    cell(r.value);
    cell(r.ts);
    sensorReadingsTbody.appendChild(tr);
  });
}

btnReloadSensorReadings.addEventListener("click", loadSensorReadings);
btnAddSensorReading.addEventListener("click", openSensorReadingModal);
sensorReadingModalClose.addEventListener("click", closeSensorReadingModal);
sensorReadingModalCancel.addEventListener("click", closeSensorReadingModal);

sensorReadingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    deviceId: sensorReadingDeviceIdInput.value ? Number(sensorReadingDeviceIdInput.value) : undefined,
    kind: sensorReadingKindInput.value.trim() || undefined,
    value: sensorReadingValueInput.value ? Number(sensorReadingValueInput.value) : undefined,
    ts: sensorReadingTsInput.value || undefined,
  };
  if (!payload.deviceId || !payload.kind || payload.value === undefined) {
    setSensorReadingModalError("Device, tipo e valore sono obbligatori.");
    return;
  }
  try {
    setMessage("Creazione lettura sensore...");
    await fetchJson("/admin/sensor-readings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMessage("Lettura creata.", "success");
    closeSensorReadingModal();
    loadSensorReadings();
  } catch (err) {
    setSensorReadingModalError(err.message);
    setMessage("Errore creazione lettura.", "error");
  }
});

// ======================================================
// COMMAND LOGS (solo lista + create debug)
// ======================================================
const commandLogsTbody = document.getElementById("commandLogsTbody");
const btnReloadCommandLogs = document.getElementById("btnReloadCommandLogs");
const btnAddCommandLog = document.getElementById("btnAddCommandLog");

const commandLogModalBackdrop = document.getElementById("commandLogModalBackdrop");
const commandLogModalErrorEl = document.getElementById("commandLogModalError");
const commandLogModalClose = document.getElementById("commandLogModalClose");
const commandLogModalCancel = document.getElementById("commandLogModalCancel");
const commandLogForm = document.getElementById("commandLogForm");

const commandLogDeviceIdInput = document.getElementById("commandLogDeviceId");
const commandLogRoomContextIdInput = document.getElementById("commandLogRoomContextId");
const commandLogCommandInput = document.getElementById("commandLogCommand");
const commandLogPayloadInput = document.getElementById("commandLogPayload");
const commandLogResultInput = document.getElementById("commandLogResult");
const commandLogTsInput = document.getElementById("commandLogTs");

function setCommandLogModalError(text) {
  commandLogModalErrorEl.textContent = text || "";
}

function openCommandLogModal() {
  setCommandLogModalError("");
  commandLogDeviceIdInput.value = "";
  commandLogRoomContextIdInput.value = "";
  commandLogCommandInput.value = "";
  commandLogPayloadInput.value = "";
  commandLogResultInput.value = "";
  commandLogTsInput.value = "";
  commandLogModalBackdrop.classList.add("show");
}

function closeCommandLogModal() {
  commandLogModalBackdrop.classList.remove("show");
  setCommandLogModalError("");
}

async function loadCommandLogs() {
  try {
    setMessage("Caricamento comandi...");
    const data = await fetchJson("/admin/command-logs");
    commandLogsCache = Array.isArray(data) ? data : [];
    renderCommandLogs();
    loadedFlags["command-logs"] = true;
    setMessage("Comandi caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento comandi: " + e.message, "error");
  }
}

function renderCommandLogs() {
  commandLogsTbody.innerHTML = "";
  if (!commandLogsCache.length) {
    commandLogsTbody.innerHTML = '<tr><td colspan="6">Nessun comando.</td></tr>';
    return;
  }
  commandLogsCache.forEach(c => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(c.id);
    cell(c.deviceId);
    cell(c.roomContextId);
    cell(c.command);
    cell(c.result);
    cell(c.ts);
    commandLogsTbody.appendChild(tr);
  });
}

btnReloadCommandLogs.addEventListener("click", loadCommandLogs);
btnAddCommandLog.addEventListener("click", openCommandLogModal);
commandLogModalClose.addEventListener("click", closeCommandLogModal);
commandLogModalCancel.addEventListener("click", closeCommandLogModal);

commandLogForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    deviceId: commandLogDeviceIdInput.value ? Number(commandLogDeviceIdInput.value) : undefined,
    roomContextId: commandLogRoomContextIdInput.value
      ? Number(commandLogRoomContextIdInput.value)
      : undefined,
    command: commandLogCommandInput.value.trim() || undefined,
    payload: commandLogPayloadInput.value.trim() || undefined,
    result: commandLogResultInput.value.trim() || undefined,
    ts: commandLogTsInput.value || undefined,
  };
  if (!payload.deviceId || !payload.command) {
    setCommandLogModalError("Device ID e comando sono obbligatori.");
    return;
  }
  try {
    setMessage("Registrazione comando...");
    await fetchJson("/admin/command-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMessage("Comando registrato.", "success");
    closeCommandLogModal();
    loadCommandLogs();
  } catch (err) {
    setCommandLogModalError(err.message);
    setMessage("Errore registrazione comando.", "error");
  }
});

// ======================================================
// LOCKS (lista + create + delete)
// ======================================================
const locksTbody = document.getElementById("locksTbody");
const btnReloadLocks = document.getElementById("btnReloadLocks");
const btnAddLock = document.getElementById("btnAddLock");

const lockModalBackdrop = document.getElementById("lockModalBackdrop");
const lockModalTitle = document.getElementById("lockModalTitle");
const lockModalErrorEl = document.getElementById("lockModalError");
const lockModalClose = document.getElementById("lockModalClose");
const lockModalCancel = document.getElementById("lockModalCancel");
const lockForm = document.getElementById("lockForm");

const lockIdInput = document.getElementById("lockId");
const lockResourceInput = document.getElementById("lockResource");
const lockRoomContextIdInput = document.getElementById("lockRoomContextId");
const lockHolderInput = document.getElementById("lockHolder");
const lockNoteInput = document.getElementById("lockNote");
const lockCreatedAtInput = document.getElementById("lockCreatedAt");
const lockExpiresAtInput = document.getElementById("lockExpiresAt");

function setLockModalError(text) {
  lockModalErrorEl.textContent = text || "";
}

function openLockModal() {
  setLockModalError("");
  lockModalTitle.textContent = "Nuovo lock";
  lockIdInput.value = "";
  lockResourceInput.value = "";
  lockRoomContextIdInput.value = "";
  lockHolderInput.value = "";
  lockNoteInput.value = "";
  lockCreatedAtInput.value = "";
  lockExpiresAtInput.value = "";
  lockModalBackdrop.classList.add("show");
}

function closeLockModal() {
  lockModalBackdrop.classList.remove("show");
  setLockModalError("");
}

async function loadLocks() {
  try {
    setMessage("Caricamento locks...");
    const data = await fetchJson("/admin/locks");
    locksCache = Array.isArray(data) ? data : [];
    renderLocks();
    loadedFlags.locks = true;
    setMessage("Locks caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento locks: " + e.message, "error");
  }
}

function renderLocks() {
  locksTbody.innerHTML = "";
  if (!locksCache.length) {
    locksTbody.innerHTML = '<tr><td colspan="7">Nessun lock.</td></tr>';
    return;
  }
  locksCache.forEach(l => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(l.id);
    cell(l.resource);
    cell(l.holder);
    cell(l.note);
    cell(l.createdAt);
    cell(l.expiresAt);
    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Cancella";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = l.id;

    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);
    locksTbody.appendChild(tr);
  });
}

locksTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const lock = locksCache.find(l => String(l.id) === String(id));
  if (!lock) return;

  if (action === "delete") {
    if (!confirm("Eliminare il lock #" + lock.id + " (" + lock.resource + ")?")) return;
    try {
      setMessage("Cancellazione lock...");
      await fetchJson("/admin/locks/" + lock.id, { method: "DELETE" });
      setMessage("Lock cancellato.", "success");
      loadLocks();
    } catch (err) {
      setMessage("Errore cancellazione lock: " + err.message, "error");
    }
  }
});

btnReloadLocks.addEventListener("click", loadLocks);
btnAddLock.addEventListener("click", openLockModal);
lockModalClose.addEventListener("click", closeLockModal);
lockModalCancel.addEventListener("click", closeLockModal);

lockForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    resource: lockResourceInput.value.trim() || undefined,
    roomContextId: lockRoomContextIdInput.value
      ? Number(lockRoomContextIdInput.value)
      : undefined,
    holder: lockHolderInput.value.trim() || undefined,
    note: lockNoteInput.value.trim() || undefined,
    createdAt: lockCreatedAtInput.value || undefined,
    expiresAt: lockExpiresAtInput.value || undefined,
  };
  if (!payload.resource) {
    setLockModalError("La risorsa è obbligatoria.");
    return;
  }
  try {
    setMessage("Creazione lock...");
    await fetchJson("/admin/locks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMessage("Lock creato.", "success");
    closeLockModal();
    loadLocks();
  } catch (err) {
    setLockModalError(err.message);
    setMessage("Errore creazione lock.", "error");
  }
});

// ======================================================
// AUDIT LOGS (lista + create debug)
// ======================================================
const auditLogsTbody = document.getElementById("auditLogsTbody");
const btnReloadAuditLogs = document.getElementById("btnReloadAuditLogs");
const btnAddAuditLog = document.getElementById("btnAddAuditLog");

const auditLogModalBackdrop = document.getElementById("auditLogModalBackdrop");
const auditLogModalErrorEl = document.getElementById("auditLogModalError");
const auditLogModalClose = document.getElementById("auditLogModalClose");
const auditLogModalCancel = document.getElementById("auditLogModalCancel");
const auditLogForm = document.getElementById("auditLogForm");

const auditLogTsInput = document.getElementById("auditLogTs");
const auditLogActorInput = document.getElementById("auditLogActor");
const auditLogIpInput = document.getElementById("auditLogIp");
const auditLogSsidInput = document.getElementById("auditLogSsid");
const auditLogApInput = document.getElementById("auditLogAp");
const auditLogOriginInput = document.getElementById("auditLogOrigin");
const auditLogRoomContextIdInput = document.getElementById("auditLogRoomContextId");
const auditLogActionInput = document.getElementById("auditLogAction");
const auditLogPayloadInput = document.getElementById("auditLogPayload");
const auditLogResultInput = document.getElementById("auditLogResult");

function setAuditLogModalError(text) {
  auditLogModalErrorEl.textContent = text || "";
}

function openAuditLogModal() {
  setAuditLogModalError("");
  auditLogTsInput.value = "";
  auditLogActorInput.value = "";
  auditLogIpInput.value = "";
  auditLogSsidInput.value = "";
  auditLogApInput.value = "";
  auditLogOriginInput.value = "";
  auditLogRoomContextIdInput.value = "";
  auditLogActionInput.value = "";
  auditLogPayloadInput.value = "";
  auditLogResultInput.value = "";
  auditLogModalBackdrop.classList.add("show");
}

function closeAuditLogModal() {
  auditLogModalBackdrop.classList.remove("show");
  setAuditLogModalError("");
}

async function loadAuditLogs() {
  try {
    setMessage("Caricamento audit logs...");
    const data = await fetchJson("/admin/audit-logs");
    auditLogsCache = Array.isArray(data) ? data : [];
    renderAuditLogs();
    loadedFlags["audit-logs"] = true;
    setMessage("Audit logs caricati.", "success");
  } catch (e) {
    setMessage("Errore caricamento audit logs: " + e.message, "error");
  }
}

function renderAuditLogs() {
  auditLogsTbody.innerHTML = "";
  if (!auditLogsCache.length) {
    auditLogsTbody.innerHTML = '<tr><td colspan="6">Nessun audit log.</td></tr>';
    return;
  }
  auditLogsCache.forEach(a => {
    const tr = document.createElement("tr");
    function cell(text) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.appendChild(td);
    }
    cell(a.id);
    cell(a.ts);
    cell(a.actor);
    cell(a.ip);
    cell(a.action);
    cell(a.payload);
    auditLogsTbody.appendChild(tr);
  });
}

btnReloadAuditLogs.addEventListener("click", loadAuditLogs);
btnAddAuditLog.addEventListener("click", openAuditLogModal);
auditLogModalClose.addEventListener("click", closeAuditLogModal);
auditLogModalCancel.addEventListener("click", closeAuditLogModal);

auditLogForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    ts: auditLogTsInput.value || undefined,
    actor: auditLogActorInput.value.trim() || undefined,
    ip: auditLogIpInput.value.trim() || undefined,
    ssid: auditLogSsidInput.value.trim() || undefined,
    ap: auditLogApInput.value.trim() || undefined,
    origin: auditLogOriginInput.value.trim() || undefined,
    roomContextId: auditLogRoomContextIdInput.value
      ? Number(auditLogRoomContextIdInput.value)
      : undefined,
    action: auditLogActionInput.value.trim() || undefined,
    payload: auditLogPayloadInput.value.trim() || undefined,
    result: auditLogResultInput.value.trim() || undefined,
  };
  try {
    setMessage("Creazione audit log...");
    await fetchJson("/admin/audit-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMessage("Audit log creato.", "success");
    closeAuditLogModal();
    loadAuditLogs();
  } catch (err) {
    setAuditLogModalError(err.message);
    setMessage("Errore creazione audit log.", "error");
  }
});

// ---- chiusura modali cliccando sul backdrop ----
window.addEventListener("click", (e) => {
  if (e.target === deviceModalBackdrop) closeDeviceModal();
  if (e.target === roomModalBackdrop) closeRoomModal();
  if (e.target === zoneModalBackdrop) closeZoneModal();
  if (e.target === settingModalBackdrop) closeSettingModal();
  if (e.target === setpointProfileModalBackdrop) closeSetpointProfileModal();
  if (e.target === overrideModalBackdrop) closeOverrideModal();
  if (e.target === eventWindowModalBackdrop) closeEventWindowModal();
  if (e.target === sensorReadingModalBackdrop) closeSensorReadingModal();
  if (e.target === commandLogModalBackdrop) closeCommandLogModal();
  if (e.target === lockModalBackdrop) closeLockModal();
  if (e.target === auditLogModalBackdrop) closeAuditLogModal();
});

// ---- loader per sezione ----
function loadSectionData(key) {
  switch (key) {
    case "devices":
      if (!loadedFlags.devices) loadDevices();
      break;
    case "rooms":
      if (!loadedFlags.rooms) loadRooms();
      break;
    case "zones":
      if (!loadedFlags.zones) loadZones();
      break;
    case "settings":
      if (!loadedFlags.settings) loadSettings();
      break;
    case "setpoint-profiles":
      if (!loadedFlags["setpoint-profiles"]) loadSetpointProfiles();
      break;
    case "overrides":
      if (!loadedFlags.overrides) loadOverrides();
      break;
    case "event-windows":
      if (!loadedFlags["event-windows"]) loadEventWindows();
      break;
    case "sensor-readings":
      if (!loadedFlags["sensor-readings"]) loadSensorReadings();
      break;
    case "command-logs":
      if (!loadedFlags["command-logs"]) loadCommandLogs();
      break;
    case "locks":
      if (!loadedFlags.locks) loadLocks();
      break;
    case "audit-logs":
      if (!loadedFlags["audit-logs"]) loadAuditLogs();
      break;
  }
}

// init
setActiveSection("devices");
