"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  isAllSelected: boolean;
  totalRecords: number;
  onConfirm: (ttl: number) => Promise<void>;
  isLoading: boolean;
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  isAllSelected,
  totalRecords,
  onConfirm,
  isLoading,
}: BulkEditModalProps) {
  const [ttl, setTtl] = useState<string>("300");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ttlNum = parseInt(ttl, 10);
    if (isNaN(ttlNum) || ttlNum < 0) return;
    await onConfirm(ttlNum);
    onClose();
  };

  const displayCount = isAllSelected ? totalRecords : selectedCount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bulk edit TTL</DialogTitle>
            <DialogDescription>
              Update the TTL (Time To Live) for {displayCount} selected record{displayCount === 1 ? "" : "s"}.
              Default NS and SOA records will be ignored.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ttl">TTL (seconds)</Label>
              <Input
                id="ttl"
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                min="0"
                step="1"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
