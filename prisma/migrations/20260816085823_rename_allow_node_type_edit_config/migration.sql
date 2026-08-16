-- Rinomina la config allow_node_type_edit -> autoengine.allow_node_type_edit,
-- preservando il valore esistente e assegnandola alla sezione autoengine.
-- Idempotente: se il codice vecchio non esiste (già migrato, o installazione
-- pulita) le due istruzioni non toccano nulla — seed.ts crea/aggiorna il
-- resto (nome, descrizione, sectionId) subito dopo, ad ogni deploy.

INSERT INTO "cfg_configuration" ("code", "name", "description", "section_id", "data_type", "options", "pattern", "val_int", "val_float", "val_bool", "val_text")
SELECT
  'autoengine.allow_node_type_edit',
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
WHERE "code" = 'allow_node_type_edit';

DELETE FROM "cfg_configuration" WHERE "code" = 'allow_node_type_edit';
