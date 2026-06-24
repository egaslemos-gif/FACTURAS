"use client";

import { useEffect } from "react";
import { EngagementTracker } from "@/lib/engagement/engagementTracker";

interface ViewTrackerProps {
  quotationId: string;
}

export default function ViewTracker({ quotationId }: ViewTrackerProps) {
  useEffect(() => {
    if (quotationId) {
      EngagementTracker.trackView(quotationId);
    }
  }, [quotationId]);

  return null;
}
