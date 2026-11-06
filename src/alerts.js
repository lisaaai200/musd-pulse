// Pure helpers for browser-local liquidation reminder UX.
// No network calls, no email APIs — the user copies or opens mailto themselves.

export function buildAlertSubject({ chain = 'Mezo', address } = {}) {
  const short = address && /^0x[0-9a-fA-F]{40}$/.test(address)
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : 'my trove';
  return `MUSD Pulse reminder: check ${short} on ${chain}`;
}

export function buildAlertBody({
  address = '',
  collateralBtc = null,
  debtMusd = null,
  ratio = null,
  liqPrice = null,
  btcPrice = null,
  note = '',
} = {}) {
  const lines = [
    'MUSD Pulse — local liquidation check reminder',
    '',
    'This message was drafted in the browser. MUSD Pulse does not send email.',
    'Open https://lisaaai200.github.io/musd-pulse/ and re-check the trove before acting.',
    '',
    `Borrower address: ${address || '(paste your Mezo address)'}`,
  ];
  if (collateralBtc != null) lines.push(`Collateral (BTC): ${collateralBtc}`);
  if (debtMusd != null) lines.push(`Debt (MUSD): ${debtMusd}`);
  if (ratio != null && Number.isFinite(ratio)) lines.push(`Collateral ratio: ${(ratio * 100).toFixed(1)}%`);
  if (btcPrice != null) lines.push(`BTC price when drafted: $${btcPrice}`);
  if (liqPrice != null && Number.isFinite(liqPrice)) lines.push(`Liquidation BTC price (est.): $${liqPrice}`);
  if (note) {
    lines.push('');
    lines.push(`Note: ${note}`);
  }
  lines.push('');
  lines.push('Not financial advice. Verify on-chain before borrowing or topping up.');
  return lines.join('\n');
}

export function buildMailtoHref({ to = '', subject, body }) {
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  if (body) q.set('body', body);
  const query = q.toString();
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}${query ? `?${query}` : ''}`;
}

export function reminderKey(address) {
  const a = (address || '').trim().toLowerCase();
  return a ? `musd-pulse:reminder:${a}` : 'musd-pulse:reminder:draft';
}

export function serializeReminder(payload) {
  return JSON.stringify({ ...payload, savedAt: payload.savedAt || new Date().toISOString() });
}

export function parseReminder(raw) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return o;
  } catch {
    return null;
  }
}
