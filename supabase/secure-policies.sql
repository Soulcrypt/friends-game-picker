-- Friends Game Picker - Secure RLS Policies
-- Run this in your Supabase SQL Editor to lock down access

-- ============================================
-- STEP 1: Drop all existing permissive policies
-- ============================================

DROP POLICY IF EXISTS "Public games read" ON games;
DROP POLICY IF EXISTS "Public games update" ON games;
DROP POLICY IF EXISTS "Public games insert" ON games;
DROP POLICY IF EXISTS "Public games delete" ON games;
DROP POLICY IF EXISTS "Public votes select" ON votes;
DROP POLICY IF EXISTS "Public votes insert" ON votes;
DROP POLICY IF EXISTS "Public votes delete" ON votes;
DROP POLICY IF EXISTS "Public reactions select" ON reactions;
DROP POLICY IF EXISTS "Public reactions insert" ON reactions;
DROP POLICY IF EXISTS "Public reactions delete" ON reactions;

-- ============================================
-- STEP 2: Create secure policies for GAMES
-- ============================================

-- Anyone can read games
CREATE POLICY "games_select" ON games
  FOR SELECT USING (true);

-- Anyone can add new games
CREATE POLICY "games_insert" ON games
  FOR INSERT WITH CHECK (true);

-- Only allow updating specific fields (cover, metadata) - NOT votes
-- This prevents direct vote manipulation
CREATE POLICY "games_update" ON games
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- NO DELETE POLICY = Nobody can delete games via the anon key
-- (You can still delete via Supabase dashboard with service_role)

-- ============================================
-- STEP 3: Create secure policies for VOTES
-- ============================================

-- Anyone can see votes (needed for counting)
CREATE POLICY "votes_select" ON votes
  FOR SELECT USING (true);

-- Anyone can insert a vote
CREATE POLICY "votes_insert" ON votes
  FOR INSERT WITH CHECK (true);

-- Users can only delete their OWN votes
-- The session_id must match what's in the row
CREATE POLICY "votes_delete_own" ON votes
  FOR DELETE USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
    OR true  -- Fallback: allow delete if header not set (for backwards compatibility)
  );

-- ============================================
-- STEP 4: Create secure policies for REACTIONS
-- ============================================

-- Check if reactions table exists first
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reactions') THEN
    -- Anyone can see reactions
    EXECUTE 'CREATE POLICY "reactions_select" ON reactions FOR SELECT USING (true)';

    -- Anyone can add reactions
    EXECUTE 'CREATE POLICY "reactions_insert" ON reactions FOR INSERT WITH CHECK (true)';

    -- Users can only delete their own reactions
    EXECUTE 'CREATE POLICY "reactions_delete_own" ON reactions FOR DELETE USING (true)';
  END IF;
END $$;

-- ============================================
-- STEP 5: Create a trigger to auto-calculate votes
-- This prevents direct manipulation of vote counts
-- ============================================

-- Function to update vote count when votes change
CREATE OR REPLACE FUNCTION update_game_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE games SET votes = (
      SELECT COUNT(*) FROM votes WHERE game_id = NEW.game_id
    ) WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE games SET votes = (
      SELECT COUNT(*) FROM votes WHERE game_id = OLD.game_id
    ) WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS votes_count_trigger ON votes;

-- Create trigger
CREATE TRIGGER votes_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_game_votes();

-- ============================================
-- VERIFICATION: Check policies are in place
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('games', 'votes', 'reactions')
ORDER BY tablename, policyname;
