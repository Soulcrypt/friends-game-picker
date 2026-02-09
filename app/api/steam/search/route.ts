import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const term = searchParams.get('term')

  if (!term) {
    return NextResponse.json({ items: [] })
  }

  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json({ items: [] })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ items: [] })
  }
}
