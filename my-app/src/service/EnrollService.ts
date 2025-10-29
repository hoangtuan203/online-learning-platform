import axios from "axios";
import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import type { EnrollmentRequest, EnrollResponse } from "../types/Enrollment";

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




    async checkEnrollment(request: EnrollmentRequest): Promise<EnrollmentStatus> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái đăng ký');
        }

        try {
            // Merge authHeaders with the config to include params
            const config = {
                ...authHeaders,
                params: {
                    courseId: request.courseId,
                    userId: request.userId
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

    /**
     * Update progress for a specific content item in the enrollment.
     * 
     * @param enrollmentId The ID of the enrollment.
     * @param request The update progress request.
     * @returns Promise<ProgressResponse> The updated progress summary.
     */
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

    // Public method để gọi từ component
    public async enroll(request: EnrollmentRequest): Promise<EnrollResponse> {
        return this.enrollUser(request);
    }
}