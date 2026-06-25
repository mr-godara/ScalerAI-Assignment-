"use client";

import { useZones } from "@/lib/hooks/use-hosted-zones";
import Link from "next/link";
import { ZoneTable } from "@/components/hosted-zones/zone-table";

export default function HostedZonesPage() {
  const { data, isLoading, error } = useZones();
  const zones = data?.items || [];

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-aws-text">Hosted zones</h1>
        <Link
          href="/hosted-zones/new"
          className="bg-aws-orange hover:bg-aws-orange-dark text-aws-text font-medium py-1.5 px-4 rounded text-sm transition-colors"
        >
          Create hosted zone
        </Link>
      </div>

      <div className="bg-aws-white border border-aws-border rounded shadow-sm">
        <div className="p-4 border-b border-aws-border bg-aws-bg flex justify-between items-center">
          <h2 className="text-lg font-medium text-aws-text">Hosted zones</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="text-sm text-aws-text-secondary">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">Error loading hosted zones</div>
          ) : zones.length === 0 ? (
            <div className="text-sm text-aws-text-secondary">No hosted zones found.</div>
          ) : (
             <ZoneTable zones={zones} />
          )}
        </div>
      </div>
    </div>
  );
}
