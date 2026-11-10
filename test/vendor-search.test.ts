import assert from 'node:assert/strict';
import test from 'node:test';
import { findVendors } from '../lib/vendor-search.ts';

test('vendor search returns the first ten in provider order and requests more with the same query', async () => {
  const bodies: unknown[] = [];
  const provider: typeof fetch = async (url, options) => {
    assert.equal(url, 'https://places.googleapis.com/v1/places:searchText');
    const body = JSON.parse(String(options?.body));
    bodies.push(body);
    const count = body.pageToken ? 1 : 11;
    return Response.json({
      places: Array.from({ length: count }, (_, index) => ({
        id: String(body.pageToken ? index + 10 : index),
        displayName: { text: `Vendor ${index}` },
      })),
      nextPageToken: body.pageToken ? undefined : 'next-page',
    });
  };
  const search = { category: 'Florists', location: 'Montréal, QC' };
  const first = await findVendors(search, 'test-key', provider);
  assert.deepEqual(first.vendors.map(vendor => vendor.id), Array.from({ length: 10 }, (_, index) => String(index)));
  const more = await findVendors({ ...search, pageToken: first.nextPageToken }, 'test-key', provider);
  assert.deepEqual(more.vendors.map(vendor => vendor.id), ['10']);
  assert.equal(more.nextPageToken, undefined);
  assert.deepEqual(bodies, [
    { textQuery: 'Florists near Montréal, QC', rankPreference: 'RELEVANCE', pageSize: 10, includePureServiceAreaBusinesses: true },
    { textQuery: 'Florists near Montréal, QC', rankPreference: 'RELEVANCE', pageSize: 10, includePureServiceAreaBusinesses: true, pageToken: 'next-page' },
  ]);
});

test('provider failures and no matches remain distinct', async () => {
  const search = { category: 'Caterers', location: '11229' };
  await assert.rejects(findVendors(search, 'test-key', async () => new Response(null, { status: 429 })));
  assert.deepEqual((await findVendors(search, 'test-key', async () => Response.json({}))).vendors, []);
});
