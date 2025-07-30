-- Fix infinite recursion in RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Admins can update all suggestions" ON public.suggestions;

-- Create a more efficient admin check using a security definer function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = $1 
    AND profiles.role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all suggestions" ON public.suggestions
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all suggestions" ON public.suggestions
    FOR UPDATE USING (public.is_admin());