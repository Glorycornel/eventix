import { NextResponse } from 'next/server';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json([], { status: 200 });
  }

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('accept-language', 'en');
  url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Eventix/1.0 (contact@eventix.local)',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json([], { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
