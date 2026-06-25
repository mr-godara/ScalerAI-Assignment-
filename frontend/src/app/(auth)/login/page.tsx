"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/lib/hooks/use-auth";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    const params = new URLSearchParams();
    params.append("username", data.email);
    params.append("password", data.password);

    loginMutation.mutate(params, {
      onError: () => {
        toast.error("Invalid email or password");
      },
    });
  };

  return (
    <div className="w-full max-w-sm bg-aws-white rounded-md shadow-md border border-aws-border overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Globe className="h-10 w-10 text-aws-orange" />
          </div>
          <h1 className="text-xl font-medium text-aws-text tracking-wide">
            Sign in to Route53 Clone
          </h1>
          <p className="text-sm text-aws-text-secondary mt-1">
            Manage your DNS infrastructure
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-aws-text mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@route53.local"
              autoFocus
              {...register("email")}
              className={`w-full border ${
                errors.email ? "border-red-500 focus:ring-red-500" : "border-aws-border focus:border-aws-blue focus:ring-aws-blue"
              } px-3 py-2 rounded text-sm focus:outline-none focus:ring-1`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-aws-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`w-full border ${
                  errors.password ? "border-red-500 focus:ring-red-500" : "border-aws-border focus:border-aws-blue focus:ring-aws-blue"
                } px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aws-text-secondary hover:text-aws-text focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-aws-orange hover:bg-aws-orange-dark text-black font-bold py-2 rounded text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-aws-border pt-6">
          <p className="text-xs text-aws-text-secondary">
            Demo: admin@route53.local / Admin1234!
          </p>
        </div>
      </div>
    </div>
  );
}
