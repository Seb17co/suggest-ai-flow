-- Add 'more_info_needed' status option to suggestions table
ALTER TABLE public.suggestions 
DROP CONSTRAINT IF EXISTS suggestions_status_check;

ALTER TABLE public.suggestions 
ADD CONSTRAINT suggestions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed'));