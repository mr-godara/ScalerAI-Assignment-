import { ComingSoon } from "@/components/common/coming-soon";
import { GitBranch } from "lucide-react";

export default function TrafficPoliciesPage() {
  return (
    <div className="flex-1 p-6">
      <ComingSoon
        title="Traffic Policies"
        description="Create and manage traffic flow policies to route end users to the best endpoint for your application based on geo-proximity, latency, and health."
        icon={<GitBranch />}
      />
    </div>
  );
}
