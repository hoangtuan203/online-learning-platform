import axios from "axios";

export const getAuthHeaders = (): { headers: { Authorization: string } } | undefined => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.warn('No access token found in localStorage. Please login first.');
        return undefined;
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const handleAuthError = (error: unknown): void => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
};