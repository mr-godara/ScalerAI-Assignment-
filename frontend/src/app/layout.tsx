import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { KeyboardShortcutsModal } from "@/components/layout/keyboard-shortcuts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Route 53 Clone",
  description: "AWS Route 53 clone frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster position="top-right" richColors closeButton theme="dark" />
          <KeyboardShortcutsModal />
        </Providers>
      </body>
    </html>
  );
}
