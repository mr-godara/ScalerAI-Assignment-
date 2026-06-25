import { api } from "./client";
import { LoginResponse, User } from "@/types/api";

export const authApi = {
  login: (credentials: URLSearchParams) => {
    return api.post<LoginResponse>("/auth/token", credentials, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  logout: async () => {
    // If backend has a logout endpoint, call it here. 
    // Otherwise just resolve.
    return Promise.resolve();
  },
  getMe: () => {
    return api.get<User>("/auth/users/me");
  },
};
