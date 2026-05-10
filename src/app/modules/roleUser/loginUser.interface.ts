export interface IUpdateUserPayload {
    name?: string;
    email?: string;
    contactNumber?: string;
    profilePhoto?: string;
}

export interface IUserFilterRequest {
    searchTerm?: string;
    status?: string;
}
