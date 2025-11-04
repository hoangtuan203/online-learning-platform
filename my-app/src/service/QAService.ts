import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import axios from "axios";

export interface QuestionRequest {
    contentId: string;
    questionText: string;
    askedBy: number;
    askedName: string;
}

export interface AnswerRequest {
    answerText: string;
    answeredBy: number;
    answererName?: string;
    parentAnswerId?: number;
}

export interface QuestionResponse {
    id: number;
    contentId: string;
    contentTitle: string;
    question: string;
    questionText?: string;
    answer?: string;
    createdAt: string;
    status: 'pending' | 'answered';
    authorName?: string;
    authorAvatar?: string;
    // NEW: Like fields
    likeCount?: number;
    liked?: boolean;
}

export interface AnswerResponse {
    id: number;
    questionId: number;
    answerText: string;
    answeredBy: number;
    answererName: string;
    answererUsername?: string;
    parentId?: number;
    createdAt: string;
    // NEW: Like fields
    likeCount?: number;
    liked?: boolean;
}

export interface QAResponse {
    question: {
        id: number;
        authorName?: string;
        authorAvatar?: string;
        contentId: string;
        questionText: string;
        answered: boolean;
        createdAt: string;
        // NEW: Like fields
        likeCount?: number;
        liked?: boolean;
    };
    answers: AnswerResponse[];
}

export interface LikeResponse {
    liked: boolean;
    likeCount: number;
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

    async getAllQA(enrollmentId: number): Promise<QAResponse[]> {
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

            return result.map(this.normalizeQAResponse);
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải danh sách câu hỏi');
            throw error;
        }
    }

    async getQAByContent(enrollmentId: number, contentId: string): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem câu hỏi theo nội dung');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/questions/${contentId}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được danh sách câu hỏi từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Phản hồi không chứa danh sách câu hỏi');
            }

            return result.map(this.normalizeQAResponse);
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải danh sách câu hỏi theo nội dung');
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

    async getQAByContentInCourse(courseId: number, contentId: string, userId?: number): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem QA theo nội dung trong khóa học');
        }

        try {
            const params = userId ? `?userId=${userId}` : '';
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/courses/${courseId}/contents/${contentId}/qa${params}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được danh sách QA từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Phản hồi không chứa danh sách QA');
            }

            return result.map(this.normalizeQAResponse);
        } catch (error) {
            this.handleError(error, 'Lỗi khi tải danh sách QA theo nội dung trong khóa học');
            throw error;
        }
    }

    async addAnswer(questionId: number, request: AnswerRequest): Promise<AnswerResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để trả lời câu hỏi');
        }

        try {
            const payload: any = {
                answerText: request.answerText,
                answeredBy: request.answeredBy,
                ...(request.answererName && { answererName: request.answererName }),
                ...(request.parentAnswerId && { parentAnswerId: request.parentAnswerId })
            };

            const response = await httpRequest.post(
                `/enrollment-service/enrolls/questions/${questionId}/answers`,
                payload,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            return this.normalizeAnswer(result);
        } catch (error) {
            this.handleError(error, 'Lỗi khi trả lời câu hỏi');
            throw error;
        }
    }

    // UPDATED: Normalizer includes like fields
    private normalizeQAResponse(data: any): QAResponse {
        return {
            question: {
                id: data.question?.id || 0,
                authorName: data.question?.authorName || 'Anonymous',
                authorAvatar: data.question?.authorAvatar || null,
                contentId: data.question?.contentId || '',
                questionText: data.question?.questionText || '',
                answered: data.question?.answered || false,
                createdAt: data.question?.createdAt || new Date().toISOString(),
                // NEW: Include like fields from backend
                likeCount: data.question?.likeCount || 0,
                liked: data.question?.liked || false,
            },
            answers: (data.answers || []).map((answer: any) => ({
                id: answer.id || 0,
                questionId: answer.questionId || 0,
                answerText: answer.answerText || '',
                answeredBy: answer.answeredBy || 0,
                answererName: answer.answererName || 'Admin',
                answererUsername: answer.answererUsername || '',
                parentId: answer.parentId,
                createdAt: answer.createdAt || new Date().toISOString(),
                // NEW: Include like fields from backend
                likeCount: answer.likeCount || 0,
                liked: answer.liked || false,
            })),
        };
    }

    // Toggle like for Question
    async toggleQuestionLike(questionId: number, userId: number): Promise<LikeResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để like câu hỏi');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/questions/${questionId}/like?userId=${userId}`,
                {},
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            return result;
        } catch (error) {
            this.handleError(error, 'Lỗi khi like câu hỏi');
            throw error;
        }
    }

    // Toggle like for Answer
    async toggleAnswerLike(answerId: number, userId: number): Promise<LikeResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để like câu trả lời');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/answers/${answerId}/like?userId=${userId}`,
                {},
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            return result;
        } catch (error) {
            this.handleError(error, 'Lỗi khi like câu trả lời');
            throw error;
        }
    }


    async checkQuestionLikeStatus(questionId: number, userId: number): Promise<boolean> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái like');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/questions/${questionId}/like-status`,
                {
                    ...authHeaders,
                    params: { userId },
                }
            );

            const result = response.data.result || response.data;
            if (typeof result.liked !== "boolean") {
                throw new Error('Response không hợp lệ (thiếu trường liked)');
            }

            return result.liked;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái like');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy câu hỏi');
                }
                throw new Error(`Lỗi kiểm tra trạng thái like: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    /**
     * Kiểm tra user có like câu trả lời hay không
     */
    async checkAnswerLikeStatus(answerId: number, userId: number): Promise<boolean> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái like');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/answers/${answerId}/like-status`,
                {
                    ...authHeaders,
                    params: { userId },
                }
            );

            const result = response.data.result || response.data;
            if (typeof result.liked !== "boolean") {
                throw new Error('Response không hợp lệ (thiếu trường liked)');
            }

            return result.liked;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái like');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy câu trả lời');
                }
                throw new Error(`Lỗi kiểm tra trạng thái like: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    private normalizeQuestion(data: any): QuestionResponse {
        return {
            id: data.id || 0,
            contentId: data.contentId || '',
            contentTitle: data.contentTitle || '',
            question: data.questionText || data.question || '',
            questionText: data.questionText || data.question || '',
            answer: data.answerText || data.answer,
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || data.answered ? 'answered' : 'pending',
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            // NEW: Include like fields
            likeCount: data.likeCount || 0,
            liked: data.liked || false,
        };
    }

    private normalizeAnswer(data: any): AnswerResponse {
        return {
            id: data.id || 0,
            questionId: data.questionId || 0,
            answerText: data.answerText || '',
            answeredBy: data.answeredBy || 0,
            answererName: data.answererName || '',
            answererUsername: data.answererUsername || '',
            parentId: data.parentId,
            createdAt: data.createdAt || new Date().toISOString(),
            // NEW: Include like fields
            likeCount: data.likeCount || 0,
            liked: data.liked || false,
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