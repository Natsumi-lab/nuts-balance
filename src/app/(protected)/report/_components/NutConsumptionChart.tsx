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
  data: NutConsumptionData[]; // ナッツ別の消費日数データ
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

// ナッツ別消費日数の棒グラフ
export default function NutConsumptionChart({
  data,
  maxDays,
}: NutConsumptionChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  /**
   * グラフ描画エリアの参照
   *
   * この要素の実際の幅を取得して、
   * BarChart の width にそのまま渡す。
   */
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * 計測した描画幅
   *
   * 初回は null にしておき、
   * 親要素の幅が確定したあとに更新する。
   */
  const [chartWidth, setChartWidth] = useState<number | null>(null);

  /**
   * 親要素の幅を監視する処理
   *
   * レイアウト変化や画面サイズ変更に合わせて
   * グラフ幅を再計測する。
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(el.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setChartWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // テーマに応じた色設定
  const gridColor = isDark ? "#3a4a40" : "#E8E8E8";
  const axisColor = isDark ? "#4a5a50" : "#E0E0E0";
  const tickColor = isDark ? "#9aa89e" : "#555";
  const tooltipBg = isDark ? "#2a3a30" : "#FAFAFA";
  const tooltipBorder = isDark ? "#4a5a50" : "#E0E0E0";

  // すべて0日の場合
  const allZero = data.every((item) => item.days === 0);

  // Y軸は最低でも5まで表示して見やすさを保つ
  const yMax = Math.max(maxDays, 5);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 md:p-5">
        <div className="mb-4 text-center">
          <div className="text-xl font-semibold text-card-foreground">
            ナッツ別 食べた日数
          </div>
        </div>

        {allZero ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-sm text-muted-foreground">
              記録がありません
            </div>
          </div>
        ) : (
          // グラフ描画エリア
          <div ref={containerRef} className="h-[260px] w-full min-w-0">
            {chartWidth !== null && chartWidth > 0 ? (
              <BarChart
                width={chartWidth}
                height={260}
                data={data}
                margin={{ top: 10, right: 8, left: 0, bottom: 28 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

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
                      key={`bar-segment-${index}`}
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

        {!allZero && (
          // 凡例
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
