import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "../stores/auth-store";
import { AppError } from "@/types/api";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const baseURL = rawApiUrl.replace(/\/$/, "").endsWith("/api/v1")
  ? rawApiUrl.replace(/\/$/, "")
  : `${rawApiUrl.replace(/\/$/, "")}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    let detailStr = error.message || "An unexpected error occurred";
    const responseData = error.response?.data;
    const detail =
      responseData && typeof responseData === "object" && "detail" in responseData
        ? (responseData as { detail?: unknown }).detail
        : undefined;
    
    if (typeof detail === "string") {
      detailStr = detail;
    } else if (Array.isArray(detail)) {
      detailStr = detail
        .map((item) => {
          if (item && typeof item === "object") {
            const candidate = item as { msg?: unknown; message?: unknown };
            if (typeof candidate.msg === "string") return candidate.msg;
            if (typeof candidate.message === "string") return candidate.message;
          }
          return JSON.stringify(item);
        })
        .join(", ");
    } else if (typeof detail === "object" && detail !== null) {
      const candidate = detail as { message?: unknown; detail?: unknown };
      if (typeof candidate.message === "string") {
        detailStr = candidate.message;
      } else if (typeof candidate.detail === "string") {
        detailStr = candidate.detail;
      } else {
        detailStr = JSON.stringify(detail);
      }
    }

    const appError: AppError = {
      message: detailStr,
      status: error.response?.status,
    };

    // Parse RFC 7807 Problem Details or custom field errors if backend sends them
    if (responseData && typeof responseData === "object" && "errors" in responseData) {
      appError.field_errors = (responseData as { errors?: Record<string, string[]> }).errors;
    }

    return Promise.reject(appError);
  }
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T, AxiosResponse<T>>(url, config).then((res) => res.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T, AxiosResponse<T>>(url, config).then((res) => res.data),
};
