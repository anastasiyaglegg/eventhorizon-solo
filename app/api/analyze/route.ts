import { analyze } from '../../../lib/analysis';
import { isTime, setupMinutes } from '../../../lib/event';

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  if (!input || !isTime(input.arrival) ||
      !(input.currentArrival === null || isTime(input.currentArrival)) ||
      typeof input.missingSetup !== 'boolean') {
    return Response.json({ error: 'Enter a valid proposed arrival time.' }, { status: 400 });
  }

  try {
    const result = await analyze(input.currentArrival, input.arrival,
      input.missingSetup ? null : setupMinutes, process.env.ANTHROPIC_API_KEY);
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Analysis did not return a valid report. Try again before approving.' },
      { status: 502 });
  }
}
