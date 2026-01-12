-- Add dominant_color column to tools table
ALTER TABLE tools ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

-- Create anonymous_favorites table for session-based favorites
CREATE TABLE IF NOT EXISTS anonymous_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    anon_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tool_id, anon_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_favorites_tool ON anonymous_favorites(tool_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_favorites_anon ON anonymous_favorites(anon_id);

-- Comment for documentation
COMMENT ON TABLE anonymous_favorites IS 'Stores favorite tools for anonymous (non-logged-in) users based on session cookie';
COMMENT ON COLUMN tools.dominant_color IS 'Hex color extracted from logo image, e.g. #3b82f6';
