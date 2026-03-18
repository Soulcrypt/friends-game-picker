# Friends Game Picker -- MVP Design Spec (Historical)

> **Note:** This document is the original MVP design specification. The app has since evolved
> significantly beyond this spec. See `README.md` for the current feature set and architecture.

This is a **lean decision tool** for groups picking a game fast. No accounts, no fluff, optimized for voting and sorting.

---

## 1. UX / UI DESIGN (What It Looks Like)

### Page Structure
- Dark theme
- Single page
- Card-based grid

### Top Bar
- Title: 🎮 What are we playing?
- Search input (title only)
- Toggle filters:
  - Free
  - Paid
  - Co-op
  - Shooter
  - Horror
  - RPG
- Sort dropdown:
  - Most Votes (default)
  - A–Z

### Game Card
- 2:3 cover image (Steam-style)
- Title (1 line, ellipsis)
- Up to 2 genre chips
- Price badge (Free / $ / Wait for Sale)
- 👍 Vote button
- Vote count

### Visual Priority
- #1 voted game: glowing border
- #2–#3: subtle highlight

---

## 2. DATA MODEL (MINIMAL)

```ts
Game {
  id: string
  title: string
  cover: string
  tags: string[]
  price: string
  votes: number
}
```

Votes are anonymous and stored per-session.

---

## 3. INITIAL GAME DATA (CLEAN JSON)

```json
[
  {
    "id": "darktide",
    "title": "Warhammer 40,000: Darktide",
    "cover": "/covers/darktide.jpg",
    "tags": ["FPS", "Co-op"],
    "price": "Free",
    "votes": 0
  },
  {
    "id": "helldivers2",
    "title": "Helldivers 2",
    "cover": "/covers/helldivers2.jpg",
    "tags": ["Co-op", "Shooter"],
    "price": "$40",
    "votes": 0
  },
  {
    "id": "sonsforest",
    "title": "Sons of the Forest",
    "cover": "/covers/sonsforest.jpg",
    "tags": ["Survival", "Horror", "Co-op"],
    "price": "$30",
    "votes": 0
  }
]
```

(You’d continue this list for all games.)

---

## 4. TECH STACK (FASTEST PATH)

- Frontend: **Next.js (App Router)**
- Styling: **Tailwind CSS**
- Backend: **Supabase**
- DB: Postgres
- Auth: None (anonymous sessions)

---

## 5. NEXT.JS FILE STRUCTURE

```
/app
  /page.tsx
  /components
    GameCard.tsx
    FilterBar.tsx
/lib
  games.ts
  votes.ts
```

---

## 6. CORE COMPONENTS

### GameCard.tsx
```tsx
export default function GameCard({ game, onVote }) {
  return (
    <div className="rounded-xl bg-zinc-900 hover:scale-105 transition">
      <img src={game.cover} className="rounded-t-xl" />
      <div className="p-3">
        <h3 className="truncate font-bold">{game.title}</h3>
        <div className="flex gap-1 text-xs">
          {game.tags.slice(0,2).map(tag => (
            <span key={tag} className="bg-zinc-700 px-2 rounded">{tag}</span>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span>{game.price}</span>
          <button onClick={onVote}>👍 {game.votes}</button>
        </div>
      </div>
    </div>
  )
}
```

---

## 7. VOTING LOGIC (GOOD ENOUGH)

- Each browser gets a UUID in localStorage
- One vote per game per UUID
- Supabase table:

```sql
votes (
  id uuid,
  game_id text,
  session_id text
)
```

Increment count only if no existing vote.

---

## 8. DEPLOYMENT

- Host on Vercel
- Supabase free tier
- Share one URL with friends

---

## 9. WHAT NOT TO ADD

- Accounts
- Reviews
- Long descriptions
- Comments

This tool exists to **end the argument**, not start one.

---

## 10. FUTURE UPGRADES (ONLY IF NEEDED)

- "Quick Pick" button (random from top 3)
- "Installed by most players" tag
- Discord webhook when winner changes

Ship the MVP first.

