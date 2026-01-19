-- Check the constraint on schedules.hari column
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
AND conname LIKE '%hari%';

-- This will show what values are allowed for hari column
-- Common constraints:
-- CHECK (hari IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat'))
-- or
-- CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'))

-- If constraint expects lowercase, run this to see current data:
SELECT DISTINCT hari FROM schedules;
