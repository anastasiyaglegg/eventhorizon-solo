'use client';

import { useState, type FormEvent } from 'react';
import { eventLocation } from '../lib/event';
import { vendorCategories, vendorSearch } from '../lib/vendor-search';

export default function VendorFinder({ embedKey }: { embedKey?: string }) {
  const [category, setCategory] = useState(vendorCategories[0]);
  const [location, setLocation] = useState(eventLocation);
  const [search, setSearch] = useState<{ category: string; location: string } | null>(null);
  const results = search ? vendorSearch(search.category, search.location, embedKey) : null;

  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (location.trim()) setSearch({ category, location: location.trim() });
  }

  return <section className="panel finder" id="vendor-finder" aria-labelledby="finder-title">
    <p className="eyebrow">02 / Local search</p>
    <h2 id="finder-title">Vendor finder</h2>
    <p>Find real businesses near your event. Search by city, ZIP code, or venue address.</p>
    <form className="controls" onSubmit={find}>
      <label>Vendor category<select value={category} onChange={event => setCategory(event.target.value)}>
        {vendorCategories.map(option => <option key={option}>{option}</option>)}
      </select></label>
      <label>Event location<input value={location} onChange={event => setLocation(event.target.value)}
        required maxLength={160} placeholder="City or venue address" /></label>
      <button disabled={!location.trim()}>Find vendors</button>
    </form>
    {search && results && <div className="map-results">
      <p role="status"><strong>{search.category} near {search.location}</strong></p>
      {results.embedUrl && <iframe title={`Google Maps results for ${search.category} near ${search.location}`}
        src={results.embedUrl} referrerPolicy="strict-origin-when-cross-origin" loading="lazy" allowFullScreen />}
      <a href={results.mapsUrl} target="_blank" rel="noopener noreferrer">View results in Google Maps ↗</a>
    </div>}
  </section>;
}
