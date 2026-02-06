"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { NutConsumptionData } from "@/lib/domain/report";

type NutConsumptionChartProps = {
  data: NutConsumptionData[];
  maxDays: number; // 対象月の日数（Y軸の最大値）
};

// ナッツごとの色
const NUT_COLORS: Record<string, string> = {
  "アーモンド": "#C9A66B",
  "くるみ": "#8B7355",
  "カシューナッツ": "#E6C88C",
  "マカダミアナッツ": "#F5DEB3",
  "ピスタチオ": "#93C572",
  "ヘーゼルナッツ": "#CD853F",
};

// デフォルト色
const DEFAULT_COLOR = "#9FBFAF";

/**
 * ナッツ別消費日数の棒グラフ
 */
export default function NutConsumptionChart({
  data,
  maxDays,
}: NutConsumptionChartProps) {
  // グラフ用データ（名前を短縮）
  const chartData = data.map((item) => ({
    ...item,
    shortName: item.name.length > 6 ? item.name.slice(0, 5) + "…" : item.name,
  }));

  // すべて0日の場合
  const allZero = data.every((item) => item.days === 0);

  return (
    <div className="rounded-2xl border border-[#E6E6E4] bg-white shadow-sm">
      <div className="p-5">
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-[#2F3A34]">
            ナッツ別 食べた日数
          </div>
        </div>

        {allZero ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-[#888]">記録がありません</div>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: "#555" }}
                  axisLine={{ stroke: "#E0E0E0" }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, Math.max(maxDays, 5)]}
                  tick={{ fontSize: 11, fill: "#555" }}
                  axisLine={{ stroke: "#E0E0E0" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  formatter={(value) => [`${value}日`, "食べた日数"]}
                  labelFormatter={(label) => {
                    const item = data.find(
                      (d) =>
                        d.name === label ||
                        (d.name.length > 6 && d.name.slice(0, 5) + "…" === label)
                    );
                    return item?.name ?? label;
                  }}
                  contentStyle={{
                    backgroundColor: "#FAFAFA",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={NUT_COLORS[entry.name] ?? DEFAULT_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 凡例 */}
        {!allZero && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {data.map((item) => (
              <div key={item.nutId} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: NUT_COLORS[item.name] ?? DEFAULT_COLOR }}
                />
                <span className="text-[#555]">
                  {item.name}: {item.days}日
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
