"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { ReasonChartRow } from "./ReasonBarChart";

const COLORS = ["#218DAE", "#2BBBD7", "#FCE59A", "#FFD758"];

export const FeedbackReasonDonutChart = ({
  rows,
}: {
  rows: ReasonChartRow[];
}) => {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const data = rows.map((row) => ({ name: row.label, value: row.total }));

  return (
    <div className="relative h-56 min-w-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient
                key={color}
                id={`feedbackDonutGradient${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.72" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="82%"
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={`url(#feedbackDonutGradient${index % COLORS.length})`}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {total.toLocaleString("ko-KR")}
        </strong>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          전체 발생
        </span>
      </div>
    </div>
  );
};
