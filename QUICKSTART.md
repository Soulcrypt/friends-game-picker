# Quickstart -- Get Running in 5 Minutes

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (any region)
3. Wait ~2 minutes for project to initialize
4. Go to SQL Editor (left sidebar)
5. Copy everything from `supabase/setup.sql`, paste and run it
6. (Optional) Run `supabase/secure-policies.sql` for tighter security

## Step 3: Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

1. In Supabase, go to: Settings > API
2. Copy your `Project URL` and `anon public` key
3. Set a site password for `ACCESS_PASSWORD`
4. (Optional) Add Twitch credentials for IGDB search

## Step 4: Start Development

```bash
npm run dev
```

Open http://localhost:3000 and enter your site password.

## Step 5: Add Games

Games are added through the UI -- click "Add Game" and search by title. Cover art, trailers, and metadata are fetched automatically from Steam/IGDB.

---

## You're Done!

Test the app:

1. Search and add a few games
2. Click vote buttons
3. Try filtering by tags and sources
4. Switch between grid/list/compact views
5. Flip a card to see details and reactions
6. Open "Pick For Us" to spin the randomizer
7. Open in multiple browser tabs to see voting across sessions

---

## Optional: Discord OAuth (for Ranked Polls)

1. In Supabase: Authentication > Providers > Discord
2. Create a Discord app at [discord.com/developers](https://discord.com/developers)
3. Add Supabase's callback URL to Discord redirects
4. Users can now login with Discord and create ranked-choice polls

---

## Deploy to Vercel

```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Add environment variables
4. Deploy

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` or `N` | Add Game |
| `P` | Pick For Us |
| `I` | Import Games |
| Arrow keys | Navigate grid |
| `Escape` | Close modals |

---

## Next Steps

- Invite friends and start voting
- Set up Discord OAuth for ranked polls
- Run `supabase/secure-policies.sql` before going public
- Check README.md for full architecture details
