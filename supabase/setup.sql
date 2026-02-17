-- Friends Game Picker - Database Setup
-- Run this in your Supabase SQL Editor

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  price TEXT NOT NULL DEFAULT 'TBD',
  votes INTEGER DEFAULT 0,
  rawg_id INTEGER,
  steam_appid INTEGER,
  trailer_url TEXT,
  metacritic INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  screenshots TEXT[],
  description TEXT,
  short_description TEXT,
  platforms JSONB,
  release_date TEXT,
  developers TEXT[],
  publishers TEXT[],
  categories TEXT[],
  -- Multi-source game data
  primary_source TEXT DEFAULT 'steam',
  igdb_id INTEGER,
  epic_id TEXT,
  xbox_id TEXT,
  gog_id INTEGER,
  platform_availability JSONB
);

-- Add columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'steam_appid') THEN
    ALTER TABLE games ADD COLUMN steam_appid INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'screenshots') THEN
    ALTER TABLE games ADD COLUMN screenshots TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'description') THEN
    ALTER TABLE games ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'short_description') THEN
    ALTER TABLE games ADD COLUMN short_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'platforms') THEN
    ALTER TABLE games ADD COLUMN platforms JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'release_date') THEN
    ALTER TABLE games ADD COLUMN release_date TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'developers') THEN
    ALTER TABLE games ADD COLUMN developers TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'publishers') THEN
    ALTER TABLE games ADD COLUMN publishers TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'categories') THEN
    ALTER TABLE games ADD COLUMN categories TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'primary_source') THEN
    ALTER TABLE games ADD COLUMN primary_source TEXT DEFAULT 'steam';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'igdb_id') THEN
    ALTER TABLE games ADD COLUMN igdb_id INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'epic_id') THEN
    ALTER TABLE games ADD COLUMN epic_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'xbox_id') THEN
    ALTER TABLE games ADD COLUMN xbox_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'gog_id') THEN
    ALTER TABLE games ADD COLUMN gog_id INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'platform_availability') THEN
    ALTER TABLE games ADD COLUMN platform_availability JSONB;
  END IF;
END $$;

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public games read" ON games;
DROP POLICY IF EXISTS "Public games update" ON games;
DROP POLICY IF EXISTS "Public games insert" ON games;
DROP POLICY IF EXISTS "Public games delete" ON games;
DROP POLICY IF EXISTS "Public votes select" ON votes;
DROP POLICY IF EXISTS "Public votes insert" ON votes;
DROP POLICY IF EXISTS "Public votes delete" ON votes;

-- Allow public read access to games
CREATE POLICY "Public games read"
  ON games FOR SELECT
  USING (true);

-- Allow public update of vote counts
CREATE POLICY "Public games update"
  ON games FOR UPDATE
  USING (true);

-- Allow public insert of new games
CREATE POLICY "Public games insert"
  ON games FOR INSERT
  WITH CHECK (true);

-- Allow public delete of games
CREATE POLICY "Public games delete"
  ON games FOR DELETE
  USING (true);

-- Allow public access to votes
CREATE POLICY "Public votes select" 
  ON votes FOR SELECT 
  USING (true);

CREATE POLICY "Public votes insert" 
  ON votes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public votes delete" 
  ON votes FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_game_id ON votes(game_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_games_votes ON games(votes DESC);

-- Insert sample games (you can modify this list)
INSERT INTO games (id, title, cover, tags, price, votes) VALUES
  ('darktide', 'Warhammer 40,000: Darktide', '/covers/darktide.jpg', ARRAY['FPS', 'Co-op'], 'Free', 0),
  ('helldivers2', 'Helldivers 2', '/covers/helldivers2.jpg', ARRAY['Co-op', 'Shooter'], '$40', 0),
  ('sonsforest', 'Sons of the Forest', '/covers/sonsforest.jpg', ARRAY['Survival', 'Horror', 'Co-op'], '$30', 0),
  ('deeprock', 'Deep Rock Galactic', '/covers/deeprock.jpg', ARRAY['Co-op', 'Shooter', 'FPS'], '$30', 0),
  ('lethal', 'Lethal Company', '/covers/lethal.jpg', ARRAY['Horror', 'Co-op'], '$10', 0),
  ('phasmophobia', 'Phasmophobia', '/covers/phasmophobia.jpg', ARRAY['Horror', 'Co-op'], '$14', 0),
  ('valheim', 'Valheim', '/covers/valheim.jpg', ARRAY['Survival', 'Co-op', 'RPG'], '$20', 0),
  ('l4d2', 'Left 4 Dead 2', '/covers/l4d2.jpg', ARRAY['Co-op', 'Shooter', 'FPS'], '$10', 0),
  ('palworld', 'Palworld', '/covers/palworld.jpg', ARRAY['Survival', 'Co-op'], '$30', 0),
  ('rust', 'Rust', '/covers/rust.jpg', ARRAY['Survival', 'Shooter'], '$40', 0),
  ('7days', '7 Days to Die', '/covers/7days.jpg', ARRAY['Survival', 'Horror', 'Co-op'], '$25', 0),
  ('theforest', 'The Forest', '/covers/theforest.jpg', ARRAY['Survival', 'Horror', 'Co-op'], '$20', 0)
ON CONFLICT (id) DO NOTHING;

-- Create index for IGDB lookups
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON games(igdb_id) WHERE igdb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_primary_source ON games(primary_source);

-- =====================================================
-- DISCORD AUTH + RANKED VOTING SYSTEM
-- =====================================================

-- User profiles (synced from Discord OAuth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT UNIQUE NOT NULL,
  discord_username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Polls (voting sessions)
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Game Night Vote',
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ends_at TIMESTAMP,
  max_ranks INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ranked votes (replaces simple votes for polls)
CREATE TABLE IF NOT EXISTS ranked_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(poll_id, user_id, rank),  -- One game per rank per user per poll
  UNIQUE(poll_id, user_id, game_id) -- Can't vote for same game twice
);

-- Enable Row Level Security for new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Public profiles read" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public polls read" ON polls;
DROP POLICY IF EXISTS "Authenticated create polls" ON polls;
DROP POLICY IF EXISTS "Creator can update poll" ON polls;
DROP POLICY IF EXISTS "Public votes read" ON ranked_votes;
DROP POLICY IF EXISTS "Authenticated users vote" ON ranked_votes;
DROP POLICY IF EXISTS "Users can change own votes" ON ranked_votes;

-- Profiles RLS policies
CREATE POLICY "Public profiles read" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls RLS policies
CREATE POLICY "Public polls read" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Authenticated create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update poll" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

-- Ranked votes RLS policies
CREATE POLICY "Public votes read" ON ranked_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users vote" ON ranked_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own votes" ON ranked_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ranked_votes_poll ON ranked_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_ranked_votes_user ON ranked_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_ranked_votes_game ON ranked_votes(game_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON profiles(discord_id);