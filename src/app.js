import { readSnapshot, readTrove, isAddress } from './rpc.js';
import { collateralRatio, liquidationPrice, maxDebt, openingDebt, healthLabel, drawdownToLiquidation } from './math.js';

const $ = (id) => document.getElementById(id);
const usd = (n, d = 0) => (n == null ? 'unavailable' : n.toLocaleString('en-US', { maximumFractionDigits: d }));
let snap;

function renderSnap() {
  const s = snap.supply, total = ['mezo', 'ethereum', 'base'].reduce((a, k) => a + (s[k] || 0), 0);
  $('snap').innerHTML = `
    <tr><td>BTC price (Mezo PriceFeed)</td><td>$${usd(snap.btcPrice, 2)}</td></tr>
    <tr><td>MUSD supply on Mezo</td><td>${usd(s.mezo)}</td></tr>
    <tr><td>MUSD supply on Ethereum</td><td>${usd(s.ethereum)}</td></tr>
    <tr><td>MUSD supply on Base</td><td>${usd(s.base)}</td></tr>
    <tr><td>Sum of the three readings</td><td>${usd(total)}</td></tr>
    <tr><td>Minimum collateral ratio</td><td>${usd(snap.mcr * 100)}%</td></tr>
    <tr><td>Recovery-mode threshold</td><td>${usd(snap.ccr * 100)}%</td></tr>`;
  $('at').textContent = `Read at ${new Date(snap.at).toLocaleString()}. Bridged supply uses Wormhole NTT, so chain readings may overlap.`;
}

function renderCalc() {
  if (!snap) return;
  const coll = +$('coll').value || 0, borrow = +$('borrow').value || 0;
  const debt = openingDebt(borrow, { gasCompensation: snap.gasCompensation });
  const cr = collateralRatio(coll, debt, snap.btcPrice), label = healthLabel(cr, snap);
  $('calc').innerHTML = `
    <div class="big ${label.replace(' ', '-')}">${Number.isFinite(cr) ? usd(cr * 100, 1) + '%' : '—'} · ${label}</div>
    <table>
      <tr><td>Total debt incl. 0.1% fee and ${usd(snap.gasCompensation)} MUSD gas reserve</td><td>${usd(debt, 2)}</td></tr>
      <tr><td>Liquidation BTC price</td><td>$${usd(liquidationPrice(coll, debt, snap.mcr), 0)}</td></tr>
      <tr><td>BTC can fall before liquidation</td><td>${usd(drawdownToLiquidation(coll, debt, snap.btcPrice, snap.mcr) * 100, 1)}%</td></tr>
      <tr><td>Max total debt at 150% (stays out of recovery range)</td><td>${usd(maxDebt(coll, snap.btcPrice, snap.ccr), 0)}</td></tr>
    </table>`;
}

async function renderTrove() {
  const a = $('addr').value.trim();
  if (!a) { $('trove').textContent = ''; return; }
  if (!isAddress(a)) { $('trove').textContent = 'That is not a valid address.'; return; }
  $('trove').textContent = 'Reading…';
  try {
    const t = await readTrove(a, BigInt(Math.round(snap.btcPrice * 1e6)) * 10n ** 12n);
    if (!t.coll && !t.principal) { $('trove').textContent = 'No open trove found for this address.'; return; }
    const debt = t.principal + t.interest, label = healthLabel(t.icr, snap);
    $('trove').innerHTML = `<div class="big ${label.replace(' ', '-')}">${usd(t.icr * 100, 1)}% · ${label}</div>
      <table><tr><td>Collateral</td><td>${usd(t.coll, 6)} BTC</td></tr><tr><td>Debt (principal + interest)</td><td>${usd(debt, 2)} MUSD</td></tr>
      <tr><td>Liquidation BTC price</td><td>$${usd(liquidationPrice(t.coll, debt, snap.mcr))}</td></tr></table>`;
  } catch (e) { $('trove').textContent = 'Could not read this trove: ' + e.message; }
}

readSnapshot().then((s) => { snap = s; renderSnap(); renderCalc(); })
  .catch((e) => { $('snap').innerHTML = `<tr><td>Live data unavailable: ${e.message}</td><td></td></tr>`; });
['coll', 'borrow'].forEach((id) => $(id).addEventListener('input', renderCalc));
$('addr').addEventListener('change', renderTrove);
