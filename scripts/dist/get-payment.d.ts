export interface GetPaymentResponse {
    success: boolean;
    payment?: Record<string, unknown>;
    statusCode?: number;
    error?: unknown;
}
/**
 * Get payment by payment ID.
 */
export declare function getPayment(paymentId: string): Promise<GetPaymentResponse>;
/**
 * Check payment by source transaction hash.
 * Looks back 7 days, returns the most recent matching payment.
 */
export declare function checkPaymentByTxHash(txHash: string): Promise<GetPaymentResponse>;
/**
 * Check payment by deposit address + memo.
 * Looks back 7 days, returns the most recent matching payment.
 */
export declare function checkPaymentByAddressMemo(receiverAddress: string, receiverMemo: string): Promise<GetPaymentResponse>;
