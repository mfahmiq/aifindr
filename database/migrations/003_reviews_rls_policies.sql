-- Migration: Enable RLS for reviews table and add policies for public review submissions
-- Run this in Supabase SQL Editor

-- Enable RLS on reviews table if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to insert reviews
-- Reviews will be moderated before being shown publicly
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to read approved reviews  
CREATE POLICY "Anyone can read approved reviews" ON reviews
    FOR SELECT
    USING (status = 'approved');

-- Allow authenticated users to read their own reviews regardless of status
CREATE POLICY "Users can read own reviews" ON reviews
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to update their own pending reviews
CREATE POLICY "Users can update own pending reviews" ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Note: For full admin access, you may need to add a policy like:
-- CREATE POLICY "Admins can do everything" ON reviews
--     FOR ALL
--     USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
