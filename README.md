# Friends Game Picker

A group decision tool for picking what game to play. Vote, rank, and decide together.

## Features

- **Multi-Source Game Search** -- Search Steam and IGDB simultaneously with auto-deduplication
- **Anonymous Voting** -- Session-based upvoting with real-time vote counts
- **Ranked-Choice Polls** -- Discord-authenticated ranked voting with Borda count scoring
- **Pick For Us** -- Slot-machine randomizer from your filtered game pool
- **Game Comparison** -- Side-by-side comparison of up to 3 games
- **Reactions** -- Mark games as "Played It", "Own It", or "Down to Try"
- **Multiple Views** -- Grid, list, and compact views with adjustable card sizes
- **Filters & Presets** -- Filter by tags, sources, price; save and load filter presets
- **Drag & Drop Ordering** -- Custom game arrangement via drag and drop
- **Flip Cards** -- Click any card to reveal details, trailer link, and reactions
- **Top-3 Glow** -- Gold/silver/bronze neon glow on the highest-voted games
- **Recently Added Row** -- Horizontal scroll of games added in the last 7 days
- **Keyboard Navigation** -- Full keyboard support (arrow keys, shortcuts for modals)
- **Site Password Gate** -- Simple password protection to keep the app private
- **Discord OAuth** -- Login with Discord for ranked poll voting
- **Mobile Responsive** -- Floating action button, bottom sheets, touch targets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS 3 + custom cyberpunk neon theme |
| UI Primitives | Radix UI (dialog, dropdown, popover, tabs, etc.) |
| Animation | Framer Motion |
| Drag & Drop | @dnd-kit |
| Virtualization | @tanstack/react-virtual |
| Icons | react-icons + lucide-react |
| Backend/DB | Supabase (PostgreSQL + Auth) |
| Auth | Site password (cookie) + Discord OAuth (Supabase Auth) |
| Notifications | react-hot-toast |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run everything from `supabase/setup.sql`
3. (Optional) Run `supabase/secure-policies.sql` for tighter RLS policies

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your credentials (see `.env.local.example` for all required/optional vars):

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `ACCESS_PASSWORD` | Yes | Site password gate |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side poll results |
| `TWITCH_CLIENT_ID` | Optional | IGDB game search |
| `TWITCH_CLIENT_SECRET` | Optional | IGDB game search |

### 4. (Optional) Set Up Discord OAuth

1. In Supabase dashboard: Authentication > Providers > Discord
2. Create a Discord application at [discord.com/developers](https://discord.com/developers)
3. Add the Supabase callback URL to your Discord app's redirects

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
friends-game-picker/
├── app/
│   ├── api/
│   │   ├── auth/route.ts              # Site password auth
│   │   ├── games/search/route.ts      # Unified multi-source game search
│   │   ├── igdb/                      # IGDB proxy routes
│   │   ├── polls/[id]/results/        # Server-side poll results
│   │   └── steam/                     # Steam proxy routes
│   ├── auth/callback/route.ts         # Discord OAuth callback
│   ├── components/
│   │   ├── AddGameModal.tsx           # Multi-source game search + add
│   │   ├── CompareModal.tsx           # Side-by-side game comparison
│   │   ├── FilterBar.tsx              # Search, filters, sort, presets
│   │   ├── FloatingActionButton.tsx   # Mobile FAB
│   │   ├── GameCard.tsx               # Flip card with reactions
│   │   ├── GameListItem.tsx           # List view row
│   │   ├── ImportModal.tsx            # JSON bulk import
│   │   ├── LoginButton.tsx            # Discord login/avatar
│   │   ├── PickerModal.tsx            # Slot machine randomizer
│   │   ├── PollBanner.tsx             # Active poll indicator
│   │   ├── PollManager.tsx            # Create/end polls
│   │   ├── ReactionButtons.tsx        # Played/Own/Try buttons
│   │   ├── RecentlyAddedRow.tsx       # Horizontal scroll of new games
│   │   ├── TrailerModal.tsx           # Video trailer player
│   │   ├── ui/                        # Reusable UI primitives
│   │   └── views/                     # Grid, grouped grid, list views
│   ├── login/page.tsx                 # Password gate page
│   ├── polls/page.tsx                 # Poll history page
│   ├── globals.css                    # Cyberpunk neon design system
│   ├── layout.tsx                     # Root layout + fonts
│   └── page.tsx                       # Main game grid page
├── lib/
│   ├── auth-context.tsx               # Discord auth provider
│   ├── game-context.tsx               # Split game state contexts
│   ├── constants.ts                   # App-wide constants
│   ├── hooks/
│   │   ├── useCompare.ts             # Compare selection state
│   │   ├── useFilterPresets.ts       # Saved filter configurations
│   │   ├── useFiltering.ts           # Filter/sort/search logic
│   │   ├── useFocusTrap.ts           # Modal focus management
│   │   ├── useGameData.tsx           # Games + voting data layer
│   │   ├── useKeyboardNavigation.ts  # Grid keyboard nav
│   │   ├── useMobileDetection.ts     # Viewport detection
│   │   ├── usePinnedGames.ts         # Pinned games (localStorage)
│   │   ├── usePoll.ts               # Poll state management
│   │   ├── useReactions.ts           # Game reactions state
│   │   └── useViewSettings.ts        # View mode/card size/grouping
│   ├── services/igdb.ts              # IGDB API client
│   ├── steam.ts                      # Steam API helpers
│   ├── supabase.ts                   # Supabase client
│   ├── types.ts                      # TypeScript interfaces
│   ├── utils.ts                      # Utility functions
│   └── votes.ts                      # DB operations (games, votes, polls, reactions)
├── supabase/
│   ├── setup.sql                     # Full database schema
│   └── secure-policies.sql           # Hardened RLS policies
├── data/games.json                   # Sample seed data (12 games)
├── scripts/generate-sql.js           # SQL INSERT generator
└── .env.local.example                # Environment variable template
```

## Database Schema

The app uses 6 tables:

- **`games`** -- Game catalog with multi-source metadata (Steam, IGDB, Epic, etc.)
- **`votes`** -- Anonymous session-based upvotes (triggers auto-update vote counts)
- **`reactions`** -- "Played", "Own", "Want to Try" per game per session
- **`profiles`** -- Discord user profiles (synced from OAuth)
- **`polls`** -- Ranked-choice voting sessions
- **`ranked_votes`** -- Individual ranked votes within polls

See `supabase/setup.sql` for the full schema.

## How It Works

1. **Password gate**: Middleware checks for an auth cookie; unauthenticated users are redirected to `/login`
2. **Game discovery**: Search Steam and IGDB in parallel; results are deduplicated and ranked by relevance
3. **Simple voting**: Each browser gets a UUID in localStorage; one vote per game per session
4. **Ranked polls**: Discord-authenticated users create polls; others rank their top 3 choices; scores calculated via Borda count (3/2/1 points)
5. **Reactions**: Session-based reactions ("Played It", "Own It", "Down to Try") shown on the card back face
6. **Top-3 priority**: Games with the most votes get gold/silver/bronze neon glow effects
7. **Pick For Us**: Slot-machine randomizer cycles through filtered games and picks a winner with confetti

## Architecture

State management uses a split-context pattern for performance:

- **`GameDataContext`** -- Games, votes, loading state
- **`FilterContext`** -- Search, filters, sort, computed filtered/grouped games
- **`ViewContext`** -- View mode, card size, grouping, mobile detection
- **`PollContext`** -- Active poll, rankings, results
- **`InteractionContext`** -- Pinned games, compare, presets, custom order

Each context is memoized independently so components only re-render when their specific slice of state changes. A unified `useGameContext()` hook is available for backward compatibility.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` or `N` | Open Add Game modal |
| `P` | Open Pick For Us |
| `I` | Open Import |
| `/` or `Ctrl+K` | Focus search |
| Arrow keys | Navigate game grid |
| `Escape` | Close modals |

## Deployment

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

Share the URL with your friends and start voting.

## License

MIT
