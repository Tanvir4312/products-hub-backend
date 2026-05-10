import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateAdmin, ICreateModeratorPayload } from "./adminModeratorCreate..interface";
import { auth } from "../../lib/auth";
import { Prisma, Role, UserStatus } from "../../../../generated/prisma/index.js";


const createModerator = async (payload: ICreateModeratorPayload) => {
  const isExitUser = await prisma.user.findUnique({
    where: {
      email: payload.moderator.email,
    },
  });

  if (isExitUser) {
    throw new AppError(status.BAD_REQUEST, "User already exist");
  }

  const userdata = await auth.api.signUpEmail({
    body: {
      name: payload.moderator.name,
      email: payload.moderator.email,
      password: payload.password,
      role: Role.MODERATOR,
      needPasswordChange: true,

    },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const moderatorData = await tx.moderator.create({
        data: {
          userId: userdata.user.id,
          ...payload.moderator,
        },
      });

      await tx.user.update({
        where: {
          id: userdata.user.id,
        },
        data: {
          emailVerified: true,
        },
      });

      const moderator = await tx.moderator.findUnique({
        where: {
          id: moderatorData.id,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          contactNumber: true,


          gender: true,
          profilePhoto: true,
          isDeleted: true,

          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              emailVerified: true,
              needPasswordChange: true,
              isDeleted: true,
              deletedAt: true,
            },
          },
        },
      });


      return moderator

    });

    return result;
  } catch (err) {
    await prisma.user.delete({
      where: {
        id: userdata.user.id,
      },
    });

  }
};

const createAdmins = async (payload: ICreateAdmin) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.admin.email,
    },
  });

  if (isUserExist) {
    throw new AppError(status.BAD_REQUEST, "User already exist");
  }

  const { password, admin, role } = payload;

  const userdata = await auth.api.signUpEmail({
    body: {
      ...admin,
      role,
      password,
      needPasswordChange: true,
    },
  });
  await prisma.user.update({
    where: {
      id: userdata.user.id,
    },
    data: {
      emailVerified: true,
    },
  });

  try {
    const adminData = await prisma.admin.create({
      data: {
        userId: userdata.user.id,
        ...admin,
      },
      include: {
        user: true,
      },
    });
    return adminData;
  } catch (err) {
  
    await prisma.user.delete({
      where: {
        id: userdata.user.id,
      },
    });
  }
};

const getAllUsers = async (
  searchTerm: string,
  page: number,
  limit: number,
  skip: number,
  sortBy: string,
  sortOrder: string,
  filterRole?: string,
  filterStatus?: string
) => {
  const andCondition: Prisma.UserWhereInput[] = [];

  // 1. Search term logic (existing)
  if (searchTerm) {
    // Check if searchTerm matches a status or role for broad search
    const statusVal = searchTerm?.toUpperCase() === UserStatus.ACTIVE
      ? UserStatus.ACTIVE
      : searchTerm?.toUpperCase() === UserStatus.INACTIVE
        ? UserStatus.INACTIVE
        : searchTerm?.toUpperCase() === UserStatus.SUSPENDED
          ? UserStatus.SUSPENDED
          : undefined;

    const roleVal = searchTerm?.toUpperCase() === Role.ADMIN
      ? Role.ADMIN
      : searchTerm?.toUpperCase() === Role.MODERATOR
        ? Role.MODERATOR
        : searchTerm?.toUpperCase() === Role.USER
          ? Role.USER
          : undefined;

    andCondition.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        ...(roleVal ? [{ role: { equals: roleVal as Role } }] : []),
        ...(statusVal ? [{ status: { equals: statusVal as UserStatus } }] : []),
      ],
    });
  }

  // 2. Explicit Role filter
  if (filterRole) {
    andCondition.push({
      role: filterRole as Role,
    });
  }

  // 3. Explicit Status filter
  if (filterStatus) {
    andCondition.push({
      status: {
        equals: filterStatus as UserStatus,
      },
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andCondition.length > 0 ? { AND: andCondition } : {};

  const result = await prisma.user.findMany({
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder === "asc" ? "asc" : "desc",
    },
    where: whereConditions,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      needPasswordChange: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true,
      deletedAt: true,
    },
  });

  const totalUser = await prisma.user.count({
    where: whereConditions,
  });
  return {
    data: result,
    meta: {
      limit,
      current_Page: page,
      total_page: Math.ceil(totalUser / limit),
      total: totalUser,
    },
  };
};
export const UserService = {
  createModerator,
  createAdmins,
  getAllUsers,
};
