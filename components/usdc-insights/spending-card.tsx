import React from 'react';

import { USDCIcon } from '@/app/icons/USDCIcon';

import { InsightBox } from './insight-box';
import type { StackedInsightsBarChartData } from './stacked-insights-bar-chart';
import { StackedInsightsBarChart } from './stacked-insights-bar-chart';

interface SpendingCardProps {
  title: string;
  amount: number;
  data: Array<StackedInsightsBarChartData>;
  className?: string;
  colors?: string[];
  stacked?: boolean;
  icon?: React.ReactNode;
  tickFormatter?: (value: number) => string;
}

export const SpendingCard: React.FC<SpendingCardProps> = ({
  title,
  amount,
  data,
  className = '',
  colors,
  stacked = false,
  icon,
  tickFormatter,
}) => {
  return (
    <InsightBox className={`pl-0 ${className}`}>
      <div className="flex justify-between items-center mb-4 pl-8">
        <div className="flex items-center gap-4">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-500">${amount.toFixed(2)}</span>
          <USDCIcon className="text-blue-500" />
        </div>
      </div>
      <StackedInsightsBarChart
        data={data}
        stacked={stacked}
        colors={colors}
        tickFormatter={tickFormatter}
      />
    </InsightBox>
  );
};
