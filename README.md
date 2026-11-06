# MUSD Pulse

**Live demo: https://lisaaai200.github.io/musd-pulse/**

> An AI-run entry for the Mezo Buildathon: built and submitted by Genie, an AI agent operated by Lord JC.

A live, read-only page for MUSD, the Bitcoin-backed stablecoin on [Mezo](https://mezo.org). It is built for the **Access & Distribution** track of the Mezo Buildathon: it helps people understand MUSD and plan a safe borrow before they ever connect a wallet.

- **Right now**: BTC price from Mezo's PriceFeed, MUSD supply on Mezo, Ethereum and Base, and the protocol's live minimum and recovery-mode ratios (read from TroveManager).
- **Will my trove be safe?**: enter BTC collateral and MUSD to borrow; see collateral ratio, liquidation BTC price, how far BTC can fall, and the max debt that stays at 150%+. Includes the 0.1% borrowing fee and the live gas-compensation reserve.
- **Check an existing trove**: paste a borrower address to see its collateral, debt and ratio.
- **Testnet practice trove (Wave 2)**: step-by-step walkthrough linking official Mezo Testnet RPC/faucet/borrow docs. This page stays read-only — no wallet connect.
- **Bridge explainer (Wave 2)**: how MUSD moves across Mezo / Ethereum / Base via Wormhole NTT (docs only; no bridge tx).
- **Liquidation reminder (Wave 2)**: local browser draft + `localStorage` + copy / `mailto:` — MUSD Pulse never sends email and never stores a personal inbox in the repo.

No wallet connection, no keys, no backend. Plain HTML and ES modules calling public JSON-RPC nodes (`eth_call` only).

## Run
```
npx serve .        # or any static server, then open http://localhost:3000
npm test           # unit tests (node:test, no dependencies)
npm run live       # live smoke test against public RPCs
```

## Contracts read (Mezo mainnet, from the official docs)
| Contract | Address |
| --- | --- |
| MUSD | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` (same on Ethereum and Base) |
| TroveManager | `0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193` |
| PriceFeed | `0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88` |

## Testnet references used in the practice walkthrough
| Item | Value / link |
| --- | --- |
| Chain ID | `31611` |
| RPC | `https://rpc.test.mezo.org` |
| Explorer | https://explorer.test.mezo.org/ |
| Faucet | https://faucet.test.mezo.org/ |
| Testnet MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| Borrow UI | https://mezo.org/feature/borrow |

## Roadmap
- **Wave 1 (done)**: live MUSD data + trove health calculator; submitted on AKINDO.
- **Wave 2 (this update, free-only)**: testnet practice-trove walkthrough, bridge explainer, local liquidation-reminder UX. Still needs JC OK before any AKINDO Wave 2 submit.
- **Later**: mobile layout polish, embeddable widget. Automated email delivery (if ever) needs JC OK and a free provider — not in this release.

Built by Genie, an AI agent operated by Lord JC. Not financial advice. MIT licensed.
