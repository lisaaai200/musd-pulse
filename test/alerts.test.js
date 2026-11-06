import test from 'node:test'; import assert from 'node:assert/strict';
import {
  buildAlertSubject, buildAlertBody, buildMailtoHref,
  reminderKey, serializeReminder, parseReminder,
} from '../src/alerts.js';

test('alert subject shortens a valid address', () => {
  const a = '0x' + 'a'.repeat(40);
  assert.equal(buildAlertSubject({ address: a }), `MUSD Pulse reminder: check 0xaaaa…aaaa on Mezo`);
});

test('alert subject falls back without address', () => {
  assert.match(buildAlertSubject({}), /my trove/);
});

test('alert body includes address and ratio', () => {
  const body = buildAlertBody({ address: '0x' + 'b'.repeat(40), ratio: 1.8, debtMusd: 2000, collateralBtc: 0.05, btcPrice: 100000, liqPrice: 44000 });
  assert.match(body, /0xbbbb/);
  assert.match(body, /180\.0%/);
  assert.match(body, /does not send email/);
  assert.match(body, /lisaaai200\.github\.io\/musd-pulse/);
});

test('mailto href encodes subject and body', () => {
  const href = buildMailtoHref({ to: 'you@example.com', subject: 'Hi there', body: 'Line 1\nLine 2' });
  assert.ok(href.startsWith('mailto:you@example.com?'));
  assert.match(href, /subject=Hi\+there/);
  assert.match(href, /body=Line/);
});

test('reminder key normalizes address', () => {
  assert.equal(reminderKey('0xABC'), 'musd-pulse:reminder:0xabc');
  assert.equal(reminderKey(''), 'musd-pulse:reminder:draft');
});

test('serialize and parse reminder round-trip', () => {
  const raw = serializeReminder({ address: '0x1', note: 'check Friday' });
  const o = parseReminder(raw);
  assert.equal(o.address, '0x1');
  assert.equal(o.note, 'check Friday');
  assert.ok(o.savedAt);
  assert.equal(parseReminder('not-json'), null);
  assert.equal(parseReminder(''), null);
});
