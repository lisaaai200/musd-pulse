// Minimal read-only JSON-RPC client: no wallet, no signing, no dependencies.
export const CHAINS = {
  mezo: { name: 'Mezo', rpc: ['https://mainnet.mezo.public.validationcloud.io', 'https://rpc-http.mezo.boar.network', 'https://mezo.drpc.org'] },
  ethereum: { name: 'Ethereum', rpc: ['https://ethereum-rpc.publicnode.com'] },
  base: { name: 'Base', rpc: ['https://mainnet.base.org'] },
};
export const ADDR = {
  MUSD: '0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186', // same address on Mezo, Ethereum and Base
  TroveManager: '0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193',
  PriceFeed: '0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88',
};
export const SEL = {
  totalSupply: '0x18160ddd', fetchPrice: '0x0fdb11cf', getTCR: '0xb82f263d',
  getCurrentICR: '0xd293c710', getEntireDebtAndColl: '0xb91af97c',
  MCR: '0x794e5724', CCR: '0x5733d58f', MUSD_GAS_COMPENSATION: '0x7af110ba',
};

export const word = (hex) => BigInt('0x' + (hex.replace(/^0x/, '') || '0'));
export const pad32 = (v) => (typeof v === 'bigint' ? v.toString(16) : v.toLowerCase().replace(/^0x/, '')).padStart(64, '0');
export const fromWad = (v, decimals = 18) => Number(v) / 10 ** decimals;
export const words = (hex) => (hex.replace(/^0x/, '').match(/.{64}/g) || []).map((w) => BigInt('0x' + w));

export function isAddress(a) { return /^0x[0-9a-fA-F]{40}$/.test(a || ''); }

export async function ethCall(chainKey, to, data, fetchImpl = fetch) {
  let lastErr;
  for (const url of CHAINS[chainKey].rpc) {
    try {
      const res = await fetchImpl(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data }, 'latest'] }),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || 'rpc error');
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no rpc');
}

export async function readSnapshot(fetchImpl = fetch) {
  const call = (c, to, d) => ethCall(c, to, d, fetchImpl);
  const [price, mcr, ccr, gas] = (await Promise.all([
    call('mezo', ADDR.PriceFeed, SEL.fetchPrice), call('mezo', ADDR.TroveManager, SEL.MCR),
    call('mezo', ADDR.TroveManager, SEL.CCR), call('mezo', ADDR.TroveManager, SEL.MUSD_GAS_COMPENSATION),
  ])).map(word);
  const supply = {};
  await Promise.all(Object.keys(CHAINS).map(async (c) => {
    try { supply[c] = fromWad(word(await call(c, ADDR.MUSD, SEL.totalSupply))); } catch { supply[c] = null; }
  }));
  return { btcPrice: fromWad(price), mcr: fromWad(mcr), ccr: fromWad(ccr), gasCompensation: fromWad(gas), supply, at: new Date().toISOString() };
}

export async function readTrove(address, btcPriceWad, fetchImpl = fetch) {
  if (!isAddress(address)) throw new Error('not an address');
  const r = await ethCall('mezo', ADDR.TroveManager, SEL.getEntireDebtAndColl + pad32(address), fetchImpl);
  const w = words(r);
  const icr = word(await ethCall('mezo', ADDR.TroveManager, SEL.getCurrentICR + pad32(address) + pad32(btcPriceWad), fetchImpl));
  // TroveManager.getEntireDebtAndColl returns (coll, principal, interest, pendingColl, pendingPrincipal, pendingInterest)
  const [coll = 0n, principal = 0n, interest = 0n, pColl = 0n, pPrin = 0n, pInt = 0n] = w;
  return { coll: fromWad(coll + pColl), principal: fromWad(principal + pPrin), interest: fromWad(interest + pInt), icr: fromWad(icr) };
}
