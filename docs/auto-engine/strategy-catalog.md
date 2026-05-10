# Strategy Catalog — Implementazioni

Questa pagina documenta le implementazioni concrete delle Strategy per ogni category.

---

# 1. NodeManualValueByUrlStrategy

## Category

`node_manual_value_by_url`

## Descrizione

Nodo di input che legge il proprio valore da un URL esterno ad ogni ciclo. Usato tipicamente come child di `out_thermostat` per fornire il setpoint, ma può essere usato per qualsiasi valore scalare da sistemi esterni (calendario Google, API BMS, sistema prenotazione, ecc.).

## Topologia

```
[ out_thermostat ]
    ├──► [ in_sensor ]                      (temperatura attuale)
    └──► [ node_manual_value_by_url ]       (setpoint da URL esterno)
```

È sempre una foglia — non ha child.

## Attributi richiesti

| Attributo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `setpoint_url` | string | **Sì** | URL che risponde con `{ "value": "21.5" }` |

## Implementazione

```typescript
calculateDesired(node: AuenNode): string {
  const url = node.attributes.find(a => a.code === 'setpoint_url')?.value;
  if (!url) return node.actual_value;
  try {
    const response = http.get(url);
    return String(response.data.value);
  } catch {
    return node.actual_value; // conservativo se URL non risponde
  }
}
updateActual(node: AuenNode): string | undefined { return node.desired_value; }
syncHardware(): 'NONE' { return 'NONE'; }
```

---

# 2. ThermostatStrategy

## Category

`out_thermostat`

## Descrizione

Confronta due child: un sensore (`in_sensor`) e un setpoint (`node_manual_value_by_url` o `node_manual_target`). Produce on/off con isteresi configurabile.

## Topologia

```
[ out_thermostat ]
    ├──► [ in_sensor ]                  (temperatura attuale)
    └──► [ node_manual_value_by_url ]   (setpoint)
         oppure [ node_manual_target ]
```

## Attributi

| Attributo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `hysteresis` | number | No | Default `0.5` gradi |

## Implementazione

```typescript
calculateDesired(node: AuenNode): string {
  const sensor = node.children.find(c => c.type.category === 'in_sensor');
  const setpoint = node.children.find(c =>
    c.type.category === 'node_manual_value_by_url' ||
    c.type.category === 'node_manual_target'
  );
  const currentTemp = parseFloat(sensor.actual_value);
  const targetTemp = parseFloat(setpoint.actual_value);
  const hysteresis = parseFloat(
    node.attributes.find(a => a.code === 'hysteresis')?.value ?? '0.5'
  );
  if (node.actual_value === '1') {
    return currentTemp > targetTemp + hysteresis ? '0' : '1';
  } else {
    return currentTemp < targetTemp - hysteresis ? '1' : '0';
  }
}
updateActual(node: AuenNode): string | undefined { return node.desired_value; }
syncHardware(): 'WRITE' { return 'WRITE'; }
```

---

# 3. ProxyMirrorStrategy

## Category

`proxy_mirror`

## Descrizione

Copia `actual_value` dal nodo sorgente. Può avere `delay_from_child` — utile per pompe che devono aspettare che le valvole siano aperte prima di partire. `syncHardware` è dinamico — delega al nodo sorgente.

## Topologia

```
[ out_logic_or "Linea sale stradali" ]
       ↑ source_node_id
[ proxy_mirror "Pompa Auditorium" ]  (delay_from_child: 10s)
[ proxy_mirror "Chiller" ]
```

## Attributi

| Attributo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `source_node_id` | auen_node | **Sì** | ID del nodo da cui copiare actual_value |
| `delay_from_child` | number | No | Secondi di attesa su entrambe le transizioni ON e OFF |

## Implementazione

```typescript
calculateDesired(node: AuenNode, allNodes: AuenNode[]): string {
  const sourceId = node.attributes.find(a => a.code === 'source_node_id')?.value;
  if (!sourceId) return node.actual_value;
  const source = allNodes.find(n => n.id === parseInt(sourceId));
  return source?.actual_value ?? node.actual_value;
}
updateActual(node: AuenNode): string | undefined {
  const delayAttr = node.attributes.find(a => a.code === 'delay_from_child');
  if (delayAttr && node.desired_value_updated_at) {
    const waitMs = parseInt(delayAttr.value) * 1000;
    const elapsed = Date.now() - new Date(node.desired_value_updated_at).getTime();
    if (elapsed < waitMs) return undefined;
  }
  return node.desired_value;
}
syncHardware(node: AuenNode, allNodes: AuenNode[]): 'READ' | 'WRITE' | 'NONE' {
  const sourceId = node.attributes.find(a => a.code === 'source_node_id')?.value;
  if (!sourceId) return 'NONE';
  const source = allNodes.find(n => n.id === parseInt(sourceId));
  if (!source) return 'NONE';
  return StrategyFactory.get(source.type.category).syncHardware();
}
```

---

# 4. ProxyInverterStrategy

## Category

`proxy_inverter`

## Descrizione

Come `ProxyMirrorStrategy` ma inverte il valore. **Solo per nodi sorgente con** `value_type = 'boolean'`. Se il sorgente non è boolean: comportamento conservativo.

## Attributi

Stessi di `proxy_mirror`: `source_node_id` (obbligatorio), `delay_from_child` (opzionale).

## Implementazione

```typescript
calculateDesired(node: AuenNode, allNodes: AuenNode[]): string {
  const sourceId = node.attributes.find(a => a.code === 'source_node_id')?.value;
  if (!sourceId) return node.actual_value;
  const source = allNodes.find(n => n.id === parseInt(sourceId));
  if (!source || source.type.value_type !== 'boolean') return node.actual_value;
  return source.actual_value === '1' ? '0' : '1';
}
// updateActual e syncHardware: identici a ProxyMirrorStrategy
```
