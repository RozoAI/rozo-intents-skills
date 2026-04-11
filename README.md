# rozo-intents

Cross-chain crypto payments and bridging inside Claude Code. Send USDC/USDT
across Ethereum, Arbitrum, Base, BSC, Polygon, Solana, and Stellar by just
describing what you want in plain language — Rozo handles wallet detection,
token selection, fee estimation, balance checks, and on-chain execution.

Built as a [Claude Code plugin](https://code.claude.com/docs/en/plugins.md).
Powered by the [Rozo API](https://apidoc.rozo.ai/).
Published on [ClawHub](https://clawhub.ai/plugins/rozo-intents).

## Install

In Claude Code, run:

```
/plugin marketplace add RozoAI/rozo-intents-skills
/plugin install rozo-intents@rozo
```

Or install via [ClawHub](https://clawhub.ai/plugins/rozo-intents) if you're
using an OpenClaw-compatible client.

That's it. No API keys, no env vars — the Rozo APIs are public and
rate-limited. You just need Node.js available (the plugin's runtime scripts
are plain `node`).

## Example prompts

Once installed, ask Claude Code things like:

- `pay 10 USDC on Base to 0x1234…abcd`
- `send 25 USDT on BSC to 0xabcd…1234`
- `payout 5 USDC on Solana to 9WzDXw…fkjP`
- `pay 2 USDC on Stellar to GABC…XYZ with memo invoice-42`
- `check my USDC balance on Base for 0x…`
- `what's the status of payment <uuid>?`
- *(drop in a payment QR screenshot)* → `send this`

The plugin auto-detects the wallet type, prefers USDC when the user doesn't
specify, warns you if a Stellar G-wallet is missing a trustline for the
asset, and picks a confirmation style based on amount:

- **≤ $1 (default)** — silent auto-execute, one-line result report
- **≤ $10 (default)** — narrated auto-execute, no yes/no prompt
- **> $10** — full summary with a single yes/no confirmation

Rozo charges **no fee** for transactions at or below the single-confirm
threshold. Thresholds are configurable in `version.json`.

Chain correctness questions (e.g. "which EVM chain for this `0x…`
address?") always block regardless of amount — wrong chain = lost funds.

## Supported chains

### Pay-out (sending to)

| Chain    | USDC | USDT |
|----------|:----:|:----:|
| Ethereum | ✓    | ✓    |
| Arbitrum | ✓    | ✓    |
| Base     | ✓    | ✓    |
| BSC      | ✓    | ✓    |
| Polygon  | ✓    | ✓    |
| Solana   | ✓    | —    |
| Stellar  | ✓    | —    |

### Pay-in (paying from)

| Chain    | USDC | USDT |
|----------|:----:|:----:|
| Ethereum | ✓    | ✓    |
| Arbitrum | ✓    | ✓    |
| Base     | ✓    | —    |
| BSC      | ✓    | ✓    |
| Polygon  | ✓    | ✓    |
| Solana   | ✓    | ✓    |
| Stellar  | ✓    | —    |

**Amount limits:** $0.01 min, $10,000 max per transaction. Payment type is
`exactOut` by default — the recipient gets the exact amount. For
transactions **above** the single-confirm threshold (default $10), the fee
is added on top of the amount you send; for transactions at or below the
threshold, the fee is $0.

## Links

- ClawHub plugin page: <https://clawhub.ai/plugins/rozo-intents>
- Docs: <https://docs.rozo.ai>
- API reference: <https://apidoc.rozo.ai>
- Supported tokens & chains: <https://docs.rozo.ai/integration/api-doc/supported-tokens-and-chains>

## Repo layout

```
skills/                           source skills (router + 4 sub-skills)
scripts/                          Node runtime scripts (TypeScript source + compiled dist)
references/                       chain/API/wallet reference docs
plugin/                            build tooling and manifest templates
.claude-plugin/marketplace.json    repo-root marketplace manifest (published)
build/plugin/rozo-intents/         built plugin artifact (published)
version.json                       single source of truth for version + metadata
```

### Releasing a new version

```bash
# 1. Bump version.json -> "version": "x.y.z"
# 2. Rebuild
npm run build:all
# 3. Commit and push
git add version.json .claude-plugin/ build/plugin/
git commit -m "Release x.y.z"
git push
```

Bumping `version.json` is required on every code change — Claude Code uses
the version field to invalidate installed users' caches.

## License

[MIT-0](./LICENSE.md) — do whatever you want.
