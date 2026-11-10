import Readiness from './readiness';
import VendorFinder from './vendor-finder';
import { eventLocation } from '../lib/event';
import { eventName } from '../lib/vendor-calendar';

export default function Home() {
  return <>
    <header className="shell masthead">
      <span className="brand"><span aria-hidden="true">◉</span> Event Horizon</span>
      <nav aria-label="Dashboard"><a href="#readiness">Readiness</a><a href="#vendor-finder">Vendor finder</a><a href="/vendor-calendar">Vendor calendar</a></nav>
    </header>
    <main className="shell">
      <div className="hero">
        <p className="eyebrow">Coordinator dashboard</p>
        <h1>{eventName}</h1>
        <p>Review schedule changes and find vendors for your event.</p>
        <span className="badge">Sample event · {eventLocation}</span>
      </div>
      <Readiness />
      <VendorFinder />
    </main>
  </>;
}
