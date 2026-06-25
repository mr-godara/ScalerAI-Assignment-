"use client";

import { useCurrentUser, useLogout } from "@/lib/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { Menu, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="flex h-[40px] items-center justify-between bg-aws-navy px-4 border-b-2 border-aws-orange shrink-0 z-50">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 text-white md:hidden hover:text-aws-orange"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-white font-semibold text-sm tracking-wide">AWS Route 53</span>
      </div>
      
      <div className="flex items-center gap-6 h-full">
        {/* Mock region selector */}
        <button className="hidden sm:flex items-center text-white/90 hover:text-white text-sm">
          N. Virginia <ChevronDown className="ml-1 h-4 w-4" />
        </button>

        {/* Mock support */}
        <button className="hidden sm:flex items-center text-white/90 hover:text-white text-sm">
          Support <ChevronDown className="ml-1 h-4 w-4" />
        </button>

        <ThemeToggle />

        {/* User menu dropdown */}
        <div className="relative h-full flex items-center" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center text-white/90 hover:text-white text-sm h-full px-2"
          >
            {user?.email || "user@example.com"} <ChevronDown className="ml-1 h-4 w-4" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-[40px] w-48 bg-aws-white border border-aws-border shadow-lg py-1 rounded-bl rounded-br">
              <div className="px-4 py-2 border-b border-aws-border">
                <p className="text-xs text-aws-text-secondary font-medium uppercase tracking-wider">Account</p>
                <p className="text-sm text-aws-text truncate" title={user?.email}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-aws-text hover:bg-aws-bg transition-colors"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
