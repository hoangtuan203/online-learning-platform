import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";
import axios from "axios";

export interface NoteRequest {
    contentId: string;
    contentTitle: string;
    courseTitle: string;
    timestamp: string;
    noteText: string;
}

export interface NoteResponse {
    id: number;
    contentId: string;
    contentTitle: string;
    courseTitle: string;
    timestamp: string;
    noteText: string;
    createdAt: string;
}

export class NoteService {

    async addNote(enrollmentId: number, request: NoteRequest): Promise<NoteResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để thêm ghi chú');
        }

        try {
            const response = await httpRequest.post(
                `/enrollment-service/enrolls/${enrollmentId}/notes`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu ghi chú từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin ghi chú');
            }

            return {
                id: result.id || 0,
                contentId: result.contentId || '',
                contentTitle: result.contentTitle || '',
                courseTitle: result.courseTitle || '',
                timestamp: result.timestamp || '',
                noteText: result.noteText || '',
                createdAt: result.createdAt || '',
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi thêm ghi chú';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi thêm ghi chú');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để thêm ghi chú');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền thêm ghi chú này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    async getNotes(enrollmentId: number): Promise<NoteResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy danh sách ghi chú');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/notes`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu ghi chú từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách ghi chú');
            }

            return result.map((item: any) => ({
                id: item.id || 0,
                contentId: item.contentId || '',
                contentTitle: item.contentTitle || '',
                courseTitle: item.courseTitle || '',
                timestamp: item.timestamp || '',
                noteText: item.noteText || '',
                createdAt: item.createdAt || '',
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy danh sách ghi chú';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy danh sách ghi chú');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy danh sách ghi chú');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền lấy danh sách ghi chú này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


    async getNotesByContent(enrollmentId: number, contentId: string): Promise<NoteResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy ghi chú theo nội dung');
        }

        try {
            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/notes/${contentId}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu ghi chú từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách ghi chú');
            }

            return result.map((item: any) => ({
                id: item.id || 0,
                contentId: item.contentId || '',
                contentTitle: item.contentTitle || '',
                courseTitle: item.courseTitle || '',
                timestamp: item.timestamp || '',
                noteText: item.noteText || '',
                createdAt: item.createdAt || '',
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy ghi chú theo nội dung';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy ghi chú theo nội dung');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy ghi chú theo nội dung');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền lấy ghi chú theo nội dung này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment hoặc nội dung');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }



    async updateNote(enrollmentId: number, noteId: number, request: Partial<NoteRequest>): Promise<NoteResponse> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để cập nhật ghi chú');
        }

        try {
            const response = await httpRequest.put(
                `/enrollment-service/enrolls/${enrollmentId}/notes/${noteId}`,
                request,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu ghi chú từ server');
            }

            const result = response.data.result || response.data;
            if (!result || typeof result !== 'object') {
                throw new Error('Response không chứa thông tin ghi chú');
            }

            return {
                id: result.id || 0,
                contentId: result.contentId || '',
                contentTitle: result.contentTitle || '',
                courseTitle: result.courseTitle || '',
                timestamp: result.timestamp || '',
                noteText: result.noteText || '',
                createdAt: result.createdAt || '',
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi cập nhật ghi chú';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi cập nhật ghi chú');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để cập nhật ghi chú');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền cập nhật ghi chú này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment hoặc ghi chú');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async deleteNote(enrollmentId: number, noteId: number): Promise<void> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để xóa ghi chú');
        }

        try {
            await httpRequest.delete(
                `/enrollment-service/enrolls/${enrollmentId}/notes/${noteId}`,
                authHeaders
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi xóa ghi chú';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi xóa ghi chú');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để xóa ghi chú');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền xóa ghi chú này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment hoặc ghi chú');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async getFilteredNotes(enrollmentId: number, contentId?: string, sortBy: 'newest' | 'oldest' = 'newest'): Promise<NoteResponse[]> {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Bạn cần đăng nhập để lấy danh sách ghi chú đã lọc');
        }

        try {
            const params = new URLSearchParams();
            if (contentId) {
                params.append('contentId', contentId);
            }
            params.append('sortBy', sortBy);

            const response = await httpRequest.get(
                `/enrollment-service/enrolls/${enrollmentId}/notes/filtered?${params.toString()}`,
                authHeaders
            );

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu ghi chú từ server');
            }

            const result = response.data.result || response.data;
            if (!Array.isArray(result)) {
                throw new Error('Response không chứa danh sách ghi chú');
            }

            return result.map((item: any) => ({
                id: item.id || 0,
                contentId: item.contentId || '',
                contentTitle: item.contentTitle || '',
                courseTitle: item.courseTitle || '',
                timestamp: item.timestamp || '',
                noteText: item.noteText || '',
                createdAt: item.createdAt || '',
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response.data || 'Lỗi lấy danh sách ghi chú đã lọc';
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Lỗi lấy danh sách ghi chú đã lọc');
                }
                if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để lấy danh sách ghi chú đã lọc');
                }
                if (error.response?.status === 403) {
                    throw new Error('Bạn không có quyền lấy danh sách ghi chú đã lọc này');
                }
                if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy enrollment');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

}