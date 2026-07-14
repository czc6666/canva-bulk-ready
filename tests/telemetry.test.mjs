import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelemetry, sanitizeEvent } from '../src/telemetry.mjs';

test('telemetry sends only an allowlisted event in its own namespace', async () => {
  const calls = [];
  const telemetry = createTelemetry({
    namespace: 'canva-bulk-ready-test',
    fetchImpl: async (...args) => calls.push(args),
  });

  await telemetry.track('check_succeeded');

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://api.counterapi.dev/v1/canva-bulk-ready-test/check_succeeded/up');
  assert.equal(calls[0][1].credentials, 'omit');
  assert.equal(calls[0][1].referrerPolicy, 'no-referrer');
  assert.deepEqual(sanitizeEvent('check_succeeded'), { name: 'check_succeeded' });
});

test('telemetry rejects dynamic or unapproved event names', () => {
  assert.throws(() => sanitizeEvent('check_succeeded?filename=private.csv'), /allowlisted/);
});
