import axios from "axios";
import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import type { EnrollmentRequest, EnrollResponse } from "../types/Enrollment";
import type { AnswerRequest, AnswerResponse, QAResponse, QuestionRequest, QuestionResponse } from "../types/QA";

interface EnrollmentStatus {
    status: string;
    enrollmentId?: string;
    enrolled: boolean;
}

interface UpdateProgressRequest {
    contentItemId: string;
    score?: number;
    durationSpent?: number;
}

interface ProgressResponse {
    enrollmentId: number;
    progressPercentage: number;
    status: string;
    completedContentItems: number;
}

interface UpdateCurrentPositionRequest {
    currentContentId: string;
}

interface CurrentPositionResponse {
    currentContentId: string | null;
}

interface ContentProgressDTO {
    contentId: string;
    title?: string;
    type: string;
    completed: boolean;
    score?: number;
    durationSpent?: number;

}

interface EnrollmentProgressDetailsResponse {
    enrollmentId: number;
    status: string;
    progressPercentage: number;
    totalContentItems: number;
    completedContentItems: number;
    currentContentId: string | null;
    contents: ContentProgressDTO[];
}


interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    courseTitle: string;
    thumbnailUrl?: string;
    instructorName?: string;
    enrollmentDate: string;
    startDate?: string;
    completedDate?: string;
    status: string;
    progressPercentage: number;
    totalContentItems: number;
    currentContentId?: string;

    progressSummaries?: Array<{
        id: number;
        contentItemId: string;
        contentType: string;
        completed: boolean;
        score?: number;
        durationSpent: number;
    }>;
}

interface GetEnrolledCoursesResponse {
    enrollments: Enrollment[];
}
export class EnrollService {

    async loadProgressDetails(enrollmentId: number): Promise<EnrollmentProgressDetailsResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để tải chi tiết tiến độ');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/progress-details`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu chi tiết tiến độ từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin chi tiết tiến độ');
            }

            return {
                enrollmentId: result.enrollmentId || 0,
                status: result.status || '',
                progressPercentage: result.progressPercentage || 0,
                totalContentItems: result.totalContentItems || 0,
                completedContentItems: result.completedContentItems || 0,
                currentContentId: result.currentContentId || null,
                contents: result.contents || [],
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi tải chi tiết tiến độ';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi tải chi tiết tiến độ');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để tải chi tiết tiến độ');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền tải chi tiết tiến độ này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async getEnrolledCourses(userId: number): Promise<GetEnrolledCoursesResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để tải danh sách khóa học đã tham gia');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/user/${userId}/courses`,
                authHeaders
            );

            console.log("Enrolled courses response:", response.data);  // Giữ để debug

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu danh sách khóa học từ server');
            }

            const result = response.data.result || response.data;  // Handle wrapper nếu có

            let enrollmentsData: any[] = [];
            if (Array.isArray(result)) {
                enrollmentsData = result;  // Array trực tiếp từ backend
            } else if (result && Array.isArray(result.enrollments)) {
                enrollmentsData = result.enrollments;  // Wrapper object
            } else {
                throw new Error('Response không chứa danh sách enrollments hợp lệ');
            }

            if (enrollmentsData.length === 0) {
                return { enrollments: [] };
            }

            const enrollments: Enrollment[] = enrollmentsData.map((enroll: any) => ({
                id: enroll.id || 0,
                userId: enroll.userId || 0,
                courseId: enroll.courseId || 0,
                courseTitle: enroll.courseTitle || `Khóa học ${enroll.courseId}`,
                thumbnailUrl: enroll.thumbnailUrl || undefined,
                instructorName: enroll.instructorName || undefined,
                enrollmentDate: enroll.enrollmentDate || '',
                startDate: enroll.startDate || undefined,
                completedDate: enroll.completedDate || undefined,
                status: enroll.status || '',
                progressPercentage: enroll.progressPercentage || 0,
                totalContentItems: enroll.totalContentItems || 0,
                currentContentId: enroll.currentContentId || undefined,
                progressSummaries: enroll.progressSummaries || [],
                instructor: 'Giảng viên chưa xác định',  // Fallback trực tiếp
            }));

            console.log("Mapped enrollments:", enrollments);  // Debug: Xem sau mapping

            return { enrollments };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi tải danh sách khóa học';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi tải danh sách khóa học');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để tải danh sách khóa học');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền tải danh sách khóa học này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollments cho user');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }



    async checkEnrollment(request: EnrollmentRequest): Promise<EnrollmentStatus> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái đăng ký');
        }

        try {
            console.log("Checking enrollment for request:", request);
            const config = {
                ...authHeaders,
                params: {
                    userId: request.userId,
                    courseId: request.courseId

                }
            };
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/check`,
                config
            );

            return {
                status: response.data?.status || '',
                enrollmentId: response.data?.enrollmentId || undefined,
                enrolled: response.data?.enrolled || false
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái đăng ký');
                }
                throw new Error(`Lỗi kiểm tra trạng thái đăng ký: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async updateProgress(enrollmentId: number, request: UpdateProgressRequest): Promise<ProgressResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để cập nhật tiến độ');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/${enrollmentId}/progress`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu cập nhật tiến độ từ server');
            }

            // Parse response (assuming it's a plain object from Map.of)
            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin tiến độ');
            }

            return {
                enrollmentId: result.enrollmentId || 0,
                progressPercentage: result.progressPercentage || 0,
                status: result.status || '',
                completedContentItems: result.completedContentItems || 0,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi cập nhật tiến độ';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi cập nhật tiến độ');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để cập nhật tiến độ');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền cập nhật tiến độ này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    async getCurrentPosition(enrollmentId: number): Promise<CurrentPositionResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy vị trí học hiện tại');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/current-position`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu vị trí học từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin vị trí học');
            }

            return {
                currentContentId: result.currentContentId || null,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy vị trí học hiện tại');
                }
                throw new Error(`Lỗi lấy vị trí học: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    async getProgress(enrollmentId: number): Promise<ProgressResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy tiến độ');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/progress`,
                authHeaders
            );
            console.log("Progress response:", response);


            if (!response.data) {
                throw new Error('Không nhận được dữ liệu tiến độ từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin tiến độ');
            }

            return {
                enrollmentId: result.enrollmentId || enrollmentId,
                progressPercentage: result.progressPercentage || 0,
                status: result.status || '',
                completedContentItems: result.completedContentItems || 0,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy tiến độ');
                }
                throw new Error(`Lỗi lấy tiến độ: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Update the current learning position for the enrollment.
     * 
     * @param enrollmentId The ID of the enrollment.
     * @param request The update current position request.
     * @returns Promise<void>
     */
    async updateCurrentPosition(enrollmentId: number, request: UpdateCurrentPositionRequest): Promise<void> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để cập nhật vị trí học');
        }

        try {
            await httpRequest.post(
                `/enrollment-service/enrolls/${enrollmentId}/current-position`,
                request,
                authHeaders
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi cập nhật vị trí học';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi cập nhật vị trí học');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để cập nhật vị trí học');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền cập nhật vị trí học này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    private async enrollUser(request: EnrollmentRequest): Promise<EnrollResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để đăng ký khóa học');
        }

        try {
            const response = await httpRequest.post(
                '/enrollment-service/enrolls/register',
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu đăng ký từ server');
            }

            // Parse nếu wrapped (code + result)
            const result = response.data.result || response.data;
            if (!result || !result.message) {
                throw new Error('Response không chứa thông tin đăng ký');
            }

            return {
                message: result.message,
                enrollmentId: result.enrollmentId || null,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    // Xử lý lỗi already enrolled hoặc bad request cụ thể
                    const errorMsg = error.response.data?.message || 'Lỗi đăng ký khóa học';
                    throw new Error(errorMsg);
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để đăng ký khóa học');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền đăng ký khóa học này');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    async getQAByContentInCourse(courseId: number, contentId: string): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem Q&A');
        }

        console.log("Fetching Q&A for courseId:", courseId, "contentId:", contentId);

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/courses/${courseId}/contents/${contentId}/qa`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu Q&A từ server');
            }

            const result = response.data.result || response.data;
            console.log("Q&A response data:", result);

            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách Q&A');
            }

            return result.map((item: any) => ({
                question: {
                    id: item.question.id || 0,
                    contentId: item.question.contentId || '',
                    questionText: item.question.questionText || '',
                    answered: item.question.answered || false,
                    authorName: item.question.authorName || 'Anonymous',
                    authorAvatar: item.question.authorAvatar || null,
                    createdAt: item.question.createdAt || '',
                },
                answer: item.answer ? {
                    id: item.answer.id || 0,
                    questionId: item.answer.questionId || 0,
                    answerText: item.answer.answerText || '',
                    answeredBy: item.answer.answeredBy || 0,
                    answererName: item.answer.answererName || 'Anonymous',
                    createdAt: item.answer.createdAt || '',
                } : null,
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy Q&A';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy Q&A');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để xem Q&A');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền xem Q&A này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy course hoặc content');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Lấy tất cả Q&A của course (public cho tất cả học viên)
     */
    async getAllQAInCourse(courseId: number): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xem Q&A');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/courses/${courseId}/qa`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu Q&A từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách Q&A');
            }

            return result.map((item: any) => ({
                question: {
                    id: item.question.id || 0,
                    contentId: item.question.contentId || '',
                    questionText: item.question.questionText || '',
                    answered: item.question.answered || false,
                    authorName: item.question.authorName || 'Anonymous',
                    authorAvatar: item.question.authorAvatar || null,
                    createdAt: item.question.createdAt || '',
                },
                answer: item.answer ? {
                    id: item.answer.id || 0,
                    questionId: item.answer.questionId || 0,
                    answerText: item.answer.answerText || '',
                    answeredBy: item.answer.answeredBy || 0,
                    answererName: item.answer.answererName || 'Anonymous',
                    createdAt: item.answer.createdAt || '',
                } : null,
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy Q&A';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy Q&A');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để xem Q&A');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền xem Q&A này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy course');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    // ========== APIs PRIVATE (CHO USER CỤ THỂ - NẾU CẦN) ==========

    /**
     * Lấy Q&A của một user trong content cụ thể (private)
     */
    async getQAByContent(enrollmentId: number, contentId: string): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy Q&A theo nội dung');
        }

        console.log("Fetching Q&A for enrollmentId:", enrollmentId, "contentId:", contentId);

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/questions/${contentId}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu Q&A từ server');
            }

            const result = response.data.result || response.data;
            console.log("Q&A response data:", result);

            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách Q&A');
            }

            return result.map((item: any) => ({
                question: {
                    id: item.question.id || 0,
                    contentId: item.question.contentId || '',
                    questionText: item.question.questionText || '',
                    answered: item.question.answered || false,
                    authorName: item.question.authorName || 'Anonymous',
                    authorAvatar: item.question.authorAvatar || null,
                    createdAt: item.question.createdAt || '',
                },
                answer: item.answer ? {
                    id: item.answer.id || 0,
                    questionId: item.answer.questionId || 0,
                    answerText: item.answer.answerText || '',
                    answeredBy: item.answer.answeredBy || 0,
                    answererName: item.answer.answererName || 'Anonymous',
                    createdAt: item.answer.createdAt || '',
                } : null,
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy Q&A theo nội dung';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy Q&A theo nội dung');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy Q&A theo nội dung');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền lấy Q&A theo nội dung này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment hoặc nội dung');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Lấy tất cả Q&A của một user (private)
     */
    async getAllQA(enrollmentId: number): Promise<QAResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy tất cả Q&A');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/questions`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu Q&A từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách Q&A');
            }

            return result.map((item: any) => ({
                question: {
                    id: item.question.id || 0,
                    contentId: item.question.contentId || '',
                    questionText: item.question.questionText || '',
                    answered: item.question.answered || false,
                    authorName: item.question.authorName || 'Anonymous',
                    authorAvatar: item.question.authorAvatar || null,
                    createdAt: item.question.createdAt || '',
                },
                answer: item.answer ? {
                    id: item.answer.id || 0,
                    questionId: item.answer.questionId || 0,
                    answerText: item.answer.answerText || '',
                    answeredBy: item.answer.answeredBy || 0,
                    answererName: item.answer.answererName || 'Anonymous',
                    createdAt: item.answer.createdAt || '',
                } : null,
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy tất cả Q&A';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy tất cả Q&A');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy tất cả Q&A');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền lấy tất cả Q&A này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    // ========== APIs TẠO/CẬP NHẬT ==========

    /**
     * Tạo câu hỏi mới
     */
    async addQuestion(enrollmentId: number, request: QuestionRequest): Promise<QuestionResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để thêm câu hỏi');
        }

        console.log("authHeaders", authHeaders);

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/${enrollmentId}/questions`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu câu hỏi từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin câu hỏi');
            }

            return {
                id: result.id || 0,
                contentId: result.contentId || '',
                questionText: result.questionText || '',
                answered: result.answered || false,
                authorName: result.authorName || 'Anonymous',
                authorAvatar: result.authorAvatar || null,
                createdAt: result.createdAt || '',
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi thêm câu hỏi';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi thêm câu hỏi');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để thêm câu hỏi');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền thêm câu hỏi này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Tạo/cập nhật câu trả lời
     */
    async addAnswer(questionId: number, request: AnswerRequest): Promise<AnswerResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để thêm câu trả lời');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/questions/${questionId}/answers`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu câu trả lời từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin câu trả lời');
            }

            return {
                id: result.id || 0,
                questionId: result.questionId || 0,
                answerText: result.answerText || '',
                answeredBy: result.answeredBy || 0,
                answererName: result.answererName || 'Admin',
                createdAt: result.createdAt || '',
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi thêm câu trả lời';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi thêm câu trả lời');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để thêm câu trả lời');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền thêm câu trả lời này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy câu hỏi');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }




    public async enroll(request: EnrollmentRequest): Promise<EnrollResponse> {
        return this.enrollUser(request);
    }
}