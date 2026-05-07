import { Gender, UserStatus } from "../../../generated/prisma/index.js";

export interface IModeratorUpadatePayload {
  name?: string;
  email?: string;
  contactNumber?: string;
  profilePhoto?: string;
  gender?: Gender;
}

export interface IModeratorFilterRequest {
  searchTerm?: string;
  status?: UserStatus;
  gender?: Gender;
}


