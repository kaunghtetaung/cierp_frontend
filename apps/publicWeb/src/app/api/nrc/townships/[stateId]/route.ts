import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';

/**
 * GET /api/nrc/townships/[stateId]
 * Returns townships for a specific state/region
 *
 * @param stateId - State ID (1-14)
 * Response: Array of NrcTownship objects
 * Cache: 1 hour (static data)
 */
export async function GET(
  request: Request,
  { params }: { params: { stateId: string } }
) {
  const { stateId } = params;

  // Validate stateId
  const stateNum = parseInt(stateId);
  if (isNaN(stateNum) || stateNum < 1 || stateNum > 14) {
    return NextResponse.json(
      { error: 'Invalid state ID. Must be between 1 and 14.' },
      { status: 400 }
    );
  }

  try {
    // Dynamic import of township data for the specified state
    const townships = await import(`@/../../libs/nrc-data/townships/${stateId}.json`);

    return NextResponse.json(townships.default, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Failed to load townships for state ${stateId}:`, error);
    return notFound();
  }
}
