-- Change out_thermostat node type from boolean to thermal
UPDATE "auen_node_type"
SET "value_type" = 'thermal'
WHERE "category" = 'out_thermostat' AND "value_type" = 'boolean';

-- Reset existing thermostat node values from '0'/'1' to 'off'
UPDATE "auen_node"
SET "desired_value" = 'off', "actual_value" = 'off'
WHERE "type_id" IN (
  SELECT "id" FROM "auen_node_type" WHERE "category" = 'out_thermostat'
);
