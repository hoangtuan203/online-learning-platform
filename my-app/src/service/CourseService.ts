import axios from "axios";
import httpRequest from "../utils/httpRequest";
import type { CoursePage } from "../types/Course";

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

export class CourseService {
  public async getAllCourses(page = 0, size = 10): Promise<CoursePage> {
    try {
      const response = await httpRequest.post("/courses/graphql", {
        query: FIND_ALL_COURSES_QUERY,
        variables: { page, size },
      });

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
        throw new Error(
          `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }


}