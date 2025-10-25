"use client";

import { LucideChevronDown, LucideChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeprovisioningUserListProps = {
  users: Array<{
    user: {
      username: string;
      email: string;
    };
    membership: {
      membershipRole: string;
      joinedAt: Date;
    } | null;
  }>;
  urgencyLevel: "info" | "warning" | "critical";
};

export const DeprovisioningUserList = ({
  users,
  urgencyLevel,
}: DeprovisioningUserListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const borderClass = {
    info: "border-blue-200 bg-blue-100/50",
    warning: "border-orange-200 bg-orange-100/50",
    critical: "border-red-200 bg-red-100/50",
  }[urgencyLevel];

  const previewUsers = users.slice(0, 3);
  const remainingCount = users.length - 3;

  return (
    <div className={`rounded-md border p-3 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Affected Members ({users.length})</span>
        {users.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? (
              <>
                <LucideChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <LucideChevronDown className="h-3 w-3 mr-1" />
                Show All
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {(isExpanded ? users : previewUsers).map((entry) => (
          <div
            key={entry.user.email}
            className="text-xs flex justify-between items-center py-1"
          >
            <div>
              <span className="font-medium">{entry.user.username}</span>
              <span className="text-gray-600 ml-2">({entry.user.email})</span>
            </div>
            <div className="text-gray-500 text-[10px]">
              {entry.membership?.membershipRole || "N/A"}
              {entry.membership?.joinedAt && (
                <span className="ml-2">
                  Joined {new Date(entry.membership.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
        ))}

        {!isExpanded && remainingCount > 0 && (
          <div className="text-xs text-gray-600 italic pt-1">
            and {remainingCount} more...
          </div>
        )}
      </div>
    </div>
  );
};

