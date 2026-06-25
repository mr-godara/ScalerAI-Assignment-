import { ComingSoon } from "@/components/common/coming-soon";
import { User } from "lucide-react";

export default function ProfilesPage() {
  return (
    <div className="flex-1 p-6">
      <ComingSoon
        title="Profiles"
        description="Share Route 53 configurations across VPCs and AWS accounts using Route 53 Profiles."
        icon={<User />}
      />
    </div>
  );
}
