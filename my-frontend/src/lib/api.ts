import type {
    ApiResponse, AuthResponse, UserInfo, ProfileResponse,
    UpdateProfileRequest, AdminUserListResponse, AdminUserDto, AlumniDto, PostDto, EventDto,
    PermissionDto, SupportDeveloperResponse, PeerGroupDto, AlumniListResponse,
    ChatMessageDto, ConversationDto, NotificationDto
} from '../types';

const BASE_URL = '/api/v1';
export const OAUTH2_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : 'https://backend-production-feca5.up.railway.app';

export const tokenStorage = {
    getAccess: () => localStorage.getItem('accessToken'),
    getRefresh: () => localStorage.getItem('refreshToken'),
    set: (access: string, refresh: string) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    },
    clear: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    const json: ApiResponse<AuthResponse> = await res.json();
    if (!res.ok || !json.data) throw new Error('Refresh failed');

    tokenStorage.set(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    retry = true
): Promise<ApiResponse<T>> {
    const token = tokenStorage.getAccess();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

        if (res.status === 204) return { success: true, timestamp: new Date().toISOString() } as ApiResponse<T>;

        const json: ApiResponse<T> = await res.json();

        if (!res.ok && json.error?.code === 'TOKEN_EXPIRED' && retry) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const newToken = await refreshAccessToken();
                    refreshQueue.forEach(cb => cb(newToken));
                    refreshQueue = [];
                    return apiFetch<T>(path, options, false);
                } catch {
                    tokenStorage.clear();
                    window.location.href = '/login';
                    return json;
                } finally {
                    isRefreshing = false;
                }
            }
            return new Promise((resolve) => {
                refreshQueue.push(() => resolve(apiFetch<T>(path, options, false)));
            });
        }
        return json;
    } catch (err) {
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: { status: 500, code: 'NETWORK_ERROR', message: 'Server connection failed' }
        };
    }
}

export const authApi = {
    login: (email: string, password: string) => apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: any) => apiFetch<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: (refreshToken: string) => apiFetch<{ message: string }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    me: () => apiFetch<UserInfo>('/auth/me'),
    forgotPassword: (email: string) => apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) => apiFetch<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
    verifyEmail: (token: string) => apiFetch<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
    completeOAuthRegistration: (role: string, studentId: string) => apiFetch<AuthResponse>('/auth/complete-oauth-registration', { method: 'POST', body: JSON.stringify({ role, studentId }) }),
};

export const profileApi = {
    getMyProfile: () => apiFetch<ProfileResponse>('/profile'),
    updateMyProfile: (data: UpdateProfileRequest) => apiFetch<ProfileResponse>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getProfileById: (userId: string) => apiFetch<ProfileResponse>(`/profile/${userId}`),
    uploadPhoto: (file: File) => {
        const form = new FormData();
        form.append('photo', file);
        return apiFetch<{ profilePhotoUrl: string }>('/profile/photo', { method: 'POST', body: form });
    },
    uploadBugReportPhoto: (file: File) => {
        const form = new FormData();
        form.append('photo', file);
        return apiFetch<{ bugReportPhotoUrl: string }>('/profile/bug-report/photo', { method: 'POST', body: form });
    },
};

export const supportApi = {
    reportBug: (data: { title: string; information: string; recipients: string[] }) =>
        apiFetch<void>('/support/bug-report', { method: 'POST', body: JSON.stringify(data) }),
    getDevelopers: () => apiFetch<SupportDeveloperResponse[]>('/support/developers'),
};

export const alumniApi = {
    getAll: () => apiFetch<AlumniDto[]>('/alumni'),
    getPeerPrograms: () => apiFetch<PeerGroupDto[]>('/alumni/peers/programs'),
    getPeerYears: (program?: string) => {
        const p = new URLSearchParams();
        if (program) p.append('program', program);
        return apiFetch<PeerGroupDto[]>(`/alumni/peers/years${p.toString() ? `?${p.toString()}` : ''}`);
    },
    getPeerCountries: (program?: string, year?: number) => {
        const p = new URLSearchParams();
        if (program) p.append('program', program);
        if (year) p.append('year', year.toString());
        return apiFetch<PeerGroupDto[]>(`/alumni/peers/countries${p.toString() ? `?${p.toString()}` : ''}`);
    },
    getPeerStates: (program?: string, year?: number, country?: string) => {
        const p = new URLSearchParams();
        if (program) p.append('program', program);
        if (year) p.append('year', year.toString());
        if (country) p.append('country', country);
        return apiFetch<PeerGroupDto[]>(`/alumni/peers/states${p.toString() ? `?${p.toString()}` : ''}`);
    },
    getPeerCities: (program?: string, year?: number, country?: string, state?: string) => {
        const p = new URLSearchParams();
        if (program) p.append('program', program);
        if (year) p.append('year', year.toString());
        if (country) p.append('country', country);
        if (state) p.append('state', state);
        return apiFetch<PeerGroupDto[]>(`/alumni/peers/cities${p.toString() ? `?${p.toString()}` : ''}`);
    },
    getPeers: (params: { query?: string; program?: string; year?: string; country?: string; state?: string; city?: string; page?: number; size?: number }) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });
        return apiFetch<AlumniListResponse>(`/alumni/peers/list?${queryParams.toString()}`);
    }
};

export const adminApi = {
    getAllUsers: () => apiFetch<AdminUserListResponse>('/admin/users'),
    setLock: (userId: string, lock: boolean) => apiFetch<AdminUserDto>(`/admin/users/${userId}/lock`, { method: 'PATCH', body: JSON.stringify({ lock }) }),
    setEnabled: (userId: string, enabled: boolean) => apiFetch<AdminUserDto>(`/admin/users/${userId}/enable?enabled=${enabled}`, { method: 'PATCH' }),
    deleteUser: (userId: string) => apiFetch<void>(`/admin/users/${userId}`, { method: 'DELETE' }),
    assignRole: (userId: string, roleName: string) => apiFetch<AdminUserDto>(`/admin/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleName }) }),
    removeRole: (userId: string, roleName: string) => apiFetch<AdminUserDto>(`/admin/users/${userId}/roles/${roleName}`, { method: 'DELETE' }),
    sendTargetedEmail: (data: { subject: string; body: string; department?: string; degree?: string; specialization?: string; graduationYear?: number; targetUserEmail?: string; }) =>
        apiFetch<string>('/admin/email/send', { method: 'POST', body: JSON.stringify(data) }),
    getPermissions: () => apiFetch<PermissionDto[]>('/admin/permissions'),
    updatePermissions: (userId: string, permissions: string[]) => apiFetch<AdminUserDto>(`/admin/users/${userId}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
};

export const postsApi = {
    getAll: () => apiFetch<PostDto[]>('/posts'),
    getOne: (postId: string) => apiFetch<PostDto>(`/posts/${postId}`),
    create: (title: string, description: string, images?: File[] | null) => {
        const form = new FormData();
        form.append('data', JSON.stringify({ title, description }));
        if (images) images.forEach(img => form.append('image', img));
        return apiFetch<PostDto>('/posts', { method: 'POST', body: form });
    },
    update: (postId: string, title: string, description: string, images?: File[] | null, imageUrls?: string[]) => {
        const form = new FormData();
        form.append('data', JSON.stringify({ title, description, imageUrls }));
        if (images) images.forEach(img => form.append('image', img));
        return apiFetch<PostDto>(`/posts/${postId}`, { method: 'PUT', body: form });
    },
    delete: (postId: string) => apiFetch<void>(`/posts/${postId}`, { method: 'DELETE' }),
};

export const eventsApi = {
    getAll: () => apiFetch<EventDto[]>('/events'),

    getOne: (id: string) => apiFetch<EventDto>(`/events/${id}`),

    create: (
        data: { name: string; startTime: string; endTime?: string | null; place: string; description?: string | null },
        media?: File[] | null
    ) => {
        const form = new FormData();
        form.append('data', JSON.stringify(data));
        if (media) media.forEach(m => form.append('media', m));
        return apiFetch<EventDto>('/events', { method: 'POST', body: form });
    },

    update: (
        id: string,
        data: { name?: string; startTime?: string; endTime?: string | null; place?: string; description?: string | null; media?: any[] },
        media?: File[] | null
    ) => {
        const form = new FormData();
        form.append('data', JSON.stringify(data));
        if (media) media.forEach(m => form.append('media', m));
        return apiFetch<EventDto>(`/events/${id}`, { method: 'PUT', body: form });
    },

    delete: (id: string) => apiFetch<void>(`/events/${id}`, { method: 'DELETE' }),
};

export const chatApi = {
    send: (recipientId: string, content: string) => apiFetch<ChatMessageDto>('/chat/send', { method: 'POST', body: JSON.stringify({ recipientId, content }) }),
    getHistory: (userId: string) => apiFetch<ChatMessageDto[]>(`/chat/history?userId=${userId}`),
    getConversations: () => apiFetch<ConversationDto[]>('/chat/conversations'),
    getNotifications: () => apiFetch<NotificationDto[]>('/chat/notifications'),
    markAsRead: (id: string) => apiFetch<void>(`/chat/notifications/${id}/read`, { method: 'PATCH' }),
};

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return path;
};