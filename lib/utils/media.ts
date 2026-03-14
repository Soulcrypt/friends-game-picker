// Media selection utilities for trailers and screenshots

import type { SteamAppDetails } from '../steam'

type SteamMovie = NonNullable<SteamAppDetails['movies']>[number]

/**
 * Selects the best trailer from Steam movie list.
 * Prefers highlighted/featured trailers, then most recent (higher ID).
 * Returns mp4 max quality first, then webm, then constructed URL.
 */
export function selectBestTrailer(movies: SteamMovie[] | undefined): string | undefined {
  if (!movies?.length) return undefined

  // Sort: highlighted first, then by id (higher id = more recent)
  const sortedMovies = [...movies].sort((a, b) => {
    if (a.highlight && !b.highlight) return -1
    if (!a.highlight && b.highlight) return 1
    return b.id - a.id
  })

  const bestMovie = sortedMovies[0]

  // Prefer mp4 max quality, fallback to webm, then to constructed URL
  if (bestMovie.mp4?.max) {
    return bestMovie.mp4.max
  } else if (bestMovie.webm?.max) {
    return bestMovie.webm.max
  }

  // Fallback to constructed URL
  return `https://steamcdn-a.akamaihd.net/steam/apps/${bestMovie.id}/movie_max.mp4`
}

/**
 * Selects screenshots up to a maximum count.
 * Returns full path URLs.
 */
export function selectScreenshots(
  screenshots: { path_full: string }[] | undefined,
  maxCount: number = 8
): string[] | undefined {
  if (!screenshots?.length) return undefined
  return screenshots.slice(0, maxCount).map(s => s.path_full)
}

/**
 * Helper to detect YouTube URLs (which can't be played in video tags).
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

/**
 * Checks if a URL is a direct video file that can be played in HTML5 video tag.
 */
export function isDirectVideoUrl(url: string): boolean {
  if (isYouTubeUrl(url)) return false
  // Common direct video extensions and Steam video URLs
  return url.includes('.mp4') ||
         url.includes('.webm') ||
         url.includes('steamcdn') ||
         url.includes('akamaihd.net')
}
