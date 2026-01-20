-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor

-- Step 1: Create a security definer function to check admin status
-- This bypasses RLS when checking the users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
$$;

-- Step 2: Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can do everything on tool_claims" ON tool_claims;
DROP POLICY IF EXISTS "Admins can update any tool" ON tools;
DROP POLICY IF EXISTS "Admins can delete any tool" ON tools;

-- Step 3: Recreate admin policies using the security definer function
CREATE POLICY "Admins can do everything on tool_claims" ON tool_claims FOR ALL USING (
    public.is_admin()
);

CREATE POLICY "Admins can update any tool" ON tools FOR UPDATE USING (
    auth.uid() = owner_id OR public.is_admin()
);

CREATE POLICY "Admins can delete any tool" ON tools FOR DELETE USING (
    public.is_admin()
);

-- Step 4: Add admin policy for subscriptions (to fix 500 error)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
);

-- Step 5: Add admin policy for viewing all claims
DROP POLICY IF EXISTS "Admins can view all claims" ON tool_claims;
CREATE POLICY "Admins can view all claims" ON tool_claims FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
);

-- Step 6: Add policy for users to insert themselves
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 7: Admin policy for users table (using security definer)
DROP POLICY IF EXISTS "Admins can do everything on users" ON users;
CREATE POLICY "Admins can do everything on users" ON users FOR ALL USING (
    public.is_admin() OR auth.uid() = id
);
