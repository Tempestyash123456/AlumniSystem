import type {
    ApiResponse, AuthResponse, UserInfo, ProfileResponse,
    UpdateProfileRequest, AdminUserListResponse, AdminUserDto, AlumniDto, PostDto
} from '../types';

const BASE_URL = 'http://localhost:8080/api/v1';

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
    // Only set Content-Type for non-FormData requests
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
};

export const alumniApi = {
    getAll: () => apiFetch<AlumniDto[]>('/alumni'),
};

export const adminApi = {
    getAllUsers: () => apiFetch<AdminUserListResponse>('/admin/users'),
    setLock: (userId: string, lock: boolean) => apiFetch<AdminUserDto>(`/admin/users/${userId}/lock`, { method: 'PATCH', body: JSON.stringify({ lock }) }),
    setEnabled: (userId: string, enabled: boolean) => apiFetch<AdminUserDto>(`/admin/users/${userId}/enable?enabled=${enabled}`, { method: 'PATCH' }),
    deleteUser: (userId: string) => apiFetch<void>(`/admin/users/${userId}`, { method: 'DELETE' }),
    assignRole: (userId: string, roleName: string) => apiFetch<AdminUserDto>(`/admin/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleName }) }),
    removeRole: (userId: string, roleName: string) => apiFetch<AdminUserDto>(`/admin/users/${userId}/roles/${roleName}`, { method: 'DELETE' }),
};

export const postsApi = {
    getAll: () => apiFetch<PostDto[]>('/posts'),
    getOne: (postId: string) => apiFetch<PostDto>(`/posts/${postId}`),
    create: (title: string, description: string, image?: File | null) => {
        const form = new FormData();
        form.append('data', JSON.stringify({ title, description }));
        if (image) form.append('image', image);
        return apiFetch<PostDto>('/posts', { method: 'POST', body: form });
    },
    update: (postId: string, title: string, description: string, image?: File | null) => {
        const form = new FormData();
        form.append('data', JSON.stringify({ title, description }));
        if (image) form.append('image', image);
        return apiFetch<PostDto>(`/posts/${postId}`, { method: 'PUT', body: form });
    },
    delete: (postId: string) => apiFetch<void>(`/posts/${postId}`, { method: 'DELETE' }),
};

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Already absolute
    return `http://localhost:8080${path}`;
};