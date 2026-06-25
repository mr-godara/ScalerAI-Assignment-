"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
  OnChangeFn,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTable } from "./skeleton-table";
import React from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  expanded?: Record<string, boolean>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyState,
  rowSelection,
  onRowSelectionChange,
  renderSubComponent,
  getRowCanExpand,
  expanded = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getRowCanExpand,
    state: {
      rowSelection,
      sorting,
      expanded,
    },
    onRowSelectionChange,
  });

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table aria-label="Data table">
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-slate-50 border-slate-200">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="h-10 px-4 text-xs font-semibold text-slate-500 tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody aria-busy={isLoading}>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <SkeletonTable columns={columns.length} rows={5} />
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-blue-50 border-b border-slate-200 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4 text-sm text-slate-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && renderSubComponent && (
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b border-slate-200">
                      {renderSubComponent({ row })}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center bg-white">
                {emptyState || "No results."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
