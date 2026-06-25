"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DNSRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

// Form Schema
const recordSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]),
  alias: z.boolean().default(false),
  alias_target: z.string().optional(),
  ttl: z.number().min(0),
  ttlUnit: z.enum(["seconds", "minutes", "hours", "days"]).default("seconds"),
  routing_policy: z.string().default("Simple"),
  comment: z.string().max(256).optional(),
  
  // Dynamic fields
  value_textarea: z.string().optional(),
  value_single: z.string().optional(),
  value_mx: z.array(z.object({ priority: z.string(), hostname: z.string() })).optional(),
  value_srv: z.array(z.object({ priority: z.string(), weight: z.string(), port: z.string(), target: z.string() })).optional(),
  value_caa: z.array(z.object({ flags: z.string(), tag: z.string(), value: z.string() })).optional(),
}).refine(data => {
  if (data.alias && !data.alias_target) return false;
  return true;
}, { message: "Alias target is required when alias is true", path: ["alias_target"] });

type FormValues = z.infer<typeof recordSchema>;

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  initialData?: DNSRecord;
  onSubmit: (data: Partial<DNSRecord>) => void;
  isLoading?: boolean;
}

const getTTLAndUnit = (ttlSeconds: number): { ttl: number; ttlUnit: "seconds" | "minutes" | "hours" | "days" } => {
  if (ttlSeconds === 0) return { ttl: 0, ttlUnit: "seconds" };
  if (ttlSeconds % 86400 === 0) return { ttl: ttlSeconds / 86400, ttlUnit: "days" };
  if (ttlSeconds % 3600 === 0) return { ttl: ttlSeconds / 3600, ttlUnit: "hours" };
  if (ttlSeconds % 60 === 0) return { ttl: ttlSeconds / 60, ttlUnit: "minutes" };
  return { ttl: ttlSeconds, ttlUnit: "seconds" };
};

const getSeconds = (ttl: number, unit: "seconds" | "minutes" | "hours" | "days") => {
  switch (unit) {
    case "days": return ttl * 86400;
    case "hours": return ttl * 3600;
    case "minutes": return ttl * 60;
    default: return ttl;
  }
};

export function RecordModal({
  isOpen,
  onClose,
  zoneName,
  initialData,
  onSubmit,
  isLoading,
}: RecordModalProps) {
  const isEditing = !!initialData;

  const defaultValues: FormValues = {
    name: "",
    type: "A",
    alias: false,
    alias_target: "",
    ttl: 300,
    ttlUnit: "seconds",
    routing_policy: "Simple",
    comment: "",
    value_textarea: "",
    value_single: "",
    value_mx: [{ priority: "10", hostname: "" }],
    value_srv: [{ priority: "10", weight: "10", port: "80", target: "" }],
    value_caa: [{ flags: "0", tag: "issue", value: "" }],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues,
  });

  const { control, handleSubmit, watch, reset, register, setValue } = form;
  const type = watch("type");
  const alias = watch("alias");

  // Arrays for MX, SRV, CAA
  const { fields: mxFields, append: appendMx, remove: removeMx } = useFieldArray({ control, name: "value_mx" });
  const { fields: srvFields, append: appendSrv, remove: removeSrv } = useFieldArray({ control, name: "value_srv" });
  const { fields: caaFields, append: appendCaa, remove: removeCaa } = useFieldArray({ control, name: "value_caa" });

  useEffect(() => {
    if (isOpen && initialData) {
      const { ttl, ttlUnit } = getTTLAndUnit(initialData.ttl);
      
      const formValues: any = {
        name: initialData.name.replace(`.${zoneName}`, ""),
        type: initialData.type,
        alias: initialData.alias,
        alias_target: initialData.alias_target || "",
        ttl,
        ttlUnit,
        routing_policy: initialData.routing_policy,
        comment: initialData.comment || "",
      };

      if (!initialData.alias && initialData.value) {
        if (["A", "AAAA", "TXT", "NS", "PTR"].includes(initialData.type)) {
          formValues.value_textarea = initialData.value.join("\n");
        } else if (initialData.type === "CNAME") {
          formValues.value_single = initialData.value[0];
        } else if (initialData.type === "MX") {
          formValues.value_mx = initialData.value.map(v => {
            const [p, h] = v.split(" ");
            return { priority: p, hostname: h };
          });
        } else if (initialData.type === "SRV") {
          formValues.value_srv = initialData.value.map(v => {
            const [p, w, port, t] = v.split(" ");
            return { priority: p, weight: w, port: port, target: t };
          });
        } else if (initialData.type === "CAA") {
          formValues.value_caa = initialData.value.map(v => {
            const [f, t, val] = v.split(" ");
            return { flags: f, tag: t, value: val };
          });
        }
      }
      reset(formValues);
    } else if (isOpen && !initialData) {
      reset(defaultValues);
    }
  }, [isOpen, initialData, zoneName, reset]);

  const onFormSubmit = (data: FormValues) => {
    // Transform to DNSRecord format
    let finalValue: string[] = [];

    if (!data.alias) {
      if (["A", "AAAA", "TXT", "NS", "PTR"].includes(data.type)) {
        finalValue = (data.value_textarea || "").split("\n").map(s => s.trim()).filter(Boolean);
      } else if (data.type === "CNAME") {
        finalValue = [data.value_single?.trim() || ""];
      } else if (data.type === "MX") {
        finalValue = (data.value_mx || []).map(m => `${m.priority} ${m.hostname.trim()}`);
      } else if (data.type === "SRV") {
        finalValue = (data.value_srv || []).map(s => `${s.priority} ${s.weight} ${s.port} ${s.target.trim()}`);
      } else if (data.type === "CAA") {
        finalValue = (data.value_caa || []).map(c => `${c.flags} ${c.tag} ${c.value.trim()}`);
      }
    }

    const payload: Partial<DNSRecord> = {
      name: data.name, // The backend usually expects relative or absolute. If absolute, we might append zoneName.
      type: data.type,
      ttl: getSeconds(data.ttl, data.ttlUnit),
      routing_policy: data.routing_policy,
      alias: data.alias,
      alias_target: data.alias ? data.alias_target : undefined,
      comment: data.comment,
      value: data.alias ? undefined : finalValue,
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit record" : "Quick create record"}
          </DialogTitle>
        </DialogHeader>

        <form id="record-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-4">
          
          {/* Record Name */}
          <div className="space-y-2">
            <Label>Record name</Label>
            <div className="flex items-center">
              <Input
                {...register("name")}
                aria-describedby={form.formState.errors.name ? "name-error" : undefined}
                className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="e.g. www"
              />
              <div className="bg-slate-100 border border-slate-200 border-l-0 rounded-r-md px-3 h-10 flex items-center text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                .{zoneName}
              </div>
            </div>
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Record Type & Alias */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Record type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => {
                    field.onChange(val);
                    if (val === "CNAME") setValue("alias", false); // CNAME cannot be alias at apex in real AWS, but here we just reset.
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"].map(t => (
                        <SelectItem key={t} value={t} disabled={t === "SOA"}>
                          {t} - {getTypeDescription(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Alias</Label>
              <div className="h-10 flex items-center gap-3">
                <Controller
                  control={control}
                  name="alias"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-slate-600">Route traffic to an AWS resource</span>
              </div>
            </div>
          </div>

          {alias ? (
            <div className="space-y-2 bg-blue-50/50 p-4 rounded-md border border-blue-100">
              <Label>Route traffic to</Label>
              <Input {...register("alias_target")} aria-describedby={form.formState.errors.alias_target ? "alias-error" : undefined} placeholder="e.g. s3-website-us-east-1.amazonaws.com" />
              {form.formState.errors.alias_target && (
                <p id="alias-error" className="text-sm text-red-500">{form.formState.errors.alias_target.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Value</Label>
              {["A", "AAAA", "TXT", "NS", "PTR"].includes(type) && (
                <div>
                  <Textarea
                    {...register("value_textarea")}
                    rows={4}
                    className="font-mono text-sm"
                    placeholder={
                      type === "TXT" 
                        ? '"Sample Text"\n"Another line"' 
                        : type === "A" 
                        ? "192.0.2.1\n192.0.2.2" 
                        : "Enter one value per line"
                    }
                  />
                  {type === "TXT" && <p className="text-xs text-slate-500 mt-1">Enclose text in quotation marks (" ").</p>}
                </div>
              )}
              {type === "CNAME" && (
                <Input {...register("value_single")} placeholder="e.g. server1.example.com" />
              )}
              {type === "MX" && (
                <div className="space-y-2">
                  {mxFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input {...register(`value_mx.${index}.priority`)} placeholder="Priority (e.g. 10)" className="w-24" />
                      <Input {...register(`value_mx.${index}.hostname`)} placeholder="Mail server (e.g. mail.example.com)" className="flex-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMx(index)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendMx({ priority: "10", hostname: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add MX Record
                  </Button>
                </div>
              )}
              {type === "SRV" && (
                <div className="space-y-2">
                  {srvFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input {...register(`value_srv.${index}.priority`)} placeholder="Priority" className="w-20" />
                      <Input {...register(`value_srv.${index}.weight`)} placeholder="Weight" className="w-20" />
                      <Input {...register(`value_srv.${index}.port`)} placeholder="Port" className="w-20" />
                      <Input {...register(`value_srv.${index}.target`)} placeholder="Target" className="flex-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSrv(index)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendSrv({ priority: "10", weight: "10", port: "80", target: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add SRV Record
                  </Button>
                </div>
              )}
              {type === "CAA" && (
                <div className="space-y-2">
                  {caaFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input {...register(`value_caa.${index}.flags`)} placeholder="Flags" className="w-20" />
                      <Input {...register(`value_caa.${index}.tag`)} placeholder="Tag" className="w-24" />
                      <Input {...register(`value_caa.${index}.value`)} placeholder="Value" className="flex-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCaa(index)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCaa({ flags: "0", tag: "issue", value: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add CAA Record
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TTL */}
          <div className="space-y-2">
            <Label>TTL (Time to live)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                {...register("ttl", { valueAsNumber: true })}
                className="w-24"
                min={0}
              />
              <Controller
                control={control}
                name="ttlUnit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Routing Policy */}
          <div className="space-y-2">
            <Label>Routing policy</Label>
            <Controller
              control={control}
              name="routing_policy"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple routing</SelectItem>
                    <SelectItem value="Weighted" disabled>Weighted (Pro)</SelectItem>
                    <SelectItem value="Geolocation" disabled>Geolocation (Pro)</SelectItem>
                    <SelectItem value="Latency" disabled>Latency (Pro)</SelectItem>
                    <SelectItem value="Failover" disabled>Failover (Pro)</SelectItem>
                    <SelectItem value="Multivalue" disabled>Multivalue answer (Pro)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Comment - optional</Label>
            <Textarea {...register("comment")} placeholder="Enter a comment" rows={2} />
          </div>

        </form>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="record-form" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isLoading ? "Saving..." : isEditing ? "Save changes" : "Create records"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getTypeDescription(type: string) {
  switch(type) {
    case "A": return "Routes traffic to an IPv4 address";
    case "AAAA": return "Routes traffic to an IPv6 address";
    case "CNAME": return "Routes traffic to another domain name";
    case "MX": return "Specifies mail servers";
    case "TXT": return "Contains text or policy data";
    case "NS": return "Nameservers for a hosted zone";
    case "PTR": return "Routes an IP to a hostname";
    case "SRV": return "Service locator";
    case "CAA": return "Certificate Authority Authorization";
    case "SOA": return "Start of Authority";
    default: return "";
  }
}
