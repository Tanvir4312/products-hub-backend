
import { Role, UserStatus, Gender } from "../../../generated/prisma/index.js";

export interface IUpdateAdminPayload {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
}

export interface IChangeUserStatusPayload {
    status: UserStatus;
}

export interface IChangeUserRolePayload {
    role: Role;
}

export interface IAdminFilterRequest {
    searchTerm?: string;
    status?: UserStatus;
    gender?: Gender;
}