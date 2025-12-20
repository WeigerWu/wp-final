-- Add is_deleted column to comments table for soft delete functionality
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON public.comments(is_deleted);

-- Update existing comments to have is_deleted = false
UPDATE public.comments SET is_deleted = false WHERE is_deleted IS NULL;

