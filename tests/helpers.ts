import type { Game } from '@/lib/types'

export function createMockGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'test-game-1',
    title: 'Test Game',
    cover: 'https://example.com/cover.jpg',
    tags: ['FPS', 'Co-op'],
    price: '$30',
    votes: 0,
    steam_appid: 12345,
    categories: ['Multi-player', 'Co-op'],
    primary_source: 'steam',
    ...overrides,
  }
}

export function createMockGames(): Game[] {
  return [
    createMockGame({
      id: 'helldivers-2',
      title: 'Helldivers 2',
      tags: ['Co-op', 'Shooter'],
      price: '$40',
      votes: 5,
      categories: ['Multi-player', 'Co-op'],
      steam_appid: 553850,
      created_at: new Date().toISOString(),
    }),
    createMockGame({
      id: 'deep-rock',
      title: 'Deep Rock Galactic',
      tags: ['Co-op', 'FPS'],
      price: 'Free',
      votes: 3,
      categories: ['Multi-player', 'Co-op'],
      steam_appid: 548430,
      igdb_id: 1000,
    }),
    createMockGame({
      id: 'lethal-company',
      title: 'Lethal Company',
      tags: ['Horror', 'Co-op'],
      price: '$10',
      votes: 8,
      categories: ['Multi-player', 'Co-op'],
      steam_appid: 1966720,
    }),
    createMockGame({
      id: 'valheim',
      title: 'Valheim',
      tags: ['Survival', 'RPG'],
      price: '$20',
      votes: 1,
      categories: ['Multi-player', 'Co-op', 'Single-player'],
      steam_appid: 892970,
      primary_source: 'igdb',
      igdb_id: 2000,
    }),
    createMockGame({
      id: 'rust',
      title: 'Rust',
      tags: ['Survival', 'Shooter'],
      price: '$40',
      votes: 0,
      categories: ['Multi-player'],
      steam_appid: 252490,
    }),
  ]
}
