import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import axios from "axios";

export type NotificationType = 'PROGRESS_REMINDER' | 'QA_REPLY' | 'OTHER';  // Union type (từ trước)

export interface NotificationData {
    [key: string]: any;  // Flexible cho data JSON, e.g., { questionId: number, progress: number }
}

export interface NotificationResponse {
    id: number;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
    data?: NotificationData;  // Parsed từ dataJson
}

export interface CreateNotificationRequest {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    data?: NotificationData;
}

export interface MarkReadResponse {
    message: string;
}

export class NotificationService {
    async getNotifications(userId: string): Promise<NotificationResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem thông báo');
        }

        try {
            const response = await httpRequest.get(
                `/notification-service/notifications?userId=${userId}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được danh sách thông báo từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Phản hồi không chứa danh sách thông báo');
            }

            return result.map(this.normalizeNotification);
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải danh sách thông báo');
            throw error;
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem số thông báo chưa đọc');
        }

        try {
            const response = await httpRequest.get(
                `/notification-service/notifications/count?userId=${userId}`,
                authHeaders
            );

            if (response.data === undefined || response.data === null) {
                throw new Error('Không nhận được số lượng thông báo từ server');
            }

            const result = response.data.result || response.data;
            if (typeof result !== 'number') {
                throw new Error('Phản hồi không chứa số lượng hợp lệ');
            }

            return result;
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải số thông báo chưa đọc');
            throw error;
        }
    }

    async markAsRead(id: number, userId: string): Promise<MarkReadResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để đánh dấu đã đọc');
        }

        try {
            const response = await httpRequest.put(
                `/notification-service/notifications/${id}/read?userId=${userId}`,
                {},
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            if (typeof result.message !== 'string') {
                throw new Error('Phản hồi không chứa thông báo thành công');
            }

            return { message: result.message };
        } catch (error) {
            this.handleError(error, 'Lỗi khi đánh dấu đã đọc');
            throw error;
        }
    }

    async markAllAsRead(userId: string): Promise<MarkReadResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để đánh dấu tất cả đã đọc');
        }

        try {
            const response = await httpRequest.put(
                `/notification-service/notifications/mark-all-read?userId=${userId}`,
                {},
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            if (typeof result.message !== 'string') {
                throw new Error('Phản hồi không chứa thông báo thành công');
            }

            return { message: result.message };
        } catch (error) {
            this.handleError(error, 'Lỗi khi đánh dấu tất cả đã đọc');
            throw error;
        }
    }

    async createNotification(request: CreateNotificationRequest): Promise<{ id: number; createdAt: string }> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để tạo thông báo');
        }

        try {
            const response = await httpRequest.post(
                `/notification-service/notifications`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            if (typeof result.id !== 'number' || typeof result.createdAt !== 'string') {
                throw new Error('Phản hồi không chứa ID hoặc thời gian tạo hợp lệ');
            }

            return { id: result.id, createdAt: result.createdAt };
        } catch (error) {
            this.handleError(error, 'Lỗi khi tạo thông báo');
            throw error;
        }
    }

    private normalizeNotification(data: any): NotificationResponse {
        let parsedData: NotificationData = {};
        if (data.dataJson) {
            try {
                parsedData = JSON.parse(data.dataJson);
            } catch (e) {
                console.warn('Lỗi parse dataJson:', e);
            }
        }

        return {
            id: data.id || 0,
            userId: data.userId || '',
            type: data.type || 'OTHER',  // Literal string (từ union type)
            title: data.title || '',
            message: data.message || '',
            isRead: data.isRead || false,
            link: data.link,
            createdAt: data.createdAt || new Date().toISOString(),
            data: parsedData,
        };
    }

    private handleError(error: any, defaultMessage: string): never {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
                const errorMsg = error.response.data || defaultMessage;
                throw new Error(typeof errorMsg === 'string' ? errorMsg : defaultMessage);
            }
            if (error.response?.status === 401) {
                throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
            }
            if (error.response?.status === 403) {
                throw new Error('Bạn không có quyền thực hiện thao tác này');
            }
            if (error.response?.status === 404) {
                throw new Error('Không tìm thấy dữ liệu yêu cầu');
            }
            throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
        }
        throw error;
    }
}