
import axios from "axios";
import type { AuthResponse, LoginRequest, UserPage, RefreshRequest, User, UpdateUserRequest, CreateUserRequest, VerifyOtpRequest, OAuthResponse } from "../types/User";
import httpRequest from "../utils/httpRequest";
import { getAuthHeaders } from "../utils/auth";

export class UserService {
    private async authenticateUser(request: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await httpRequest.post('/user-service/users/login', request);
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu đăng nhập từ server');
            }
            // Parse nếu wrapped (code + result)
            const result = response.data.result || response.data;
            if (!result || !result.accessToken) {
                throw new Error('Response không chứa access token');
            }
            return {
                accessToken: result.accessToken,
                user: result.user || null, // Null nếu backend không return
                authenticated: result.authenticated ?? true,
                expiryTime: result.expiryTime || null,
            };
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
            const authResponse = await this.authenticateUser(input);

            // Lưu accessToken (bắt buộc)
            localStorage.setItem("accessToken", authResponse.accessToken);

            // Lưu user nếu backend return (nếu null, fetch riêng sau)
            if (authResponse.user) {
                localStorage.setItem("user", JSON.stringify(authResponse.user));
            } else {
                // Optional: Fetch user ngay sau login nếu cần
                await this.getCurrentUser();
            }

            // Lưu authenticated và expiryTime nếu có
            localStorage.setItem("authenticated", authResponse.authenticated.toString());
            if (authResponse.expiryTime) {
                localStorage.setItem("expiryTime", authResponse.expiryTime);
            }

            return authResponse;
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

    public async refreshToken(request: RefreshRequest): Promise<AuthResponse> {
        try {
            if (!request || !request.token) {
                throw new Error('Refresh token không được null');
            }
            const response = await httpRequest.post('/user-service/users/refresh', request);
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu refresh token từ server');
            }
            // Parse wrapped
            const result = response.data.result || response.data;
            if (!result || !result.accessToken) {
                throw new Error('Response không chứa access token mới');
            }

            // Lưu token mới
            localStorage.setItem("accessToken", result.accessToken);
            if (result.expiryTime) {
                localStorage.setItem("expiryTime", result.expiryTime);
            }

            return {
                accessToken: result.accessToken,
                user: undefined, // Không return user, dùng từ localStorage
                authenticated: result.authenticated ?? true,
                expiryTime: result.expiryTime || null,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    window.location.href = '/login'; // Redirect
                    throw new Error('Refresh token hết hạn. Vui lòng đăng nhập lại.');
                }
                throw new Error(`Lỗi refresh: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    public async getCurrentUser(): Promise<User> {
        try {
            const authHeaders = getAuthHeaders();
            const response = await httpRequest.get('/user-service/users/me', authHeaders);
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu user từ server');
            }
            const user = response.data; // Giả sử response là User object
            localStorage.setItem("user", JSON.stringify(user));
            return user;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn');
                }
                throw new Error(`Lỗi lấy thông tin user: ${error.response?.data?.message || error.message}`);
            }
            throw error;
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
            const response = await httpRequest.get("user-service/users/search", config);

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

    public async updateUser(userId: number, updateData: UpdateUserRequest): Promise<User> {
        try {
            const authHeaders = getAuthHeaders();
            const response = await httpRequest.put(`/user-service/users/${userId}`, updateData, authHeaders);

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu cập nhật từ server');
            }

            const result = response.data.result || response.data;
            if (!result) {
                throw new Error('Response không chứa dữ liệu user cập nhật');
            }

            const updatedUser = result as User;
            localStorage.setItem("user", JSON.stringify(updatedUser));

            return updatedUser;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                } else if (error.response?.status === 400) {
                    throw new Error(`Dữ liệu không hợp lệ: ${error.response.data?.message || error.message}`);
                }
                throw new Error(`Lỗi cập nhật user: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    // In UserService.ts - Fix for uploadAvatar method
    public async uploadAvatar(userId: number, file: File): Promise<string> {
        try {
            if (!file) {
                throw new Error('File ảnh không hợp lệ');
            }

            const formData = new FormData();
            formData.append('file', file);

            const authHeaders = getAuthHeaders();
            const response = await httpRequest.put(
                `/user-service/users/${userId}/avatar`,
                formData,
                {
                    ...(authHeaders || {}),
                    headers: {
                        ...(authHeaders?.headers || {}),
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.data) {
                throw new Error('Không nhận được URL avatar từ server');
            }

            const avatarUrl = response.data; // Backend returns String URL directly
            // Update localStorage user with new avatarUrl
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser) as User;
                user.avatarUrl = avatarUrl;
                localStorage.setItem("user", JSON.stringify(user));
            }

            return avatarUrl;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                } else if (error.response?.status === 400) {
                    throw new Error(`File không hợp lệ: ${error.response.data?.message || error.message}`);
                }
                throw new Error(`Lỗi upload avatar: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    public async createUser(request: CreateUserRequest): Promise<{ message: string; email: string }> {
        try {
            if (!request || !request.name || !request.username || !request.email || !request.password) {
                throw new Error('Tên, username, email và password không được null');
            }

            const response = await httpRequest.post('/user-service/users/create', request);
            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            // Parse wrapped
            const result = response.data.result || response.data;
            if (!result) {
                throw new Error('Response không chứa dữ liệu');
            }

            return result;  // { message, email }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    throw new Error(`Dữ liệu không hợp lệ: ${error.response.data?.message || error.message}`);
                } else if (error.response?.status === 409 || error.response?.status === 422) {
                    throw new Error('Email hoặc username đã tồn tại');
                }
                throw new Error(`Lỗi tạo user: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    public async verifyOtp(request: VerifyOtpRequest): Promise<{ message: string }> {
        try {
            const response = await httpRequest.post('/user-service/users/verify-otp', request);
            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data.result || response.data;
            if (!result) {
                throw new Error('Response không chứa dữ liệu');
            }

            return result;  // { message }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    throw new Error(`OTP không hợp lệ: ${error.response.data?.message || error.message}`);
                }
                throw new Error(`Lỗi xác thực OTP: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    public async handleOAuthCallback(
        provider: string,
        code: string
    ): Promise<OAuthResponse> {
        console.log("OAuth code received:", code);

        try {
            const response = await httpRequest.post<OAuthResponse>(
                `/user-service/users/oauth2/callback/${provider}`,
                { code }
            );
            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const result = response.data ;
            if (!result) {
                throw new Error('Response không chứa dữ liệu');
            }

            return result;  // OAuthResponse
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    throw new Error(`Lỗi OAuth callback: ${error.response.data?.message || error.message}`);
                }
                throw new Error(`Lỗi OAuth callback: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }


}