import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import axios from "axios";

export interface QuestionRequest {
    contentId: string;
    contentTitle: string;
    question: string;
}

export interface QuestionResponse {
    id: number;
    contentId: string;
    contentTitle: string;
    question: string;
    answer?: string;
    createdAt: string;
    status: 'pending' | 'answered';
}

export class QAService {
    async askQuestion(enrollmentId: number, request: QuestionRequest): Promise<QuestionResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để đặt câu hỏi');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/${enrollmentId}/questions`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            return this.normalizeQuestion(result);
        } catch (error) {
            this.handleError(error, 'Lỗi khi đặt câu hỏi');
            throw error;
        }
    }

    async getQuestions(enrollmentId: number): Promise<QuestionResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem câu hỏi');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/questions`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được danh sách câu hỏi từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Phản hồi không chứa danh sách câu hỏi');
            }

            return result.map(this.normalizeQuestion);
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải danh sách câu hỏi');
            throw error;
        }
    }

    async updateQuestion(enrollmentId: number, questionId: number, newQuestion: string): Promise<QuestionResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để cập nhật câu hỏi');
        }

        try {
            const response = await httpRequest.put(
                `/enrollment-service/enrolls/${enrollmentId}/questions/${questionId}`,
                { question: newQuestion },
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            return this.normalizeQuestion(result);
        } catch (error) {
            this.handleError(error, 'Lỗi khi cập nhật câu hỏi');
            throw error;
        }
    }

    async deleteQuestion(enrollmentId: number, questionId: number): Promise<void> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xóa câu hỏi');
        }

        try {
            await httpRequest.delete(
                `/enrollment-service/enrolls/${enrollmentId}/questions/${questionId}`,
                authHeaders
            );
        } catch (error) {
            this.handleError(error, 'Lỗi khi xóa câu hỏi');
            throw error;
        }
    }

    async getFilteredQuestions(
        enrollmentId: number, 
        contentId?: string, 
        status?: 'pending' | 'answered',
        sortBy: 'newest' | 'oldest' = 'newest'
    ): Promise<QuestionResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lọc câu hỏi');
        }

        try {
            const params = new URLSearchParams();
            if (contentId) {
                params.append('contentId', contentId);
            }
            if (status) {
                params.append('status', status);
            }
            params.append('sortBy', sortBy);

            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/questions/filtered?${params.toString()}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được danh sách câu hỏi từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Phản hồi không chứa danh sách câu hỏi');
            }

            return result.map(this.normalizeQuestion);
        } catch (error) {
            this.handleError(error, 'Lỗi khi lọc câu hỏi');
            throw error;
        }
    }

    private normalizeQuestion(data: any): QuestionResponse {
        return {
            id: data.id || 0,
            contentId: data.contentId || '',
            contentTitle: data.contentTitle || '',
            question: data.question || '',
            answer: data.answer,
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'pending'
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