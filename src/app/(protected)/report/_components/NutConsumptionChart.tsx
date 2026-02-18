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
import { useTheme } from "next-themes";
import type { NutConsumptionData } from "@/lib/domain/report";

type NutConsumptionChartProps = {
  data: NutConsumptionData[];
  maxDays: number; // 対象月の日数（Y軸の最大値）
};

// ナッツごとの色（ライト/ダーク共通で使用）
const NUT_COLORS: Record<string, string> = {
  アーモンド: "#C9A66B",
  くるみ: "#8B7355",
  カシューナッツ: "#E6C88C",
  マカダミアナッツ: "#F5DEB3",
  ピスタチオ: "#93C572",
  ヘーゼルナッツ: "#CD853F",
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // テーマに応じた色設定
  const gridColor = isDark ? "#3a4a40" : "#E8E8E8";
  const axisColor = isDark ? "#4a5a50" : "#E0E0E0";
  const tickColor = isDark ? "#9aa89e" : "#555";
  const tooltipBg = isDark ? "#2a3a30" : "#FAFAFA";
  const tooltipBorder = isDark ? "#4a5a50" : "#E0E0E0";

  // すべて0日の場合
  const allZero = data.every((item) => item.days === 0);

  const yMax = Math.max(maxDays, 5);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 md:p-5">
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-card-foreground">
            ナッツ別 食べた日数
          </div>
        </div>

        {allZero ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              記録がありません
            </div>
          </div>
        ) : (
          /* X軸を回転させない前提で、下側の余白を詰めて 0 の位置を下げる */
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                // bottom を詰めることで、プロット領域が下に伸びて「0」が下がる
                margin={{ top: 10, right: 8, left: 0, bottom: 28 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

                {/* 斜体（回転）をやめる */}
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: tickColor }}
                  axisLine={{ stroke: axisColor }}
                  tickLine={false}
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={32}
                  tickMargin={10}
                />

                {/* 目盛り間隔を広げる（= tick数を減らす） */}
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={{ stroke: axisColor }}
                  tickLine={false}
                  allowDecimals={false}
                  tickCount={5}
                  width={32}
                />

                <Tooltip
                  formatter={(value) => [`${value}日`, "食べた日数"]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: tickColor,
                  }}
                />

                <Bar dataKey="days" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.map((entry, index) => (
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

        {/* 凡例：flex wrapでコンパクトに配置 */}
        {!allZero && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
            {data.map((item) => (
              <div key={item.nutId} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded shrink-0"
                  style={{
                    backgroundColor: NUT_COLORS[item.name] ?? DEFAULT_COLOR,
                  }}
                />
                <span className="text-card-foreground">{item.name}</span>
                <span className="text-muted-foreground font-medium">
                  {item.days}日
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
