// ── API Response Envelope ────────────────────────────────────────────────────
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

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface UserInfo {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    roles: string[];
    permissions: string[];
    accountLocked: boolean;
    enabled: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: UserInfo;
}

export interface MessageResponse {
    message: string;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export interface ProfileResponse {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;

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

export interface UpdateProfileRequest {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    studentId?: string | null;
    graduationYear?: number | null;
    degree?: string | null;
    department?: string | null;
    specialization?: string | null;
    currentJobTitle?: string | null;
    currentCompany?: string | null;
    industry?: string | null;
    experienceYears?: number | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    dateOfBirth?: string | null;
    skills?: string[] | null;
    profilePublic?: boolean | null;
    openToMentor?: boolean | null;
    openToHire?: boolean | null;
}

// ── Alumni Directory ──────────────────────────────────────────────────────────
export interface AlumniDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminUserDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;
    roles: string[];
    permissions: string[];
    allPermissions: string[];
    enabled: boolean;
    accountLocked: boolean;
    profileScore: number;
    lastLoginAt?: string;
    createdAt: string;
}

export interface AdminUserListResponse {
    users: AdminUserDto[];
    totalCount: number;
}

export interface PermissionDto {
    id: string;
    name: string;
    description: string;
}

export interface UpdatePermissionsRequest {
    permissions: string[];
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export interface PostDto {
    id: string;
    title: string;
    description: string;   // Raw Markdown
    imageUrl?: string;
    authorFirstName: string;
    authorLastName: string;
    createdAt: string;
    updatedAt: string;
}

// -- Events ---------------------------------------------------------------------
export interface EventDto {
    id: string;
    name: string;
    startTime: string;        // ISO string
    endTime?: string;         // ISO string, optional
    place: string;
    description?: string;     // Raw Markdown, optional
    mediaUrl?: string;        // Relative or absolute URL
    mediaType?: string;       // "IMAGE" | "VIDEO"
    documentUrl?: string;     // Relative URL
    documentName?: string;    // Original filename
    authorFirstName: string;
    authorLastName: string;
    createdAt: string;
    updatedAt: string;
}
