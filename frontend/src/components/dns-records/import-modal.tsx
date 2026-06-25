"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportZoneFile } from "@/lib/hooks/use-dns-records";
import { UploadCloud, File, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
}

export function ImportModal({ isOpen, onClose, zoneId }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportZoneFile(zoneId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      const data = await importMutation.mutateAsync(file);
      setResult(data);
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} records`);
      }
      if (data.errors && data.errors.length > 0) {
        toast.warning(`Import completed with some errors or skipped records.`);
      }
    } catch (err: any) {
      // The hook handles toast for generic errors, but we can catch it here too
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import zone file</DialogTitle>
          <DialogDescription>
            Upload a standard BIND zone file to import DNS records into this hosted zone.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging ? "border-orange-500 bg-orange-50" : "border-slate-300 hover:border-slate-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.zone,text/plain"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <File className="h-10 w-10 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-slate-900">{file.name}</span>
                  <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-900">Click or drag file to this area to upload</p>
                  <p className="text-xs text-slate-500 mt-1">Supports standard BIND .zone or .txt files</p>
                </>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-3 rounded-md text-blue-800">
                <Info className="h-4 w-4 shrink-0" />
                <p>Default NS and SOA records in the zone file will be ignored to prevent conflicts.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-md bg-green-50 text-green-800 border border-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Import completed</p>
                <p className="text-sm">{result.imported} records imported, {result.skipped} skipped.</p>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Warnings and Errors
                </div>
                <div className="bg-slate-50 border rounded-md p-3 max-h-[150px] overflow-y-auto text-xs font-mono text-slate-600 space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
                Cancel
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white" 
                onClick={handleImport} 
                disabled={!file || importMutation.isPending}
              >
                {importMutation.isPending ? "Importing..." : "Import records"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
