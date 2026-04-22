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
    roleSelected: boolean;
    bugReportPhotoUrl?: string;
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

export interface JobExperience {
    id?: string;
    jobTitle: string;
    company: string;
    industry?: string;
    startMonth: number;
    startYear: number;
    endMonth?: number | null;
    endYear?: number | null;
    experienceMonths?: number;
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
    admissionYear?: number;
    graduationYear?: number;
    discipline?: string;
    program?: string;

    jobs: JobExperience[];
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
    bugReportPhotoUrl?: string;
}

export interface UpdateProfileRequest {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    studentId?: string | null;
    admissionYear?: number | null;
    graduationYear?: number | null;
    discipline?: string | null;
    program?: string | null;
    jobs?: JobExperience[] | null;
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
    bugReportPhotoUrl?: string | null;
}

// ── Alumni Directory ──────────────────────────────────────────────────────────
export interface AlumniDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
    admissionYear?: number;
    graduationYear?: number;
    phone?: string;
    program?: string;
    country?: string;
    state?: string;
    city?: string;
    currentJobTitle?: string;
    currentCompany?: string;
    linkedinUrl?: string;
}

export interface AlumniListResponse {
    alumni: AlumniDto[];
    totalCount: number;
}

export interface PeerGroupDto {
    name: string;
    count: number;
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
    admissionYear?: number;
    studentId?: string;
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
    imageUrls: string[];
    authorFirstName: string;
    authorLastName: string;
    createdAt: string;
    updatedAt: string;
}

// -- Events ---------------------------------------------------------------------
export interface EventMediaDto {
    url: string;
    type: 'IMAGE' | 'VIDEO';
}

export interface EventDto {
    id: string;
    name: string;
    startTime: string;        // ISO string
    endTime?: string;         // ISO string, optional
    place: string;
    description?: string;     // Raw Markdown, optional
    media: EventMediaDto[];
    authorFirstName: string;
    authorLastName: string;
    createdAt: string;
    updatedAt: string;
}

// ── Support ──────────────────────────────────────────────────────────────────
export interface SupportDeveloperResponse {
    userId: string;
    name: string;
    email: string;
    role: string;
    linkedinUrl?: string;
    githubUrl?: string;
    bugReportPhotoUrl?: string;
}

// ── Chat & Notifications ──────────────────────────────────────────────────────
export interface ChatMessageDto {
    id: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    content: string;
    createdAt: string;
}

export interface NotificationDto {
    id: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: string;
}

export interface ConversationDto {
    userId: string;
    userName: string;
    profilePhotoUrl?: string;
    lastMessageAt?: string;
    lastMessageContent?: string;
    unreadCount?: number;
}
