"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { useTheme } from "next-themes";

export interface ChartLineConfig {
  key: string;
  name: string;
  color: string;
}

interface PerformanceChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  lines: ChartLineConfig[];
  height?: number;
  emptyMessage?: string;
}

export const PerformanceChart = ({
  data,
  lines,
  height = 250,
  emptyMessage = "No data available.",
}: PerformanceChartProps) => {
  const { theme } = useTheme();

  const formattedData = data.map((d, index) => ({
    ...d,
    index,
    date: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  if (!formattedData.length) {
    return (
      <div
        style={{ height }}
        className="text-muted-foreground flex w-full items-center justify-center rounded-md border border-dashed text-sm"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={theme === "dark" ? "#333" : "#eee"}
          />
          <XAxis
            dataKey="index"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(index) =>
              formattedData[index as number]?.date || ""
            }
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            domain={[0, 100]}
          />
          <Tooltip
            labelFormatter={(label) =>
              formattedData[label as number]?.date || ""
            }
            contentStyle={{
              backgroundColor: theme === "dark" ? "#09090b" : "#ffffff",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              name={line.name}
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              activeDot={{ r: 6, fill: line.color }}
              dot={{
                r: 4,
                fill: "var(--background)",
                stroke: line.color,
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
