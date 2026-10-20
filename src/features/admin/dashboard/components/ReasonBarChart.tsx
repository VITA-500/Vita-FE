"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const REASON_COLORS = ["#218DAE", "#2BBBD7", "#FCE59A", "#FFD758"];
const TODAY_COLORS = ["#17677F", "#167E95", "#D39F16", "#C58E00"];

type FeedbackBarLabelProps = {
  value?: string | number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
};

const FeedbackBarLabel = ({
  height = 0,
  index = 0,
  value,
  width = 0,
  x = 0,
  y = 0,
}: FeedbackBarLabelProps) => {
  const [today, total] = String(value ?? "").split("|");
  if (!total || !today) return null;

  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dominantBaseline="middle"
      fontSize={10}
      fontWeight={700}
    >
      <tspan fill={TODAY_COLORS[index % TODAY_COLORS.length]}>
        (+{today}개)
      </tspan>
      <tspan fill="#64748b"> / {total}개</tspan>
    </text>
  );
};

export type ReasonChartRow = {
  label: string;
  today: number;
  total: number;
};

/**
 * 사유별 누적 발생 가로 막대. rows는 많이 나온 순으로 받고, 맨 위 사유만 브랜드색으로 강조한다. 누적과 오늘은 크기 차이가 커서 같은 축에 그리지 않고
 * 오늘 수는 막대 끝 라벨 괄호로 붙인다. 모바일(약 240px 폭)에서도 막대가 남도록 라벨을 짧게 둔다. 숫자는 대시보드의 숨김 표가 스크린리더에 제공한다.
 */
export const ReasonBarChart = ({ rows }: { rows: ReasonChartRow[] }) => {
  const data = rows.map((row) => ({
    ...row,
    previous: Math.max(row.total - row.today, 0),
    valueLabel: `${row.today.toLocaleString("ko-KR")}|${row.total.toLocaleString("ko-KR")}`,
  }));

  return (
    <div
      aria-hidden="true"
      className="w-full text-gray-600 dark:text-gray-300"
      style={{ height: rows.length * 32 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
          barCategoryGap={14}
        >
          <defs>
            <linearGradient
              id="feedbackTotalGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#218DAE" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#2BBBD7" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient
              id="feedbackTodayGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#FCE59A" />
              <stop offset="100%" stopColor="#FFD758" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12, fontWeight: 700 }}
          />
          <Bar
            dataKey="previous"
            stackId="feedback"
            radius={[5, 0, 0, 5]}
            minPointSize={1}
            barSize={10}
            isAnimationActive={false}
            fill="url(#feedbackTotalGradient)"
          >
            {data.map((row, index) => (
              <Cell
                key={row.label}
                fill={REASON_COLORS[index % 4]}
                fillOpacity={0.72}
              />
            ))}
          </Bar>
          <Bar
            dataKey="today"
            stackId="feedback"
            radius={[0, 5, 5, 0]}
            minPointSize={1}
            barSize={10}
            isAnimationActive={false}
            fill="url(#feedbackTodayGradient)"
          >
            {data.map((row, index) => (
              <Cell key={row.label} fill={TODAY_COLORS[index % 4]} />
            ))}
            <LabelList
              dataKey="valueLabel"
              position="right"
              content={<FeedbackBarLabel />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
