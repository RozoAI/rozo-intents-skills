/**
 * Parse payment QR code content.
 *
 * Supports:
 * - EIP-681: ethereum:<address>[@chainId][/transfer?address=<to>&uint256=<amount>]
 * - Solana Pay: solana:<address>?amount=<amount>[&spl-token=<mint>][&label=...][&message=...][&memo=...]
 * - Stellar URI: web+stellar:pay?destination=<address>&amount=<amount>[&asset_code=USDC&asset_issuer=...]
 * - Plain addresses: 0x..., base58, G..., C...
 */

export interface ParsedQR {
  type: "eip681" | "solana-pay" | "stellar-uri" | "plain-address";
  address: string;
  chainId?: number;
  token?: string;
  tokenAddress?: string;
  /** Amount exactly as written in the URI. EIP-681 uses base units (wei / token units); Solana Pay and Stellar URIs use decimal token amounts. */
  amount?: string;
  /** Token decimals used to read `amount`, when known. */
  decimals?: number;
  /** Human-readable amount in whole tokens (e.g. "1.5" USDC), when it can be computed exactly. Use this for display and payment, not `amount`. */
  tokenAmount?: string;
  memo?: string;
  label?: string;
  message?: string;
  raw: string;
}

// EIP-681 chain ID to Rozo chain ID mapping
const EIP681_CHAIN_MAP: Record<number, number> = {
  1: 1,        // Ethereum
  42161: 42161, // Arbitrum
  8453: 8453,  // Base
  56: 56,      // BSC
  137: 137,    // Polygon
};

// Known ERC-20 token contract → symbol mapping (lowercase).
// Decimals match chains.ts; note the BSC tokens use 18, not 6.
const EVM_TOKEN_CONTRACTS: Record<string, { symbol: string; chainId: number; decimals: number }> = {
  // USDC
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", chainId: 1, decimals: 6 },
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { symbol: "USDC", chainId: 42161, decimals: 6 },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", chainId: 8453, decimals: 6 },
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { symbol: "USDC", chainId: 56, decimals: 18 },
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { symbol: "USDC", chainId: 137, decimals: 6 },
  // USDT
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", chainId: 1, decimals: 6 },
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { symbol: "USDT", chainId: 42161, decimals: 6 },
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": { symbol: "USDT", chainId: 8453, decimals: 6 },
  "0x55d398326f99059ff775485246999027b3197955": { symbol: "USDT", chainId: 56, decimals: 18 },
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { symbol: "USDT", chainId: 137, decimals: 6 },
};

// Native EVM assets (ETH, BNB, POL) all use 18 decimals.
const EVM_NATIVE_DECIMALS = 18;

// uint256 has at most 78 decimal digits; anything longer is not a valid amount.
const MAX_UINT256_DIGITS = 78;

/**
 * Convert an EIP-681 base-unit amount ("1000000", "1e18", "2.014e18") to a
 * decimal string in whole tokens, exactly. Returns undefined if the value is
 * malformed, larger than a uint256, or does not resolve to a whole number of
 * base units.
 */
export function formatBaseUnits(raw: string, decimals: number): string | undefined {
  const match = raw.match(/^(\d+)(?:\.(\d+))?(?:[eE]\+?(\d+))?$/);
  if (!match) return undefined;
  const [, intPart, rawFracPart = "", expPart = "0"] = match;
  const fracPart = rawFracPart.replace(/0+$/, ""); // "1000000.0" is still whole
  const exponent = Number(expPart);
  // Bound the expansion before padding: untrusted input like "1e999999999"
  // must not allocate a huge string.
  const significantIntDigits = intPart.replace(/^0+/, "").length;
  if (exponent > MAX_UINT256_DIGITS || significantIntDigits + exponent > MAX_UINT256_DIGITS) {
    return undefined;
  }
  if (fracPart.length > exponent) return undefined; // fractional base units
  const units = BigInt(intPart + fracPart.padEnd(exponent, "0"));
  const scale = 10n ** BigInt(decimals);
  const whole = units / scale;
  const fraction = (units % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function isDecimalAmount(value: string | null): value is string {
  return value !== null && /^\d+(\.\d+)?$/.test(value);
}

// Solana SPL token mint → symbol mapping
const SOLANA_TOKEN_MINTS: Record<string, string> = {
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
};

function parseEIP681(uri: string): ParsedQR | null {
  // ethereum:<contract_or_address>[@chainId][/transfer?address=<to>&uint256=<amount>]
  // or ethereum:<address>[@chainId][?value=<wei_amount>]
  const match = uri.match(/^ethereum:(0x[0-9a-fA-F]{40})(?:@(\d+))?(?:\/(\w+))?(?:\?(.+))?$/);
  if (!match) return null;

  const [, addressOrContract, chainIdStr, method, queryStr] = match;
  const params = new URLSearchParams(queryStr ?? "");
  const chainId = chainIdStr ? EIP681_CHAIN_MAP[Number(chainIdStr)] ?? Number(chainIdStr) : undefined;

  // ERC-20 transfer: contract is the token, address param is the recipient
  if (method === "transfer") {
    const recipient = params.get("address");
    const rawAmount = params.get("uint256");
    if (!recipient) return null;

    const contractLower = addressOrContract.toLowerCase();
    const knownToken = EVM_TOKEN_CONTRACTS[contractLower];
    // A QR that names a chain the contract is not deployed on is contradictory
    // (e.g. Base USDC with @56): don't label it or apply that token's decimals.
    const tokenInfo =
      knownToken && (chainId === undefined || chainId === knownToken.chainId) ? knownToken : undefined;

    return {
      type: "eip681",
      address: recipient,
      chainId: chainId ?? tokenInfo?.chainId,
      token: tokenInfo?.symbol,
      tokenAddress: addressOrContract,
      amount: rawAmount ?? undefined,
      decimals: tokenInfo?.decimals,
      tokenAmount:
        tokenInfo && rawAmount ? formatBaseUnits(rawAmount, tokenInfo.decimals) : undefined,
      raw: uri,
    };
  }

  // Simple ETH/native transfer with value (we note it but it's not a stablecoin transfer)
  const value = params.get("value");
  return {
    type: "eip681",
    address: addressOrContract,
    chainId,
    amount: value ?? undefined,
    decimals: value ? EVM_NATIVE_DECIMALS : undefined,
    tokenAmount: value ? formatBaseUnits(value, EVM_NATIVE_DECIMALS) : undefined,
    raw: uri,
  };
}

function parseSolanaPay(uri: string): ParsedQR | null {
  // solana:<address>?amount=<amount>[&spl-token=<mint>][&label=...][&message=...][&memo=...]
  const match = uri.match(/^solana:([1-9A-HJ-NP-Za-km-z]{32,44})(?:\?(.+))?$/);
  if (!match) return null;

  const [, address, queryStr] = match;
  const params = new URLSearchParams(queryStr ?? "");
  const splToken = params.get("spl-token");
  const amount = params.get("amount");

  return {
    type: "solana-pay",
    address,
    chainId: 900,
    token: splToken ? SOLANA_TOKEN_MINTS[splToken] : undefined,
    tokenAddress: splToken ?? undefined,
    amount: amount ?? undefined,
    // Solana Pay amounts are already decimal token amounts.
    tokenAmount: isDecimalAmount(amount) ? amount : undefined,
    memo: params.get("memo") ?? undefined,
    label: params.get("label") ?? undefined,
    message: params.get("message") ?? undefined,
    raw: uri,
  };
}

function parseStellarURI(uri: string): ParsedQR | null {
  // web+stellar:pay?destination=<address>&amount=<amount>[&asset_code=USDC&asset_issuer=...]
  const match = uri.match(/^web\+stellar:pay\?(.+)$/);
  if (!match) return null;

  const params = new URLSearchParams(match[1]);
  const destination = params.get("destination");
  if (!destination) return null;

  const assetCode = params.get("asset_code");
  const amount = params.get("amount");

  return {
    type: "stellar-uri",
    address: destination,
    chainId: 1500,
    token: assetCode ?? undefined,
    amount: amount ?? undefined,
    // SEP-7 amounts are already decimal token amounts.
    tokenAmount: isDecimalAmount(amount) ? amount : undefined,
    memo: params.get("memo") ?? undefined,
    raw: uri,
  };
}

function parsePlainAddress(text: string): ParsedQR | null {
  const trimmed = text.trim();

  // EVM
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return { type: "plain-address", address: trimmed, raw: trimmed };
  }
  // Stellar G-wallet
  if (/^G[A-Z2-7]{55}$/.test(trimmed)) {
    return { type: "plain-address", address: trimmed, chainId: 1500, raw: trimmed };
  }
  // Stellar C-wallet
  if (/^C[A-Z2-7]{55}$/.test(trimmed)) {
    return { type: "plain-address", address: trimmed, chainId: 1500, raw: trimmed };
  }
  // Solana
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return { type: "plain-address", address: trimmed, chainId: 900, raw: trimmed };
  }

  return null;
}

export function parseQR(content: string): ParsedQR | null {
  const trimmed = content.trim();

  if (trimmed.startsWith("ethereum:")) return parseEIP681(trimmed);
  if (trimmed.startsWith("solana:")) return parseSolanaPay(trimmed);
  if (trimmed.startsWith("web+stellar:")) return parseStellarURI(trimmed);

  return parsePlainAddress(trimmed);
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error("Usage: node parse-qr.js <qr_content>");
    process.exit(1);
  }

  const result = parseQR(input);
  if (result) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error(JSON.stringify({ error: "Could not parse QR content", raw: input }));
    process.exit(1);
  }
}
