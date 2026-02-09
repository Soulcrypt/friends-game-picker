# 🎮 Friends Game Picker

A lean decision tool for groups picking a game fast. No accounts, no fluff, optimized for voting and sorting.

## Features

- 🗳️ Anonymous voting system
- 🎨 Dark theme UI
- 🔍 Search and filter games
- 🏆 Visual priority for top 3 games
- 📱 Responsive design
- ⚡ Fast sorting (Most Votes / A-Z)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run these commands:

```sql
-- Create games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  price TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to games
CREATE POLICY "Public games read" ON games FOR SELECT USING (true);
CREATE POLICY "Public games update" ON games FOR UPDATE USING (true);

-- Allow public access to votes
CREATE POLICY "Public votes" ON votes FOR ALL USING (true);
```

3. Insert initial game data from `data/games.json` into the `games` table

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard → Project Settings → API

### 4. Add Game Covers

Place game cover images in `public/covers/` directory. Images should be:
- 2:3 aspect ratio (e.g., 400x600px)
- Named according to game IDs in the database
- Format: JPG or PNG

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Share the URL with your friends and start voting.

## Project Structure

```
friends-game-picker/
├── app/
│   ├── components/
│   │   ├── GameCard.tsx      # Individual game card
│   │   └── FilterBar.tsx     # Search, filters, sort
│   ├── globals.css            # Global styles + dark theme
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── votes.ts               # Voting logic
│   └── types.ts               # TypeScript types
├── data/
│   └── games.json             # Initial game data
└── public/
    └── covers/                # Game cover images
```

## How It Works

1. Each browser gets a unique session ID stored in `localStorage`
2. Users can vote once per game per session
3. Votes are stored in Supabase
4. Vote counts update in real-time
5. Top 3 games get visual priority (gold/silver/bronze glow)

## What's NOT Included (By Design)

- User accounts
- Reviews or ratings
- Comments
- Long descriptions
- Social features

This tool exists to **end the argument, not start one**.

## Future Upgrades (Only If Needed)

- "Quick Pick" button (random from top 3)
- "Installed by most players" tag
- Discord webhook when winner changes

## License

MIT
