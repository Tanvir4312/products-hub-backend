import { ProductStatus } from "../../../generated/prisma/index.js";

export interface ICreateProductPayload {
    name: string;
    description: string;
    tagIds: string[];
    photo: string;
}

export interface IUpdateProductPayload {
    name?: string;
    description?: string;
    tagIds?: string[];
    photo?: string;
    featured?: boolean;
    status ?: ProductStatus
}

export interface IProductFilterRequest {
    searchTerm?: string;
    status?: ProductStatus;
    ownerId?: string;
}
