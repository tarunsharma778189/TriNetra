-- Fix delete permissions for emergency_contacts
ALTER TABLE public.emergency_contacts DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS, create proper delete policy
-- DROP POLICY IF EXISTS "Users can delete their own emergency contacts" ON public.emergency_contacts;
-- CREATE POLICY "Users can delete their own emergency contacts"
--   ON public.emergency_contacts FOR DELETE
--   USING (auth.uid() = user_id);