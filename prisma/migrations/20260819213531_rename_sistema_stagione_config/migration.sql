-- Rinomina la config sistema.stagione -> autoengine.season, preservando il
-- valore esistente e spostandola nella sezione autoengine (unico modulo che
-- la legge). La sezione 'sistema' resta orfana dopo lo spostamento e viene
-- rimossa.
-- Idempotente: se il codice vecchio non esiste (già migrato, o installazione
-- pulita) le istruzioni non toccano nulla — seed.ts crea/aggiorna il resto
-- (nome, descrizione, sectionId) subito dopo, ad ogni deploy.

INSERT INTO "cfg_configuration" ("code", "name", "description", "section_id", "data_type", "options", "pattern", "val_int", "val_float", "val_bool", "val_text")
SELECT
  'autoengine.season',
  "name",
  "description",
  (SELECT "id" FROM "cfg_section" WHERE "code" = 'autoengine'),
  "data_type",
  "options",
  "pattern",
  "val_int",
  "val_float",
  "val_bool",
  "val_text"
FROM "cfg_configuration"
WHERE "code" = 'sistema.stagione';

DELETE FROM "cfg_configuration" WHERE "code" = 'sistema.stagione';

DELETE FROM "cfg_section" WHERE "code" = 'sistema';
