# rozo-intents Skills

Cross-chain crypto payments and bridging via Rozo. Covers wallet detection,
balance checks, QR parsing, payment creation, and status tracking.

## Runtime

All `node scripts/dist/*.js` commands MUST run from the **plugin root**
(directory containing `.claude-plugin/plugin.json`). Use `${CLAUDE_PLUGIN_ROOT}`
when installed as a plugin. If unset, `cd` to the directory that contains
`scripts/dist/`, `skills/`, and `.claude-plugin/`.

**No API keys required.** Rozo APIs are public and rate-limited.

## Critical Rules

These apply across all sub-skills. Never skip them.

- **EVM address without chain → always ask which chain.** Wrong chain = lost funds.
  Do this regardless of amount or confirmation threshold.
- **Stellar memo MUST be included when funding.** The deposit address is shared;
  memo routes the payment to the correct order. Missing memo = lost funds.
- **Amount limits:** $0.01 minimum, $10,000 maximum per transaction.
- **Trust the live API over chain/token support tables.** Always run
  `create-payment.js --dryrun` before telling a user a route is unsupported.
- **Stellar G-wallet: check trustline before proceeding.** Missing trustline =
  funds rejected. Run `check-stellar-trustline.js` first.
- **Do not `sleep` between status polls.** Some harnesses block it. Re-run
  `get-payment.js` immediately if status is still pending.

## Confirmation Thresholds

Read `version.json` for current values (`freeConfirmThresholdUsd` = $1,
`singleConfirmThresholdUsd` = $10 by default).

| Amount | Behavior |
|---|---|
| ≤ $1 | Silent auto-execute, one-line result only |
| ≤ $10 | Narrated auto-execute, no yes/no prompt, **skip dryrun** (fee = $0) |
| > $10 | Run `--dryrun` for exact fee, full summary + yes/no confirmation |

Chain ambiguity is **never** skipped regardless of amount.

## Skills

| Skill | File | Triggers |
|---|---|---|
| [rozo-intents](skills/rozo-intents/SKILL.md) | skills/rozo-intents/ | Main router — "pay", "send", "transfer", wallet addresses, QR screenshots |
| [send-payment](skills/send-payment/SKILL.md) | skills/send-payment/ | "pay", "send", "transfer", "payout" with amount + destination |
| [check-balance](skills/check-balance/SKILL.md) | skills/check-balance/ | "check balance", "how much do I have", "what's my USDC balance" |
| [payment-status](skills/payment-status/SKILL.md) | skills/payment-status/ | "payment status", "track payment", payment UUID or tx hash |
| [parse-qr](skills/parse-qr/SKILL.md) | skills/parse-qr/ | QR screenshots, payment URIs (EIP-681, Solana Pay, Stellar URI) |

## Scripts

| Script | Used by | Purpose |
|---|---|---|
| `check-balance.js` | check-balance, send-payment | Fetch wallet balances (auto-detects chain from address) |
| `create-payment.js` | send-payment | Create payment or dryrun for fee estimate |
| `get-payment.js` | payment-status, send-payment | Poll payment status by ID, tx hash, or address+memo |
| `parse-qr.js` | parse-qr, send-payment | Parse EIP-681, Solana Pay, Stellar URI, plain addresses |
| `check-stellar-trustline.js` | send-payment | Verify USDC/EURC trustline on Stellar G-wallets |
| `chains.js` | (shared) | Chain IDs, token addresses, decimals |

## Supported Chains

### Pay-out (sending to)

| Chain | USDC | USDT |
|---|:---:|:---:|
| Ethereum | ✓ | ✓ |
| Arbitrum | ✓ | ✓ |
| Base | ✓ | ✓ |
| BSC | ✓ | ✓ |
| Polygon | ✓ | ✓ |
| Solana | ✓ | — |
| Stellar | ✓ | — |

### Pay-in (paying from)

| Chain | USDC | USDT |
|---|:---:|:---:|
| Ethereum | ✓ | ✓ |
| Arbitrum | ✓ | ✓ |
| Base | ✓ | — |
| BSC | ✓ | ✓ |
| Polygon | ✓ | ✓ |
| Solana | ✓ | ✓ |
| Stellar | ✓ | — |

These tables can be stale — always verify with `--dryrun`.

## Source Chain Selection

1. User specifies source → use it
2. Stellar wallet available (`.stellar-secret`, `STELLAR_PRIVATE_KEY`, or `STELLAR_ADDRESS` in `.env`) → **default to Stellar** (zero fee ≤ $10, fastest settlement)
3. Otherwise check for EVM/Solana wallets in `.env`
4. Multiple non-Stellar wallets → ask user, recommend Stellar

## References

- `references/supported-chains.md` — chain IDs, token addresses, decimals
- `references/api-reference.md` — Rozo API endpoints and schemas
- `references/wallet-detection.md` — address format detection rules
- API docs: <https://apidoc.rozo.ai>
- Supported tokens: <https://docs.rozo.ai/integration/api-doc/supported-tokens-and-chains>
