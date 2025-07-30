-- Add archived column to suggestions table
ALTER TABLE public.suggestions
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for faster lookups
CREATE INDEX idx_suggestions_archived ON public.suggestions(archived);
