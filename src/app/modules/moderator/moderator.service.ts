import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IModeratorUpadatePayload, IModeratorFilterRequest } from "./moderator.interface";
import { IRequestUser } from "../../interfaces/requestUser.inteface";
import { Prisma, UserStatus } from "../../../generated/prisma/index.js";

import { moderatorSearchableFields } from "./moderator.constant";

const getAllModerator = async (
  filters: IModeratorFilterRequest,
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

  const andCondition: Prisma.ModeratorWhereInput[] = [];

  // Search by name, email, or contactNumber (all directly on Moderator model)
  if (searchTerm) {
    andCondition.push({
      OR: moderatorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Filter by status (on user relation)
  if (filterData.status) {
    andCondition.push({
      user: {
        status: filterData.status as UserStatus,
      },
    });
  }

  // Filter by gender (on moderator)
  if (filterData.gender) {
    andCondition.push({
      gender: filterData.gender,
    });
  }

  const whereConditions: Prisma.ModeratorWhereInput =
    andCondition.length > 0 ? { AND: andCondition } : {};

  const moderator = await prisma.moderator.findMany({
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder === "asc" ? "asc" : "desc",
    },
    where: {
      ...whereConditions,
      isDeleted: false,
    },
    include: {
      user: true,
    },
  });

  const totalModerator = await prisma.moderator.count({
    where: {
      ...whereConditions,
      isDeleted: false,
    },
  });

  return {
    data: moderator,
    meta: {
      limit,
      current_Page: page,
      total_page: Math.ceil(totalModerator / limit),
      total: totalModerator,
    },
  };
};
const getAllModeratorwithoutQuery = async () => {
  const moderator = await prisma.moderator.findMany({
    include: {
      user: true,
    },
  });

  return {
    data: moderator,
  };
};

const getModeratorById = async (id: string) => {
  const isExisModerator = await prisma.moderator.findUnique({
    where: {
      id,
      isDeleted: false,
    }
  });
  if (!isExisModerator) {
    throw new AppError(status.NOT_FOUND, "Moderator not found");
  }

  const moderator = await prisma.moderator.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });
  return moderator;
};

const moderatorUpdate = async (
  id: string,
  payload: IModeratorUpadatePayload,
  currentUser: IRequestUser,

) => {

  const isModeratorExis = await prisma.moderator.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      user: true,
    },
  });

  if (!isModeratorExis) {
    throw new AppError(status.NOT_FOUND, "Moderator not found");
  }

  if (currentUser.role === "MODERATOR") {
    if (currentUser.email !== isModeratorExis.user.email) {
      throw new AppError(
        status.UNAUTHORIZED,
        "You are not authorized to update this moderator",
      );
    }
  }



  return await prisma.$transaction(async (tx) => {
    if (payload) {
      await tx.moderator.update({
        where: {
          id,
        },
        data: {
          ...payload
        }
      });
    }
    if (payload?.name) {
      await tx.user.update({
        where: {
          id: isModeratorExis.userId,
        },
        data: {
          name: payload?.name,
        },
      });
    }
    if (payload?.email) {
      await tx.user.update({
        where: {
          id: isModeratorExis.userId,
        },
        data: {
          email: payload?.email,
        },
      });
    }

    const moderator = await tx.moderator.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });
    return moderator;
  });
};

const moderatorDelete = async (id: string) => {
  const isExisModerator = await prisma.moderator.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });
  if (!isExisModerator) {
    throw new AppError(status.NOT_FOUND, "Moderator not found");
  }
  return await prisma.$transaction(async (tx) => {
    await tx.moderator.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    await tx.user.update({
      where: {
        id: isExisModerator.userId,
      },
      data: {
        status: UserStatus.INACTIVE,

      },
    });
    await tx.session.deleteMany({
      where: {
        userId: isExisModerator.userId,
      },
    });
  });
};

export const ModeratorService = {
  getAllModerator,
  getAllModeratorwithoutQuery,
  getModeratorById,
  moderatorUpdate,
  moderatorDelete,
};
