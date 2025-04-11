import React from 'react';

import { WebAnalytics } from '@/components/usdc-insights/web-analytics';

export default function AdminPage() {
  return (
    <div className="m-20">
      <h1 className="text-3xl font-semibold mb-10">Admin Dashboard</h1>
      <WebAnalytics />
    </div>
  );
}
