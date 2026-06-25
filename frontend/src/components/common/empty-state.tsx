import React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
          <Icon className="h-6 w-6 text-slate-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          <Button
            onClick={action.onClick}
            variant="default"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
