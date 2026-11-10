export const tasks = [
  { id: 'buffet', name: 'Inspect the buffet', time: '17:40', dependsOnCatering: true },
  { id: 'briefing', name: 'Brief the service team', time: '17:50', dependsOnCatering: true },
  { id: 'registration', name: 'Set up guest registration', time: '17:15', dependsOnCatering: false },
];

export const eventStart = '18:00';
export const eventLocation = 'Brooklyn, NY';
export const initialArrival = '16:00';
export const setupMinutes = 90;

export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && timePattern.test(value);
}

function minutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function displayTime(value: number) {
  const hour = String(Math.floor(value / 60) % 24).padStart(2, '0');
  const minute = String(value % 60).padStart(2, '0');
  return `${hour}:${minute}${value >= 1440 ? ' (next day)' : ''}`;
}

export function schedule(arrival: string, duration: number | null) {
  if (duration === null) return null;
  const finish = minutes(arrival) + duration;
  return {
    finish: displayTime(finish),
    overlap: Math.max(0, finish - minutes(eventStart)),
    affectedIds: tasks.filter(task => task.dependsOnCatering && finish > minutes(task.time))
      .map(task => task.id),
  };
}
