export declare enum PaymentMethod {
    STRIPE = "stripe",// 信用卡
    ALIPAY = "alipay",// 支付宝
    PAYPAL = "paypal",// PayPal
    WECHAT = "wechat"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    displayName: string;
    price: number;
    yearlyPrice?: number;
    credits: number;
    features: string[];
    limits: {
        dailyQuota: number;
        modelAccess: string[];
        maxTokens: number;
        concurrent: number;
    };
}
export declare const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan>;
declare class PaymentService {
    private stripe;
    private paypalClient;
    constructor();
    private initializePaymentProviders;
    createPayment(params: {
        userId: string;
        amount: number;
        currency: string;
        method: PaymentMethod;
        description: string;
        planId?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        transactionId: any;
        paymentId: string;
        clientSecret: string | null;
        amount: number;
        currency: string;
        method: PaymentMethod;
    } | {
        transactionId: any;
        paymentId: any;
        approvalUrl: any;
        amount: number;
        currency: string;
        method: PaymentMethod;
    } | {
        transactionId: any;
        paymentId: any;
        paymentUrl: string;
        amount: number;
        currency: string;
        method: PaymentMethod;
    }>;
    private createStripePayment;
    private createPayPalPayment;
    private createAlipayPayment;
    private generateAlipaySign;
    handlePaymentWebhook(method: PaymentMethod, payload: any, signature?: string): Promise<string | {
        received: boolean;
    }>;
    private handleStripeWebhook;
    private handlePayPalWebhook;
    private handleAlipayCallback;
    private handlePaymentSuccess;
    private handlePaymentFailure;
    getUserSubscription(userId: string): Promise<{
        plan: SubscriptionPlan;
        isActive: boolean;
        expiresAt: Date | null;
        credits: number;
        canUpgrade: boolean;
    }>;
    cancelSubscription(userId: string): Promise<{
        success: boolean;
    }>;
}
export declare const paymentService: PaymentService;
export {};
//# sourceMappingURL=payment.d.ts.map