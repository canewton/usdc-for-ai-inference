'use client';

import React, { useEffect, useState } from 'react';
import type { TooltipProps } from 'recharts';

import { aiModel } from '@/types/ai.types';

import { ActiveUsers } from './active-users';
import { InsightBox } from './insight-box';
import type { StackedInsightsBarChartData } from './stacked-insights-bar-chart';
import { StackedInsightsBarChart } from './stacked-insights-bar-chart';
import type { TimePeriod } from './time-period-options';
import { TimePeriodOptions } from './time-period-options';
import { USDCMarketCapGraph } from './usdc-market-cap-graph';

interface BillingTransaction {
  id: string;
  ai_model: string;
  project_name: string;
  transaction_type: string;
  amount: string;
  status: string;
  created_at: string;
  expanded: boolean;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function generateDateRange(startDate: Date): string[] {
  const currentDate = new Date();

  const dates: string[] = [];
  for (
    let date = new Date(startDate);
    date <= currentDate;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(
      `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()].substring(0, 3)}`,
    );
  }
  return dates;
}

interface Props {
  data: BillingTransaction[];
}

const CountCustomTooltip = ({
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
      <div className="flex items-center justify-between w-[300px] mb-3">
        <p className="text-xl font-medium">{label}</p>
        <p className="text-lg">{total.toFixed(0)} Requests</p>
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="flex justify-between items-center mb-2">
          <div className="flex items-center justify-between w-[300px]">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <span className="text-gray-400">
              {(entry.value as number).toFixed(0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WebInsights: React.FC<Props> = (props) => {
  const [selectedPeriodCount, setSelectedPeriodCount] =
    useState<TimePeriod>('1M');
  const [selectedPeriodSales, setSelectedPeriodSales] =
    useState<TimePeriod>('1M');
  const [countData, setCountData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);

  function processTransactionsByRange(
    transactions: BillingTransaction[],
    range: TimePeriod,
    mode: 'count' | 'sales' = 'count',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1D':
        startDate = new Date(now);
        startDate.setDate(now.getDate());
        break;
      case '7D':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        break;
      case '1M':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startDate && transactionDate <= now;
    });

    const dates = generateDateRange(startDate);
    const returnData: StackedInsightsBarChartData[] = [];
    var totalSalesTemp = 0;

    dates.forEach((date) => {
      const dateTransactions = filteredTransactions.filter((t) => {
        const tDate = new Date(t.created_at);
        return (
          `${String(tDate.getDate()).padStart(2, '0')} ${months[tDate.getMonth()].substring(0, 3)}` ===
          date
        );
      });

      const value: StackedInsightsBarChartData = {
        value1: 0,
        value2: 0,
        value3: 0,
        value4: 0,
        date,
      };

      dateTransactions.forEach((t) => {
        if (t.ai_model === aiModel.TEXT_TO_TEXT)
          value.value1! += mode === 'count' ? 1 : parseFloat(t.amount);
        if (t.ai_model === aiModel.TEXT_TO_IMAGE)
          value.value2! += mode === 'count' ? 1 : parseFloat(t.amount);
        if (t.ai_model === aiModel.IMAGE_TO_3D)
          value.value3! += mode === 'count' ? 1 : parseFloat(t.amount);
        if (t.ai_model === aiModel.IMAGE_TO_VIDEO)
          value.value4! += mode === 'count' ? 1 : parseFloat(t.amount);

        if (
          t.ai_model === aiModel.TEXT_TO_TEXT ||
          t.ai_model === aiModel.TEXT_TO_IMAGE ||
          t.ai_model === aiModel.IMAGE_TO_3D ||
          t.ai_model === aiModel.IMAGE_TO_VIDEO
        )
          totalSalesTemp += parseFloat(t.amount);
      });

      returnData.push(value);
    });

    if (mode === 'sales') {
      setTotalSales(totalSalesTemp);
    }

    return returnData;
  }

  useEffect(() => {
    setCountData(
      processTransactionsByRange(props.data, selectedPeriodCount, 'count'),
    );
  }, [selectedPeriodCount, props.data]);

  useEffect(() => {
    setSalesData(
      processTransactionsByRange(props.data, selectedPeriodSales, 'sales'),
    );
  }, [selectedPeriodSales, props.data]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ActiveUsers />
        <InsightBox className="pl-0">
          <div className="flex justify-between items-center pl-8 mb-4">
            <div>
              <p className="text-sm">Total Sales</p>
              <p className="text-blue-500 text-xl">${totalSales.toFixed(2)}</p>
            </div>
            <TimePeriodOptions
              selectedPeriod={selectedPeriodSales}
              setSelectedPeriod={setSelectedPeriodSales}
            />
          </div>
          <StackedInsightsBarChart data={salesData} stacked={true} />
        </InsightBox>
      </div>
      <InsightBox className="pl-0 mb-6">
        <div className="flex justify-between items-center pl-8 mb-4">
          <h2>Total Requests</h2>
          <TimePeriodOptions
            selectedPeriod={selectedPeriodCount}
            setSelectedPeriod={setSelectedPeriodCount}
          />
        </div>
        <StackedInsightsBarChart
          data={countData}
          stacked={true}
          tooltip={<CountCustomTooltip />}
        />
      </InsightBox>
      <USDCMarketCapGraph />
    </div>
  );
};
