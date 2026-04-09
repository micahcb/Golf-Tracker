import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 },
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `ESPN API returned ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Tournament fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch tournament data' }, { status: 500 })
  }
}
