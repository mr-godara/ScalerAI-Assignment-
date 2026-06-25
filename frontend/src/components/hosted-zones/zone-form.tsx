"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zoneSchema, ZoneFormValues } from "@/lib/schemas/zone-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ZoneForm({ onSubmit, isPending }: { onSubmit: (data: ZoneFormValues) => void, isPending: boolean }) {
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: "",
      comment: "",
      privateZone: false,
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-lg font-medium text-slate-800 border-b pb-4">Hosted zone configuration</h2>
        
        {/* Domain Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Domain name</Label>
          <Input 
            id="name" 
            {...register("name")} 
            placeholder="e.g. example.com." 
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500">{errors.name.message}</p>
          )}
          <p className="text-xs text-slate-500">Enter the name of the domain for your hosted zone.</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="comment">Description - optional</Label>
          <Textarea 
            id="comment" 
            {...register("comment")} 
            placeholder="Enter a description" 
            rows={3}
            aria-describedby={errors.comment ? "comment-error" : undefined}
          />
          {errors.comment && (
            <p id="comment-error" className="text-sm text-red-500">{errors.comment.message}</p>
          )}
          <p className="text-xs text-slate-500">A description about this hosted zone.</p>
        </div>

        {/* Type */}
        <div className="space-y-3">
          <Label>Type</Label>
          <Controller
            control={control}
            name="privateZone"
            render={({ field }) => (
              <RadioGroup
                value={field.value ? "PRIVATE" : "PUBLIC"}
                onValueChange={(val) => field.onChange(val === "PRIVATE")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PUBLIC" id="public" />
                  <Label htmlFor="public" className="font-normal cursor-pointer text-slate-700">
                    <span className="font-medium text-slate-900 block">Public hosted zone</span>
                    <span className="text-sm text-slate-500">Determines how traffic is routed on the internet.</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <Label htmlFor="private" className="font-normal cursor-pointer text-slate-700">
                    <span className="font-medium text-slate-900 block">Private hosted zone</span>
                    <span className="text-sm text-slate-500">Determines how traffic is routed within Amazon VPCs.</span>
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending} 
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isPending ? "Creating..." : "Create hosted zone"}
        </Button>
      </div>
    </form>
  );
}
