"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  variant?: "ghost" | "outline" | "default" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function CopyButton({ 
  value, 
  className, 
  variant = "ghost", 
  size = "icon",
  showText = false
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("text-slate-500 hover:text-slate-900 transition-all", className)}
      onClick={onCopy}
      title="Copy to clipboard"
    >
      {hasCopied ? (
        <Check className={cn("h-4 w-4 text-green-500", showText && "mr-2")} />
      ) : (
        <Copy className={cn("h-4 w-4", showText && "mr-2")} />
      )}
      {showText && (hasCopied ? "Copied!" : "Copy")}
    </Button>
  );
}
