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
  trailer_url TEXT,
  metacritic INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

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
