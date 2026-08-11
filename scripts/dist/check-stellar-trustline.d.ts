/**
 * Check if a Stellar G-wallet has a trustline for a given asset via the Horizon API.
 * Supports USDC (default) and EURC.
 */
export type StellarAsset = "USDC" | "EURC";
export interface TrustlineResult {
    address: string;
    asset: StellarAsset;
    hasTrustline: boolean;
    balance?: string;
    error?: string;
}
export declare function checkStellarTrustline(address: string, asset?: StellarAsset): Promise<TrustlineResult>;
