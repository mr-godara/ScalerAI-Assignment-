"use client";

import { useState, useEffect } from "react";
import { useZones, useDeleteZone } from "@/lib/hooks/use-hosted-zones";
import { ZoneTable } from "@/components/hosted-zones/zone-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function HostedZonesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("any");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when type filter changes
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const { data, isLoading, refetch } = useZones({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    type: typeFilter !== "any" ? typeFilter : undefined,
  });

  const deleteZoneMutation = useDeleteZone();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [zonesToDelete, setZonesToDelete] = useState<string[]>([]);

  const handleDeleteSingle = (id: string) => {
    setZonesToDelete([id]);
    setDeleteModalOpen(true);
  };

  const handleDeleteSelected = (ids: string[]) => {
    setZonesToDelete(ids);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // If backend doesn't support bulk delete, we do it one by one
      // The API interface has deleteZone. If we want to delete multiple,
      // we might need to loop or call a bulk delete if it existed.
      // Since hostedZonesApi only has deleteZone, we will map over them.
      await Promise.all(zonesToDelete.map((id) => deleteZoneMutation.mutateAsync(id)));
      
      toast.success(
        zonesToDelete.length > 1
          ? "Hosted zones deleted successfully"
          : "Hosted zone deleted successfully"
      );
      setDeleteModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete hosted zone(s)");
    }
  };

  const totalItems = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hosted zones
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" disabled>
            Import zone
          </Button>
          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
            <Link href="/hosted-zones/new">Create hosted zone</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search hosted zones by name"
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            {totalItems === 1 ? "1 hosted zone" : `${totalItems} hosted zones`}
          </div>
        </div>

        {/* Table Area */}
        <div className="p-4">
          <ZoneTable
            data={data?.zones || []}
            isLoading={isLoading}
            onDeleteSelected={handleDeleteSelected}
            onDeleteSingle={handleDeleteSingle}
          />
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-b-md">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div>
                Showing {startItem}-{endItem} of {totalItems}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete hosted zone"
        message={
          <>
            Are you sure you want to delete {zonesToDelete.length === 1 ? "this hosted zone" : `these ${zonesToDelete.length} hosted zones`}? 
            This action cannot be undone. All associated DNS records must be deleted first.
          </>
        }
        onConfirm={confirmDelete}
        isLoading={deleteZoneMutation.isPending}
      />
    </div>
  );
}
