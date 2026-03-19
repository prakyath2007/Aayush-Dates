-- ============================================================================
-- LoveMarket — Seed Data
-- Run this AFTER migration.sql in the Supabase SQL Editor
-- ============================================================================

-- Insert mock profiles (no user_id — these are "NPC" profiles for the market)
-- In production, real users create profiles through signup

INSERT INTO profiles (name, age, location, height, education, job, company, bio, interests, instagram, linkedin, strava, ipo_price, current_price, previous_price, all_time_high, all_time_low, volume_24h, total_volume, market_cap, total_longs, total_shorts, unique_viewers, demand_score, composite_score) VALUES
('Sarah Chen', 26, 'San Francisco, CA', '5''6"', 'Stanford University', 'Product Manager', 'Stripe', 'Building the future of fintech by day, exploring hidden coffee shops by night.', '{"Travel","Coffee","Photography","Tech","Hiking","Art"}', TRUE, TRUE, FALSE, 120.0, 167.32, 163.10, 185.40, 98.50, 42, 1260, 31600, 189, 47, 342, 7.8, 76),

('Marcus Johnson', 28, 'New York, NY', '6''1"', 'NYU Stern', 'Investment Analyst', 'Goldman Sachs', 'Finance professional who lives for the markets and weekend basketball.', '{"Sports","Finance","Cooking","Music","Travel"}', TRUE, TRUE, TRUE, 110.0, 182.45, 178.20, 201.30, 95.00, 58, 1890, 42800, 245, 32, 456, 8.5, 82),

('Priya Sharma', 25, 'Austin, TX', '5''4"', 'UT Austin', 'UX Designer', 'Meta', 'Designing beautiful experiences and chasing sunsets. Yoga lover, amateur chef.', '{"Yoga","Art","Cooking","Reading","Music","Fashion"}', TRUE, FALSE, FALSE, 100.0, 134.80, 131.50, 148.90, 88.20, 28, 840, 18200, 134, 62, 267, 6.4, 68),

('Jake Williams', 30, 'Los Angeles, CA', '5''11"', 'UCLA', 'Creative Director', 'Independent', 'Creative soul navigating LA. I make films, collect vinyl, and believe in street tacos.', '{"Movies","Music","Art","Photography","Travel","Cooking"}', TRUE, FALSE, FALSE, 95.0, 112.90, 110.40, 128.50, 82.00, 19, 620, 11800, 89, 54, 198, 5.8, 61),

('Emma Rodriguez', 27, 'Miami, FL', '5''7"', 'University of Miami', 'Marketing Director', 'Spotify', 'Music is my love language. Live shows, beach days, and perfecting arepas.', '{"Music","Dancing","Cooking","Travel","Fashion","Fitness"}', TRUE, TRUE, TRUE, 130.0, 198.20, 192.80, 215.60, 112.00, 67, 2340, 52800, 312, 28, 521, 9.1, 88),

('Alex Park', 24, 'Seattle, WA', '5''9"', 'University of Washington', 'Software Engineer', 'Amazon', 'Full-stack developer and weekend hiker. Board game nights are mandatory.', '{"Tech","Hiking","Gaming","Coffee","Reading","Cooking"}', FALSE, TRUE, TRUE, 105.0, 141.55, 138.90, 156.20, 91.30, 35, 980, 22400, 156, 41, 312, 7.2, 72),

('Olivia Kim', 29, 'Chicago, IL', '5''5"', 'Northwestern University', 'Data Scientist', 'Airbnb', 'I find patterns in data and joy in jazz bars. Strong opinions on deep dish.', '{"Tech","Music","Cooking","Travel","Art","Wine"}', TRUE, TRUE, FALSE, 115.0, 156.70, 153.40, 172.80, 99.50, 44, 1450, 28900, 198, 38, 389, 7.6, 74),

('Daniel Torres', 31, 'Denver, CO', '6''0"', 'Colorado State University', 'Physical Therapist', 'UCHealth', 'Helping people move better. Off-hours: skiing, climbing, marathon training.', '{"Fitness","Hiking","Sports","Dogs","Cooking","Travel"}', TRUE, FALSE, TRUE, 100.0, 128.40, 125.60, 142.10, 86.80, 24, 720, 15400, 112, 48, 234, 6.8, 66);

-- Create agent scores for each profile
DO $$
DECLARE
  p RECORD;
  agents TEXT[] := ARRAY['intent', 'social', 'activity', 'compatibility', 'health', 'market_maker', 'sentiment', 'trust', 'news'];
  agent TEXT;
  v_score FLOAT;
  v_signal TEXT;
  v_trend FLOAT;
BEGIN
  FOR p IN SELECT id, name, instagram, linkedin, strava, bio, interests FROM profiles LOOP
    FOREACH agent IN ARRAY agents LOOP
      -- Generate smart scores based on profile data
      v_score := 40 + random() * 45; -- Base 40-85

      -- Boost scores contextually
      IF agent = 'social' AND (p.instagram OR p.linkedin) THEN
        v_score := LEAST(95, v_score + 15);
      END IF;
      IF agent = 'trust' AND p.linkedin THEN
        v_score := LEAST(95, v_score + 10);
      END IF;
      IF agent = 'health' AND p.strava THEN
        v_score := LEAST(95, v_score + 20);
      END IF;
      IF agent = 'sentiment' AND LENGTH(COALESCE(p.bio, '')) > 50 THEN
        v_score := LEAST(95, v_score + 12);
      END IF;
      IF agent = 'intent' AND array_length(p.interests, 1) > 4 THEN
        v_score := LEAST(95, v_score + 10);
      END IF;

      -- Determine signal
      IF v_score >= 70 THEN v_signal := 'BUY';
      ELSIF v_score <= 40 THEN v_signal := 'SELL';
      ELSE v_signal := 'HOLD';
      END IF;

      v_trend := -3 + random() * 8;

      INSERT INTO agent_scores (profile_id, agent_id, score, signal, trend, confidence, details)
      VALUES (
        p.id, agent,
        ROUND(v_score::numeric, 1),
        v_signal,
        ROUND(v_trend::numeric, 1),
        ROUND((0.5 + random() * 0.4)::numeric, 2),
        jsonb_build_object('breakdown', 'Auto-generated evaluation for ' || agent, 'profile', p.name)
      );
    END LOOP;

    RAISE NOTICE 'Seeded agent scores for: %', p.name;
  END LOOP;
END $$;

-- Generate 30 days of price history for each profile
DO $$
DECLARE
  p RECORD;
  i INTEGER;
  v_price FLOAT;
  v_timestamp TIMESTAMPTZ;
BEGIN
  FOR p IN SELECT id, ipo_price, current_price FROM profiles LOOP
    v_price := p.ipo_price * 0.85;

    FOR i IN REVERSE 30..0 LOOP
      v_price := GREATEST(20, LEAST(400, v_price + (random() - 0.42) * 8));
      v_timestamp := NOW() - (i || ' days')::INTERVAL;

      INSERT INTO price_history (profile_id, price, volume, tick_type, timestamp)
      VALUES (p.id, ROUND(v_price::numeric, 2), FLOOR(5 + random() * 60), 'daily', v_timestamp);
    END LOOP;
  END LOOP;
END $$;

SELECT 'Seed complete! ' || COUNT(*) || ' profiles created.' FROM profiles;
