import { ProductStatus } from "../../../../generated/prisma/index.js";

export interface ICreateProductPayload {
    name: string;
    description: string;
    tagIds: string[];
    photo: string;
    links: string;
}

export interface IUpdateProductPayload {
    name?: string;
    description?: string;
    tagIds?: string[];
    photo?: string;
    isFeatured?: boolean;
    status?: ProductStatus;
    links?: string;
}

export interface IProductFilterRequest {
    searchTerm?: string;
    status?: ProductStatus;
    ownerId?: string;
    tagName?: string;
    isFeatured?: boolean | string;
    reportedStatus?: boolean | string;
}
