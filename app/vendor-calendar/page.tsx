import type { Metadata } from 'next';
import { eventLocation } from '../../lib/event';
import { eventDate, eventName } from '../../lib/vendor-calendar';
import Calendar from './calendar';

export const metadata: Metadata = { title: 'Vendor Calendar | Event Horizon' };

export default function VendorCalendarPage() {
  return <>
    <header className="shell masthead">
      <span className="brand"><span aria-hidden="true">◉</span> Event Horizon</span>
      <nav aria-label="Dashboard"><a href="/#readiness">Readiness</a><a href="/#vendor-finder">Vendor finder</a>
        <a href="/vendor-calendar" aria-current="page">Vendor calendar</a></nav>
    </header>
    <main className="shell">
      <div className="hero">
        <p className="eyebrow">Coordinator dashboard</p>
        <h1>Vendor calendar</h1>
        <p>{eventName} · {eventLocation} · {eventDate}</p>
      </div>
      <Calendar />
    </main>
  </>;
}
