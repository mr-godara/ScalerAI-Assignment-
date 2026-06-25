"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: "/",
      ctrl: true,
      action: () => setIsOpen(true),
      description: "Show keyboard shortcuts",
      category: "Global",
      preventInput: false,
    },
    {
      key: ["g", "h"],
      action: () => router.push("/hosted-zones"),
      description: "Go to hosted zones",
      category: "Navigation",
    },
    {
      key: ["g", "d"],
      action: () => router.push("/"),
      description: "Go to dashboard",
      category: "Navigation",
    },
    {
      key: ["c", "z"],
      action: () => router.push("/hosted-zones/new"),
      description: "Create new hosted zone",
      category: "Actions",
    },
    {
      key: "/",
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: "Focus search bar",
      category: "Global",
      preventInput: true,
    },
    {
      key: "Escape",
      action: () => setIsOpen(false),
      description: "Close modal",
      category: "Global",
      preventInput: false,
    },
  ]);

  const shortcuts = [
    { keys: ["Ctrl", "/"], desc: "Show keyboard shortcuts" },
    { keys: ["g", "h"], desc: "Go to hosted zones" },
    { keys: ["g", "d"], desc: "Go to dashboard" },
    { keys: ["c", "z"], desc: "Create new hosted zone" },
    { keys: ["/"], desc: "Focus search bar" },
    { keys: ["Esc"], desc: "Close modal" },
    { keys: ["n"], desc: "New record (Zone details page)" },
    { keys: ["Del"], desc: "Delete selected rows" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate the AWS Route53 console faster using these shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 dark:text-slate-300">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
              <span className="text-slate-600 dark:text-slate-400">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-xs text-slate-700 dark:text-slate-300 shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
