"use client";

import { useState } from "react";
import {
  ColumnDef,
  RowSelectionState,
} from "@tanstack/react-table";
import { DNSRecord } from "@/types/api";
import { DataTable } from "@/components/common/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowUpDown, ChevronDown, ChevronRight, Lock, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { CopyButton } from "@/components/common/copy-button";
import { StatusBadge } from "@/components/common/status-badge";

interface RecordsTableProps {
  data: DNSRecord[];
  isLoading: boolean;
  zoneName: string;
  onEdit: (record: DNSRecord) => void;
  onDeleteSelected: (ids: string[], isAll: boolean) => void;
  onDeleteSingle: (id: string) => void;
  totalItems: number;
  isAllSelected: boolean;
  setIsAllSelected: (v: boolean) => void;
  rowSelection: RowSelectionState;
  setRowSelection: (updater: any) => void;
  onBulkEditTtl: (ids: string[], isAll: boolean) => void;
}

export function RecordsTable({
  data,
  isLoading,
  zoneName,
  onEdit,
  onDeleteSelected,
  onDeleteSingle,
  totalItems,
  isAllSelected,
  setIsAllSelected,
  rowSelection,
  setRowSelection,
  onBulkEditTtl,
}: RecordsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: ColumnDef<DNSRecord>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const isAllPageSelected = table.getIsAllPageRowsSelected();
        return (
          <Checkbox
            checked={isAllPageSelected}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (!value) setIsAllSelected(false);
            }}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        );
      },
      cell: ({ row }) => {
        const isProtected = row.original.type === "NS" || row.original.type === "SOA";
        return isProtected ? (
          <div className="w-4 flex justify-center translate-y-[2px]" title="Default records cannot be deleted">
            <Lock className="h-3 w-3 text-slate-400" />
          </div>
        ) : (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-slate-100 h-8"
          >
            Record name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const isExpanded = expandedRows[row.id];
        
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpanded(row.id);
              }}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <span
              className="text-[#0073BB] font-medium cursor-pointer"
              onClick={() => toggleRowExpanded(row.id)}
            >
              {name || zoneName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-slate-100 h-8"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <StatusBadge variant="record-type" type={type} />
        );
      },
    },
    {
      accessorKey: "routing_policy",
      header: "Routing policy",
      cell: ({ row }) => {
        const policy = row.getValue("routing_policy") as string;
        return <span className="capitalize">{policy.toLowerCase()}</span>;
      },
    },
    {
      accessorKey: "ttl",
      header: () => <div className="text-right">TTL (seconds)</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            {row.getValue("ttl")}
          </div>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value/Route traffic to",
      cell: ({ row }) => {
        const record = row.original;
        if (record.alias) {
          return <span className="text-slate-600 truncate max-w-[200px] inline-block">Alias to {record.alias_target}</span>;
        }
        const values = record.value || [];
        if (values.length === 0) return "-";
        
        return (
          <span className="text-slate-600 text-sm">
            {values[0]}
            {values.length > 1 && (
              <span className="ml-2 text-slate-400">+{values.length - 1} more</span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const record = row.original;
        const isProtected = record.type === "NS" || record.type === "SOA";
        
        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(record)}
              className="h-8 w-8 text-slate-500 hover:text-blue-600"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit record</span>
            </Button>
            {!isProtected && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteSingle(record.id)}
                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sticky Bulk Action Bar */}
      {/* Select All Banner */}
      {Object.keys(rowSelection).length === data.length && data.length < totalItems && !isAllSelected && (
        <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-slate-700">
          All {data.length} records on this page are selected. 
          <Button variant="link" className="px-2" onClick={() => setIsAllSelected(true)}>
            Select all {totalItems} records in zone
          </Button>
        </div>
      )}
      {isAllSelected && (
        <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-slate-700">
          All {totalItems} records in the zone are selected.
          <Button variant="link" className="px-2" onClick={() => {
            setIsAllSelected(false);
            setRowSelection({});
          }}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Sticky Bulk Action Bar */}
      {(Object.keys(rowSelection).length > 0 || isAllSelected) && (
        <div className="sticky top-0 z-10 flex items-center gap-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
            {isAllSelected ? totalItems : Object.keys(rowSelection).length} selected
          </Badge>
          <Button
            id="bulk-edit-ttl-btn"
            variant="outline"
            size="sm"
            onClick={() => {
              const selectedIds = isAllSelected ? [] : Object.keys(rowSelection).map(
                (index) => data[parseInt(index, 10)].id
              );
              onBulkEditTtl(selectedIds, isAllSelected);
            }}
          >
            Edit TTL
          </Button>
          <Button
            id="bulk-delete-btn"
            variant="destructive"
            size="sm"
            onClick={() => {
              const selectedIds = isAllSelected ? [] : Object.keys(rowSelection).map(
                (index) => data[parseInt(index, 10)].id
              );
              onDeleteSelected(selectedIds, isAllSelected);
            }}
          >
            Delete {isAllSelected ? totalItems : Object.keys(rowSelection).length} records
          </Button>
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        expanded={expandedRows}
        getRowCanExpand={() => true}
        renderSubComponent={({ row }) => {
          const record = row.original;
          return (
            <div className="p-6 bg-slate-50 border-l-4 border-l-blue-500">
              <div className="grid grid-cols-[200px_1fr] gap-4 mb-4">
                <div className="text-sm font-semibold text-slate-700">Value/Route traffic to</div>
                <div className="bg-slate-100 p-3 rounded-md border border-slate-200">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                    {record.alias ? `Alias to ${record.alias_target}` : (record.value || []).join("\n")}
                  </pre>
                </div>
              </div>
              
              {record.comment && (
                <div className="grid grid-cols-[200px_1fr] gap-4 mb-4">
                  <div className="text-sm font-semibold text-slate-700">Comment</div>
                  <div className="text-sm text-slate-600">
                    {record.comment}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
                  Edit record
                </Button>
                <CopyButton 
                  value={`arn:aws:route53:::hostedzone/${record.zone_id}/recordset/${record.id}`} 
                  variant="outline" 
                  size="sm" 
                  showText 
                />
              </div>
            </div>
          );
        }}
        emptyState={
          <EmptyState
            title="No records found"
            description="No DNS records match your filter criteria or this hosted zone is empty."
            icon={FileText}
          />
        }
      />
    </div>
  );
}
