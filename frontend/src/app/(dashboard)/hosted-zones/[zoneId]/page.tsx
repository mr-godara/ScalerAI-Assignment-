"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  useRecords,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useBulkDeleteRecords,
  useBulkUpdateRecords,
} from "@/lib/hooks/use-dns-records";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useZone, useDeleteZone, useUpdateZone } from "@/lib/hooks/use-hosted-zones";
import { RecordsTable } from "@/components/dns-records/records-table";
import { RecordModal } from "@/components/dns-records/record-modal";
import { ImportModal } from "@/components/dns-records/import-modal";
import { BulkEditModal } from "@/components/dns-records/bulk-edit-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dnsRecordsApi } from "@/lib/api/dns-records";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DNSRecord } from "@/types/api";
import { RowSelectionState } from "@tanstack/react-table";
import Link from "next/link";
import { CopyButton } from "@/components/common/copy-button";
import { getErrorMessage } from "@/lib/utils";

export default function ZoneDetailPage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const router = useRouter();
  const { zoneId } = use(params);

  // Zone Data
  const { data: zone, isLoading: isZoneLoading } = useZone(zoneId);
  const deleteZoneMutation = useDeleteZone();
  const updateZoneMutation = useUpdateZone();
  const [deleteZoneModalOpen, setDeleteZoneModalOpen] = useState(false);
  const [editZoneModalOpen, setEditZoneModalOpen] = useState(false);
  const [editZoneComment, setEditZoneComment] = useState("");
  const [editZoneType, setEditZoneType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Records Data
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("any");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTypeChange = (value: string | null) => {
    if (!value) return;
    setTypeFilter(value);
    setPage(1);
  };

  const { data: recordsData, isLoading: isRecordsLoading } = useRecords(zoneId, {
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    type: typeFilter !== "any" ? typeFilter : undefined,
  });

  // Mutations
  const createRecordMutation = useCreateRecord(zoneId);
  const updateRecordMutation = useUpdateRecord(zoneId);
  const deleteRecordMutation = useDeleteRecord(zoneId);
  const bulkDeleteMutation = useBulkDeleteRecords(zoneId);
  const bulkUpdateMutation = useBulkUpdateRecords(zoneId);

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | undefined>(undefined);
  
  const [deleteRecordModalOpen, setDeleteRecordModalOpen] = useState(false);
  const [recordsToDelete, setRecordsToDelete] = useState<string[]>([]);
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [recordsToUpdate, setRecordsToUpdate] = useState<string[]>([]);
  
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [isUpdateAll, setIsUpdateAll] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  // Handlers
  const handleCreateClick = () => {
    setEditingRecord(undefined);
    setIsRecordModalOpen(true);
  };

  const handleEditZoneClick = () => {
    setEditZoneComment(zone?.comment || "");
    setEditZoneType(zone?.type === "PRIVATE" ? "PRIVATE" : "PUBLIC");
    setEditZoneModalOpen(true);
  };

  const handleEditClick = (record: DNSRecord) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (data: Partial<DNSRecord>) => {
    try {
      if (editingRecord) {
        await updateRecordMutation.mutateAsync({ recordId: editingRecord.id, data });
        toast.success("Record updated successfully");
      } else {
        await createRecordMutation.mutateAsync(data);
        toast.success("Record created successfully");
      }
      setIsRecordModalOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save record"));
    }
  };

  const handleDeleteSingle = (id: string) => {
    setRecordsToDelete([id]);
    setDeleteRecordModalOpen(true);
  };

  const handleDeleteSelected = (ids: string[], isAll: boolean) => {
    setRecordsToDelete(ids);
    setIsDeleteAll(isAll);
    setDeleteRecordModalOpen(true);
  };
  
  const handleBulkEditTtl = (ids: string[], isAll: boolean) => {
    setRecordsToUpdate(ids);
    setIsUpdateAll(isAll);
    setIsBulkEditModalOpen(true);
  };
  
  const confirmBulkUpdateTtl = async (ttl: number) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids: recordsToUpdate, isAll: isUpdateAll, updates: { ttl } });
      setRowSelection({});
      setIsAllSelected(false);
    } catch {
      // Handled by hook
    }
  };

  const confirmDeleteRecords = async () => {
    try {
      if (isDeleteAll || recordsToDelete.length > 1) {
        if (!isDeleteAll && recordsToDelete.length >= 10) {
          // Chunk deletion to show progress
          setDeleteProgress({ current: 0, total: recordsToDelete.length });
          const chunkSize = 5;
          for (let i = 0; i < recordsToDelete.length; i += chunkSize) {
            const chunk = recordsToDelete.slice(i, i + chunkSize);
            await bulkDeleteMutation.mutateAsync({ ids: chunk, isAll: false });
            setDeleteProgress({ current: Math.min(i + chunkSize, recordsToDelete.length), total: recordsToDelete.length });
          }
        } else {
          await bulkDeleteMutation.mutateAsync({ ids: recordsToDelete, isAll: isDeleteAll });
        }
      } else if (recordsToDelete.length === 1) {
        await deleteRecordMutation.mutateAsync(recordsToDelete[0]);
      }
      
      toast.success(`Deleted ${isDeleteAll ? "all" : recordsToDelete.length} record(s)`);
      setDeleteRecordModalOpen(false);
      setDeleteProgress(null);
      setRowSelection({});
      setIsAllSelected(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete record(s)"));
      setDeleteProgress(null);
    }
  };

  const confirmDeleteZone = async () => {
    try {
      await deleteZoneMutation.mutateAsync(zoneId);
      toast.success("Hosted zone deleted successfully");
      router.push("/hosted-zones");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete hosted zone"));
      setDeleteZoneModalOpen(false);
    }
  };

  const handleUpdateZone = async () => {
    try {
      await updateZoneMutation.mutateAsync({
        id: zoneId,
        data: {
          comment: editZoneComment.trim() || undefined,
          type: editZoneType,
        },
      });
      setEditZoneModalOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update hosted zone"));
    }
  };

  useKeyboardShortcuts([
    {
      key: "n",
      action: handleCreateClick,
      description: "Create new record",
    },
    {
      key: "Delete",
      action: () => {
        if (Object.keys(recordsToDelete).length > 0 || (typeof window !== 'undefined' && document.querySelectorAll('[aria-selected="true"]').length > 0)) {
           // Find selected from DOM or wait, recordsToDelete isn't currently populated until "Delete selected" button is clicked in RecordsTable. 
           // In RecordsTable we don't expose rowSelection directly to this component. 
           // If we press Delete, we might not have the IDs here unless we lift rowSelection state up.
           // For simplicity, we can trigger the delete button in the UI if it's visible.
           const deleteBtn = document.getElementById('bulk-delete-btn');
           if (deleteBtn) deleteBtn.click();
        }
      },
      description: "Delete selected records",
    }
  ]);

  const totalItems = recordsData?.total || 0;
  const totalPages = recordsData?.total_pages || 1;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  if (isZoneLoading) {
    return <div className="p-8 text-slate-500">Loading hosted zone details...</div>;
  }

  if (!zone) {
    return <div className="p-8 text-red-500">Hosted zone not found.</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-blue-600 hover:underline mb-4">
        <Link href="/hosted-zones">Hosted zones</Link>
        <span className="text-slate-400 mx-2">&gt;</span>
        <span className="text-slate-600">{zone.name}</span>
      </div>

      {/* Zone Info Banner */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {zone.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={zone.type === "PUBLIC" ? "bg-green-100 text-green-800" : "bg-slate-100"}>
              {zone.type === "PUBLIC" ? "Public" : "Private"}
            </Badge>
            <Badge variant="outline" className="text-slate-600 bg-slate-50 font-mono flex items-center">
              {zone.id}
              <CopyButton value={zone.id} className="ml-1 h-5 w-5" />
            </Badge>
            <span className="text-sm text-slate-500">
              {zone.record_count} records
            </span>
          </div>
          {zone.comment && (
            <p className="text-sm text-slate-600">{zone.comment}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleEditZoneClick}>
            Edit
          </Button>
          <Button variant="outline" onClick={() => setDeleteZoneModalOpen(true)}>
            Delete zone
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList variant="line" className="bg-transparent border-b border-slate-200 w-full justify-start h-auto p-0 rounded-none gap-6">
          <TabsTrigger 
            value="records"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-1 py-3"
          >
            Records
          </TabsTrigger>
          <TabsTrigger 
            value="traffic"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-1 py-3"
          >
            Traffic policy instances
          </TabsTrigger>
          <TabsTrigger 
            value="tags"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-1 py-3"
          >
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6 space-y-4">
          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            {/* Action Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleCreateClick}>
                  Create record
                </Button>
                <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>Import zone file</Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })}>
                    Export <ChevronDown className="ml-2 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={async () => {
                      try {
                        const recordIds = isAllSelected ? [] : Object.keys(rowSelection).map(idx => recordsData?.records[parseInt(idx, 10)]?.id).filter(Boolean) as string[];
                        const blob = await dnsRecordsApi.downloadExport(zoneId, "json", recordIds);
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `zone-${zoneId}.json`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch {
                        toast.error("Failed to export zone as JSON");
                      }
                    }}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      try {
                        const recordIds = isAllSelected ? [] : Object.keys(rowSelection).map(idx => recordsData?.records[parseInt(idx, 10)]?.id).filter(Boolean) as string[];
                        const blob = await dnsRecordsApi.downloadExport(zoneId, "bind", recordIds);
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `zone-${zoneId}.zone`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch {
                        toast.error("Failed to export BIND zone file");
                      }
                    }}>
                      Export as BIND zone file
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search records by name or value"
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-[180px]">
                <Select value={typeFilter} onValueChange={handleTypeChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="p-4">
              <RecordsTable
                data={recordsData?.records || []}
                isLoading={isRecordsLoading}
                zoneName={zone.name}
                onEdit={handleEditClick}
                onDeleteSelected={handleDeleteSelected}
                onDeleteSingle={handleDeleteSingle}
                totalItems={totalItems}
                isAllSelected={isAllSelected}
                setIsAllSelected={setIsAllSelected}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                onBulkEditTtl={handleBulkEditTtl}
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
                      if (!val) return;
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
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
                      className="h-8 w-8 bg-white"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white"
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
        </TabsContent>
        <TabsContent value="traffic" className="p-8 text-center text-slate-500 border rounded-md mt-6">
          Traffic policy instances coming soon.
        </TabsContent>
        <TabsContent value="tags" className="p-8 text-center text-slate-500 border rounded-md mt-6">
          Tags management coming soon.
        </TabsContent>
      </Tabs>

      {/* Edit Hosted Zone Modal */}
      <Dialog open={editZoneModalOpen} onOpenChange={setEditZoneModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit hosted zone</DialogTitle>
            <DialogDescription>
              Update the hosted zone type and optional description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Domain name</Label>
              <Input id="zone-name" value={zone.name} disabled />
              <p className="text-xs text-slate-500">Hosted zone names cannot be changed after creation.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone-type">Type</Label>
              <Select
                value={editZoneType}
                onValueChange={(value) => {
                  if (value === "PUBLIC" || value === "PRIVATE") {
                    setEditZoneType(value);
                  }
                }}
              >
                <SelectTrigger id="zone-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public hosted zone</SelectItem>
                  <SelectItem value="PRIVATE">Private hosted zone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone-comment">Description - optional</Label>
              <Textarea
                id="zone-comment"
                value={editZoneComment}
                onChange={(event) => setEditZoneComment(event.target.value)}
                rows={3}
                maxLength={256}
                placeholder="Enter a description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditZoneModalOpen(false)}
              disabled={updateZoneMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleUpdateZone}
              disabled={updateZoneMutation.isPending}
            >
              {updateZoneMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        zoneName={zone.name}
        initialData={editingRecord}
        onSubmit={handleRecordSubmit}
        isLoading={createRecordMutation.isPending || updateRecordMutation.isPending}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        zoneId={zoneId}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={recordsToUpdate.length}
        isAllSelected={isUpdateAll}
        totalRecords={totalItems}
        onConfirm={confirmBulkUpdateTtl}
        isLoading={bulkUpdateMutation.isPending}
      />

      {/* Delete Record Modal */}
      <ConfirmModal
        isOpen={deleteRecordModalOpen}
        onClose={() => setDeleteRecordModalOpen(false)}
        title={`Delete record${isDeleteAll || recordsToDelete.length > 1 ? "s" : ""}`}
        message={
          deleteProgress ? (
            <div className="space-y-2">
              <p>Deleting {deleteProgress.current} of {deleteProgress.total} records...</p>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-orange-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              Are you sure you want to delete {isDeleteAll ? `all ${totalItems} records` : (recordsToDelete.length === 1 ? "this record" : `these ${recordsToDelete.length} records`)}? 
              This action cannot be undone and may impact traffic to your resources.
            </>
          )
        }
        onConfirm={confirmDeleteRecords}
        isLoading={deleteRecordMutation.isPending || bulkDeleteMutation.isPending}
      />

      {/* Delete Zone Modal */}
      <ConfirmModal
        isOpen={deleteZoneModalOpen}
        onClose={() => setDeleteZoneModalOpen(false)}
        title="Delete hosted zone"
        message={
          <>
            Are you sure you want to delete <strong>{zone.name}</strong>? 
            This action cannot be undone. All custom DNS records must be deleted first.
          </>
        }
        onConfirm={confirmDeleteZone}
        isLoading={deleteZoneMutation.isPending}
      />
    </div>
  );
}
