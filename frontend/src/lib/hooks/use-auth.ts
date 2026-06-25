import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth-store";
import { useRouter } from "next/navigation";
import { AppError } from "@/types/api";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user as any, data.access_token);
      // Set cookie for middleware
      document.cookie = `auth-token=${data.access_token}; path=/; max-age=86400; samesite=lax`;
      router.push("/hosted-zones");
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      // Clear cookie for middleware
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    },
  });
};

export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["user", "me"],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
  });
};
