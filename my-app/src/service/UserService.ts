import axios from "axios";
import type { AuthResponse, LoginRequest, UserPage } from "../types/User";
import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";

export class UserService {
    private async authenticateUser(request: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await httpRequest.post('/user-service/users/login', request);
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu đăng nhập từ server');
            }
            return response.data;
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
    public async getAllUsers(page = 0, size = 10): Promise<UserPage> {
        try {
            const authHeaders = getAuthHeaders();
            const config = {
                params: { page, size },
                ...authHeaders
            }
            const response = await httpRequest.get('/user-service/users', config);

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu người dùng từ server');
            }

            return response.data;
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
        page = 0,
        size = 5
    ): Promise<UserPage> {
        try {
            const authHeaders = getAuthHeaders();
            const config = {
                params: { page, size },
                ...authHeaders
            }
            const response = await httpRequest.get("user-service//users/search", config);

            if (!response.data) {
                throw new Error("Không nhận được dữ liệu tìm kiếm từ server");
            }

            return response.data;
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