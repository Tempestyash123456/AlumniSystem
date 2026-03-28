export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: string;
}

export interface ApiError {
    status: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
}

export interface UserInfo {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    roles: string[];
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: UserInfo;
}

export interface ProfileResponse extends UserInfo {
    userId: string;
    phone?: string;
    studentId?: string;
    graduationYear?: number;
    degree?: string;
    department?: string;
    specialization?: string;
    currentJobTitle?: string;
    currentCompany?: string;
    industry?: string;
    experienceYears?: number;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    dateOfBirth?: string;
    skills?: string[];
    profileScore: number;
    profilePublic: boolean;
    openToMentor: boolean;
    openToHire: boolean;
}

export interface AdminUserDto extends UserInfo {
    enabled: boolean;
    accountLocked: boolean;
    profileScore: number;
    lastLoginAt?: string;
    createdAt: string;
}

export interface UpdateProfileRequest extends Partial<Omit<ProfileResponse, 'userId' | 'profileScore'>> {}

export interface AdminUserListResponse {
    users: AdminUserDto[];
    totalCount: number;
}