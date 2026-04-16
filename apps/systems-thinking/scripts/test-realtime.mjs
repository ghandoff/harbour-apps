#!/usr/bin/env node
// headless smoke test for the realtime facilitator dashboard.
//
// usage:
//   1. terminal A: `npx partykit dev` (from apps/systems-thinking/)
//   2. terminal B: `vercel dev`       (from apps/systems-thinking/)
//   3. terminal C: `npm run test:realtime` (from apps/systems-thinking/)
//
// what it does:
//   - creates a session via POST /api/session/create
//   - opens a websocket to the partykit room as facilitator
//   - posts a fake student-log event via POST /api/session/log
//   - asserts the websocket receives the broadcast within 1 second
//
// requires node 22+ for built-in WebSocket. exits 0 on pass, 1 on fail.

const VERCEL_URL = process.env.TEST_VERCEL_URL || 'http://localhost:3000';
const PARTYKIT_HOST = process.env.TEST_PARTYKIT_HOST || 'localhost:1999';
const PIN = '1234';

if (typeof WebSocket === 'undefined') {
  console.error('FAIL: WebSocket is not defined. node 22+ required.');
  process.exit(1);
}

function step(name) {
  console.log('• ' + name);
}

function pass(msg) {
  console.log('✓ PASS — ' + msg);
}

function fail(msg) {
  console.error('✗ FAIL — ' + msg);
  process.exit(1);
}

async function main() {
  step('creating session');
  const createRes = await fetch(VERCEL_URL + '/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: PIN }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    fail('POST /api/session/create returned ' + createRes.status + ': ' + text);
  }
  const { code } = await createRes.json();
  step('session code: ' + code);

  step('joining as fake student');
  const joinRes = await fetch(VERCEL_URL + '/api/session/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!joinRes.ok) fail('POST /api/session/join returned ' + joinRes.status);
  const { participantId } = await joinRes.json();
  step('participantId: ' + participantId.slice(0, 8));

  step('opening facilitator websocket');
  const wsUrl = 'ws://' + PARTYKIT_HOST + '/parties/main/' + code +
    '?role=facilitator&pin=' + PIN;
  const ws = new WebSocket(wsUrl);

  const received = [];
  ws.addEventListener('message', (e) => {
    try {
      received.push(JSON.parse(e.data));
    } catch {}
  });

  ws.addEventListener('error', (e) => {
    fail('websocket error: ' + (e.message || JSON.stringify(e)));
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    setTimeout(() => reject(new Error('ws open timeout (5s)')), 5000);
  }).catch((e) => fail(e.message));
  pass('websocket open');

  // wait briefly for the 'connected' hello, then test pin rejection in parallel
  await new Promise((r) => setTimeout(r, 200));
  if (received.some((m) => m.type === 'connected')) {
    pass('received "connected" hello');
  }

  step('verifying bad pin is rejected');
  const badWs = new WebSocket('ws://' + PARTYKIT_HOST + '/parties/main/' + code +
    '?role=facilitator&pin=9999');
  await new Promise((resolve) => {
    badWs.addEventListener('close', () => {
      pass('bad pin connection closed');
      resolve();
    });
    badWs.addEventListener('open', () => {
      fail('bad pin should not have opened');
    });
    setTimeout(resolve, 3000);
  });

  step('posting student-log event');
  const beforeCount = received.length;
  const logRes = await fetch(VERCEL_URL + '/api/session/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionCode: code,
      participantId,
      type: 'scenario_started',
      data: { scenario: 'churn' },
    }),
  });
  if (!logRes.ok) fail('POST /api/session/log returned ' + logRes.status);

  step('waiting up to 1s for broadcast');
  const start = Date.now();
  let progressMsg = null;
  while (Date.now() - start < 1000) {
    progressMsg = received.slice(beforeCount).find((m) => m.type === 'student-progress');
    if (progressMsg) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!progressMsg) {
    fail('no student-progress event received within 1s. received: ' +
      JSON.stringify(received));
  }
  pass('received student-progress in ' + (Date.now() - start) + 'ms');
  if (progressMsg.participantId !== participantId) {
    fail('participantId mismatch: expected ' + participantId + ' got ' + progressMsg.participantId);
  }
  if (progressMsg.currentScenario !== 'churn') {
    fail('currentScenario mismatch: expected "churn" got ' + JSON.stringify(progressMsg.currentScenario));
  }
  pass('payload matches');

  ws.close();
  console.log('\nall checks passed.');
  process.exit(0);
}

main().catch((e) => {
  console.error('test crashed:', e);
  process.exit(1);
});
