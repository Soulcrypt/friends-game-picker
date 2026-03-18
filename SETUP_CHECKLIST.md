# Friends Game Picker -- Setup Checklist

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase account created ([supabase.com](https://supabase.com))

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
- [ ] Create a Supabase project
- [ ] Run `supabase/setup.sql` in SQL Editor (creates all 6 tables)
- [ ] (Optional) Run `supabase/secure-policies.sql` for hardened RLS

### 3. Environment Configuration
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (from Supabase Settings > API)
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase Settings > API)
- [ ] Set `ACCESS_PASSWORD` (any password for site access)
- [ ] (Optional) Set `SUPABASE_SERVICE_ROLE_KEY` for server-side poll results
- [ ] (Optional) Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` for IGDB search

### 4. Discord OAuth (Optional -- for Ranked Polls)
- [ ] Create Discord application at [discord.com/developers](https://discord.com/developers)
- [ ] Enable Discord provider in Supabase: Authentication > Providers > Discord
- [ ] Add Supabase callback URL to Discord app redirects

### 5. Run the App
```bash
npm run dev
```
- [ ] Open http://localhost:3000
- [ ] Enter site password
- [ ] Add your first game via search

---

## What's Included

### Pages
- `/` -- Main game grid with voting, filtering, and all game management
- `/login` -- Password gate
- `/polls` -- Poll history with expandable ranked results

### API Routes
- `/api/auth` -- Site password authentication
- `/api/games/search` -- Unified multi-source game search (Steam + IGDB)
- `/api/steam/search` and `/api/steam/details` -- Steam API proxy
- `/api/igdb/search` and `/api/igdb/details` -- IGDB API proxy
- `/api/polls/[id]/results` -- Server-side poll results
- `/auth/callback` -- Discord OAuth callback

### Database Tables
- `games` -- Game catalog with multi-source metadata
- `votes` -- Anonymous session-based upvotes
- `reactions` -- "Played", "Own", "Want to Try" reactions
- `profiles` -- Discord user profiles
- `polls` -- Ranked-choice voting sessions
- `ranked_votes` -- Individual ranked votes

### State Management (Split Context Architecture)
- `GameDataContext` -- Games, votes, loading
- `FilterContext` -- Search, filters, sort, computed results
- `ViewContext` -- View mode, card size, grouping
- `PollContext` -- Active poll, rankings, results
- `InteractionContext` -- Pinned, compare, presets, custom order

### Features
- [x] Multi-source game search (Steam + IGDB)
- [x] Anonymous session-based voting
- [x] Ranked-choice polls (Discord auth)
- [x] Reactions (Played / Own / Try)
- [x] "Pick For Us" slot-machine randomizer
- [x] Side-by-side game comparison (up to 3)
- [x] Grid / list / compact views
- [x] Adjustable card sizes (S/M/L)
- [x] Group by genre or price
- [x] Filter by tags, sources, price
- [x] Saved filter presets
- [x] Drag & drop custom ordering
- [x] Flip cards with details + trailer + reactions
- [x] Gold/silver/bronze glow on top-voted games
- [x] Recently added games row
- [x] Full keyboard navigation
- [x] Site password gate
- [x] Discord OAuth integration
- [x] Mobile responsive (FAB, bottom sheets, touch targets)
- [x] Cyberpunk neon design system
- [x] Focus-trapped accessible modals
- [x] ARIA attributes on interactive elements
- [x] JSON bulk game import
- [x] Share collection URL

---

## Quick Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
```

---

## Deployment

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy and share the URL with friends
