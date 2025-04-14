import React from "react";
import type { TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameType } from "recharts/types/component/DefaultTooltipContent";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ContentType } from "recharts/types/component/Tooltip";

import { aiModel } from "@/types/ai.types";

export interface StackedInsightsBarChartData {
  date: string;
  value1?: number;
  value2?: number;
  value3?: number;
  value4?: number;
}

const MODEL_COLORS = {
  [aiModel.TEXT_TO_TEXT]: "#8B5CF6", // Purple
  [aiModel.TEXT_TO_IMAGE]: "#F59E0B", // Amber
  [aiModel.IMAGE_TO_3D]: "#10B981", // Emerald
  [aiModel.IMAGE_TO_VIDEO]: "#3B82F6", // Blue
};

interface Props {
  data: Array<StackedInsightsBarChartData>;
  colors?: string[];
  stacked?: boolean;
  tickFormatter?: (value: number) => string;
  tooltip?: ContentType<ValueType, NameType> | undefined;
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
      <div className="flex items-center justify-between w-[300px] mb-3">
        <p className="text-xl font-medium">{label}</p>
        <p className="text-lg">${total.toFixed(2)} USDC</p>
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
              ${(entry.value as number).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StackedInsightsBarChart = ({
  data,
  colors = [
    MODEL_COLORS[aiModel.TEXT_TO_TEXT],
    MODEL_COLORS[aiModel.TEXT_TO_IMAGE],
    MODEL_COLORS[aiModel.IMAGE_TO_3D],
    MODEL_COLORS[aiModel.IMAGE_TO_VIDEO],
  ],
  stacked,
  tickFormatter,
  tooltip,
}: Props) => {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#666" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#666" }}
            tickFormatter={tickFormatter}
            allowDecimals={false}
          />
          <Tooltip
            content={tooltip != undefined ? tooltip : <CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          {data[0]?.value1 !== undefined && (
            <Bar
              dataKey="value1"
              fill={colors[0]}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              name="Text to Text"
            />
          )}
          {data[0]?.value2 !== undefined && (
            <Bar
              dataKey="value2"
              fill={colors[1]}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              name="Text to Image"
            />
          )}
          {data[0]?.value3 !== undefined && (
            <Bar
              dataKey="value3"
              fill={colors[2]}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              name="2D to 3D"
            />
          )}
          {data[0]?.value4 !== undefined && (
            <Bar
              dataKey="value4"
              fill={colors[3]}
              radius={stacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              name="Image to Video"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
