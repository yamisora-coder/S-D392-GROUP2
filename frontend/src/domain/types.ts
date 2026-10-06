export interface User {
  id?: number;
  userId?: number;
  email: string;
  fullName: string;
  role?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: string;
  studentCode?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  studentCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponseData {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}
