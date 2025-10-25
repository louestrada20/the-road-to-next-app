"use client";

import { useEffect, useState } from "react";

type DeprovisioningCountdownProps = {
  scheduledDate: Date;
  urgencyLevel: "info" | "warning" | "critical";
};

export const DeprovisioningCountdown = ({
  scheduledDate,
  urgencyLevel,
}: DeprovisioningCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const scheduled = new Date(scheduledDate);
      const diffMs = scheduled.getTime() - now.getTime();

      if (diffMs <= 0) {
        return "now";
      }

      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (days > 1) {
        return `${days} days`;
      } else if (days === 1) {
        return "1 day";
      } else {
        return "today";
      }
    };

    const updateTime = () => setTimeRemaining(calculateTimeRemaining());
    
    // Initial calculation
    updateTime();

    // Update every hour (no need for minute precision)
    const interval = setInterval(updateTime, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, [scheduledDate]);

  const colorClass = {
    info: "text-blue-700",
    warning: "text-orange-700",
    critical: "text-red-700",
  }[urgencyLevel];

  return (
    <span className={`font-semibold ${colorClass}`}>
      {timeRemaining || "Calculating..."}
    </span>
  );
};

