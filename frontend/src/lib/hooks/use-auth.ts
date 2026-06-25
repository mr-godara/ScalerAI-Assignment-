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
    onSuccess: async (data) => {
      // Temporarily set token so getMe can use it
      useAuthStore.setState({ token: data.access_token, isAuthenticated: true });
      try {
        const user = await authApi.getMe();
        setAuth(user, data.access_token);
        router.push("/hosted-zones");
      } catch (err) {
        useAuthStore.getState().clearAuth();
      }
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
