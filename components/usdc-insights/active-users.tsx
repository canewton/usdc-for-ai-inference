'use client';

import { TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

import { InsightBox } from './insight-box';
import type { TimePeriod } from './time-period-options';
import { TimePeriodOptions } from './time-period-options';

export const ActiveUsers = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7D');
  const supabase = createClient();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const [activeUsers, setActiveUsers] = useState<any>();

  async function fetchActiveUsers() {
    const { count: activeThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', oneWeekAgo.toISOString());

    const { count: activeThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', oneMonthAgo.toISOString());

    const { count: activeLastThreeMonths } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', threeMonthsAgo.toISOString());

    const { count: activeLastYear } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', oneYearAgo.toISOString());

    setActiveUsers({
      '7D': activeThisWeek,
      '1M': activeThisMonth,
      '3M': activeLastThreeMonths,
      '1Y': activeLastYear,
    });
  }

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  return (
    <InsightBox>
      <div className="flex justify-between items-center mb-6">
        <h3>Active Users</h3>
        <TimePeriodOptions
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
        />
      </div>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 py-12">
          <TrendingUp className="w-8 h-8 text-blue-500" strokeWidth={2} />
          <span className="text-5xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            {activeUsers && activeUsers.hasOwnProperty(selectedPeriod)
              ? activeUsers[selectedPeriod]
              : 0}
          </span>
        </div>
      </div>
    </InsightBox>
  );
};
