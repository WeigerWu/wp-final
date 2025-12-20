-- Check if is_deleted column exists in comments table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'comments' 
  AND column_name = 'is_deleted';

-- If the above query returns no rows, the column doesn't exist
-- Run the migration: supabase/add-comments-is-deleted.sql

