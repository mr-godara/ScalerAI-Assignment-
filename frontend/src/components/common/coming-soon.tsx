import React from "react";
import { Info } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center max-w-2xl text-center space-y-6">
        {icon && (
          <div className="mb-4 rounded-full bg-slate-200 p-4 text-orange-500 dark:bg-slate-800">
            {React.cloneElement(
              icon as React.ReactElement<{ className?: string }>,
              { className: "h-12 w-12" }
            )}
          </div>
        )}
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">{description}</p>
        
        <div className="mt-8 flex w-full items-start space-x-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-500/30 dark:bg-blue-900/20">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-medium text-blue-400">Feature in Development</h3>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              This feature is currently under active development. You will be able to manage {title.toLowerCase()} directly from this console in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
