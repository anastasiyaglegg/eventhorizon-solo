export const vendorCategories = ['Caterers', 'Florists', 'Event photographers', 'Event DJs', 'Event rentals', 'Event venues'];

export function vendorSearch(category: string, location: string, embedKey?: string) {
  const query = `${category} near ${location.trim()}`;
  const maps = new URLSearchParams({ api: '1', query });
  return {
    mapsUrl: `https://www.google.com/maps/search/?${maps}`,
    embedUrl: embedKey
      ? `https://www.google.com/maps/embed/v1/search?${new URLSearchParams({ key: embedKey, q: query })}`
      : null,
  };
}
