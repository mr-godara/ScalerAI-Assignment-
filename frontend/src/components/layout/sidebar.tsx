"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  GitBranch,
  HeartPulse,
  Search,
  User,
} from "lucide-react";

const navSections = [
  {
    title: "DNS MANAGEMENT",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Hosted zones", href: "/hosted-zones", icon: Globe },
    ],
  },
  {
    title: "TRAFFIC MANAGEMENT",
    items: [
      { name: "Traffic policies", href: "/traffic-policies", icon: GitBranch },
      { name: "Health checks", href: "/health-checks", icon: HeartPulse },
    ],
  },
  {
    title: "RESOLVER",
    items: [
      { name: "Resolver", href: "/resolver", icon: Search },
      { name: "Profiles", href: "/profiles", icon: User },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-aws-navy transition-transform duration-300 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[40px] shrink-0 items-center px-4 border-b border-aws-navy-light/50 mt-12 md:mt-0">
          <Globe className="h-5 w-5 text-aws-orange mr-2" />
          <h1 className="text-white text-base font-semibold tracking-wide">Route 53</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="px-4 mb-2 text-[11px] font-bold text-aws-text-secondary tracking-wider uppercase">
                {section.title}
              </h2>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        className={cn(
                          "group flex items-center px-4 py-2 text-[13px] font-medium border-l-[3px] transition-colors",
                          isActive
                            ? "border-aws-orange bg-aws-navy-light text-white"
                            : "border-transparent text-white/80 hover:bg-aws-navy-light hover:text-white"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 shrink-0",
                            isActive ? "text-white" : "text-white/70 group-hover:text-white"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
