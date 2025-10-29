// CourseService.ts - Updated getCourseById to match exact backend query and response
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
        category
        instructor {
          id
          username
          fullName
        }
        createdAt
      }
      totalElements
      totalPages
    }
  }
`;

const GET_COURSE_BY_ID_QUERY = `
  query GetCourseById($id: ID!) {
    getCourseById(id: $id) {
      id
      title
      description
      instructor {
        id
        fullName
      }
      price
      thumbnailUrl
      category
      createdAt
    }
  }
`;

const SEARCH_COURSES_QUERY = `
  query SearchCourses($title: String, $category: String, $page: Int!, $size: Int!) {
    searchCourses(title: $title, category: $category, page: $page, size: $size) {
      content {
        id
        title
        instructor {
          id
          username
          fullName
        }
        thumbnailUrl
        category
        price
        createdAt
      }
      totalElements
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
  duration?: number; // Ensure this is optional number for video types
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

// Simplified CourseDetail interface based on exact backend response
export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  price: number | null;
  thumbnailUrl: string | null;
  category: string;
  instructor: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  // Derived fields (fetched/calculated separately)
  totalHours?: number;
  totalElements?: number;
  contents?: ContentResponse[];
  level?: string; // Default if not in backend
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

  public async getCourseById(id: string): Promise<CourseDetail> {
    try {
      const authHeaders = getAuthHeaders();
      const body = {
        query: GET_COURSE_BY_ID_QUERY,
        variables: { id }
      };
      const response = await httpRequest.post("/course-service/graphql", body, authHeaders);

      const { data, errors } = response.data;

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "GraphQL query error");
      }

      if (!data?.getCourseById) {
        throw new Error("Không nhận được dữ liệu khóa học từ server");
      }

      const course = data.getCourseById;

      const contents = await this.getContentsByCourseId(id);
      course.contents = contents;
      course.totalElements = contents.length;

      const totalSeconds = contents
        .filter(content => content.type === 'VIDEO' && content.duration != null)
        .reduce((sum, content) => sum + (content.duration || 0), 0);
      course.totalHours = Math.round(totalSeconds / 3600);

      course.level = "Cơ bản";

      return course;
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
      // Debug log for duration
      console.debug(`Content ID ${contentId} duration:`, response.data.duration);
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
      const contents = response.data || [];

      // Debug log to check duration values across all contents
      contents.forEach((content, index) => {
        console.debug(`Content ${index + 1} for course ${courseId} - ID: ${content.id}, Duration: ${content.duration ?? 'null/undefined'}`);
      });

      // Optional: Calculate total duration if needed (sum for video types)
      const totalDuration = contents
        .filter(content => content.type === 'VIDEO' && content.duration != null)
        .reduce((sum, content) => sum + (content.duration || 0), 0);
      console.debug(`Total duration for course ${courseId}: ${totalDuration} seconds`);

      return contents;
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
      // Debug log for updated duration
      console.debug(`Updated Content ID ${contentId} duration:`, response.data.duration);
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

  //search courses 
  public async searchCourses(title?: string, category?: string, page = 0, size = 5): Promise<CoursePage> {
    try {
      const authHeaders = getAuthHeaders();
      const body = {
        query: SEARCH_COURSES_QUERY,
        variables: {
          title: title || null,
          category: category || null,
          page,
          size
        }
      };
      const response = await httpRequest.post("/course-service/graphql", body, authHeaders);

      const { data, errors } = response.data;

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "GraphQL query error");
      }

      if (!data?.searchCourses) {
        throw new Error("Không nhận được dữ liệu khóa học từ server");
      }

      return data.searchCourses;
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
}