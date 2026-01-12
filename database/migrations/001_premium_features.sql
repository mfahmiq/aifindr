-- Premium Features Migration
-- Creates subscriptions, tool_claims tables and modifies tools table

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'pro', 'featured', 'sponsor')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  payment_id TEXT,
  payment_method TEXT,
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do all on subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TOOL CLAIMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tool_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verification_method TEXT CHECK (verification_method IN ('dns', 'meta_tag', 'email', 'manual')),
  verification_data JSONB DEFAULT '{}',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_id, user_id)
);

-- Enable RLS
ALTER TABLE tool_claims ENABLE ROW LEVEL SECURITY;

-- Policies for tool_claims
CREATE POLICY "Users can view own claims" ON tool_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims" ON tool_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do all on tool_claims" ON tool_claims
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- MODIFY TOOLS TABLE
-- =============================================
DO $$ 
BEGIN
  -- Add owner_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE tools ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add click_count column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools' AND column_name = 'click_count'
  ) THEN
    ALTER TABLE tools ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tool_claims_tool_id ON tool_claims(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_claims_user_id ON tool_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_owner_id ON tools(owner_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID, p_plan TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_plan IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = p_user_id 
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > NOW())
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = p_user_id 
      AND plan = p_plan
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > NOW())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND (ends_at IS NULL OR ends_at > NOW())
  ORDER BY 
    CASE plan 
      WHEN 'sponsor' THEN 1 
      WHEN 'featured' THEN 2 
      WHEN 'pro' THEN 3 
      ELSE 4 
    END
  LIMIT 1;
  
  RETURN COALESCE(v_plan, 'free');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_claims_updated_at
  BEFORE UPDATE ON tool_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
