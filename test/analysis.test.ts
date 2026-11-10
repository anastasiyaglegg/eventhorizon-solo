import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze } from '../lib/analysis.ts';

test('on-time catering finishes before the dependent tasks', async () => {
  const result = await analyze('16:00', '16:00', 90, undefined);
  assert.deepEqual(result.timing, { finish: '17:30', overlap: 0, affectedIds: [] });
  assert.equal(result.approvable, true);
  assert.match(result.source, /Demo report/);
});

test('late catering overlaps doors by 30 minutes and only affects dependent tasks', async () => {
  const result = await analyze('16:00', '17:00', 90, undefined);
  assert.deepEqual(result.timing, { finish: '18:30', overlap: 30, affectedIds: ['buffet', 'briefing'] });
});

test('missing inputs are reported and unknown setup suppresses timing calculations', async () => {
  const result = await analyze(null, '17:00', null, undefined);
  assert.equal(result.timing, null);
  assert.deepEqual(result.report.unknowns, ['Current catering arrival time', 'Catering setup duration']);
  assert.match(result.report.recommendation, /verify/i);
  assert.equal(result.approvable, false);
});

test('Claude report with unknown setup duration is accepted but cannot be approved', async () => {
  const result = await analyze('16:00', '17:00', null, 'test-key', async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    assert.equal(JSON.parse(body.messages[0].content).timing, null);
    assert.equal('affected_task_ids' in body.output_config.format.schema.properties, false);
    return Response.json({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({
        scheduling_risks: ['Setup finish cannot be assessed.'],
        unknowns: ['Catering setup duration'],
        recommendation: 'Verify the setup duration with catering.',
      }) }],
    });
  });
  assert.equal(result.timing, null);
  assert.equal(result.approvable, false);
});

test('Claude adapter makes one request and accepts a grounded report', async () => {
  let requests = 0;
  const provider: typeof fetch = async (url, options) => {
    requests++;
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, 'claude-opus-4-6');
    assert.equal(body.output_config.effort, 'medium');
    assert.equal(JSON.parse(body.messages[0].content).timing.overlap, 30);
    return Response.json({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({
        scheduling_risks: ['Catering setup overlaps doors opening.'],
        unknowns: [],
        recommendation: 'Ask catering about an earlier arrival.',
      }) }],
    });
  };
  const result = await analyze('16:00', '17:00', 90, 'test-key', provider);
  assert.equal(requests, 1);
  assert.equal(result.source, 'Claude analysis');
  assert.deepEqual(result.timing?.affectedIds, ['buffet', 'briefing']);
  assert.equal(result.approvable, true);
});

test('malformed and invalid provider output cannot produce an approvable report', async () => {
  for (const text of ['{broken', JSON.stringify({
    scheduling_risks: [],
    unknowns: [],
    recommendation: '',
  })]) {
    await assert.rejects(analyze('16:00', '17:00', 90, 'test-key', async () =>
      Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })));
  }
  await assert.rejects(analyze('16:00', '17:00', 90, 'test-key', async () =>
    new Response(null, { status: 429 })), /provider unavailable/);
});

test('overnight setup shows a zero-padded 24-hour time and day rollover', async () => {
  const result = await analyze('16:00', '23:00', 90, undefined);
  assert.equal(result.timing?.finish, '00:30 (next day)');
});
