import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
  IChangeUserRolePayload,
  IChangeUserStatusPayload,
  IUpdateAdminPayload,
  IAdminFilterRequest,
} from "./admin.interface";

import { Role, UserStatus, Prisma } from "../../../../generated/prisma/index.js";
import { IRequestUser } from "../../interfaces/requestUser.inteface";
import { adminSearchableFields } from "./admin.constant";

const getAllAdmin = async (
  filters: IAdminFilterRequest,
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

  const andCondition: Prisma.AdminWhereInput[] = [];

  // Search by name or email (through user relation)
  if (searchTerm) {
    andCondition.push({
      OR: adminSearchableFields.map((field) => ({
        user: {
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
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

  // Filter by role (on user relation)
  if (filterData.role) {
    andCondition.push({
      user: {
        role: filterData.role as Role,
      },
    });
  }

  const whereConditions: Prisma.AdminWhereInput =
    andCondition.length > 0 ? { AND: andCondition } : {};

  const result = await prisma.admin.findMany({
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder === "asc" ? "asc" : "desc",
    },
    where: whereConditions,
    include: {
      user: true,
    },
  });

  const totalAdmin = await prisma.admin.count({
    where: whereConditions,
  });

  return {
    data: result,
    meta: {
      limit,
      current_Page: page,
      total_page: Math.ceil(totalAdmin / limit),
      total: totalAdmin,
    },
  };
};

const getAdminById = async (id: string) => {
  const result = await prisma.admin.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });
  return result;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  
  const isAdminExist = await prisma.admin.findFirst({
    where: {
      OR: [
        { id },
        { userId: id }
      ]
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  if (currentUser?.role !== "SUPER_ADMIN") {
    if (currentUser?.id !== isAdminExist.userId) {
      throw new AppError(
        status.UNAUTHORIZED,
        "You are not authorized to update other admin only super admin can update all admin",
      );
    }
  }

  // Atomically update both Admin and User records
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Admin record
    const updatedAdmin = await tx.admin.update({
      where: {
        id: isAdminExist.id,
      },
      data: { ...payload }
    });

    // 2. Prepare user update data based on what's in the payload
    const userUpdateData: any = {};
    if (payload.name) userUpdateData.name = payload.name;
    if (payload.email) userUpdateData.email = payload.email;
    if (payload.profilePhoto) userUpdateData.profilePhoto = payload.profilePhoto;
    if (payload.contactNumber) userUpdateData.contactNumber = payload.contactNumber;

    // 3. Update User record if there's anything to update
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: {
          id: isAdminExist.userId,
        },
        data: userUpdateData,
      });
    }

    return updatedAdmin;
  });

  return result;
};

//soft delete
const deleteAdmin = async (id: string, currentUser: IRequestUser) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: currentUser.userId,
    },
  });



  if (userData?.role !== Role.SUPER_ADMIN) {
    throw new AppError(
      status.UNAUTHORIZED,
      "You are not authorized to delete admin user, only super admin can delete admin user",
    );
  }

  if (userData?.role === Role.SUPER_ADMIN) {
    throw new AppError(
      status.UNAUTHORIZED,
      "You are not allowed to delete own Super admin user",
    );
  }

  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  if (isAdminExist.userId === currentUser.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
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
        id: isAdminExist.userId,
      },
      data: {
        status: UserStatus.INACTIVE,

      },
    });

    await tx.session.deleteMany({
      where: {
        userId: isAdminExist.userId,
      },
    });

    await tx.account.deleteMany({
      where: {
        userId: isAdminExist.userId,
      },
    });
    const admin = getAdminById(id);
    return admin;
  });
  return result;
};

const changeUserStatus = async (
  currentUser: IRequestUser,
  payload: IChangeUserStatusPayload,
  id: string
) => {
  // 1. Super admin can change the status of any user (admin, doctor, patient). Except himself. He cannot change his own status.
  // 2. Admin can change the status of doctor and patient. Except himself. He cannot change his own status. He cannot change the status of super admin and other admin user.

  const { status : userStatus } = payload;

  const userToChangeStatus = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!userToChangeStatus) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const selfStatusChange = currentUser.userId === userToChangeStatus.id;

  if (selfStatusChange) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own status");
  }

  if (
    currentUser.role === Role.ADMIN &&
    userToChangeStatus?.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the status of super admin user",
    );
  }

  if (currentUser.role === Role.ADMIN && userToChangeStatus?.role === Role.ADMIN) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the status of other admin user",
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updateUserStatus = await tx.user.update({
      where: {
        id : userToChangeStatus?.id,
      },
      data: {
        status: userStatus,
        // Record the time of suspension for the auto-delete cron job
        ...(userStatus === UserStatus.SUSPENDED && { suspendedAt: new Date() }),
        // Clear suspendedAt if status is being changed away from SUSPENDED
        ...(userStatus !== UserStatus.SUSPENDED && { suspendedAt: null }),
      },
    });
    if (userStatus === UserStatus.INACTIVE) {
      await tx.session.deleteMany({
        where: {
          userId: id,
        },
      });
    }

    if (userStatus === UserStatus.SUSPENDED) {
      await tx.session.deleteMany({
        where: {
          userId: id,
        },
      });
      await tx.account.deleteMany({
        where: {
          userId: id,
        },
      });
    }
    return updateUserStatus;
  })
}

const changeUserRole = async (
  user: IRequestUser,
  payload: IChangeUserRolePayload,
  id: string
) => {
  const isSuperAdminExist = await prisma.admin.findUnique({
    where: {
      email: user.email,
      user: {
        role: Role.SUPER_ADMIN,
      },
    },
  });

  if (!isSuperAdminExist) {
    throw new AppError(status.NOT_FOUND, "Super admin not found");
  }


  if (user?.role !== "SUPER_ADMIN") {
    throw new AppError(status.UNAUTHORIZED, "You are not authorized to change user role");
  }

  const { role } = payload;

  const userToChangeRole = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  const selfRoleChange = isSuperAdminExist.userId === userToChangeRole?.id;

  if (selfRoleChange) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own role");
  }


  const updateUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: role as Role,
    },
  });
  return updateUser;
};

export const AdminService = {
  getAllAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  changeUserStatus,
  changeUserRole,
};
