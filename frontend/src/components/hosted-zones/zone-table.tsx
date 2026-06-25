"use client";

import { HostedZone } from "@/types/api";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function ZoneTable({ zones }: { zones: HostedZone[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-aws-text">
        <thead className="border-b border-aws-border bg-aws-bg text-aws-text-secondary">
          <tr>
            <th className="py-2 px-3 font-medium">Name</th>
            <th className="py-2 px-3 font-medium">Type</th>
            <th className="py-2 px-3 font-medium">Record count</th>
            <th className="py-2 px-3 font-medium">Description</th>
            <th className="py-2 px-3 font-medium">Created at</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.id} className="border-b border-aws-border hover:bg-aws-bg/50 transition-colors">
              <td className="py-2 px-3">
                <Link href={`/hosted-zones/${zone.id}`} className="text-aws-blue hover:underline">
                  {zone.name}
                </Link>
              </td>
              <td className="py-2 px-3">
                {zone.private_zone ? "Private" : "Public"}
              </td>
              <td className="py-2 px-3">{zone.resource_record_set_count}</td>
              <td className="py-2 px-3">{zone.comment || "-"}</td>
              <td className="py-2 px-3">{formatDate(zone.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
