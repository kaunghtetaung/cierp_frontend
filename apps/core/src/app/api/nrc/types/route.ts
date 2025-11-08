import { NextResponse } from 'next/server';
import types from '@/../../libs/nrc-data/nrc-types.json';

/**
 * GET /api/nrc/types
 * Returns list of NRC citizenship types (N, E, P, T, Y, S)
 *
 * Response: Array of NrcType objects
 * Cache: 1 hour (static data)
 */
export async function GET() {
  return NextResponse.json(types, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
