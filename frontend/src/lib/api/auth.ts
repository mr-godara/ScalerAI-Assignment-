import { api } from "./client";
import { LoginResponse, User } from "@/types/api";

export const authApi = {
  login: (credentials: { email: string; password: string }) => {
    return api.post<LoginResponse>("/auth/login", credentials);
  },
  logout: async () => {
    // If backend has a logout endpoint, call it here. 
    // Otherwise just resolve.
    return Promise.resolve();
  },
  getMe: () => {
    return api.get<User>("/auth/me");
  },
};
