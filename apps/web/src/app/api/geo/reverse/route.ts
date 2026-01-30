import { NextResponse } from 'next/server';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '';
  const lon = searchParams.get('lon') || '';

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Eventix/1.0 (contact@eventix.local)',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to resolve location' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
