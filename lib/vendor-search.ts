export const vendorCategories = ['Caterers', 'Florists', 'Event photographers', 'Event DJs', 'Event rentals', 'Event venues'];

export type VendorSearch = { category: string; location: string; pageToken?: string };

type Attribution = { provider: string; providerUri?: string };
type Place = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  attributions?: Attribution[];
};

export async function findVendors(search: VendorSearch, apiKey: string, request = fetch) {
  const response = await request('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.attributions,nextPageToken',
    },
    body: JSON.stringify({
      textQuery: `${search.category} near ${search.location}`,
      rankPreference: 'RELEVANCE',
      pageSize: 10,
      pageToken: search.pageToken,
      includePureServiceAreaBusinesses: true,
    }),
  });
  if (!response.ok) throw new Error('Vendor search provider unavailable.');
  const data: { places?: Place[]; nextPageToken?: string } = await response.json();
  return {
    vendors: (data.places ?? []).slice(0, 10).flatMap(place => {
      if (!place.id || !place.displayName?.text) return [];
      const query = new URLSearchParams({ api: '1', query: place.displayName.text, query_place_id: place.id });
      return [{
        id: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        mapsUrl: `https://www.google.com/maps/search/?${query}`,
        attributions: place.attributions ?? [],
      }];
    }),
    nextPageToken: data.nextPageToken,
  };
}

export type VendorPage = Awaited<ReturnType<typeof findVendors>>;
