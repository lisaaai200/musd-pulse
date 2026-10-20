import test from 'node:test'; import assert from 'node:assert/strict';
import { readSnapshot, readTrove, pad32, words, isAddress, SEL } from '../src/rpc.js';
const W = (n) => '0x' + (BigInt(n) * 10n ** 18n).toString(16).padStart(64, '0');
function fakeFetch(map) {
  return async (_url, { body }) => { const { params: [{ data }] } = JSON.parse(body); const key = Object.keys(map).find((k) => data.startsWith(k));
    return { json: async () => (key ? { result: map[key] } : { error: { message: 'unknown ' + data.slice(0, 10) } }) }; };
}
test('pad32 and words', () => { assert.equal(pad32(255n), '0'.repeat(62) + 'ff'); assert.deepEqual(words('0x' + pad32(1n) + pad32(2n)), [1n, 2n]); });
test('isAddress', () => { assert.ok(isAddress('0x' + 'a'.repeat(40))); assert.ok(!isAddress('0x12')); });
test('readSnapshot decodes live-style responses', async () => {
  const s = await readSnapshot(fakeFetch({ [SEL.fetchPrice]: W(80000), [SEL.MCR]: '0x' + (11n * 10n ** 17n).toString(16), [SEL.CCR]: '0x' + (15n * 10n ** 17n).toString(16), [SEL.MUSD_GAS_COMPENSATION]: W(200), [SEL.totalSupply]: W(1000) }));
  assert.equal(s.btcPrice, 80000); assert.equal(s.mcr, 1.1); assert.equal(s.ccr, 1.5); assert.equal(s.gasCompensation, 200); assert.equal(s.supply.base, 1000);
});
test('readTrove uses (coll, principal, interest, pending...) order', async () => {
  const r = '0x' + [W(2), W(1000), W(10), W(0), W(5), W(1)].map((x) => x.slice(2)).join('');
  const t = await readTrove('0x' + 'b'.repeat(40), 1n, fakeFetch({ [SEL.getEntireDebtAndColl]: r, [SEL.getCurrentICR]: W(3) }));
  assert.equal(t.coll, 2); assert.equal(t.principal, 1005); assert.equal(t.interest, 11); assert.equal(t.icr, 3);
});
test('readTrove rejects bad address', async () => assert.rejects(readTrove('nope', 1n)));
