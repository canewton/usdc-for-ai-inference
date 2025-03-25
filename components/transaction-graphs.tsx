import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { Image3DIcon } from '@/app/icons/Image3DIcon';
import { ImageIcon } from '@/app/icons/ImageIcon';
import { TextIcon } from '@/app/icons/TextIcon';
import { USDCIcon } from '@/app/icons/USDCIcon';
import { VideoIcon } from '@/app/icons/VideoIcon';

import { SpendingCard } from './spending-card';

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
  'text-to-text': '#8B5CF6', // Purple
  'text-to-image': '#F59E0B', // Amber
  '2d-to-3d': '#10B981', // Emerald
  'image-to-video': '#3B82F6', // Blue
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
        .filter((t) => t.ai_model === 'text-to-text')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value2: dayTransactions
        .filter((t) => t.ai_model === 'text-to-image')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value3: dayTransactions
        .filter((t) => t.ai_model === '2d-to-3d')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value4: dayTransactions
        .filter((t) => t.ai_model === 'image-to-video')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    };
  });
}

function processTransactionsByType(
  transactions: BillingTransaction[],
  monthIndex: number,
  type: string,
) {
  const dateRange = generateDateRange(monthIndex);
  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.created_at);
    return transactionDate.getMonth() === monthIndex && t.ai_model === type;
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
      value1: dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    };
  });
}

interface Props {
  data: BillingTransaction[];
}

export const TransactionGraphs: React.FC<Props> = (props) => {
  const currentDate = new Date();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    currentDate.getMonth(),
  );

  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const monthlyData = processTransactionsForMonth(
    props.data,
    currentMonthIndex,
  );
  const textToTextData = processTransactionsByType(
    props.data,
    currentMonthIndex,
    'text-to-text',
  );
  const textToImageData = processTransactionsByType(
    props.data,
    currentMonthIndex,
    'text-to-image',
  );
  const imageToImageData = processTransactionsByType(
    props.data,
    currentMonthIndex,
    '2d-to-3d',
  );
  const imageToVideoData = processTransactionsByType(
    props.data,
    currentMonthIndex,
    'image-to-video',
  );

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

  const monthlyTotal = calculateTotal(monthlyData);
  const textToTextTotal = calculateTotal(textToTextData);
  const textToImageTotal = calculateTotal(textToImageData);
  const imageToImageTotal = calculateTotal(imageToImageData);
  const imageToVideoTotal = calculateTotal(imageToVideoData);

  return (
    <div>
      <div className="bg-[#FBFBFB] rounded-2xl shadow-sm mb-6 border border-[#EAEAEC]">
        <div className="flex justify-between items-center p-8 pb-4">
          <div>
            <h2>Monthly Spend</h2>
            <div className="flex items-center gap-1">
              <span className="text-3xl text-blue-500">
                ${monthlyTotal.toFixed(2)}
              </span>
              <USDCIcon className="text-blue-500" />
            </div>
          </div>
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
            MODEL_COLORS['text-to-text'],
            MODEL_COLORS['text-to-image'],
            MODEL_COLORS['2d-to-3d'],
            MODEL_COLORS['image-to-video'],
          ]}
          stacked={true}
          showUSDCTotal={false}
          className="pt-0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingCard
          title="Text to Text"
          amount={textToTextTotal}
          data={textToTextData}
          className="bg-purple-50"
          colors={[MODEL_COLORS['text-to-text']]}
          icon={<TextIcon className="text-purple-600" />}
        />
        <SpendingCard
          title="Text to Image"
          amount={textToImageTotal}
          data={textToImageData}
          className="bg-orange-50"
          colors={[MODEL_COLORS['text-to-image']]}
          icon={<ImageIcon className="text-orange-600" />}
        />
        <SpendingCard
          title="2D to 3D Image"
          amount={imageToImageTotal}
          data={imageToImageData}
          className="bg-green-50"
          colors={[MODEL_COLORS['2d-to-3d']]}
          icon={<Image3DIcon className="text-green-600" />}
        />
        <SpendingCard
          title="Image to Video"
          amount={imageToVideoTotal}
          data={imageToVideoData}
          className="bg-blue-50"
          colors={[MODEL_COLORS['image-to-video']]}
          icon={<VideoIcon className="text-blue-600" />}
        />
      </div>
    </div>
  );
};
