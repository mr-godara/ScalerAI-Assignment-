import { toast as sonnerToast } from "sonner";
import { AppError } from "@/types/api";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (error: string | AppError | Error, description?: string) => {
    let message = "An error occurred";
    if (typeof error === "string") {
      message = error;
    } else if ("message" in error) {
      message = error.message;
    }
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
};
