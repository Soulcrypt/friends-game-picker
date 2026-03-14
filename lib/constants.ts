// App-wide constants

// Compare feature limits
export const MAX_COMPARE_GAMES = 3

// Poll configuration
export const MAX_POLL_RANKS = 3
export const POLL_TITLE_MAX_LENGTH = 50

// Points calculation for ranked voting
export const RANK_POINTS = {
  1: 3,
  2: 2,
  3: 1,
} as const

// Recently added games
export const RECENTLY_ADDED_DAYS = 7
export const RECENTLY_ADDED_LIMIT = 5

// Cache settings
export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Loading timeouts
export const LOADING_TIMEOUT_MS = 10000 // 10 seconds

// Poll results refresh interval
export const POLL_RESULTS_REFRESH_MS = 30000 // 30 seconds

// Animation durations (match CSS variables)
export const ANIMATION_DURATION = {
  micro: 150,
  standard: 250,
  emphasis: 350,
} as const

// Screenshot slideshow
export const MAX_SCREENSHOTS = 6
export const SCREENSHOT_SLIDE_INTERVAL = 3000 // 3 seconds

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 640

// Grid sizes based on card size
// Desktop: 3-column default for focused, non-overcrowded layout
export const GRID_CLASSES = {
  small: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3',
} as const

// Price group sorting order
export const PRICE_GROUP_ORDER = [
  'Free to Play',
  'Under $10',
  '$10 - $30',
  '$30 - $60',
  '$60+',
  'Other',
] as const

// Session storage keys
export const STORAGE_KEYS = {
  sessionId: 'game_picker_session_id',
  pinnedGames: 'pinnedGames',
  filterPresets: 'filterPresets',
} as const
