export interface ICreateCouponPayload {
    couponCode: string;
    description: string;
    discount: number;
    expiryDate: string;
    usageLimit?: number;
}

export interface IUpdateCouponPayload {
    description?: string;
    discount?: number;
    expiryDate?: string;
    usageLimit?: number;
    isActive?: boolean;
}

export interface ICouponFilterRequest {
    searchTerm?: string;
    isActive?: string;
}
