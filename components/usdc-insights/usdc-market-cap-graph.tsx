import { format, fromUnixTime } from 'date-fns';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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

import { InsightBox } from './insight-box';
import type { TimePeriod } from './time-period-options';
import { TimePeriodOptions } from './time-period-options';

interface MarketData {
  date: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between w-[200px] mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-lg font-semibold">
          ${(payload[0].value / 1e9).toFixed(2)}B
        </p>
      </div>
    </div>
  );
};

export const USDCMarketCapGraph = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [marketData, setMarketData] = useState<
    Record<TimePeriod, MarketData[]>
  >({} as Record<TimePeriod, MarketData[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periods: TimePeriod[] = ['1D', '7D', '1M', '3M', '1Y'];
  const daysMap: Record<TimePeriod, number> = {
    '1D': 1,
    '7D': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
  } as const;

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `https://api.coingecko.com/api/v3/coins/usd-coin/market_chart?vs_currency=usd&days=${daysMap[selectedPeriod]}${daysMap[selectedPeriod] === 1 ? '' : '&interval=daily'}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }

        const data = await response.json();
        const formattedData = data.market_caps.map(
          ([timestamp, value]: [number, number]) => ({
            date: format(
              fromUnixTime(timestamp / 1000),
              selectedPeriod === '1D'
                ? 'HH:mm'
                : selectedPeriod === '7D'
                  ? 'dd MMM'
                  : selectedPeriod === '1M'
                    ? 'dd MMM'
                    : selectedPeriod === '3M'
                      ? 'dd MMM'
                      : 'MMM yy',
            ),
            value,
          }),
        );

        setMarketData((prev) => ({
          ...prev,
          [selectedPeriod]: formattedData,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [selectedPeriod]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  const getYAxisDomain = () => {
    if (!marketData[selectedPeriod]) return ['dataMin', 'dataMax'];
    const values = marketData[selectedPeriod].map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    // Round down to nearest billion for min
    const min = Math.floor((minValue - range * 0.05) / 1e9) * 1e9;
    // Round up to nearest billion for max
    const max = Math.ceil((maxValue + range * 0.05) / 1e9) * 1e9;

    return [min, max];
  };

  const generateTicks = () => {
    const [min, max] = getYAxisDomain();
    const step = Math.round(
      (parseFloat(max.toString()) - parseFloat(min.toString())) / 5,
    );
    return Array.from(
      { length: 6 },
      (_, i) => parseFloat(min.toString()) + step * i,
    );
  };

  return (
    <InsightBox className="pl-2">
      <div className="flex justify-between items-center mb-6 pl-8">
        <div className="flex items-center gap-3">
          <USDCIcon className="w-6 h-6 text-blue-500" />
          <h3>USDC Market Cap</h3>
        </div>
        <TimePeriodOptions
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
        />
      </div>
      <div className="h-[400px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={marketData[selectedPeriod]}
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
                tickFormatter={(value) => `${(value / 1e9).toFixed(0)}B`}
                domain={getYAxisDomain()}
                ticks={generateTicks()}
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
        )}
      </div>
    </InsightBox>
  );
};
