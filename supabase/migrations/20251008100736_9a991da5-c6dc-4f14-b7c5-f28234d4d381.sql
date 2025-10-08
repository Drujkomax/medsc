-- Change manufacturer name from jsonb to text
ALTER TABLE manufacturers 
ALTER COLUMN name TYPE text USING name->>'en';