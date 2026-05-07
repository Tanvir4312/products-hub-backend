import { Gender } from "../../../../generated/prisma/index.js";

export interface ICreateModeratorPayload {
  password: string;
  moderator: {
    name: string;
    email: string;
    contactNumber?: string;
  
    gender: Gender;
    profilePhoto?: string;
    isDeleted: boolean;
  
  };
  
}

export interface ICreateAdmin {
  password: string;
  admin: {
    name: string;
    email: string;
    gender : Gender
    profilePhoto: string;
    contactNumber: string;
  };
  role: "ADMIN" | "SUPER_ADMIN";
}
