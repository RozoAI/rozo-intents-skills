import { type TokenSymbol } from "./chains.js";
export interface CreatePaymentParams {
    appId?: string;
    type?: "exactIn" | "exactOut";
    sourceChain: number;
    sourceToken: TokenSymbol;
    destChain: number;
    destAddress: string;
    destToken: TokenSymbol;
    destAmount: string;
    destMemo?: string;
    orderId?: string;
    sourceAmount?: string;
    dryrun?: boolean;
}
export interface PaymentResponse {
    success: boolean;
    payment?: Record<string, unknown>;
    statusCode?: number;
    error?: unknown;
}
export declare function createPayment(params: CreatePaymentParams): Promise<PaymentResponse>;
