"use client";

import { useZone } from "@/lib/hooks/use-hosted-zones";
import { useRecords } from "@/lib/hooks/use-dns-records";
import { RecordTable } from "@/components/dns-records/record-table";
import { useParams } from "next/navigation";

export default function HostedZoneDetailPage() {
  const { zoneId } = useParams() as { zoneId: string };
  const { data: zone, isLoading: zoneLoading } = useZone(zoneId);
  const { data: recordsData, isLoading: recordsLoading } = useRecords(zoneId);
  const records = recordsData?.items || [];

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-aws-text">{zone?.name || "Hosted zone details"}</h1>
      </div>

      <div className="bg-aws-white border border-aws-border rounded shadow-sm">
        <div className="p-4 border-b border-aws-border bg-aws-bg flex justify-between items-center">
          <h2 className="text-lg font-medium text-aws-text">Records</h2>
          <button className="bg-aws-orange hover:bg-aws-orange-dark text-aws-text font-medium py-1.5 px-4 rounded text-sm transition-colors">
            Create record
          </button>
        </div>
        <div className="p-4">
          {recordsLoading ? (
            <div className="text-sm text-aws-text-secondary">Loading records...</div>
          ) : (
             <RecordTable records={records} zoneId={zoneId} />
          )}
        </div>
      </div>
    </div>
  );
}
