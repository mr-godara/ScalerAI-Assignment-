import { ComingSoon } from "@/components/common/coming-soon";
import { Search } from "lucide-react";

export default function ResolverPage() {
  return (
    <div className="flex-1 p-6">
      <ComingSoon
        title="Resolver"
        description="Configure Route 53 Resolver to forward DNS queries between your VPCs and your network."
        icon={<Search />}
      />
    </div>
  );
}
