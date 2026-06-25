"use client";

export function DataTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Find resources"
      className="border border-aws-border px-3 py-1.5 rounded text-sm w-full max-w-xs focus:outline-none focus:border-aws-blue focus:ring-1 focus:ring-aws-blue"
    />
  );
}

export function Pagination() {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <button className="px-3 py-1 border border-aws-border rounded text-sm" disabled>Previous</button>
      <button className="px-3 py-1 border border-aws-border rounded text-sm" disabled>Next</button>
    </div>
  );
}

export function StatusBadge({ status }: { status: "success" | "error" | "pending" }) {
  const colors = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
}

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="text-aws-blue hover:underline text-xs"
    >
      Copy
    </button>
  );
}
