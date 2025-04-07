import {
  addHours,
  format,
  startOfDay,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { USDCIcon } from '@/app/icons/USDCIcon';

const generateTimePeriodsData = () => {
  const now = new Date();
  const today = startOfDay(now);

  return {
    '1D': Array.from({ length: 7 }, (_, i) => ({
      date: format(addHours(today, i * 4), 'HH:mm'),
      value: 60 + Math.random() * 0.5,
    })),
    '7D': Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(now, 6 - i), 'dd MMM'),
      value: 60 + Math.random() * 1.5,
    })),
    '1M': Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(now, 29 - i), 'dd MMM'),
      value: 59 + Math.random() * 2,
    })),
    '3M': Array.from({ length: 12 }, (_, i) => ({
      date: format(subDays(now, 89 - i * 8), 'dd MMM'),
      value: 58 + Math.random() * 3,
    })),
    '1Y': Array.from({ length: 12 }, (_, i) => ({
      date: format(subMonths(now, 11 - i), 'MMM yy'),
      value: 55 + i * 0.5 + Math.random() * 0.5,
    })),
    Max: Array.from({ length: 6 }, (_, i) => ({
      date: format(subYears(now, 5 - i), 'yyyy'),
      value: 20 + i * 8 + Math.random() * 2,
    })),
  };
};

type TimePeriod = '1D' | '7D' | '1M' | '3M' | '1Y' | 'Max';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between w-[200px] mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-lg font-semibold">${payload[0].value.toFixed(2)}B</p>
      </div>
    </div>
  );
};

export const USDCMarketCapGraph = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const periods: TimePeriod[] = ['1D', '7D', '1M', '3M', '1Y', 'Max'];

  const timePeriodsData = useMemo(() => generateTimePeriodsData(), []);

  return (
    <div className="shadow-sm mb-6 bg-[#FBFBFB] rounded-2xl p-8 border border-[#EAEAEC]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <USDCIcon className="text-blue-500" />
          <h2>USDC Market Cap</h2>
        </div>
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === selectedPeriod
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timePeriodsData[selectedPeriod]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `${value}B`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="linear"
              dataKey="value"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
