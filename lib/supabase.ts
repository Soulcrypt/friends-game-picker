import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single global client instance
let supabaseInstance: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  }
  return supabaseInstance
}

// Export singleton client
export const supabase = getClient()

// For compatibility with code expecting createSupabaseBrowserClient
export function createSupabaseBrowserClient(): SupabaseClient {
  return getClient()
}

// Sync Discord profile data to our profiles table
export async function syncProfile(
  userId: string,
  discordId: string,
  discordUsername: string,
  avatarUrl: string | null
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      discord_id: discordId,
      discord_username: discordUsername,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    })
    .select()
    .single()

  if (error) {
    console.error('Error syncing profile:', error)
    return null
  }

  return data
}

// Get profile by user ID
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Get profiles for a list of user IDs
export async function getProfiles(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return data || []
}
