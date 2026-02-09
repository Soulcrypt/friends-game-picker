# 🚀 QUICKSTART - Get Running in 5 Minutes

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Supabase (2 min)

1. Go to https://supabase.com and create a free account
2. Create a new project (pick any region)
3. Wait ~2 minutes for project to initialize
4. Go to SQL Editor (left sidebar)
5. Copy everything from `supabase/setup.sql`
6. Paste and run it in the SQL Editor

## Step 3: Configure Environment (1 min)

1. In Supabase, go to: Settings → API
2. Copy your `URL` and `anon public` key
3. Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

4. Paste your credentials into `.env.local`

## Step 4: Start Development (30 sec)

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Add Game Covers (Optional)

Download covers from [SteamGridDB](https://www.steamgriddb.com/) and place in `public/covers/`

Or use placeholder images for now - the app works without them!

---

## 🎯 You're Done!

The app is now running. Test it:

1. Click vote buttons (👍)
2. Try filtering by tags
3. Search for games
4. Sort by votes or A-Z

Open in multiple browser tabs to see voting in action!

---

## 🚀 Ready to Deploy?

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main

# Deploy to Vercel
1. Go to vercel.com
2. Import your GitHub repo
3. Add environment variables
4. Deploy!
```

---

## 📝 Next Steps

- [ ] Add your own games to `data/games.json`
- [ ] Upload game covers to `public/covers/`
- [ ] Customize filters in `FilterBar.tsx`
- [ ] Share with friends and start voting!
