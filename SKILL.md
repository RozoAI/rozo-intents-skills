# rozo-intents Skills

Cross-chain crypto payments and bridging via Rozo. Covers wallet detection,
balance checks, QR parsing, payment creation, and status tracking.

## Runtime

All `node scripts/dist/*.js` commands MUST run from the **plugin root**
(directory containing `.claude-plugin/plugin.json`). Use `${CLAUDE_PLUGIN_ROOT}`
when installed as a plugin. If unset, `cd` to the directory that contains
`scripts/dist/`, `skills/`, and `.claude-plugin/`.

**No API keys required.** Rozo APIs are public and rate-limited.

**Data sent to Rozo:** wallet addresses, chain/token choices, amounts,
memos, and payment IDs are transmitted to Rozo's public rate-limited APIs
(`intentapiv4.rozo.ai`, `api-balance.rozo-deeplink.workers.dev`) as part
of normal operation. Anyone who can observe a payment ID can query its
status.

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

**Auto-execute is OFF by default.** Both thresholds ship as `0`, so every
payment — any amount — shows full details and waits for an explicit yes/no.
Skipping confirmation for small amounts is strictly opt-in: the user must
themselves raise `freeConfirmThresholdUsd` / `singleConfirmThresholdUsd` in
`version.json`. Never suggest raising them; act on the values found.

Read `version.json` for current values (both default `0` = disabled).

| Amount | Behavior |
|---|---|
| ≤ `freeConfirm` (user-raised) | Silent auto-execute, one-line result only |
| ≤ `singleConfirm` (user-raised) | Narrated auto-execute, no yes/no prompt, **skip dryrun** (fee = $0) |
| everything else (all amounts at the `0` defaults) | Run `--dryrun` for exact fee, full summary + yes/no confirmation |

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
2. Otherwise **ask which wallet they are paying from** and recommend Stellar
   (zero fee ≤ $10, fastest settlement). **Never go looking for wallet secrets
   yourself** — do not probe for `.stellar-secret`, read `.env` files, or
   enumerate key material to guess what the user holds. A wallet the user has
   not named is not yours to discover.

## References

- `references/supported-chains.md` — chain IDs, token addresses, decimals
- `references/api-reference.md` — Rozo API endpoints and schemas
- `references/wallet-detection.md` — address format detection rules
- API docs: <https://apidoc.rozo.ai>
- Supported tokens: <https://docs.rozo.ai/integration/api-doc/supported-tokens-and-chains>
