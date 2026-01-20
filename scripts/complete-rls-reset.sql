-- COMPLETE RLS RESET AND FIX
-- Run this in Supabase SQL Editor to completely fix the infinite recursion

-- =============================================
-- STEP 1: DISABLE RLS ON ALL AFFECTED TABLES
-- =============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE tool_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- =============================================

-- Users policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can do everything on users" ON users;
DROP POLICY IF EXISTS "Anyone can read users" ON users;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Anyone can read subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Tools policies
DROP POLICY IF EXISTS "Tools are viewable by everyone" ON tools;
DROP POLICY IF EXISTS "Authenticated users can insert tools" ON tools;
DROP POLICY IF EXISTS "Owners can update their own tools" ON tools;
DROP POLICY IF EXISTS "Admins can update any tool" ON tools;
DROP POLICY IF EXISTS "Admins can delete any tool" ON tools;

-- Tool claims policies
DROP POLICY IF EXISTS "Users can view own claims" ON tool_claims;
DROP POLICY IF EXISTS "Authenticated users can create claims" ON tool_claims;
DROP POLICY IF EXISTS "Admins can do everything on tool_claims" ON tool_claims;
DROP POLICY IF EXISTS "Admins can view all claims" ON tool_claims;

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- Anonymous favorites
DROP POLICY IF EXISTS "Public access to anonymous_favorites" ON anonymous_favorites;

-- =============================================
-- STEP 3: RE-ENABLE RLS WITH SIMPLE POLICIES
-- =============================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_favorites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: CREATE SIMPLE NON-RECURSIVE POLICIES
-- =============================================

-- USERS: Simple policies without any subqueries
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete" ON users FOR DELETE USING (auth.uid() = id);

-- SUBSCRIPTIONS: Simple policies
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (true);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- TOOLS: Simple policies
CREATE POLICY "tools_select" ON tools FOR SELECT USING (true);
CREATE POLICY "tools_insert" ON tools FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tools_update" ON tools FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "tools_delete" ON tools FOR DELETE USING (auth.uid() = owner_id);

-- TOOL_CLAIMS: Simple policies
CREATE POLICY "tool_claims_select" ON tool_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tool_claims_insert" ON tool_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REVIEWS: Simple policies
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- ANONYMOUS_FAVORITES: Public access
CREATE POLICY "anonymous_favorites_all" ON anonymous_favorites FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- DONE! All policies are now simple and non-recursive
-- =============================================
