import axios from "axios";
import type { AuthResponse, LoginRequest, UserPage } from "../types/User";
import httpRequest from "../utils/httpRequest";

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        username
        name
        email
        role
      }
    }
  }
`;

const FIND_ALL_USERS_QUERY = `
  query FindAllUsers($page: Int!, $size: Int!) {
    findAllUsers(page: $page, size: $size) {
      user {
        id
        username
        name
        email
        role
        avatarUrl
        createdAt
        updatedAt
      }
      totalElements
      totalPages
      currentPage
    }
  }
`;


const SEARCH_USERS_QUERY = `
  query SearchUsers($name: String, $role: Role, $page: Int!, $size: Int!) {
    searchUsers(name: $name, role: $role, page: $page, size: $size) {
      user {
        id
        username
        name
        email
        role
        createdAt
        updatedAt
      }
      totalElements
      totalPages
      currentPage
    }
  }
`;



export class UserService {
    private async authenticateUser(request: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await httpRequest.post('/users/graphql', {
                query: LOGIN_MUTATION,
                variables: { input: request }
            });
            const { data } = response.data;
            if (!data?.login) {
                throw new Error('Không nhận được dữ liệu đăng nhập từ server');
            }
            return data.login;
        } catch (error) {
            if (axios.isAxiosError(error)) {

                if (error.response?.status === 401) {
                    throw new Error('Tài khoản hoặc mật khẩu không đúng');
                }
                throw new Error(`Lỗi kết nối server: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    public async login(input: LoginRequest): Promise<AuthResponse> {
        try {
            if (!input || !input.username || !input.password) {
                throw new Error('Username và password không được null');
            }
            return await this.authenticateUser(input);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Username và password')) {
                throw error;
            }
            console.error('Login error:', error);
            if (error instanceof Error) {
                console.trace(error);
            }
            throw new Error(`Lỗi đăng nhập: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    //find all users
    public async getAllUsers(page = 0, size = 10): Promise<UserPage> {
        try {
            const response = await httpRequest.post('/users/graphql', {
                query: FIND_ALL_USERS_QUERY,
                variables: { page, size },
            });

            const { data, errors } = response.data;

            if (errors && errors.length > 0) {
                throw new Error(errors[0].message || 'GraphQL query error');
            }

            if (!data?.findAllUsers) {
                throw new Error('Không nhận được dữ liệu người dùng từ server');
            }

            return data.findAllUsers;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Lỗi kết nối server: ${error.response?.data?.message || error.message}`
                );
            }
            throw error;
        }
    }

    public async searchUsers(
        name?: string,
        role?: string,
        page = 0,
        size = 5
    ): Promise<UserPage> {
        try {
            const response = await httpRequest.post("/users/graphql", {
                query: SEARCH_USERS_QUERY,
                variables: { name, role, page, size },
            });

            const { data, errors } = response.data;

            if (errors && errors.length > 0) {
                throw new Error(errors[0].message || "GraphQL query error");
            }

            if (!data?.searchUsers) {
                throw new Error("Không nhận được dữ liệu tìm kiếm từ server");
            }

            return data.searchUsers;
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
