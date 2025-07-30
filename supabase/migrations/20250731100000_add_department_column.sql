-- Add department column to suggestions table
ALTER TABLE public.suggestions
ADD COLUMN department TEXT NOT NULL DEFAULT 'salg' CHECK (department IN ('salg', 'marketing', 'indkøb', 'design', 'lager'));

