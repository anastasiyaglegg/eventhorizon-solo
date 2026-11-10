import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarConflicts, eventDate, isDate, sampleBookings, shiftDate } from '../lib/vendor-calendar.ts';

test('calendar dates handle month boundaries and reject invalid dates', () => {
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(isDate('2026-02-29'), false);
  assert.equal(isDate('2028-02-29'), true);
});

test('moving a booking flags same-vendor overlap without flagging adjacent slots', () => {
  const [delivery] = sampleBookings;
  assert.match(calendarConflicts(sampleBookings, delivery, { date: '2026-11-15', time: '10:30' })[0], /pickup/);
  assert.deepEqual(calendarConflicts(sampleBookings, delivery, { date: '2026-11-15', time: '11:00' }), []);
});

test('calendar flags event milestones and catering on a different day', () => {
  const catering = sampleBookings[2];
  assert.match(calendarConflicts(sampleBookings, catering, { date: eventDate, time: '17:00' })[0], /18:00/);
  assert.match(calendarConflicts(sampleBookings, catering, { date: '2026-11-15', time: '17:00' })[0], /different date/);
});
