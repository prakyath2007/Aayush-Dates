-- ============================================================================
-- Evolve — Full Database Migration for Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ============================================================================
-- 1. PROFILES — Every user is a "stock" on the market
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE DEFAULT NULL,
  -- user_id is NULL for NPC/mock profiles, set for real users

  -- Personal info
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  height TEXT,
  education TEXT,
  job TEXT,
  company TEXT,
  bio TEXT,
  photo_url TEXT,
  interests TEXT[] DEFAULT '{}',

  -- Connected socials
  instagram BOOLEAN DEFAULT FALSE,
  linkedin BOOLEAN DEFAULT FALSE,
  strava BOOLEAN DEFAULT FALSE,

  -- Market data
  ipo_price FLOAT DEFAULT 100.0,
  current_price FLOAT DEFAULT 100.0,
  previous_price FLOAT DEFAULT 100.0,
  all_time_high FLOAT DEFAULT 100.0,
  all_time_low FLOAT DEFAULT 100.0,
  volume_24h INTEGER DEFAULT 0,
  total_volume INTEGER DEFAULT 0,
  market_cap FLOAT DEFAULT 0.0,

  -- Bank of Users metrics
  total_longs INTEGER DEFAULT 0,
  total_shorts INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  demand_score FLOAT DEFAULT 5.0,

  -- AI composite score
  composite_score FLOAT DEFAULT 50.0,

  -- Settings
  anonymous BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. AGENT SCORES — 9 AI agents score each profile
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  agent_id TEXT NOT NULL, -- 'intent', 'social', 'activity', etc.
  score FLOAT DEFAULT 50.0,
  signal TEXT DEFAULT 'HOLD', -- BUY, SELL, HOLD
  trend FLOAT DEFAULT 0.0,
  confidence FLOAT DEFAULT 0.5,
  details JSONB DEFAULT '{}',

  last_tick_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, agent_id)
);

-- ============================================================================
-- 3. POSITIONS — User goes LONG or SHORT on a profile
-- ============================================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('LONG', 'SHORT')),
  entry_price FLOAT NOT NULL,
  amount FLOAT DEFAULT 1.0,
  token_cost INTEGER DEFAULT 100,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),

  current_value FLOAT DEFAULT 0.0,
  unrealized_pnl FLOAT DEFAULT 0.0,

  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  close_price FLOAT,
  realized_pnl FLOAT
);

CREATE INDEX IF NOT EXISTS idx_positions_user_status ON positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_profile ON positions(profile_id);

-- ============================================================================
-- 4. TRADES — Immutable trade log
-- ============================================================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position_id UUID,

  action TEXT NOT NULL, -- 'OPEN_LONG', 'OPEN_SHORT', 'CLOSE_LONG', 'CLOSE_SHORT'
  price FLOAT NOT NULL,
  amount FLOAT DEFAULT 1.0,
  token_cost INTEGER NOT NULL,
  pnl FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_profile ON trades(profile_id);

-- ============================================================================
-- 5. PRICE HISTORY — Time-series for charts
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  price FLOAT NOT NULL,
  volume INTEGER DEFAULT 0,
  tick_type TEXT DEFAULT 'daily', -- 'daily', 'hourly', 'on_open'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_profile_time ON price_history(profile_id, timestamp DESC);

-- ============================================================================
-- 6. TOKEN LEDGER — Track token spending/earning
-- ============================================================================
CREATE TABLE IF NOT EXISTS token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  amount INTEGER NOT NULL, -- positive = earned, negative = spent
  reason TEXT NOT NULL, -- 'daily_allocation', 'trade_cost', 'dividend', 'close_position'
  balance INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_ledger_user ON token_ledger(user_id);

-- ============================================================================
-- 7. TICK LOG — Record of every price update cycle
-- ============================================================================
CREATE TABLE IF NOT EXISTS tick_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tick_type TEXT NOT NULL,
  triggered_by TEXT,
  profiles_updated INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. WATCHLIST
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, profile_id)
);

-- ============================================================================
-- 9. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL, -- 'price_alert', 'match', 'dividend', 'position_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tick_log ENABLE ROW LEVEL SECURITY;

-- PROFILES: Everyone can read active profiles, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (active = TRUE);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- AGENT SCORES: Everyone can read (transparency!)
CREATE POLICY "Agent scores are viewable by everyone" ON agent_scores
  FOR SELECT USING (TRUE);

-- POSITIONS: Users can only see their own
CREATE POLICY "Users can view their own positions" ON positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create positions" ON positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" ON positions
  FOR UPDATE USING (auth.uid() = user_id);

-- TRADES: Users can only see their own
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PRICE HISTORY: Everyone can read (public market data)
CREATE POLICY "Price history is viewable by everyone" ON price_history
  FOR SELECT USING (TRUE);

-- TOKEN LEDGER: Users can only see their own
CREATE POLICY "Users can view their own token ledger" ON token_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert token entries" ON token_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WATCHLIST: Users can manage their own
CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS: Users can see their own
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- TICK LOG: Everyone can read
CREATE POLICY "Tick logs are viewable by everyone" ON tick_log
  FOR SELECT USING (TRUE);

-- ============================================================================
-- FUNCTIONS — Server-side trade execution
-- ============================================================================

-- Function: Get user's token balance
CREATE OR REPLACE FUNCTION get_token_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM token_ledger
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function: Execute a trade (LONG or SHORT)
CREATE OR REPLACE FUNCTION execute_trade(
  p_user_id UUID,
  p_profile_id UUID,
  p_type TEXT,
  p_token_cost INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_profile profiles%ROWTYPE;
  v_position_id UUID;
  v_trade_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Check token balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM token_ledger WHERE user_id = p_user_id;

  IF v_balance < p_token_cost THEN
    RETURN jsonb_build_object('error', 'Insufficient tokens', 'balance', v_balance);
  END IF;

  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Create position
  INSERT INTO positions (user_id, profile_id, type, entry_price, token_cost)
  VALUES (p_user_id, p_profile_id, p_type, v_profile.current_price, p_token_cost)
  RETURNING id INTO v_position_id;

  -- Log trade
  INSERT INTO trades (user_id, profile_id, position_id, action, price, token_cost)
  VALUES (p_user_id, p_profile_id, v_position_id, 'OPEN_' || p_type, v_profile.current_price, p_token_cost)
  RETURNING id INTO v_trade_id;

  -- Deduct tokens
  v_new_balance := v_balance - p_token_cost;
  INSERT INTO token_ledger (user_id, amount, reason, balance)
  VALUES (p_user_id, -p_token_cost, 'trade_cost', v_new_balance);

  -- Update profile market data
  IF p_type = 'LONG' THEN
    UPDATE profiles SET
      total_longs = total_longs + 1,
      volume_24h = volume_24h + 1,
      total_volume = total_volume + 1,
      demand_score = LEAST(10, demand_score + 0.1),
      updated_at = NOW()
    WHERE id = p_profile_id;
  ELSE
    UPDATE profiles SET
      total_shorts = total_shorts + 1,
      volume_24h = volume_24h + 1,
      total_volume = total_volume + 1,
      demand_score = GREATEST(0, demand_score - 0.1),
      updated_at = NOW()
    WHERE id = p_profile_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'position_id', v_position_id,
    'trade_id', v_trade_id,
    'entry_price', v_profile.current_price,
    'token_cost', p_token_cost,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Close a position
CREATE OR REPLACE FUNCTION close_position(
  p_user_id UUID,
  p_position_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_position positions%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_pnl FLOAT;
  v_token_return INTEGER;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get position
  SELECT * INTO v_position FROM positions
  WHERE id = p_position_id AND user_id = p_user_id AND status = 'OPEN';

  IF v_position IS NULL THEN
    RETURN jsonb_build_object('error', 'Position not found or already closed');
  END IF;

  -- Get current profile price
  SELECT * INTO v_profile FROM profiles WHERE id = v_position.profile_id;

  -- Calculate P&L
  IF v_position.type = 'LONG' THEN
    v_pnl := (v_profile.current_price - v_position.entry_price) * v_position.amount;
  ELSE
    v_pnl := (v_position.entry_price - v_profile.current_price) * v_position.amount;
  END IF;

  -- Close position
  UPDATE positions SET
    status = 'CLOSED',
    closed_at = NOW(),
    close_price = v_profile.current_price,
    realized_pnl = v_pnl,
    current_value = v_profile.current_price * v_position.amount
  WHERE id = p_position_id;

  -- Log close trade
  INSERT INTO trades (user_id, profile_id, position_id, action, price, token_cost, pnl)
  VALUES (
    p_user_id, v_position.profile_id, p_position_id,
    'CLOSE_' || v_position.type, v_profile.current_price,
    0, v_pnl
  );

  -- Return tokens + P&L
  v_token_return := v_position.token_cost + GREATEST(-v_position.token_cost, FLOOR(v_pnl * 10));
  SELECT COALESCE(SUM(amount), 0) INTO v_balance FROM token_ledger WHERE user_id = p_user_id;
  v_new_balance := v_balance + v_token_return;

  INSERT INTO token_ledger (user_id, amount, reason, balance)
  VALUES (p_user_id, v_token_return, 'close_position', v_new_balance);

  RETURN jsonb_build_object(
    'success', TRUE,
    'pnl', v_pnl,
    'token_return', v_token_return,
    'close_price', v_profile.current_price,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agent_scores_updated_at
  BEFORE UPDATE ON agent_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
