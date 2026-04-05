# Rozo Cross-Chain Payment Skills for Agents

Use these skills to send cross-chain crypto payments with the Rozo API.

An agent can use Rozo to:
- send USDC or USDT from one supported chain to a recipient on another supported chain
- pay wallet addresses on EVM chains, Solana, and Stellar
- check available balances before sending
- parse payment QR codes into transfer details
- monitor payment status after creation

This makes it easy for an agent to move funds from chain A to chain B without building separate payment logic for each network.


## Available Skills

| Skill | Description |
| ----- | ----------- |
| [send-payment](./skills/send-payment/SKILL.md) | Send cross-chain crypto payments (USDC/USDT) to any supported chain |
| [check-balance](./skills/check-balance/SKILL.md) | Check wallet USDC/USDT balances across all supported chains |
| [parse-qr](./skills/parse-qr/SKILL.md) | Parse payment QR codes (EIP-681, Solana Pay, Stellar URI) |
| [payment-status](./skills/payment-status/SKILL.md) | Check the status of a Rozo payment by ID |

## Supported Chains

### Pay-Out (sending to)

| Chain | USDC | USDT |
| ----- | ---- | ---- |
| Ethereum | Yes | Yes |
| Arbitrum | Yes | Yes |
| Base | Yes | Yes |
| BSC | Yes | Yes |
| Polygon | Yes | Yes |
| Solana | Yes | No |
| Stellar | Yes | No |

### Pay-In (paying from)

| Chain | USDC | USDT |
| ----- | ---- | ---- |
| Ethereum | Yes | Yes |
| Arbitrum | Yes | Yes |
| Base | Yes | No |
| BSC | Yes | Yes |
| Polygon | Yes | Yes |
| Solana | Yes | Yes |
| Stellar | Yes | No |

## Scripts

Shared Node.js scripts in `scripts/dist/` (compiled from TypeScript source in `scripts/src/`):

| Script | Purpose |
| ------ | ------- |
| `check-balance.js` | Fetch wallet balances via Rozo balance API |
| `check-stellar-trustline.js` | Verify asset trustline (USDC/EURC) on Stellar G-wallets |
| `create-payment.js` | Create a payment via Rozo API |
| `get-payment.js` | Get payment status by ID |
| `parse-qr.js` | Parse payment QR code URIs |
| `chains.js` | Shared chain/token config (imported by other scripts) |

### Setup

```bash
cd scripts
npm install
npm run build   # compile TS → dist/
npm test        # run tests
```

### Running scripts

All scripts run with plain `node` — no TypeScript runtime needed:

```bash
node scripts/dist/check-balance.js --address 0xab23...23dc
node scripts/dist/create-payment.js --source-chain 8453 --source-token USDC --dest-chain 137 --dest-address 0xab23...23dc --dest-token USDC --dest-amount 10 --dryrun
node scripts/dist/create-payment.js --source-chain 8453 --source-token USDC --dest-chain 137 --dest-address 0xab23...23dc --dest-token USDC --dest-amount 10
node scripts/dist/get-payment.js --payment-id <payment-uuid>
node scripts/dist/parse-qr.js "ethereum:0x833.../transfer?address=0xab2...&uint256=1000000"
node scripts/dist/check-stellar-trustline.js --address G...
node scripts/dist/check-stellar-trustline.js --address G... --asset EURC
```

## References

- [Rozo API Docs](https://apidoc.rozo.ai/)
- [Supported Tokens & Chains](https://docs.rozo.ai/integration/api-doc/supported-tokens-and-chains)
- [Stellar Contract Payments](https://docs.rozo.ai/integration/api-doc/api-for-advanced-used/stellar-contract-payments)
