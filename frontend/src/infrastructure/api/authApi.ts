import { apiClient } from './apiClient';
import { ApiResponse, AuthResponseData, LoginPayload, RegisterPayload, User } from '../../domain/types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/logout');
    return res.data;
  },
};
