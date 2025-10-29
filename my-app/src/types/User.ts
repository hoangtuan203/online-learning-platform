export interface LoginRequest {
  username: string;
  password: string;
}
export interface RefreshRequest {
  token: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  createdAt: string;
  
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
  authenticated: boolean;
  expiryTime?: string;
}

export interface UserPage {
  user: User[];
  totalElements: number;
  totalPages: number;
  currentPage?: number;
}
