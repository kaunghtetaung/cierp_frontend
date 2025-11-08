import { NextResponse } from 'next/server';
import states from '@/../../libs/nrc-data/nrc-states.json';

/**
 * GET /api/nrc/states
 * Returns list of all Myanmar states/regions for NRC
 *
 * Response: Array of NrcState objects
 * Cache: 1 hour (static data)
 */
export async function GET() {
  return NextResponse.json(states, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
