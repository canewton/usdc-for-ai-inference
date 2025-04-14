import React from "react";

import { WebAnalytics } from "@/components/usdc-insights/web-analytics";

export default function AdminPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="m-20 max-w-[1170px] w-full">
        <h1 className="text-3xl font-semibold mb-10">Admin Dashboard</h1>
        <WebAnalytics />
      </div>
    </div>
  );
}
