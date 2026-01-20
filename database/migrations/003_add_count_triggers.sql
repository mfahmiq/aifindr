-- Migration: Add atomic triggers for tool stats (view_count and favorite_count)
-- Optimized to preserve historical counts (increment/decrement instead of total recalculation)

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

-- 2. Function to update favorite_count (increment/decrement to preserve manual/historical counts)
CREATE OR REPLACE FUNCTION update_tool_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE tools
        SET favorite_count = COALESCE(favorite_count, 0) + 1
        WHERE id = NEW.tool_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tools
        SET favorite_count = GREATEST(0, COALESCE(favorite_count, 0) - 1)
        WHERE id = OLD.tool_id;
        RETURN OLD;
    END IF;
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
