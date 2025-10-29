import type { AxiosInstance } from "axios";
import axios from "axios";
import { UserService } from "../service/UserService";

const baseURL: string = import.meta.env.VITE_BASE_URL ?? "http://localhost:8888/api/";

const httpRequest: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

httpRequest.interceptors.request.use(
  (config) =>{
    const token = localStorage.getItem("accessToken");
    if(token)
      config.headers.Authorization = `Bearer ${token}`;
    return config;

  },
  (error) => Promise.reject(error)
)

httpRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const userService = new UserService();
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        await userService.refreshToken({ token: refreshToken });
        
        return httpRequest(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default httpRequest;