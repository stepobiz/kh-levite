# Grafo dei nodi e dipendenze

## Cos'è il grafo

La rete di automazione di AutoEngine è modellata come un **albero** (o foresta di alberi) di nodi. Ogni nodo ha un tipo che ne determina la logica, e può avere un parent e zero o più child.

La relazione è modellata direttamente su `auen_node` tramite il campo `parent_id` — non esiste una tabella di relazione separata.

## Struttura ad albero

Ogni nodo ha:

- **0 o 1 parent** — i nodi radice (es. caldaia) non hanno parent
- **N child** — un nodo può avere quanti child servono (se il gruppo lo permette)

## Regole sui figli per gruppo

| Gruppo | Può avere figli |
| --- | --- |
| `out_*` | ✅ |
| `fake` | ✅ |
| `in_*` | ❌ — è sempre una foglia |
| `node_*` | ❌ — è sempre una foglia |
| `proxy_*` | ❌ — è sempre una foglia |

## proxy\_\* e relazioni tra alberi

Quando la stessa logica deve alimentare due rami distinti dell'albero, si usa un nodo `proxy_mirror`. Il proxy è una foglia che copia `actual_value` dal nodo sorgente e può avere logiche proprie (es. `delay_from_child`).

**Esempio: pompa che segue "linea sale stradali" con delay:**

```
[ Linea sale stradali ]  (out_logic_or, nodo logico)
    ├──► [ EV Auditorium D ]   (out_thermostat)
    └──► [ EV Auditorium E ]   (out_thermostat)

[ Pompa Auditorium Stradali ]  (proxy_mirror, source_node_id: linea_sale_stradali, delay_from_child: 10s)
[ Chiller ]                    (proxy_mirror, source_node_id: linea_sale_stradali)
```

La pompa e il chiller sono proxy_mirror del nodo "Linea sale stradali". La pompa ha un delay di 10 secondi — aspetta che le valvole siano aperte prima di partire.

## Esempio impianto completo

```
[ Caldaia ]  (out_logic_or)
    ├──► [ Pompa Terra Chiller ]        (out_logic_or)
    ├──► [ Pompa Terra Radiante ]       (out_logic_or)
    ├──► [ Linea Stradali Auditorium ]  (out_logic_or, nodo logico is_logical=true)
    │        ├──► [ EV Auditorium E ]   (out_thermostat)
    │        │        ├──► [ Termometro Aud E ]   (in_sensor)
    │        │        └──► [ Setpoint Aud E ]     (node_manual_value_by_url)
    │        └──► [ EV Auditorium D ]   (out_thermostat)
    │                 ├──► [ Termometro Aud D ]   (in_sensor)
    │                 └──► [ Setpoint Aud D ]     (node_manual_value_by_url)
    └──► [ Pompa Stradale Salette ]     (out_logic_or)

Proxy — foglie che puntano al nodo "Linea Stradali Auditorium":
[ Pompa Auditorium Stradali ]  (proxy_mirror, delay_from_child: 10s)
[ Chiller Auditorium ]         (proxy_mirror)
```

## Caso speciale: dispositivo condiviso tra stagioni

Se un dispositivo fisico deve essere controllato da due logiche distinte (es. pompa in inverno, chiller in estate), si creano **due nodi distinti** con `is_logical = false` entrambi mappati sullo stesso component IoT da Sync:

```
[ Pompa ]   ──►  [ EV Aud E — INV ]  ──┐
                                        ├──► stesso component IoT
[ Chiller ] ──►  [ EV Aud E — EST ]  ──┘
```

## desired_value vs actual_value

| Campo | Significato | Chi lo scrive |
| --- | --- | --- |
| `desired_value` | Cosa il nodo "vuole" essere | Logic Engine (fase 1) |
| `actual_value` | Cosa il nodo "è" realmente | Logic Engine (fase 2) |

I due valori possono differire quando è configurato un `delay_from_child` — il nodo lampeggia giallo nella topologia UI finché non sono allineati. Vedi [logic-engine.md](logic-engine.md).
