-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_favorites ENABLE ROW LEVEL SECURITY;

-- USERS Table Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- TOOLS Table Policies
DROP POLICY IF EXISTS "Tools are viewable by everyone" ON tools;
CREATE POLICY "Tools are viewable by everyone" ON tools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tools" ON tools;
CREATE POLICY "Authenticated users can insert tools" ON tools FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can update their own tools" ON tools;
CREATE POLICY "Owners can update their own tools" ON tools FOR UPDATE USING (auth.uid() = owner_id);

-- TOOL_CLAIMS Table Policies
DROP POLICY IF EXISTS "Users can view own claims" ON tool_claims;
CREATE POLICY "Users can view own claims" ON tool_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create claims" ON tool_claims;
CREATE POLICY "Authenticated users can create claims" ON tool_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- REVIEWS Table Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- SUBSCRIPTIONS Table Policies
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ADMIN POLICIES (Assuming 'admin' role in users table)
DROP POLICY IF EXISTS "Admins can do everything on tool_claims" ON tool_claims;
CREATE POLICY "Admins can do everything on tool_claims" ON tool_claims FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- POLICY FOR ANONYMOUS_FAVORITES
DROP POLICY IF EXISTS "Public access to anonymous_favorites" ON anonymous_favorites;
CREATE POLICY "Public access to anonymous_favorites" ON anonymous_favorites FOR ALL USING (true) WITH CHECK (true);

-- Admins can update any tool
DROP POLICY IF EXISTS "Admins can update any tool" ON tools;
CREATE POLICY "Admins can update any tool" ON tools FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can delete tools (if needed)
DROP POLICY IF EXISTS "Admins can delete any tool" ON tools;
CREATE POLICY "Admins can delete any tool" ON tools FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

