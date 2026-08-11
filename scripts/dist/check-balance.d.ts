/**
 * Check wallet balances via the Rozo balance API.
 *
 * Single call returns all USDC/USDT balances across all supported chains
 * for the given address type (evm, solana, stellar).
 */
export interface TokenBalance {
    token: string;
    chain: string;
    balance: string;
    decimals: number;
}
export interface BalanceResponse {
    address: string;
    chain: string;
    balances: TokenBalance[];
    error?: string;
}
type ChainParam = "evm" | "solana" | "stellar";
export declare function checkBalance(address: string, chain?: ChainParam): Promise<BalanceResponse>;
export {};
