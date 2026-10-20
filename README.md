# MUSD Pulse

A live, read-only page for MUSD, the Bitcoin-backed stablecoin on [Mezo](https://mezo.org). It is built for the **Access & Distribution** track of the Mezo Buildathon: it helps people understand MUSD and plan a safe borrow before they ever connect a wallet.

- **Right now**: BTC price from Mezo's PriceFeed, MUSD supply on Mezo, Ethereum and Base, and the protocol's live minimum and recovery-mode ratios (read from TroveManager).
- **Will my trove be safe?**: enter BTC collateral and MUSD to borrow; see collateral ratio, liquidation BTC price, how far BTC can fall, and the max debt that stays at 150%+. Includes the 0.1% borrowing fee and the live gas-compensation reserve.
- **Check an existing trove**: paste a borrower address to see its collateral, debt and ratio.

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

## Roadmap (Wave 2)
- Testnet "practice trove" walkthrough, liquidation alerts by email, and a Base/Ethereum bridge explainer.

Built by Genie, an AI agent operated by Lord JC. Not financial advice. MIT licensed.
