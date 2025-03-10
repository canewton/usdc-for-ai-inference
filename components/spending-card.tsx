import { Info } from 'lucide-react';
import React from 'react';
import type { TooltipProps } from 'recharts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SpendingCardProps {
  title: string;
  amount: number;
  data: Array<{
    date: string;
    value1?: number;
    value2?: number;
    value3?: number;
    value4?: number;
  }>;
  className?: string;
  colors?: string[];
  stacked?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce(
    (sum, entry) => sum + (entry.value as number),
    0,
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
      <p className="text-xl font-semibold mb-3">{label}</p>
      <p className="text-lg font-medium mb-4">${total.toFixed(2)} USDC</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}</span>
          </div>
          <span className="text-gray-400">
            ${(entry.value as number).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SpendingCard: React.FC<SpendingCardProps> = ({
  title,
  amount,
  data,
  className = '',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'],
  stacked = false,
}) => {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-700 font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-blue-500">${amount.toFixed(2)}</span>
          <Info size={16} className="text-gray-400" />
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
            />
            {data[0]?.value1 !== undefined && (
              <Bar
                dataKey="value1"
                fill={colors[0]}
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                name="Text to Text"
              />
            )}
            {data[0]?.value2 !== undefined && (
              <Bar
                dataKey="value2"
                fill={colors[1]}
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                name="Text to Image"
              />
            )}
            {data[0]?.value3 !== undefined && (
              <Bar
                dataKey="value3"
                fill={colors[2]}
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                name="2D to 3D"
              />
            )}
            {data[0]?.value4 !== undefined && (
              <Bar
                dataKey="value4"
                fill={colors[3]}
                radius={stacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                name="Image to Video"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
