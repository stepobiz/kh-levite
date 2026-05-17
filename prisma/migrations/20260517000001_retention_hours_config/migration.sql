DELETE FROM cfg_configuration WHERE code = 'infra.process_log_retention_days';

INSERT OR IGNORE INTO cfg_configuration (code, name, description, data_type, val_int)
VALUES (
  'infra.process_log_retention_hours',
  'Retention log processi (ore)',
  'Numero di ore per cui conservare i log di esecuzione di tutti i processi (Logic Engine, Sync Engine). I log più vecchi vengono eliminati automaticamente ogni ora. Default: 24',
  'integer',
  24
);
