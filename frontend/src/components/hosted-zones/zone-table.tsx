"use client";

import { useState } from "react";
import {
  ColumnDef,
  RowSelectionState,
} from "@tanstack/react-table";
import { HostedZone } from "@/types/api";
import { DataTable } from "@/components/common/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Eye, Trash2, ArrowUpDown, Globe } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/common/empty-state";

interface ZoneTableProps {
  data: HostedZone[];
  isLoading: boolean;
  onDeleteSelected: (ids: string[]) => void;
  onDeleteSingle: (id: string) => void;
}

export function ZoneTable({
  data,
  isLoading,
  onDeleteSelected,
  onDeleteSingle,
}: ZoneTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns: ColumnDef<HostedZone>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
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
            Domain name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <Link
            href={`/hosted-zones/${row.original.id}`}
            className="text-blue-600 hover:text-orange-500 hover:underline font-medium"
          >
            {name}
          </Link>
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
          <StatusBadge variant={type === "PUBLIC" ? "public" : "private"} />
        );
      },
    },
    {
      accessorKey: "record_count",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-mr-4 hover:bg-slate-100 h-8"
            >
              Record count
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium pr-4">
            {row.getValue("record_count")}
          </div>
        );
      },
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => {
        const comment = row.getValue("comment") as string;
        return (
          <span className="text-gray-500 truncate max-w-[200px] inline-block">
            {comment || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-slate-100 h-8"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <span className="text-gray-600 text-sm">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const zone = row.original;
        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link 
              href={`/hosted-zones/${zone.id}`}
              className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-gray-500 hover:text-blue-600" })}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View details</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteSingle(zone.id)}
              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
            {Object.keys(rowSelection).length} selected
          </Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const selectedIds = Object.keys(rowSelection).map(
                (index) => data[parseInt(index, 10)].id
              );
              onDeleteSelected(selectedIds);
              setRowSelection({});
            }}
          >
            Delete selected
          </Button>
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        emptyState={
          <EmptyState
            title="No hosted zones"
            description="You haven't created any hosted zones yet. Create a hosted zone to start routing traffic for your domain."
            icon={Globe}
          />
        }
      />
    </div>
  );
}
