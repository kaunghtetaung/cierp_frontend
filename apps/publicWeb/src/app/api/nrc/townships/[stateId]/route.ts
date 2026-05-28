import { NextResponse } from 'next/server';

/**
 * GET /api/nrc/townships/[stateId]
 * Returns townships for a specific state/region
 *
 * @param stateId - State ID (1-14)
 * Response: Array of NrcTownship objects
 * Cache: 1 hour (static data)
 *
 * Next.js 15: `params` is a Promise — must be awaited. The old
 * sync-destructure pattern would fall through to 404 silently, which
 * is what was causing the township dropdown to stay empty and the
 * "Township is required" validation error to fire.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stateId: string }> },
) {
  const { stateId } = await params;

  // Validate stateId
  const stateNum = parseInt(stateId, 10);
  if (isNaN(stateNum) || stateNum < 1 || stateNum > 14) {
    return NextResponse.json(
      { error: 'Invalid state ID. Must be between 1 and 14.' },
      { status: 400 },
    );
  }

  try {
    // Dynamic import of township data for the specified state.
    // Using webpack's dynamic-import-with-template so the bundler
    // still includes all `townships/*.json` at build time.
    const mod = await import(
      `@/../../libs/nrc-data/townships/${stateId}.json`
    );
    return NextResponse.json(mod.default ?? mod, {
      headers: {
        'Cache-Control':
          'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Failed to load townships for state ${stateId}:`, error);
    return NextResponse.json(
      { error: `No township data for state ${stateId}` },
      { status: 404 },
    );
  }
}
