// Utility script to generate SQL INSERT statements from games.json
// Run with: node scripts/generate-sql.js

const fs = require('fs');
const path = require('path');

const gamesPath = path.join(__dirname, '../data/games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));

console.log('-- Generated INSERT statements for games');
console.log('-- Copy and paste into Supabase SQL Editor\n');

games.forEach(game => {
  const tags = `ARRAY[${game.tags.map(t => `'${t}'`).join(', ')}]`;
  console.log(
    `INSERT INTO games (id, title, cover, tags, price, votes) VALUES ('${game.id}', '${game.title}', '${game.cover}', ${tags}, '${game.price}', 0);`
  );
});

console.log('\n-- Done! Copy the INSERT statements above.');
