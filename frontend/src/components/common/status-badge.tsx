import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  variant: "public" | "private" | "active" | "record-type";
  type?: string; // e.g., 'A', 'CNAME' for record-type
  className?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ variant, type, className, children }: StatusBadgeProps) {
  let colorClasses = "";
  let defaultText = "";

  if (variant === "public") {
    colorClasses = "bg-green-100 text-green-800 border-green-200";
    defaultText = "Public";
  } else if (variant === "private") {
    colorClasses = "bg-slate-100 text-slate-800 border-slate-200";
    defaultText = "Private";
  } else if (variant === "active") {
    colorClasses = "bg-green-100 text-green-800 border-green-200";
    defaultText = "Active";
  } else if (variant === "record-type") {
    // Record type coloring logic
    const recordType = type?.toUpperCase() || "";
    switch (recordType) {
      case "A": 
        colorClasses = "bg-blue-100 text-blue-800 border-blue-200";
        break;
      case "AAAA": 
        colorClasses = "bg-purple-100 text-purple-800 border-purple-200";
        break;
      case "CNAME": 
        colorClasses = "bg-teal-100 text-teal-800 border-teal-200";
        break;
      case "TXT": 
        colorClasses = "bg-yellow-100 text-yellow-800 border-yellow-200";
        break;
      case "MX": 
        colorClasses = "bg-orange-100 text-orange-800 border-orange-200";
        break;
      case "NS":
      case "SOA":
      case "PTR":
      case "SRV":
      case "CAA":
        colorClasses = "bg-slate-100 text-slate-800 border-slate-200";
        break;
      default: 
        colorClasses = "bg-slate-100 text-slate-800 border-slate-200";
    }
    defaultText = recordType;
  }

  return (
    <Badge 
      variant={variant === "record-type" ? "outline" : "secondary"} 
      className={cn(colorClasses, className)}
    >
      {children || defaultText}
    </Badge>
  );
}
