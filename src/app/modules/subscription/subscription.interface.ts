export interface ISubscribePayload {
    couponCode?: string;
}

export interface ISubscriberFilterRequest {
    searchTerm?: string;
}

export interface ISubscriptionResponse {
    payment: {
        id: string;
        subscriberId: string;
        price: number;
        transactionId: string;
        subscriptionDate: Date;
        createdAt: Date;
    };
    finalAmount: number;
    discountApplied: number;
    transactionId: string;
    subscriber: {
        id: string;
        email: string;
        name: string;
        isSubscribed: boolean;
        paymentVerified: boolean;
        status: string;
        subscriptionDate: Date | null;
    };
}
