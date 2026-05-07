import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateTagPayload, IUpdateTagPayload } from "./tag.interface";

const createTag = async (payload: ICreateTagPayload) => {
    const trimmedName = payload.name.trim();

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
        where: {
            name: trimmedName,
        },
    });

    if (existingTag) {
        throw new AppError(status.CONFLICT, "Tag with this name already exists");
    }

    const result = await prisma.tag.create({
        data: {
            name: trimmedName,
        },
    });

    return result;
};

const getAllTags = async (nameFilter?: string) => {
    const whereCondition: any = {};

    // Filter by tag name (case-insensitive partial match)
    if (nameFilter) {
        whereCondition.name = {
            contains: nameFilter,
            mode: "insensitive",
        };
    }

    const tags = await prisma.tag.findMany({
        where: whereCondition,
        orderBy: {
            createdAt: "desc",
        },
    });

    return tags;
};

const updateTag = async (id: string, payload: IUpdateTagPayload) => {
    const trimmedName = payload.name.trim();

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
        where: {
            id,
        },
    });

    if (!existingTag) {
        throw new AppError(status.NOT_FOUND, "Tag not found");
    }

    // Check if new name already exists (and is not the current tag)
    if (trimmedName !== existingTag.name) {
        const duplicateTag = await prisma.tag.findUnique({
            where: {
                name: trimmedName,
            },
        });

        if (duplicateTag) {
            throw new AppError(status.CONFLICT, "Tag with this name already exists");
        }
    }

    const result = await prisma.tag.update({
        where: {
            id,
        },
        data: {
            name: trimmedName,
        },
    });

    return result;
};

const deleteTag = async (id: string) => {
    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
        where: {
            id,
        },
        include: {
            products: true,
        },
    });

    if (!existingTag) {
        throw new AppError(status.NOT_FOUND, "Tag not found");
    }

    // Delete related ProductTag entries first, then delete the tag
    await prisma.$transaction(async (tx) => {
        // Delete all related ProductTag entries
        await tx.productTag.deleteMany({
            where: {
                tagId: id,
            },
        });

        // Delete the tag
        await tx.tag.delete({
            where: {
                id,
            },
        });
    });

    return { message: "Tag deleted successfully" };
};

export const TagServices = {
    createTag,
    getAllTags,
    updateTag,
    deleteTag,
};
