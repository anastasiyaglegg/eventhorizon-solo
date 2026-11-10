'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { eventStart, isTime } from '../../lib/event';
import { calendarConflicts, eventDate, isDate, readBookings, sampleBookings, saveBookings, shiftDate, type Booking } from '../../lib/vendor-calendar';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const dragType = 'application/x-event-horizon-booking';

type Move = { booking: Booking; date: string; time: string };

export default function Calendar() {
  const [bookings, setBookings] = useState(sampleBookings);
  const [date, setDate] = useState(eventDate);
  const [move, setMove] = useState<Move | null>(null);
  const [message, setMessage] = useState('');
  const editor = useRef<HTMLHeadingElement>(null);
  const editing = move !== null;

  useEffect(() => {
    function restore() { setBookings(readBookings()); }
    restore();
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  useEffect(() => {
    if (editing) editor.current?.focus();
  }, [editing]);

  function propose(booking: Booking, targetDate = booking.date, time = booking.time) {
    setMessage('');
    setMove({ booking, date: targetDate, time });
  }

  function acceptDrag(event: DragEvent) {
    if (event.dataTransfer.types.includes(dragType)) event.preventDefault();
  }

  function dropBooking(event: DragEvent, targetDate: string, time?: string) {
    const booking = bookings.find(item => item.id === event.dataTransfer.getData(dragType));
    if (!booking) return;
    event.preventDefault();
    propose(booking, targetDate, time ?? booking.time);
  }

  const validMove = move && isDate(move.date) && isTime(move.time);
  const changed = move && (move.date !== move.booking.date || move.time !== move.booking.time);
  const conflicts = validMove ? calendarConflicts(bookings, move.booking, move) : [];

  function confirm() {
    if (!validMove || !changed) return;
    const updated = bookings.map(booking => booking.id === move.booking.id
      ? { ...booking, date: move.date, time: move.time } : booking);
    const saved = saveBookings(updated);
    if (!saved) {
      setMessage('The browser could not save this move. Your booking is still in its original slot.');
      return;
    }
    setBookings(updated);
    setDate(move.date);
    setMessage(`${move.booking.vendor} moved to ${move.date} at ${move.time}.`);
    setMove(null);
  }

  const daily = bookings.filter(booking => booking.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const plannedDates = [...new Set([eventDate, ...bookings.map(booking => booking.date)])].sort();

  return <section className="panel" aria-labelledby="schedule-title">
    <h2 id="schedule-title">Event vendor schedule</h2>
    <p>Drag a booking onto an hour or a listed date, or select <strong>Move booking</strong> to choose any date and time.</p>
    <div className="controls calendar-nav">
      <button type="button" className="secondary" aria-label="Previous day" onClick={() => setDate(shiftDate(date, -1))}>←</button>
      <label>Calendar date<input type="date" value={date}
        onChange={event => { if (isDate(event.target.value)) setDate(event.target.value); }} /></label>
      <button type="button" className="secondary" aria-label="Next day" onClick={() => setDate(shiftDate(date, 1))}>→</button>
    </div>
    <div className="actions calendar-dates" aria-label="Dates with bookings or event milestones">
      {plannedDates.map(day => <button type="button" className="secondary" key={day} aria-pressed={date === day}
        onClick={() => setDate(day)} onDragOver={acceptDrag}
        onDrop={event => dropBooking(event, day)}>{day}{day === eventDate ? ' · Event day' : ''}</button>)}
    </div>
    {move && <form className="report" onSubmit={event => { event.preventDefault(); confirm(); }}>
      <h3 ref={editor} tabIndex={-1}>Move booking · {move.booking.vendor}</h3>
      <p>Current slot <strong>{move.booking.date} at {move.booking.time}</strong></p>
      <div className="controls">
        <label>New date<input type="date" required value={move.date}
          onChange={event => setMove({ ...move, date: event.target.value })} /></label>
        <label>New time (HH:MM)<input type="text" required maxLength={5} placeholder="HH:MM" value={move.time}
          onChange={event => setMove({ ...move, time: event.target.value })} /></label>
      </div>
      {validMove && changed && <p>Proposed slot <strong>{move.date} at {move.time}</strong></p>}
      {conflicts.length > 0 && <div role="alert" className="calendar-warning">
        <strong>Schedule conflicts</strong><ul>{conflicts.map(conflict => <li key={conflict}>{conflict}</li>)}</ul>
      </div>}
      <div className="actions">
        <button disabled={!validMove || !changed}>Confirm move</button>
        <button type="button" className="secondary" onClick={() => { setMove(null); setMessage('Move canceled.'); }}>Cancel</button>
      </div>
    </form>}
    <p role="status">{message}</p>
    <h3>Schedule for {date}</h3>
    {!daily.length && <p>No vendor bookings on this date.</p>}
    <div className="calendar-grid">
      {hours.map(hour => <div className="calendar-slot" key={hour} aria-label={`Calendar slot ${hour}:00`}
        onDragOver={acceptDrag} onDrop={event => dropBooking(event, date, `${hour}:00`)}>
        <time>{hour}:00</time>
        {date === eventDate && eventStart.startsWith(hour) && <p className="calendar-milestone">Doors open · {eventStart}</p>}
        {daily.filter(booking => booking.time.startsWith(hour)).map(booking =>
          <article key={booking.id} draggable className="calendar-booking" onDragStart={event => {
            event.dataTransfer.setData(dragType, booking.id);
            event.dataTransfer.effectAllowed = 'move';
          }}>
            <span className="badge" data-booking-status={booking.status}>{booking.status}</span>
            <strong>{booking.time} · {booking.vendor}</strong>
            <small>{booking.work} · {booking.duration} min</small>
            <button type="button" className="secondary" aria-label={`Move booking for ${booking.vendor}, ${booking.work}`}
              onClick={() => propose(booking)}>Move booking</button>
          </article>)}
      </div>)}
    </div>
  </section>;
}
