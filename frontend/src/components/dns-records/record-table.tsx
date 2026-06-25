"use client";

import { DNSRecord } from "@/types/api";
import { formatRecordValue } from "@/lib/utils";

import { SkeletonTable } from "../common/skeleton-table";

export function RecordTable({ records, zoneId, isLoading }: { records: DNSRecord[], zoneId: string, isLoading?: boolean }) {
  if (isLoading) {
    return <SkeletonTable columns={5} rows={5} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-aws-text">
        <thead className="border-b border-aws-border bg-aws-bg text-aws-text-secondary">
          <tr>
            <th className="py-2 px-3 font-medium">Record name</th>
            <th className="py-2 px-3 font-medium">Type</th>
            <th className="py-2 px-3 font-medium">Routing policy</th>
            <th className="py-2 px-3 font-medium">Value/Route traffic to</th>
            <th className="py-2 px-3 font-medium">TTL (seconds)</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-aws-text-secondary">
                No records found.
              </td>
            </tr>
          )}
          {records.map((record) => (
            <tr key={record.id} className="border-b border-aws-border hover:bg-aws-bg/50 transition-colors">
              <td className="py-2 px-3 text-aws-blue cursor-pointer hover:underline">{record.name}</td>
              <td className="py-2 px-3">{record.type}</td>
              <td className="py-2 px-3">{record.routing_policy}</td>
              <td className="py-2 px-3 font-mono text-xs">{formatRecordValue(record.value)}</td>
              <td className="py-2 px-3">{record.ttl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
