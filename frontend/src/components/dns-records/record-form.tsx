"use client";

import { RecordFormValues } from "@/lib/schemas/record-schema";

export function RecordForm({ onSubmit: _onSubmit, isPending: _isPending }: { onSubmit: (data: RecordFormValues) => void, isPending: boolean }) {
  void _onSubmit;
  void _isPending;
  return (
    <div className="p-4 border border-aws-border rounded bg-aws-white">
      <p className="text-sm text-aws-text-secondary mb-4">Record Form placeholder</p>
    </div>
  );
}
