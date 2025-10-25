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
        return "Removal in progress";
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 1) {
        return `${days} days, ${hours} hours`;
      } else if (days === 1) {
        return `1 day, ${hours} hours`;
      } else if (hours > 0) {
        return `${hours} hours, ${minutes} minutes`;
      } else {
        return `${minutes} minutes`;
      }
    };

    const updateTime = () => setTimeRemaining(calculateTimeRemaining());
    
    // Initial calculation
    updateTime();

    // Update every minute for accurate countdown
    const interval = setInterval(updateTime, 60000); // Update every minute

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

