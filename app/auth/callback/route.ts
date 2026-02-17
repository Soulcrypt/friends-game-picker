import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface CookieToSet {
  name: string
  value: string
  options: CookieOptions
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Extract Discord metadata from user
      const user = data.user
      const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub || ''
      const discordUsername = user.user_metadata?.full_name ||
                              user.user_metadata?.name ||
                              user.user_metadata?.preferred_username ||
                              user.email?.split('@')[0] ||
                              'Unknown'
      const avatarUrl = user.user_metadata?.avatar_url || null

      // Sync profile to our profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          discord_id: discordId,
          discord_username: discordUsername,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })

      if (profileError) {
        console.error('Error syncing profile:', profileError)
      }
    }
  }

  // Redirect to home page after login
  return NextResponse.redirect(origin)
}
