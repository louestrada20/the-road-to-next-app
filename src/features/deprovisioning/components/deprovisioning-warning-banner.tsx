import { LucideAlertCircle, LucideAlertOctagon, LucideAlertTriangle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { pricingPath } from "@/paths";
import { getPendingDeprovisioningsForUI } from "../queries/get-pending-deprovisionings-for-ui";
import { DeprovisioningCountdown } from "./deprovisioning-countdown";
import { DeprovisioningUserList } from "./deprovisioning-user-list";

type DeprovisioningWarningBannerProps = {
  organizationId: string;
};

export const DeprovisioningWarningBanner = async ({
  organizationId,
}: DeprovisioningWarningBannerProps) => {
  const data = await getPendingDeprovisioningsForUI(organizationId);

  // No pending deprovisionings, don't show banner
  if (!data) {
    return null;
  }

  const { count, scheduledDate, urgencyLevel, queueEntries } = data;

  // Check if scheduled date has passed
  const now = new Date();
  const scheduledDate = new Date(data.scheduledDate);
  const hasPassed = scheduledDate.getTime() <= now.getTime();

  // Determine styling based on urgency
  const config = {
    info: {
      bgClass: "bg-blue-50 border-blue-500",
      Icon: LucideAlertCircle,
      iconClass: "text-blue-600",
      title: "Plan Downgrade Notice",
      message: hasPassed 
        ? `${count} member${count !== 1 ? "s" : ""} are being removed`
        : `Your plan has been downgraded. ${count} member${count !== 1 ? "s" : ""} will be removed in`,
    },
    warning: {
      bgClass: "bg-orange-50 border-orange-500",
      Icon: LucideAlertTriangle,
      iconClass: "text-orange-600",
      title: "Action Needed!",
      message: hasPassed 
        ? `${count} member${count !== 1 ? "s" : ""} are being removed`
        : `${count} member${count !== 1 ? "s" : ""} will be removed in`,
    },
    critical: {
      bgClass: "bg-red-50 border-red-500",
      Icon: LucideAlertOctagon,
      iconClass: "text-red-600",
      title: "Final Notice!",
      message: hasPassed 
        ? `${count} member${count !== 1 ? "s" : ""} are being removed`
        : `${count} member${count !== 1 ? "s" : ""} will be removed in`,
    },
  }[urgencyLevel];

  const { Icon } = config;

  return (
    <Alert className={`${config.bgClass} border-l-4`}>
      <Icon className={`h-5 w-5 ${config.iconClass}`} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{config.title}</span>
        <div className="flex items-center gap-x-2">
          <Button asChild size="sm" variant={urgencyLevel === "critical" ? "destructive" : "default"}>
            <Link href={pricingPath()}>
              Upgrade Now
            </Link>
          </Button>
        </div>
      </div>
      <AlertDescription className="mt-2 space-y-3">
        <div className="text-sm">
          {config.message}
          {!hasPassed && (
            <>
              {" "}
              <DeprovisioningCountdown
                scheduledDate={scheduledDate}
                urgencyLevel={urgencyLevel}
              />
            </>
          )}
        </div>
        
        <div className="text-xs text-gray-600">
          Scheduled removal date:{" "}
          <span className="font-medium">
            {scheduledDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        </div>

        <DeprovisioningUserList users={queueEntries} urgencyLevel={urgencyLevel} />

        <div className="pt-2 text-xs text-gray-600 border-t">
          <strong>What happens:</strong> Affected members will lose access to this organization. 
          Their tickets and comments will be preserved. Members can be reactivated if you upgrade your plan.
        </div>
      </AlertDescription>
    </Alert>
  );
};

