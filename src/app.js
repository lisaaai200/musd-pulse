import { readSnapshot, readTrove, isAddress } from './rpc.js';
import { collateralRatio, liquidationPrice, maxDebt, openingDebt, healthLabel, drawdownToLiquidation } from './math.js';
import {
  buildAlertSubject, buildAlertBody, buildMailtoHref,
  reminderKey, serializeReminder, parseReminder,
} from './alerts.js';

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
  refreshAlertDraft();
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
    if (!$('alert-addr').value.trim()) $('alert-addr').value = a;
    refreshAlertDraft();
  } catch (e) { $('trove').textContent = 'Could not read this trove: ' + e.message; }
}

function draftPayload() {
  const address = ($('alert-addr').value || $('addr').value || '').trim();
  const coll = +$('coll').value || 0;
  const borrow = +$('borrow').value || 0;
  const debt = snap ? openingDebt(borrow, { gasCompensation: snap.gasCompensation }) : borrow;
  const ratio = snap ? collateralRatio(coll, debt, snap.btcPrice) : null;
  const liq = snap ? liquidationPrice(coll, debt, snap.mcr) : null;
  return {
    address,
    email: ($('alert-email').value || '').trim(),
    note: ($('alert-note').value || '').trim(),
    collateralBtc: coll || null,
    debtMusd: debt || null,
    ratio,
    liqPrice: liq != null && Number.isFinite(liq) ? Math.round(liq) : null,
    btcPrice: snap ? Math.round(snap.btcPrice) : null,
  };
}

function refreshAlertDraft() {
  if (!$('alert-preview')) return;
  const p = draftPayload();
  const subject = buildAlertSubject({ address: p.address });
  const body = buildAlertBody(p);
  $('alert-preview').value = `Subject: ${subject}\n\n${body}`;
  $('alert-mailto').href = buildMailtoHref({ to: p.email, subject, body });
}

function setAlertStatus(msg, ok = true) {
  const el = $('alert-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'muted ' + (ok ? 'ok' : 'warn');
}

function saveReminder() {
  try {
    const p = draftPayload();
    localStorage.setItem(reminderKey(p.address), serializeReminder(p));
    setAlertStatus('Saved in this browser only (localStorage). Nothing left this device.');
  } catch (e) {
    setAlertStatus('Could not save: ' + e.message, false);
  }
}

function loadReminder() {
  try {
    const address = ($('alert-addr').value || '').trim();
    const raw = localStorage.getItem(reminderKey(address)) || (!address ? localStorage.getItem(reminderKey('')) : null);
    const o = parseReminder(raw);
    if (!o) { setAlertStatus('No saved reminder for this key.', false); return; }
    if (o.address) $('alert-addr').value = o.address;
    if (o.email) $('alert-email').value = o.email;
    if (o.note) $('alert-note').value = o.note;
    refreshAlertDraft();
    setAlertStatus(`Loaded reminder saved at ${o.savedAt || 'unknown time'}.`);
  } catch (e) {
    setAlertStatus('Could not load: ' + e.message, false);
  }
}

function clearReminder() {
  try {
    const address = ($('alert-addr').value || '').trim();
    localStorage.removeItem(reminderKey(address));
    if (!address) localStorage.removeItem(reminderKey(''));
    setAlertStatus('Cleared saved reminder for this key.');
  } catch (e) {
    setAlertStatus('Could not clear: ' + e.message, false);
  }
}

async function copyDraft() {
  refreshAlertDraft();
  const text = $('alert-preview').value;
  try {
    await navigator.clipboard.writeText(text);
    setAlertStatus('Draft copied to clipboard.');
  } catch {
    $('alert-preview').select();
    setAlertStatus('Select-all ready — press copy in your browser if clipboard is blocked.', false);
  }
}

readSnapshot().then((s) => { snap = s; renderSnap(); renderCalc(); })
  .catch((e) => { $('snap').innerHTML = `<tr><td>Live data unavailable: ${e.message}</td><td></td></tr>`; refreshAlertDraft(); });
['coll', 'borrow'].forEach((id) => $(id).addEventListener('input', renderCalc));
$('addr').addEventListener('change', renderTrove);
['alert-addr', 'alert-email', 'alert-note'].forEach((id) => $(id).addEventListener('input', refreshAlertDraft));
$('alert-refresh').addEventListener('click', refreshAlertDraft);
$('alert-copy').addEventListener('click', copyDraft);
$('alert-save').addEventListener('click', saveReminder);
$('alert-load').addEventListener('click', loadReminder);
$('alert-clear').addEventListener('click', clearReminder);
refreshAlertDraft();
