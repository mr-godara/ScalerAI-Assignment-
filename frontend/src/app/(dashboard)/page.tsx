"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { hostedZonesApi } from "@/lib/api/hosted-zones";
import { 
  Plus, 
  Globe, 
  Server, 
  Database, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hosted-zones", "dashboard"],
    queryFn: () => hostedZonesApi.getZones({ page: 1, page_size: 50 }),
  });

  const totalZones = data?.total || 0;
  const totalRecords = data?.zones?.reduce((sum, zone) => sum + zone.record_count, 0) || 0;
  
  const publicZones = data?.zones?.filter(z => z.type === "PUBLIC").length || 0;
  const privateZones = data?.zones?.filter(z => z.type === "PRIVATE").length || 0;
  
  // Format based on what's available
  let zoneTypesText = "Public & Private";
  if (data?.zones) {
    if (publicZones > 0 && privateZones > 0) zoneTypesText = `${publicZones} Public, ${privateZones} Private`;
    else if (publicZones > 0) zoneTypesText = `${publicZones} Public`;
    else if (privateZones > 0) zoneTypesText = `${privateZones} Private`;
    else zoneTypesText = "None";
  }

  const recentZones = data?.zones?.slice(0, 5) || [];

  return (
    <div className="flex flex-col space-y-8 mt-2">
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">Welcome to Route53 Clone</h1>
        <p className="text-slate-400 mt-2">Manage your Domain Name System (DNS) resources.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : isError ? (
        <div className="bg-red-900/20 border border-red-500 p-4 rounded-md flex items-start text-red-200">
          <AlertCircle className="mr-3 mt-0.5 text-red-400 shrink-0" size={20} />
          <div>
            <h3 className="font-medium">Error loading dashboard data</h3>
            <p className="text-sm mt-1">{error?.message || "An unexpected error occurred"}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col">
              <div className="flex items-center text-slate-400 mb-4">
                <Globe className="mr-2" size={20} />
                <h3 className="font-medium">Hosted Zones</h3>
              </div>
              <div className="text-4xl font-bold text-slate-100">{totalZones}</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col">
              <div className="flex items-center text-slate-400 mb-4">
                <Database className="mr-2" size={20} />
                <h3 className="font-medium">DNS Records</h3>
              </div>
              <div className="text-4xl font-bold text-slate-100">{totalRecords}</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col">
              <div className="flex items-center text-slate-400 mb-4">
                <Server className="mr-2" size={20} />
                <h3 className="font-medium">Zone Types</h3>
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{zoneTypesText}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-medium text-slate-100">Recent Hosted Zones</h2>
              
              {recentZones.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <Globe className="mx-auto text-slate-500 mb-4" size={32} />
                  <h3 className="text-lg font-medium text-slate-300">No hosted zones</h3>
                  <p className="text-slate-400 mt-2 mb-6">Create a hosted zone to start routing traffic for your domain.</p>
                  <Link href="/hosted-zones/new">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create hosted zone
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="px-6 py-3 font-medium">Domain Name</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Records</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {recentZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-blue-400">
                            <Link href={`/hosted-zones/${zone.id}`} className="hover:underline">
                              {zone.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{zone.type}</td>
                          <td className="px-6 py-4 text-slate-300">{zone.record_count}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/hosted-zones/${zone.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-700 text-right">
                    <Link href="/hosted-zones" className="text-sm text-blue-400 hover:underline inline-flex items-center">
                      View all hosted zones
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-medium text-slate-100">Quick Actions</h2>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-1">
                <Link href="/hosted-zones/new" className="flex items-center px-4 py-3 hover:bg-slate-700 rounded-md transition-colors text-slate-200">
                  <div className="bg-blue-500/20 p-2 rounded-md mr-3">
                    <Plus className="text-blue-400" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create hosted zone</div>
                    <div className="text-xs text-slate-400">Route internet traffic to your resources</div>
                  </div>
                </Link>
                <Link href="/hosted-zones" className="flex items-center px-4 py-3 hover:bg-slate-700 rounded-md transition-colors text-slate-200 mt-1">
                  <div className="bg-orange-500/20 p-2 rounded-md mr-3">
                    <Globe className="text-orange-400" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">View hosted zones</div>
                    <div className="text-xs text-slate-400">Manage your existing domains</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
