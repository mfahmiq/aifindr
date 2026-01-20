-- Migration: Add atomic triggers for tool stats (view_count and favorite_count)

-- 1. Function to increment view_count
CREATE OR REPLACE FUNCTION increment_tool_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tools
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = NEW.tool_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to update favorite_count (sum of favorites and anonymous_favorites)
CREATE OR REPLACE FUNCTION update_tool_favorite_count()
RETURNS TRIGGER AS $$
DECLARE
    target_tool_id UUID;
    auth_count INTEGER;
    anon_count INTEGER;
BEGIN
    -- Determine which tool_id to update
    IF (TG_OP = 'DELETE') THEN
        target_tool_id := OLD.tool_id;
    ELSE
        target_tool_id := NEW.tool_id;
    END IF;

    -- Calculate current counts
    SELECT COUNT(*) INTO auth_count FROM favorites WHERE tool_id = target_tool_id;
    SELECT COUNT(*) INTO anon_count FROM anonymous_favorites WHERE tool_id = target_tool_id;

    -- Update tools table
    UPDATE tools
    SET favorite_count = auth_count + anon_count
    WHERE id = target_tool_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers for tool_views
DROP TRIGGER IF EXISTS tr_increment_view_count ON tool_views;
CREATE TRIGGER tr_increment_view_count
AFTER INSERT ON tool_views
FOR EACH ROW
EXECUTE FUNCTION increment_tool_view_count();

-- 4. Create triggers for favorites
DROP TRIGGER IF EXISTS tr_update_favorite_count_auth ON favorites;
CREATE TRIGGER tr_update_favorite_count_auth
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_tool_favorite_count();

-- 5. Create triggers for anonymous_favorites
DROP TRIGGER IF EXISTS tr_update_favorite_count_anon ON anonymous_favorites;
CREATE TRIGGER tr_update_favorite_count_anon
AFTER INSERT OR DELETE ON anonymous_favorites
FOR EACH ROW
EXECUTE FUNCTION update_tool_favorite_count();
