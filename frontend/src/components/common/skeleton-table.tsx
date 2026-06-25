import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  columns: number;
  rows?: number;
}

export function SkeletonTable({ columns, rows = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full">
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="h-10 px-4 text-left">
                  <Skeleton className="h-4 w-24 bg-slate-200/60" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-slate-200">
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="p-4">
                    <Skeleton className="h-4 w-full bg-slate-200/60" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
