'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Analysis } from '../lib/analysis';
import { eventStart, initialArrival, isTime, setupMinutes, tasks } from '../lib/event';

type Review =
  | { state: 'idle' | 'analyzing' | 'approved' | 'rejected' }
  | { state: 'error'; message: string }
  | { state: 'ready'; result: Analysis; proposal: string };

const storageKey = 'event-horizon-catering-arrival';

function clock(time: string) {
  const [hour, minute] = time.split(':');
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) < 12 ? 'AM' : 'PM'}`;
}

function Findings({ title, items }: { title: string; items: string[] }) {
  return <div><h3>{title}</h3>
    {items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>None identified.</p>}
  </div>;
}

export default function Readiness() {
  const [arrival, setArrival] = useState(initialArrival);
  const [proposal, setProposal] = useState('17:00');
  const [missingSetup, setMissingSetup] = useState(false);
  const [review, setReview] = useState<Review>({ state: 'idle' });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (isTime(saved)) setArrival(saved);
    } catch {
      // The workflow can continue in memory when storage is unavailable.
    }
  }, []);

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTime(proposal) || review.state === 'analyzing') return;
    setReview({ state: 'analyzing' });
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arrival: proposal, currentArrival: arrival, missingSetup }),
      });
      const result = await response.json();
      if (!response.ok) {
        setReview({ state: 'error', message: result.error });
        return;
      }
      setReview({ state: 'ready', result, proposal });
    } catch {
      setReview({ state: 'error', message: 'Could not complete the analysis. Try again.' });
    }
  }

  function decide(approved: boolean) {
    if (review.state !== 'ready') return;
    if (approved) {
      setArrival(review.proposal);
      try {
        sessionStorage.setItem(storageKey, review.proposal);
      } catch {
        // The approved change remains available in this page.
      }
    }
    setProposal('');
    setReview({ state: approved ? 'approved' : 'rejected' });
  }

  return <section className="panel" id="readiness" aria-labelledby="readiness-title">
    <p className="eyebrow">01 / Schedule review</p>
    <h2 id="readiness-title">Event readiness</h2>
    <dl className="metrics">
      <div><dt>Doors open</dt><dd>{clock(eventStart)}</dd></div>
      <div><dt>Current catering arrival</dt><dd>{clock(arrival)}</dd></div>
      <div><dt>Setup duration</dt><dd>{missingSetup ? 'Unknown' : `${setupMinutes} min`}</dd></div>
    </dl>
    <h3>Run of show</h3>
    <ul className="schedule">{[...tasks].sort((a, b) => a.time.localeCompare(b.time)).map(task =>
      <li key={task.id}><time dateTime={task.time}>{clock(task.time)}</time><span>{task.name}</span>
        <small>{task.dependsOnCatering ? 'Depends on catering' : 'Independent'}</small></li>)}</ul>
    <form onSubmit={runAnalysis}>
      <fieldset disabled={review.state === 'analyzing'}>
        <div className="controls">
          <label>Proposed catering arrival<input type="time" required value={proposal} onChange={event => {
            setProposal(event.target.value);
            setReview({ state: 'idle' });
          }} /></label>
          <button disabled={!proposal}>{review.state === 'analyzing' ? 'Analyzing…' : 'Analyze arrival'}</button>
        </div>
        <label className="checkbox"><input type="checkbox" checked={missingSetup} onChange={event => {
          setMissingSetup(event.target.checked);
          setReview({ state: 'idle' });
        }} /> Try the demo with an unknown setup duration</label>
      </fieldset>
    </form>
    <div role="status">
      {review.state === 'analyzing' && <p>Checking the proposed arrival…</p>}
      {review.state === 'approved' && <p>Arrival updated to {clock(arrival)} for this session.</p>}
      {review.state === 'rejected' && <p>Proposal rejected. Catering is still scheduled for {clock(arrival)}.</p>}
    </div>
    {review.state === 'error' && <p role="alert" className="error">{review.message}</p>}
    {review.state === 'ready' && <div className="report" aria-labelledby="report-title">
      <p className="eyebrow">{review.result.source}</p>
      <h3 id="report-title">Impact report</h3>
      <p>Current arrival <strong>{clock(arrival)}</strong> · Proposed arrival <strong>{clock(review.proposal)}</strong></p>
      <p><strong>Calculated schedule</strong> · {review.result.timing
        ? `Setup finishes at ${review.result.timing.finish}. ${review.result.timing.overlap} min overlap after doors open.`
        : 'Setup finish and overlap are unknown.'}</p>
      <div className="findings">
        <Findings title="Affected tasks" items={review.result.report.affected_task_ids.map(id =>
          tasks.find(task => task.id === id)!.name)} />
        <Findings title="Scheduling risks" items={review.result.report.scheduling_risks} />
        <Findings title="Missing information" items={review.result.report.unknowns} />
      </div>
      <h3>Recommended next step</h3>
      <p>{review.result.report.recommendation}</p>
      <div className="actions">
        <button onClick={() => decide(true)}>Approve arrival</button>
        <button className="secondary" onClick={() => decide(false)}>Reject proposal</button>
      </div>
    </div>}
  </section>;
}
