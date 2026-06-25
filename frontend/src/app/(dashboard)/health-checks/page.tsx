import { ComingSoon } from "@/components/common/coming-soon";
import { HeartPulse } from "lucide-react";

export default function HealthChecksPage() {
  return (
    <div className="flex-1 p-6">
      <ComingSoon
        title="Health Checks"
        description="Monitor the health of your resources and route traffic away from unhealthy endpoints automatically."
        icon={<HeartPulse />}
      />
    </div>
  );
}
