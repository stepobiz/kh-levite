// ✅ VERSIONE API AGGIORNATA
let devicesList = [];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.section).classList.add("active");
    });
  });

  fetchDevices();
  fetchComponents();
  fetchLogs();

  document.getElementById("device-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const dto = {
      deviceName: form.deviceName.value,
      macAddress: form.macAddress.value,
      ipAddress: form.ipAddress.value,
      driver: form.protocol.value
    };
    const url = id ? `/api/iot/devices/${id}` : "/api/iot/devices";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto)
    });
    showToast(res.ok ? `Dispositivo ${id ? 'aggiornato' : 'creato'}` : "Errore salvataggio");
    closeModal("device-modal");
    fetchDevices();
  };

  document.getElementById("component-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const deviceId = form.deviceId.value;
    const dto = {
      componentName: form.componentName.value,
      hardwareAddress: form.hardwareAddress.value,
      hardwareIndex: Number(form.hardwareIndex.value)
    };
    const url = id
      ? `/api/iot/devices/${deviceId}/components/${id}`
      : `/api/iot/devices/${deviceId}/components`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto)
    });
    showToast(res.ok ? `Componente ${id ? 'aggiornato' : 'creato'}` : "Errore salvataggio");
    closeModal("component-modal");
    fetchComponents();
  };
});

async function fetchDevices() {
  const res = await fetch("/api/iot/devices");
  devicesList = await res.json();
  const tbody = document.querySelector("#device-table tbody");
  tbody.innerHTML = "";
  devicesList.forEach(d => {
    tbody.innerHTML += `<tr>
      <td>${d.id}</td><td>${d.deviceName || ""}</td><td>${d.macAddress || ""}</td>
      <td>${d.ipAddress}</td><td>${d.driver || ""}</td>
      <td class="actions">
        <button onclick='openDeviceModal(${JSON.stringify(d)})'>✏️</button>
        <button onclick="deleteDevice(${d.id})">🗑️</button>
        <button onclick="showDeviceDetail(${d.id})">🔍</button>
      </td>
    </tr>`;
  });
  populateDeviceSelect();
}

function populateDeviceSelect() {
  const select = document.querySelector("#component-form select[name=deviceId]");
  if (!select) return;
  select.innerHTML = `<option value="">Seleziona dispositivo...</option>`;
  devicesList.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.ipAddress} — ${d.deviceName || ""}`;
    select.appendChild(opt);
  });
}

function openDeviceModal(device = null) {
  const form = document.getElementById("device-form");
  form.reset();
  form.id.value = device?.id || "";
  form.deviceName.value = device?.deviceName || "";
  form.macAddress.value = device?.macAddress || "";
  form.ipAddress.value = device?.ipAddress || "";
  form.protocol.value = device?.driver || "";
  document.getElementById("device-modal").classList.add("show");
}

function openComponentModal(component = null) {
  const form = document.getElementById("component-form");
  form.reset();
  form.id.value = component?.id || "";
  form.deviceId.value = component?.deviceId || "";
  form.componentName.value = component?.componentName || "";
  form.hardwareAddress.value = component?.hardwareAddress || "";
  form.hardwareIndex.value = component?.hardwareIndex || "";
  document.getElementById("component-modal").classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function showToast(msg) {
  const el = document.getElementById("message");
  el.textContent = msg;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 3000);
}

async function fetchComponents() {
  const res = await fetch("/api/iot/device-components");
  const data = await res.json();
  const tbody = document.querySelector("#component-table tbody");
  tbody.innerHTML = "";
  data.forEach(c => {
    const device = devicesList.find(d => d.id === c.deviceId);
    tbody.innerHTML += `<tr>
      <td>${c.id}</td><td>${device?.ipAddress || "?"}</td><td>${c.componentName || ""}</td>
      <td>${c.hardwareIndex}</td><td>${c.hardwareAddress || ""}</td>
      <td class="actions">
        <button onclick='openComponentModal(${JSON.stringify(c)})'>✏️</button>
        <button onclick="deleteComponent(${c.id})">🗑️</button>
      </td>
    </tr>`;
  });
}

async function deleteDevice(id) {
  const res = await fetch(`/api/iot/devices/${id}`, { method: "DELETE" });
  showToast(res.ok ? "Dispositivo eliminato" : "Errore eliminazione");
  fetchDevices();
}

async function deleteComponent(id) {
  const res = await fetch(`/api/iot/device-components/${id}`, { method: "DELETE" });
  showToast(res.ok ? "Componente eliminato" : "Errore eliminazione");
  fetchComponents();
}

async function fetchLogs() {
  const res = await fetch("/api/iot/telemetry-logs");
  const data = await res.json();
  const tbody = document.querySelector("#log-table tbody");
  tbody.innerHTML = "";
  data.forEach(l => {
    tbody.innerHTML += `<tr>
      <td>${l.id}</td><td>${l.componentId}</td><td>${l.value}</td>
      <td>${l.direction}</td><td>${l.createdAt}</td>
    </tr>`;
  });
}

async function showDeviceDetail(deviceId) {
  const device = devicesList.find(d => d.id === deviceId);
  if (!device) return;
  document.getElementById("detail-title").textContent = `${device.deviceName || "Dispositivo"} (${device.ipAddress})`;
  document.getElementById("device-detail-panel").classList.remove("hidden");

  const res = await fetch(`/api/iot/devices/${deviceId}/components`);
  const components = await res.json();
  const tbody = document.querySelector("#device-components-table tbody");
  tbody.innerHTML = "";
  components.forEach(c => {
    tbody.innerHTML += `<tr><td>${c.id}</td><td>${c.componentName || ""}</td><td>${c.hardwareIndex}</td><td>${c.hardwareAddress || ""}</td></tr>`;
  });
}

function closeDeviceDetail() {
  document.getElementById("device-detail-panel").classList.add("hidden");
}