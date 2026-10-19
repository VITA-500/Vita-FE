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

export type ReasonChartRow = {
  label: string;
  today: number;
  total: number;
};

const ROW_HEIGHT = 40;

/**
 * 사유별 누적 발생 가로 막대. rows는 많이 나온 순으로 받고, 맨 위 사유만 브랜드색으로 강조한다. 누적과 오늘은 크기 차이가 커서 같은 축에 그리지 않고
 * 오늘 수는 막대 끝 라벨 괄호로 붙인다. 모바일(약 240px 폭)에서도 막대가 남도록 라벨을 짧게 둔다. 숫자는 대시보드의 숨김 표가 스크린리더에 제공한다.
 */
export const ReasonBarChart = ({ rows }: { rows: ReasonChartRow[] }) => {
  const data = rows.map((row) => ({
    ...row,
    valueLabel: `${row.total.toLocaleString("ko-KR")} (+${row.today.toLocaleString("ko-KR")})`,
  }));

  return (
    <div
      aria-hidden="true"
      className="w-full text-gray-600 dark:text-gray-300"
      style={{ height: rows.length * ROW_HEIGHT }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 64, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={84}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12, fontWeight: 700 }}
          />
          <Bar
            dataKey="total"
            radius={[0, 6, 6, 0]}
            minPointSize={2}
            isAnimationActive={false}
            background={{ fill: "currentColor", fillOpacity: 0.06, radius: 6 }}
          >
            {data.map((row, index) => (
              <Cell
                key={row.label}
                fill={
                  index === 0 && row.total > 0
                    ? "var(--color-brand)"
                    : "currentColor"
                }
                fillOpacity={index === 0 && row.total > 0 ? 1 : 0.3}
              />
            ))}
            <LabelList
              dataKey="valueLabel"
              position="right"
              fill="currentColor"
              fontSize={11}
              fontWeight={700}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
