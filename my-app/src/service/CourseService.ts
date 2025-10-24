// CourseService.ts (full code based on previous implementations)
import axios from "axios";
import httpRequest from "../utils/httpRequest";
import type { CoursePage } from "../types/Course";
import { getAuthHeaders } from "../utils/auth"; // Assuming this is your auth utils

const FIND_ALL_COURSES_QUERY = `
  query FindAllCourses($page: Int!, $size: Int!) {
    findAllCourses(page: $page, size: $size) {
      content {
        id
        title
        description
        price
        thumbnailUrl
        instructor {
          id
          fullName
        }
        createdAt
      }
      totalElements
      totalPages
    }
  }
`;

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface CreateContentRequest {
  courseId: string;
  title: string;
  description: string;
  type: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  level?: string;
  tags?: string[];
  questions?: QuizQuestion[];
}

export interface ContentResponse {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  level?: string;
  tags?: string[];
  questions?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationResponse {
  success: boolean;
  content: ContentResponse | null;
  errorMessage: string | null;
  status: string;
}

export interface BulkOperationResponse {
  success: boolean;
  contents: ContentResponse[];
  errorMessage: string | null;
  count: number;
}

export class CourseService {
  private baseUrl = "/content-service/contents";

  public async getAllCourses(page = 0, size = 10): Promise<CoursePage> {
    try {
      const authHeaders = getAuthHeaders();
      const body = {
        query: FIND_ALL_COURSES_QUERY,
        variables: { page, size }
      };
      const response = await httpRequest.post("/course-service/graphql", body, authHeaders);

      const { data, errors } = response.data;

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "GraphQL query error");
      }

      if (!data?.findAllCourses) {
        throw new Error("Không nhận được dữ liệu khóa học từ server");
      }

      return data.findAllCourses;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  public async createContent(data: CreateContentRequest): Promise<OperationResponse> {
    try {
      const authHeaders = getAuthHeaders();
      const response = await httpRequest.post<OperationResponse>(`${this.baseUrl}/create`, data, authHeaders);
      if (!response.data.success) {
        throw new Error(response.data.errorMessage || "Lỗi không xác định từ server");
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        const message = error.response?.data?.errorMessage || error.message;
        throw new Error(`Lỗi khi tạo nội dung: ${message}`);
      }
      throw new Error(`Lỗi hệ thống: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async createContentsInBulk(data: CreateContentRequest[]): Promise<BulkOperationResponse> {
    try {
      const authHeaders = getAuthHeaders();
      const response = await httpRequest.post<BulkOperationResponse>(`${this.baseUrl}/bulk`, data, authHeaders);
      if (!response.data.success) {
        throw new Error(response.data.errorMessage || "Lỗi không xác định từ server");
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        const message = error.response?.data?.errorMessage || error.message;
        throw new Error(`Lỗi khi tạo nội dung hàng loạt: ${message}`);
      }
      throw new Error(`Lỗi hệ thống: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getContentById(contentId: string): Promise<ContentResponse> {
    try {
      const authHeaders = getAuthHeaders();
      const response = await httpRequest.get<ContentResponse>(`${this.baseUrl}/${contentId}`, authHeaders);
      if (!response.data) {
        throw new Error("Không tìm thấy nội dung từ server");
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response?.status === 404) {
          throw new Error("Nội dung không tồn tại");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  public async getContentsByCourseId(courseId: string): Promise<ContentResponse[]> {
    try {
      const authHeaders = getAuthHeaders();
      const response = await httpRequest.get<ContentResponse[]>(`${this.baseUrl}/course/${courseId}`, authHeaders);
      return response.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response?.status === 404) {
          throw new Error("Không tìm thấy nội dung cho khóa học này");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  public async updateContent(contentId: string, data: CreateContentRequest): Promise<ContentResponse> {
    try {
      const authHeaders = getAuthHeaders();
      const response = await httpRequest.put<ContentResponse>(`${this.baseUrl}/${contentId}`, data, authHeaders);
      if (!response.data) {
        throw new Error("Không thể cập nhật nội dung từ server");
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response?.status === 404) {
          throw new Error("Nội dung không tồn tại");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  public async deleteContent(contentId: string): Promise<void> {
    try {
      const authHeaders = getAuthHeaders();
      await httpRequest.delete(`${this.baseUrl}/${contentId}`, authHeaders);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response?.status === 404) {
          throw new Error("Nội dung không tồn tại");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  public async deleteContentsByCourseId(courseId: string): Promise<void> {
    try {
      const authHeaders = getAuthHeaders();
      await httpRequest.delete(`${this.baseUrl}/course/${courseId}`, authHeaders);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response?.status === 404) {
          throw new Error("Không tìm thấy nội dung cho khóa học này");
        }
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  // Type-specific wrappers (recommended for clarity)
  public async createVideo(data: Omit<CreateContentRequest, 'questions'> & { questions?: never }): Promise<OperationResponse> {
    const request: CreateContentRequest = {
      ...data,
      type: 'VIDEO',
      questions: [],
    };
    return this.createContent(request);
  }

  public async createDocument(data: Omit<CreateContentRequest, 'duration' | 'questions' | 'thumbnail'> & { duration?: never; questions?: never; thumbnail?: never }): Promise<OperationResponse> {
    const request: CreateContentRequest = {
      ...data,
      type: 'DOCUMENT',
      duration: undefined,
      questions: [],
      thumbnail: undefined,
    };
    return this.createContent(request);
  }

  public async createQuiz(data: CreateContentRequest & { questions: QuizQuestion[] }): Promise<OperationResponse> {
    const request: CreateContentRequest = {
      ...data,
      type: 'QUIZ',
      url: undefined,
      duration: undefined,
      thumbnail: undefined,
    };
    return this.createContent(request);
  }
}