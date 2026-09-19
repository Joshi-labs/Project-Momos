-- ==========================================================
-- PROJECT MOMOS: SUPABASE DATABASE & RLS SETUP SCRIPT
-- ==========================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create TICKETS Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Steam Veg', 'Afghani', 'Fried')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast queries & polling
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- 3. Helper Function: Check if caller is Admin (Security Definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Trigger: Automatically create Profile row on user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: PROFILES
-- Users can view their own profile, admins can view all profiles
DROP POLICY IF EXISTS "Allow select for profile owner or admin" ON public.profiles;
CREATE POLICY "Allow select for profile owner or admin"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update their own profile info
DROP POLICY IF EXISTS "Allow self profile update" ON public.profiles;
CREATE POLICY "Allow self profile update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (e.g. promoting role)
DROP POLICY IF EXISTS "Allow admin update on profiles" ON public.profiles;
CREATE POLICY "Allow admin update on profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. RLS Policies: TICKETS
-- Users can view their own tickets, admins can view all tickets
DROP POLICY IF EXISTS "Users can view own tickets or admin views all" ON public.tickets;
CREATE POLICY "Users can view own tickets or admin views all"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can create a ticket for themselves (must be status 'pending')
DROP POLICY IF EXISTS "Users can insert own pending ticket" ON public.tickets;
CREATE POLICY "Users can insert own pending ticket"
  ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can update any ticket (Approve / Reject)
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets"
  ON public.tickets
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete tickets if needed
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.tickets;
CREATE POLICY "Admins can delete tickets"
  ON public.tickets
  FOR DELETE
  USING (public.is_admin());

-- ==========================================================
-- PRO TIP: How to promote your account to Admin
-- 1. Sign up on the web app with your email (e.g., admin@vpjoshi.in)
-- 2. Run this command in Supabase SQL Editor:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@vpjoshi.in';
-- ==========================================================

