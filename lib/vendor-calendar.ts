import { eventStart, initialArrival, isTime, minutes, setupMinutes } from './event.ts';

export const eventName = 'Harbor House Reception';
export const eventDate = '2026-11-14';
export const cateringId = 'catering-setup';

type Slot = { date: string; time: string };
export type Booking = Slot & {
  id: string;
  vendor: string;
  work: string;
  duration: number;
  status: 'Confirmed' | 'Proposed';
};

export const sampleBookings: Booking[] = [
  { id: 'rentals', vendor: 'Harbor Rentals', work: 'Furniture delivery', date: eventDate, time: '13:00', duration: 60, status: 'Confirmed' },
  { id: 'florist', vendor: 'Juniper Floral', work: 'Install arrangements', date: eventDate, time: '15:00', duration: 60, status: 'Confirmed' },
  { id: cateringId, vendor: 'Harbor Catering', work: 'Catering setup', date: eventDate, time: initialArrival, duration: setupMinutes, status: 'Confirmed' },
  { id: 'photography', vendor: 'Baylight Photography', work: 'Venue and guest coverage', date: eventDate, time: '17:00', duration: 60, status: 'Confirmed' },
  { id: 'rentals-pickup', vendor: 'Harbor Rentals', work: 'Furniture pickup', date: '2026-11-15', time: '10:00', duration: 60, status: 'Proposed' },
];

function dateValue(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

export function isDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000')) return false;
  const value = dateValue(date);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === date;
}

export function shiftDate(date: string, days: number) {
  const value = new Date(dateValue(date) + days * 86_400_000).toISOString().slice(0, 10);
  return isDate(value) ? value : date;
}

export function calendarConflicts(bookings: Booking[], booking: Booking, slot: Slot) {
  const start = dateValue(slot.date) / 60_000 + minutes(slot.time);
  const end = start + booking.duration;
  const doors = dateValue(eventDate) / 60_000 + minutes(eventStart);
  const conflicts = bookings.filter(other => {
    const otherStart = dateValue(other.date) / 60_000 + minutes(other.time);
    return other.id !== booking.id && other.vendor === booking.vendor &&
      start < otherStart + other.duration && otherStart < end;
  }).map(other => `Overlaps ${other.work.toLowerCase()} for ${other.vendor} on ${other.date} at ${other.time}.`);
  if (start <= doors && doors < end) conflicts.push(`This booking overlaps doors opening on ${eventDate} at ${eventStart}.`);
  if (booking.id === cateringId && slot.date !== eventDate) {
    conflicts.push('Catering setup would be booked on a different date from the event.');
  }
  return conflicts;
}

const bookingStorageKey = 'event-horizon-vendor-slots';
const legacyArrivalKey = 'event-horizon-catering-arrival';

export function readBookings() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(bookingStorageKey) ?? 'null');
    const legacyArrival = sessionStorage.getItem(legacyArrivalKey);
    return sampleBookings.map(booking => {
      const slot = saved?.[booking.id];
      if (isDate(slot?.date) && isTime(slot?.time)) return { ...booking, date: slot.date, time: slot.time };
      if (booking.id === cateringId && isTime(legacyArrival)) return { ...booking, time: legacyArrival };
      return booking;
    });
  } catch {
    return sampleBookings;
  }
}

export function saveBookings(bookings: Booking[]) {
  try {
    sessionStorage.setItem(bookingStorageKey, JSON.stringify(Object.fromEntries(
      bookings.map(({ id, date, time }) => [id, { date, time }]),
    )));
    return true;
  } catch {
    return false;
  }
}
