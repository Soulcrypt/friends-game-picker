import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Cookie expiration: 30 days in seconds
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    const accessPassword = process.env.ACCESS_PASSWORD

    if (!accessPassword) {
      console.error('ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (password !== accessPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('friends-game-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('friends-game-auth')
  return NextResponse.json({ success: true })
}
