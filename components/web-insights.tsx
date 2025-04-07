import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { aiModel } from '@/types/ai.types';

import { SpendingCard } from './spending-card';
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

const MODEL_COLORS = {
  [aiModel.TEXT_TO_TEXT]: '#8B5CF6', // Purple
  [aiModel.TEXT_TO_IMAGE]: '#F59E0B', // Amber
  [aiModel.IMAGE_TO_3D]: '#10B981', // Emerald
  [aiModel.IMAGE_TO_VIDEO]: '#3B82F6', // Blue
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function generateDateRange(monthIndex: number): string[] {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const isCurrentMonth = currentDate.getMonth() === monthIndex;
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const lastDay = isCurrentMonth ? currentDate.getDate() : daysInMonth;

  const dates: string[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, monthIndex, day);
    dates.push(
      `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()].substring(0, 3)}`,
    );
  }
  return dates;
}

function processTransactionsForMonth(
  transactions: BillingTransaction[],
  monthIndex: number,
  mode: 'count' | 'sales' = 'count',
) {
  const dateRange = generateDateRange(monthIndex);
  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.created_at);
    return transactionDate.getMonth() === monthIndex;
  });

  return dateRange.map((date) => {
    const dayTransactions = filteredTransactions.filter((t) => {
      const tDate = new Date(t.created_at);
      return (
        `${String(tDate.getDate()).padStart(2, '0')} ${months[tDate.getMonth()].substring(0, 3)}` ===
        date
      );
    });

    return {
      date,
      value1: dayTransactions
        .filter((t) => t.ai_model === aiModel.TEXT_TO_TEXT)
        .reduce(
          (sum, t) => (mode === 'count' ? sum + 1 : sum + parseFloat(t.amount)),
          0,
        ),
      value2: dayTransactions
        .filter((t) => t.ai_model === aiModel.TEXT_TO_IMAGE)
        .reduce(
          (sum, t) => (mode === 'count' ? sum + 1 : sum + parseFloat(t.amount)),
          0,
        ),
      value3: dayTransactions
        .filter((t) => t.ai_model === aiModel.IMAGE_TO_3D)
        .reduce(
          (sum, t) => (mode === 'count' ? sum + 1 : sum + parseFloat(t.amount)),
          0,
        ),
      value4: dayTransactions
        .filter((t) => t.ai_model === aiModel.IMAGE_TO_VIDEO)
        .reduce(
          (sum, t) => (mode === 'count' ? sum + 1 : sum + parseFloat(t.amount)),
          0,
        ),
    };
  });
}

interface Props {
  data: BillingTransaction[];
}

export const WebInsights: React.FC<Props> = (props) => {
  const currentDate = new Date();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    currentDate.getMonth(),
  );

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [monthlyTotal, setMonthyTotal] = useState<number>(0);

  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [monthlySalesTotal, setMonthySalesTotal] = useState<number>(0);

  const calculateTotal = (data: any[]) => {
    return data.reduce((total, item) => {
      const values = [
        item.value1,
        item.value2,
        item.value3,
        item.value4,
      ].filter(Boolean);
      return total + values.reduce((sum, value) => sum + value, 0);
    }, 0);
  };

  const updateGraphs = (monthIndex: number) => {
    const monthlyDataTemp = processTransactionsForMonth(props.data, monthIndex);
    setMonthlyData(monthlyDataTemp);
    setMonthyTotal(calculateTotal(monthlyDataTemp));

    const monthlySalesDataTemp = processTransactionsForMonth(
      props.data,
      monthIndex,
      'sales',
    );
    setMonthlySalesData(monthlySalesDataTemp);
    setMonthySalesTotal(calculateTotal(monthlySalesDataTemp));
  };

  const handlePrevMonth = () => {
    updateGraphs(currentMonthIndex === 0 ? 11 : currentMonthIndex - 1);
    setCurrentMonthIndex((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    updateGraphs(currentMonthIndex === 11 ? 0 : currentMonthIndex + 1);
    setCurrentMonthIndex((prev) => (prev === 11 ? 0 : prev + 1));
  };

  useEffect(() => {
    updateGraphs(currentDate.getMonth());
  }, []);

  return (
    <div>
      <div className="bg-[#FBFBFB] rounded-2xl shadow-sm mb-6 border border-[#EAEAEC]">
        <div className="flex justify-between items-center p-8 pb-4">
          <h2>Total Requests</h2>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handlePrevMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-gray-600 min-w-[80px] text-center">
              {months[currentMonthIndex]}
            </span>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleNextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <SpendingCard
          title=""
          amount={monthlyTotal}
          data={monthlyData}
          colors={[
            MODEL_COLORS[aiModel.TEXT_TO_TEXT],
            MODEL_COLORS[aiModel.TEXT_TO_IMAGE],
            MODEL_COLORS[aiModel.IMAGE_TO_3D],
            MODEL_COLORS[aiModel.IMAGE_TO_VIDEO],
          ]}
          stacked={true}
          showUSDCTotal={false}
          className="pt-0 border-0"
        />
      </div>
      <SpendingCard
        title="Total Sales"
        amount={monthlySalesTotal}
        data={monthlySalesData}
        className="bg-[#FBFBFB] mb-6"
        colors={[MODEL_COLORS[aiModel.TEXT_TO_TEXT]]}
        tickFormatter={(value) => `$${value}`}
        stacked={true}
      />
      <USDCMarketCapGraph />
    </div>
  );
};
