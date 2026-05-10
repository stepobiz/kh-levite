# KH Levite — Modulo IoT

Il modulo IoT è il sottosistema di KH Levite dedicato alla gestione dei dispositivi IoT presenti nell'impianto.

Ha tre responsabilità principali:

**1. Anagrafica dispositivi**
Mantiene il registro di tutti i dispositivi IoT installati — ogni dispositivo è identificato dalla propria configurazione (indirizzo IP, MAC address, driver di comunicazione) e dai suoi componenti hardware (es. i singoli switch di uno Shelly).

**2. Digital twin dello stato**
Per ogni componente hardware, il modulo mantiene un log continuo dei valori letti nel tempo. Questo log rappresenta il digital twin dello stato dell'impianto — è possibile conoscere in qualsiasi momento lo stato attuale di un componente e la sua storia.

**3. Interfaccia di comando**
Il modulo è l'unico punto di accesso per inviare comandi ai dispositivi IoT. Gli altri moduli di KH Levite che hanno bisogno di interagire con l'hardware (es. accendere o spegnere un dispositivo) lo fanno esclusivamente tramite il modulo IoT — mai comunicando direttamente con i dispositivi.

## Principio architetturale

> Il modulo IoT è il **gateway esclusivo** verso l'hardware. Nessun altro modulo di KH Levite comunica direttamente con i dispositivi IoT.

Questo garantisce che lo stato dell'impianto sia sempre tracciato in un unico punto, che i comandi passino sempre per la logica di buffering e retry, e che l'aggiunta di nuovi tipi di dispositivi richieda modifiche solo al modulo IoT.

## Documentazione

- [Modello dati](data-model.md)
- [Processo di telemetria](telemetry-process.md)
- [nextValue — campo interno](next-value.md)
- [REST API](rest-api.md)
