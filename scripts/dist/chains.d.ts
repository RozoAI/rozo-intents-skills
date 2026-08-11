export type ChainType = "evm" | "solana" | "stellar";
export type TokenSymbol = "USDC" | "USDT";
export type Direction = "payin" | "payout";
export interface ChainInfo {
    name: string;
    type: ChainType;
}
export interface TokenInfo {
    address: string;
    decimals: number;
}
export declare const CHAINS: Record<number, ChainInfo>;
export declare const CHAIN_NAME_TO_ID: Record<string, number>;
export declare const PAYIN_TOKENS: Record<TokenSymbol, Record<number, TokenInfo>>;
export declare const PAYOUT_TOKENS: Record<TokenSymbol, Record<number, TokenInfo>>;
export declare function getTokenAddress(chainId: number, token: TokenSymbol, direction?: Direction): TokenInfo | null;
export declare function getChainName(chainId: number): string;
export declare function isPayoutSupported(chainId: number, token: TokenSymbol): boolean;
/**
 * Parse a chain argument that may be either a numeric ID ("8453") or a
 * case-insensitive chain name ("base", "stellar", "solana", "ethereum",
 * "arbitrum", "bsc", "polygon"). Returns the numeric chain ID, or null
 * if the input resolves to neither.
 */
export declare function parseChain(input: string): number | null;
