import { findVendors, vendorCategories } from '../../../lib/vendor-search.ts';

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const location = typeof input?.location === 'string' ? input.location.trim() : '';
  if (!location || location.length > 160 || !vendorCategories.includes(input?.category) ||
      (input.pageToken !== undefined && (typeof input.pageToken !== 'string' || input.pageToken.length > 2048))) {
    return Response.json({ error: 'Choose a vendor category and enter a valid event location.' }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return Response.json({ error: 'Live vendor search needs a Google Places API key. See the project setup instructions.' },
      { status: 503 });
  }

  try {
    const results = await findVendors({ category: input.category, location, pageToken: input.pageToken }, key);
    return Response.json(results, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Vendor search is unavailable right now. Try again.' }, { status: 502 });
  }
}
