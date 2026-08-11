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
    amount?: string;
    memo?: string;
    label?: string;
    message?: string;
    raw: string;
}
export declare function parseQR(content: string): ParsedQR | null;
