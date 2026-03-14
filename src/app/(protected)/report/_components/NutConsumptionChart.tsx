"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { NutConsumptionData } from "@/lib/domain/report";

type NutConsumptionChartProps = {
  data: NutConsumptionData[];
  maxDays: number;
};

const CHART_HEIGHT = 260;
const MIN_Y_MAX = 5;

// ナッツごとの色
const NUT_COLORS: Record<string, string> = {
  アーモンド: "#C9A66B",
  くるみ: "#8B7355",
  カシューナッツ: "#E6C88C",
  マカダミアナッツ: "#F5DEB3",
  ピスタチオ: "#93C572",
  ヘーゼルナッツ: "#CD853F",
};

const DEFAULT_COLOR = "#9FBFAF";

export default function NutConsumptionChart({
  data,
  maxDays,
}: NutConsumptionChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number | null>(null);

  /**
   * グラフ描画幅の監視
   */
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const width = Math.floor(element.getBoundingClientRect().width);
      if (width > 0) {
        setChartWidth(width);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const themeColors = {
    grid: isDark ? "#3a4a40" : "#E8E8E8",
    axis: isDark ? "#4a5a50" : "#E0E0E0",
    tick: isDark ? "#9aa89e" : "#555",
    tooltipBg: isDark ? "#2a3a30" : "#FAFAFA",
    tooltipBorder: isDark ? "#4a5a50" : "#E0E0E0",
  };

  const allZero = data.every((item) => item.days === 0);
  const yMax = Math.max(maxDays, MIN_Y_MAX);

  const isChartReady = chartWidth !== null && chartWidth > 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 md:p-5">
        {/* タイトル */}
        <div className="mb-4 text-center">
          <div className="text-xl font-semibold text-card-foreground">
            ナッツ別 食べた日数
          </div>
        </div>

        {allZero ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-sm text-muted-foreground">
              記録がありません
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full min-w-0 h-[260px]">
            {isChartReady ? (
              <BarChart
                width={chartWidth}
                height={CHART_HEIGHT}
                data={data}
                margin={{ top: 10, right: 8, left: 0, bottom: 28 }}
                barCategoryGap="18%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={themeColors.grid}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: themeColors.tick }}
                  axisLine={{ stroke: themeColors.axis }}
                  tickLine={false}
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={32}
                  tickMargin={10}
                />

                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 11, fill: themeColors.tick }}
                  axisLine={{ stroke: themeColors.axis }}
                  tickLine={false}
                  allowDecimals={false}
                  tickCount={5}
                  width={32}
                />

                <Tooltip
                  formatter={(value) => [`${value}日`, "食べた日数"]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: themeColors.tooltipBg,
                    border: `1px solid ${themeColors.tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: themeColors.tick,
                  }}
                />

                <Bar dataKey="days" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.nutId}
                      fill={NUT_COLORS[entry.name] ?? DEFAULT_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        )}

        {/* 凡例 */}
        {!allZero && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
            {data.map((item) => (
              <div key={item.nutId} className="flex items-center gap-1">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded"
                  style={{
                    backgroundColor: NUT_COLORS[item.name] ?? DEFAULT_COLOR,
                  }}
                />
                <span className="text-card-foreground">{item.name}</span>
                <span className="font-medium text-muted-foreground">
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
