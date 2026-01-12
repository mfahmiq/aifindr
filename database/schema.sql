-- =====================================================
-- AI TOOLS DIRECTORY - DATABASE SCHEMA
-- Platform: PostgreSQL (Supabase Compatible)
-- Created: 2026-01-05
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name
    color VARCHAR(50), -- tailwind color class
    tool_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TOOLS TABLE (Main entity)
-- =====================================================
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    long_description TEXT,
    website_url TEXT NOT NULL,
    logo_url TEXT,
    video_url TEXT, -- Pro feature: demo video
    
    -- Pricing
    pricing_type VARCHAR(50) DEFAULT 'Freemium' 
        CHECK (pricing_type IN ('Free', 'Freemium', 'Paid', 'Trial')),
    
    -- Subscription Plan
    plan VARCHAR(50) DEFAULT 'Free' 
        CHECK (plan IN ('Free', 'Pro', 'Sponsor', 'Featured')),
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Category
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    rejection_reason TEXT,
    
    -- Verification & Benefits
    is_verified BOOLEAN DEFAULT FALSE,
    is_priority BOOLEAN DEFAULT FALSE, -- Jump to top
    has_backlink BOOLEAN DEFAULT FALSE, -- Do-follow backlink
    has_premium_support BOOLEAN DEFAULT FALSE,
    
    -- Features
    has_free_trial BOOLEAN DEFAULT FALSE,
    has_api BOOLEAN DEFAULT FALSE,
    is_open_source BOOLEAN DEFAULT FALSE,
    
    -- Stats (denormalized for performance)
    rating DECIMAL(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    
    -- Submitter info
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_email VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TOOL FEATURES TABLE
-- =====================================================
CREATE TABLE tool_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TAGS TABLE
-- =====================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TOOL TAGS (Many-to-Many)
-- =====================================================
CREATE TABLE tool_tags (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, tag_id)
);

-- =====================================================
-- 7. REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Guest reviews (if not logged in)
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    
    -- Moderation
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. REVIEW HELPFUL VOTES
-- =====================================================
CREATE TABLE review_votes (
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (review_id, user_id)
);

-- =====================================================
-- 9. FAVORITES (User bookmarks)
-- =====================================================
CREATE TABLE favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, tool_id)
);

-- =====================================================
-- 10. BLOG POSTS TABLE
-- =====================================================
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    
    -- Author
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    author_avatar TEXT,
    
    -- Metadata
    category VARCHAR(100) NOT NULL,
    read_time INTEGER DEFAULT 5, -- minutes
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. DEALS TABLE
-- =====================================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    
    discount VARCHAR(100) NOT NULL, -- "20% OFF", "Free Trial", etc
    code VARCHAR(100), -- Promo code
    description TEXT NOT NULL,
    
    -- URLs
    affiliate_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Dates
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    claim_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. ADS TABLE
-- =====================================================
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    
    -- Type of ad placement
    placement VARCHAR(50) NOT NULL 
        CHECK (placement IN ('top_banner', 'sidebar', 'inline', 'footer_cta')),
    
    -- Content
    title VARCHAR(255),
    description TEXT,
    image_url TEXT,
    link_url TEXT NOT NULL,
    cta_text VARCHAR(100) DEFAULT 'Learn More',
    
    -- Styling
    gradient_from VARCHAR(50),
    gradient_to VARCHAR(50),
    
    -- Targeting (optional)
    target_categories UUID[] DEFAULT '{}',
    
    -- Status & Scheduling
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Billing
    advertiser_name VARCHAR(255),
    advertiser_email VARCHAR(255),
    price_paid DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. NEWSLETTER SUBSCRIBERS
-- =====================================================
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Source tracking
    source VARCHAR(100), -- 'homepage', 'blog', 'footer', etc
    
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 14. TOOL VIEWS (Analytics)
-- =====================================================
CREATE TABLE tool_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Anonymous tracking
    ip_hash VARCHAR(64), -- Hashed IP for uniqueness
    user_agent TEXT,
    referrer TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 15. SUBMISSIONS (Tool submit queue)
-- =====================================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tool data (before creating actual tool)
    name VARCHAR(255) NOT NULL,
    website_url TEXT NOT NULL,
    short_description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    pricing_type VARCHAR(50) NOT NULL,
    
    -- Files
    logo_url TEXT,
    video_url TEXT,
    
    -- Plan selected
    plan VARCHAR(50) DEFAULT 'Free',
    
    -- Submitter
    submitter_email VARCHAR(255) NOT NULL,
    submitter_name VARCHAR(255),
    
    -- Payment (for Pro/Sponsor)
    payment_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id VARCHAR(255), -- Stripe/PayPal ID
    amount_paid DECIMAL(10,2),
    
    -- Review status
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Converted to tool
    tool_id UUID REFERENCES tools(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 16. ACTIVITY LOG (Admin audit trail)
-- =====================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- 'tool.approve', 'review.delete', etc
    entity_type VARCHAR(50) NOT NULL, -- 'tool', 'review', 'deal', etc
    entity_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tools
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_tools_category ON tools(category_id);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_plan ON tools(plan);
CREATE INDEX idx_tools_rating ON tools(rating DESC);
CREATE INDEX idx_tools_views ON tools(view_count DESC);
CREATE INDEX idx_tools_created ON tools(created_at DESC);

-- Reviews
CREATE INDEX idx_reviews_tool ON reviews(tool_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Blog
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_published ON blog_posts(published_at DESC);

-- Deals
CREATE INDEX idx_deals_tool ON deals(tool_id);
CREATE INDEX idx_deals_active ON deals(is_active, expires_at);

-- Ads
CREATE INDEX idx_ads_placement ON ads(placement);
CREATE INDEX idx_ads_active ON ads(is_active, starts_at, ends_at);

-- Analytics
CREATE INDEX idx_tool_views_tool ON tool_views(tool_id);
CREATE INDEX idx_tool_views_date ON tool_views(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Public read access for approved tools
CREATE POLICY "Public tools are viewable by everyone" ON tools
    FOR SELECT USING (status = 'approved');

-- Public read access for approved reviews
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
    FOR SELECT USING (status = 'approved');

-- Users can manage their own favorites
CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own reviews
CREATE POLICY "Users can manage their own reviews" ON reviews
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Initial Categories
-- =====================================================
INSERT INTO categories (name, slug, icon, color) VALUES
    ('Chat', 'chat', '💬', 'blue'),
    ('Image', 'image', '🎨', 'purple'),
    ('Video', 'video', '🎬', 'red'),
    ('Coding', 'coding', '💻', 'green'),
    ('Audio', 'audio', '🎵', 'pink'),
    ('Productivity', 'productivity', '📊', 'orange'),
    ('Writing', 'writing', '✍️', 'yellow');

-- =====================================================
-- SEED DATA: Initial Tags
-- =====================================================
INSERT INTO tags (name, slug) VALUES
    ('AI Assistant', 'ai-assistant'),
    ('Image Generation', 'image-generation'),
    ('Coding', 'coding'),
    ('Writing', 'writing'),
    ('API Available', 'api-available'),
    ('Open Source', 'open-source'),
    ('Free', 'free'),
    ('Productivity', 'productivity'),
    ('Creative', 'creative'),
    ('Developer Tools', 'developer-tools');
