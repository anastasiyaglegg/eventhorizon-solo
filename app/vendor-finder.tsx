'use client';

import { useState, type FormEvent } from 'react';
import { eventLocation } from '../lib/event';
import { vendorCategories, type VendorPage, type VendorSearch } from '../lib/vendor-search';

type Results = VendorPage & { search: VendorSearch };

export default function VendorFinder() {
  const [category, setCategory] = useState(vendorCategories[0]);
  const [location, setLocation] = useState(eventLocation);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(search: VendorSearch, previous?: Results) {
    if (loading) return;
    setLoading(true);
    setError('');
    if (!previous) setResults(null);
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(search),
      });
      const page = await response.json();
      if (!response.ok) {
        setError(page.error);
        return;
      }
      const existing = previous?.vendors ?? [];
      const vendors = (page as VendorPage).vendors.filter(vendor => !existing.some(item => item.id === vendor.id));
      setResults({ search, vendors: [...existing, ...vendors], nextPageToken: page.nextPageToken });
    } catch {
      setError('Could not complete the vendor search. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (location.trim()) void load({ category, location: location.trim() });
  }

  return <section className="panel finder" id="vendor-finder" aria-labelledby="finder-title">
    <p className="eyebrow">02 / Local search</p>
    <h2 id="finder-title">Vendor finder</h2>
    <p>Find real businesses near your event. Search by city, ZIP code, or venue address.</p>
    <form onSubmit={find}>
      <fieldset disabled={loading}>
        <div className="controls">
          <label>Vendor category<select value={category} onChange={event => setCategory(event.target.value)}>
            {vendorCategories.map(option => <option key={option}>{option}</option>)}
          </select></label>
          <label>Event location<input value={location} onChange={event => setLocation(event.target.value)}
            required maxLength={160} placeholder="City or venue address" /></label>
          <button disabled={!location.trim()}>Find vendors</button>
        </div>
      </fieldset>
    </form>
    <p role="status">{loading ? 'Searching for vendors…' : results
      ? `Showing ${results.vendors.length} results for ${results.search.category.toLowerCase()} near ${results.search.location}.`
      : ''}</p>
    {error && <p role="alert" className="error">{error}</p>}
    {results && <div className="vendor-results">
      {results.vendors.length ? <>
        <ol className="vendor-list">{results.vendors.map(vendor => <li key={vendor.id}>
          <strong>{vendor.name}</strong>
          <span>{vendor.address || 'Street address unavailable'}</span>
          <a href={vendor.mapsUrl} target="_blank" rel="noopener noreferrer">View listing on Google Maps ↗</a>
          {vendor.attributions.map(({ provider, providerUri }) =>
            <small key={provider}>{providerUri && /^https?:\/\//i.test(providerUri)
              ? <a href={providerUri}>{provider}</a> : provider}</small>)}
        </li>)}</ol>
        <p className="maps-attribution" translate="no">Google Maps</p>
      </> : <p>No matching vendors found. Try a nearby city or a different category.</p>}
      {results.nextPageToken && <button type="button" className="secondary" disabled={loading}
        onClick={() => void load({ ...results.search, pageToken: results.nextPageToken }, results)}>
        Show more
      </button>}
    </div>}
    <p className="vendor-policy"><a href="/vendor-search-policy">Vendor search terms and privacy</a></p>
  </section>;
}
