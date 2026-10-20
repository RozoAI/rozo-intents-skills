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
/**
 * Convert an EIP-681 base-unit amount ("1000000", "1e18", "2.014e18") to a
 * decimal string in whole tokens, exactly. Returns undefined if the value is
 * malformed or does not resolve to a whole number of base units.
 */
export declare function formatBaseUnits(raw: string, decimals: number): string | undefined;
export declare function parseQR(content: string): ParsedQR | null;
