-- Create ideas table to store approved suggestions as final ideas
CREATE TABLE public.ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id UUID REFERENCES public.suggestions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    prd TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS and allow only admins to manage ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ideas" ON public.ideas
  FOR ALL USING (public.is_admin());

-- Index for faster lookups by suggestion
CREATE INDEX idx_ideas_suggestion_id ON public.ideas(suggestion_id);
