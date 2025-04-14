"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Image3DIcon } from "@/app/icons/Image3DIcon";
import { ImageIcon } from "@/app/icons/ImageIcon";
import { TextIcon } from "@/app/icons/TextIcon";
import { USDCIcon } from "@/app/icons/USDCIcon";
import { VideoIcon } from "@/app/icons/VideoIcon";
import { aiModel } from "@/types/ai.types";

import { InsightBox } from "./insight-box";
import { SpendingCard } from "./spending-card";
import { StackedInsightsBarChart } from "./stacked-insights-bar-chart";

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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MODEL_COLORS = {
  [aiModel.TEXT_TO_TEXT]: "#8B5CF6", // Purple
  [aiModel.TEXT_TO_IMAGE]: "#F59E0B", // Amber
  [aiModel.IMAGE_TO_3D]: "#10B981", // Emerald
  [aiModel.IMAGE_TO_VIDEO]: "#3B82F6", // Blue
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
      `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()].substring(0, 3)}`,
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
        `${String(tDate.getDate()).padStart(2, "0")} ${months[tDate.getMonth()].substring(0, 3)}` ===
        date
      );
    });

    return {
      date,
      value1: dayTransactions
        .filter((t) => t.ai_model === aiModel.TEXT_TO_TEXT)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value2: dayTransactions
        .filter((t) => t.ai_model === aiModel.TEXT_TO_IMAGE)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value3: dayTransactions
        .filter((t) => t.ai_model === aiModel.IMAGE_TO_3D)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      value4: dayTransactions
        .filter((t) => t.ai_model === aiModel.IMAGE_TO_VIDEO)
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
        `${String(tDate.getDate()).padStart(2, "0")} ${months[tDate.getMonth()].substring(0, 3)}` ===
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

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [textToTextData, setTextToTextData] = useState<any[]>([]);
  const [textToImageData, setTextToImageData] = useState<any[]>([]);
  const [imageToImageData, setImageToImageData] = useState<any[]>([]);
  const [imageToVideoData, setImageToVideoData] = useState<any[]>([]);

  const [monthlyTotal, setMonthyTotal] = useState<number>(0);
  const [textToTextTotal, setTextToTextTotal] = useState<number>(0);
  const [textToImageTotal, setTextToImageTotal] = useState<number>(0);
  const [imageToImageTotal, setImageToImageTotal] = useState<number>(0);
  const [imageToVideoTotal, setImageToVideoTotal] = useState<number>(0);

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
    const textToTextDataTemp = processTransactionsByType(
      props.data,
      monthIndex,
      aiModel.TEXT_TO_TEXT,
    );
    const textToImageDataTemp = processTransactionsByType(
      props.data,
      monthIndex,
      aiModel.TEXT_TO_IMAGE,
    );
    const imageToImageDataTemp = processTransactionsByType(
      props.data,
      monthIndex,
      aiModel.IMAGE_TO_3D,
    );
    const imageToVideoDataTemp = processTransactionsByType(
      props.data,
      monthIndex,
      aiModel.IMAGE_TO_VIDEO,
    );
    setMonthlyData(monthlyDataTemp);
    setTextToTextData(textToTextDataTemp);
    setTextToImageData(textToImageDataTemp);
    setImageToImageData(imageToImageDataTemp);
    setImageToVideoData(imageToVideoDataTemp);

    setMonthyTotal(calculateTotal(monthlyDataTemp));
    setTextToTextTotal(calculateTotal(textToImageDataTemp));
    setTextToImageTotal(calculateTotal(textToImageDataTemp));
    setImageToImageTotal(calculateTotal(imageToImageDataTemp));
    setImageToVideoTotal(calculateTotal(imageToVideoDataTemp));
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
      <InsightBox className="mb-6 pl-0">
        <div className="flex justify-between items-center mb-4 pl-8">
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
        <StackedInsightsBarChart
          data={monthlyData}
          colors={[
            MODEL_COLORS[aiModel.TEXT_TO_TEXT],
            MODEL_COLORS[aiModel.TEXT_TO_IMAGE],
            MODEL_COLORS[aiModel.IMAGE_TO_3D],
            MODEL_COLORS[aiModel.IMAGE_TO_VIDEO],
          ]}
          stacked={true}
          tickFormatter={(value) => `$${value}`}
        />
      </InsightBox>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingCard
          title="Text to Text"
          amount={textToTextTotal}
          data={textToTextData}
          className="bg-purple-50"
          colors={[MODEL_COLORS[aiModel.TEXT_TO_TEXT]]}
          icon={<TextIcon className="text-purple-600" />}
          tickFormatter={(value) => `$${value}`}
        />
        <SpendingCard
          title="Text to Image"
          amount={textToImageTotal}
          data={textToImageData}
          className="bg-orange-50"
          colors={[MODEL_COLORS[aiModel.TEXT_TO_IMAGE]]}
          icon={<ImageIcon className="text-orange-600" />}
          tickFormatter={(value) => `$${value}`}
        />
        <SpendingCard
          title="2D to 3D Image"
          amount={imageToImageTotal}
          data={imageToImageData}
          className="bg-green-50"
          colors={[MODEL_COLORS[aiModel.IMAGE_TO_3D]]}
          icon={<Image3DIcon className="text-green-600" />}
          tickFormatter={(value) => `$${value}`}
        />
        <SpendingCard
          title="Image to Video"
          amount={imageToVideoTotal}
          data={imageToVideoData}
          className="bg-blue-50"
          colors={[MODEL_COLORS[aiModel.IMAGE_TO_VIDEO]]}
          icon={<VideoIcon className="text-blue-600" />}
          tickFormatter={(value) => `$${value}`}
        />
      </div>
    </div>
  );
};
