import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appid = searchParams.get('appid')

  if (!appid) {
    return NextResponse.json(null)
  }

  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json(null)
    }

    const data = await res.json()
    const appData = data[appid]

    if (!appData?.success) {
      return NextResponse.json(null)
    }

    return NextResponse.json(appData.data)
  } catch {
    return NextResponse.json(null)
  }
}
