import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateProductPayload, IUpdateProductPayload, IProductFilterRequest } from "./product.interface";
import { Prisma } from "../../../../generated/prisma/index.js";
import { productSearchableFields } from "./product.constant";

const createProduct = async (
    payload: ICreateProductPayload,
    ownerId: string
) => {
    const { name, description, tagIds, photo, links } = payload;

    // Trim all string inputs
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedOwnerId = ownerId.trim();

    // Remove duplicate tagIds
    const uniqueTagIds = [...new Set(tagIds)];

    // Validate all tagIds exist in Tag table
    const existingTags = await prisma.tag.findMany({
        where: {
            id: {
                in: uniqueTagIds,
            },
        },
        select: {
            id: true,
        },
    });

    const existingTagIds = existingTags.map((tag) => tag.id);
    const invalidTagIds = uniqueTagIds.filter((id) => !existingTagIds.includes(id));

    if (invalidTagIds.length > 0) {
        throw new AppError(
            status.BAD_REQUEST,
            `Invalid tag IDs: ${invalidTagIds.join(", ")}`
        );
    }

    // Use transaction to create product and tag relations
    const result = await prisma.$transaction(async (tx) => {
        // Create product
        const product = await tx.product.create({
            data: {
                name: trimmedName,
                description: trimmedDescription,
                ownerId: trimmedOwnerId,
                photo,
                links,
            },
        });

        // Create ProductTag relations
        if (uniqueTagIds.length > 0) {
            await tx.productTag.createMany({
                data: uniqueTagIds.map((tagId) => ({
                    productId: product.id,
                    tagId,
                })),
                skipDuplicates: true,
            });
        }

        // Return product with tags
        const productWithTags = await tx.product.findUnique({
            where: {
                id: product.id,
            },
            include: {
                tags: {
                    include: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return productWithTags;
    });

    return result;
};

const getAllProducts = async (
    filters: IProductFilterRequest,
    options: {
        page: number;
        limit: number;
        skip: number;
        sortBy?: string;
        sortOrder?: string;
    }
) => {
    const { searchTerm, ...filterData } = filters;
    const { limit, skip, page } = options;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const andCondition: Prisma.ProductWhereInput[] = [];

    // Only show non-deleted products
    andCondition.push({
        isDeleted: false,
    });

    // Search by name, description, or tag name
    if (searchTerm) {
        andCondition.push({
            OR: [
                // Search by product name/description
                ...productSearchableFields.map((field) => ({
                    [field]: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                })),
                // Search by tag name (through ProductTag relation)
                {
                    tags: {
                        some: {
                            tag: {
                                name: {
                                    contains: searchTerm,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                },
            ],
        });
    }

    // Filter by status and ownerId
    if (filterData.status) {
        andCondition.push({
            status: filterData.status,
        });
    }

    if (filterData.ownerId) {
        andCondition.push({
            ownerId: filterData.ownerId,
        });
    }

    if (filterData.tagName) {
        andCondition.push({
            tags: {
                some: {
                    tag: {
                        name: {
                            equals: filterData.tagName,
                            mode: "insensitive",
                        },
                    },
                },
            },
        });
    }

    if (filterData.isFeatured !== undefined) {
        andCondition.push({
            isFeatured: filterData.isFeatured === "true" || filterData.isFeatured === true,
        });
    }

    if (filterData.reportedStatus !== undefined) {
        andCondition.push({
            reportedStatus: filterData.reportedStatus === "true" || filterData.reportedStatus === true,
        });
    }

    const whereConditions: Prisma.ProductWhereInput =
        andCondition.length > 0 ? { AND: andCondition } : { isDeleted: false };

    const products = await prisma.product.findMany({
        take: limit,
        skip,
        orderBy: sortBy === "votedUsers" 
            ? { votedUsers: { _count: sortOrder === "asc" ? "asc" : "desc" } }
            : { [sortBy]: sortOrder === "asc" ? "asc" : "desc" },
        where: whereConditions,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
            tags: {
                include: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            reviews: {
                select: {
                    rating: true,
                    comment: true,
                    user: {
                        select: {
                            name: true,
                            profilePhoto: true
                        }
                    }
                }
            },
            votedUsers: {
                select: {
                    userId: true,
                },
            },
            reportedUsers: {
                select: {
                    userId: true,
                },
            },
            _count: {
                select: {
                    votedUsers: true,
                    reportedUsers: true,
                    reviews: true,
                },
            },
        },
    });

    const totalProducts = await prisma.product.count({
        where: whereConditions,
    });

    return {
        data: products,
        meta: {
            limit,
            current_Page: page,
            total_page: Math.ceil(totalProducts / limit),
            total: totalProducts,
        },
    };
};

const getMyProducts = async (
    userId: string,
    filters: IProductFilterRequest,
    options: {
        page: number;
        limit: number;
        skip: number;
        sortBy?: string;
        sortOrder?: string;
    }
) => {
    const { searchTerm, ...filterData } = filters;
    const { limit, skip, page } = options;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const andCondition: Prisma.ProductWhereInput[] = [];

    // Only show user's own products
    andCondition.push({
        ownerId: userId,
        isDeleted: false,
    });

    // Search by name, description, or tag name
    if (searchTerm) {
        andCondition.push({
            OR: [
                ...productSearchableFields.map((field) => ({
                    [field]: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                })),
                {
                    tags: {
                        some: {
                            tag: {
                                name: {
                                    contains: searchTerm,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                },
            ],
        });
    }

    if (filterData.status) {
        andCondition.push({
            status: filterData.status,
        });
    }

    if (filterData.tagName) {
        andCondition.push({
            tags: {
                some: {
                    tag: {
                        name: {
                            equals: filterData.tagName,
                            mode: "insensitive",
                        },
                    },
                },
            },
        });
    }

    if (filterData.isFeatured !== undefined) {
        andCondition.push({
            isFeatured: filterData.isFeatured === 'true' || filterData.isFeatured === true,
        });
    }

    const whereConditions: Prisma.ProductWhereInput = { AND: andCondition };

    const products = await prisma.product.findMany({
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder === "asc" ? "asc" : "desc",
        },
        where: whereConditions,
        include: {
            tags: {
                include: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            votedUsers: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            reportedUsers: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            _count: {
                select: {
                    votedUsers: true,
                    reportedUsers: true,
                    reviews: true,
                },
            },
        },
    });

    const totalProducts = await prisma.product.count({
        where: whereConditions,
    });

    return {
        data: products,
        meta: {
            limit,
            current_Page: page,
            total_page: Math.ceil(totalProducts / limit),
            total: totalProducts,
        },
    };
};

const getProductById = async (id: string) => {
    const product = await prisma.product.findUnique({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
            tags: {
                include: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            votedUsers: {
                select: {
                    userId: true,
                },
            },
            reportedUsers: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profilePhoto: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            _count: {
                select: {
                    votedUsers: true,
                    reportedUsers: true,
                    reviews: true,
                },
            },
        },
    });

    if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    return product;
};

const updateProduct = async (
    id: string,
    payload: IUpdateProductPayload,
    currentUserId: string,
    currentUserRole: string
) => {
    const { name, description, tagIds, photo, status: productStatus, links, isFeatured } = payload;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
        where: {
            id,
        },
        include: {
            owner: true,
        },
    });

    if (!existingProduct || existingProduct.isDeleted) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    // Check authorization - only owner or ADMIN/SUPER_ADMIN/MODERATOR can update
    const isPrivilegedUser = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN" || currentUserRole === "MODERATOR";
    
    if (!isPrivilegedUser) {
        if (existingProduct.ownerId !== currentUserId) {
            throw new AppError(
                status.FORBIDDEN,
                "You can only update your own products"
            );
        }
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (photo !== undefined) updateData.photo = photo;
    if (productStatus !== undefined) updateData.status = productStatus;
    if (links !== undefined) updateData.links = links;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    // Handle tag updates
    let uniqueTagIds: string[] | undefined;
    if (tagIds && tagIds.length > 0) {
        uniqueTagIds = [...new Set(tagIds)];

        // Validate all tagIds exist
        const existingTags = await prisma.tag.findMany({
            where: {
                id: {
                    in: uniqueTagIds,
                },
            },
            select: {
                id: true,
            },
        });

        const existingTagIds = existingTags.map((tag) => tag.id);
        const invalidTagIds = uniqueTagIds.filter(
            (id) => !existingTagIds.includes(id)
        );

        if (invalidTagIds.length > 0) {
            throw new AppError(
                status.BAD_REQUEST,
                `Invalid tag IDs: ${invalidTagIds.join(", ")}`
            );
        }
    }

    // Use transaction for update
    const result = await prisma.$transaction(async (tx) => {
        // Update product
        const product = await tx.product.update({
            where: {
                id,
            },
            data: updateData,
        });

        // Update tags if provided
        if (uniqueTagIds) {
            // Delete existing relations
            await tx.productTag.deleteMany({
                where: {
                    productId: id,
                },
            });

            // Create new relations
            await tx.productTag.createMany({
                data: uniqueTagIds.map((tagId) => ({
                    productId: id,
                    tagId,
                })),
                skipDuplicates: true,
            });
        }

        // Return updated product with tags
        const productWithTags = await tx.product.findUnique({
            where: {
                id: product.id,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                    },
                },
                tags: {
                    include: {
                        tag: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return productWithTags;
    });

    return result;
};

const deleteProduct = async (
    id: string,
    currentUserId: string,
    currentUserRole: string
) => {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
        where: {
            id,
        },
    });

    if (!existingProduct || existingProduct.isDeleted) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    // Check authorization - only owner or ADMIN/SUPER_ADMIN can delete
    if (currentUserRole !== "ADMIN" && currentUserRole !== "SUPER_ADMIN") {
        if (existingProduct.ownerId !== currentUserId) {
            throw new AppError(
                status.FORBIDDEN,
                "You can only delete your own products"
            );
        }
    }

    // Soft delete
    const result = await prisma.product.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
        },
    });

    return { message: "Product deleted successfully" };
};

export const ProductServices = {
    createProduct,
    getAllProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
