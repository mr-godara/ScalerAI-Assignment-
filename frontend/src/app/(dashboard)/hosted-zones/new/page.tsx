"use client";

import { ZoneForm } from "@/components/hosted-zones/zone-form";
import { useCreateZone } from "@/lib/hooks/use-hosted-zones";
import { useRouter } from "next/navigation";

export default function CreateHostedZonePage() {
  const createMutation = useCreateZone();
  const router = useRouter();

  return (
    <div className="p-0 max-w-4xl">
      <h1 className="text-2xl font-semibold text-aws-text mb-6">Create hosted zone</h1>
      <ZoneForm
        isPending={createMutation.isPending}
        onSubmit={(data) => {
          createMutation.mutate({
            name: data.name,
            comment: data.comment,
            type: data.privateZone ? "PRIVATE" : "PUBLIC"
          }, {
            onSuccess: () => {
              router.push("/hosted-zones");
            },
          });
        }}
      />
    </div>
  );
}
