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
          <div className="p-4 bg-slate-800 rounded-full text-orange-500 mb-4">
            {React.cloneElement(icon as React.ReactElement, { size: 48 })}
          </div>
        )}
        <h1 className="text-3xl font-semibold text-slate-100">{title}</h1>
        <p className="text-lg text-slate-400">{description}</p>
        
        <div className="w-full mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-md flex items-start text-left space-x-3">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-medium text-blue-400">Feature in Development</h3>
            <p className="text-sm text-slate-300 mt-1">
              This feature is currently under active development. You will be able to manage {title.toLowerCase()} directly from this console in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
