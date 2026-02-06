"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type MonthSelectorProps = {
  currentYearMonth: string; // YYYY-MM形式
};

/**
 * 月切り替えUI
 * - 前月 / 次月ボタン
 * - 現在の年月表示
 */
export default function MonthSelector({ currentYearMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 年月をパース
  const [year, month] = currentYearMonth.split("-").map(Number);

  // 月を日本語で表示
  const displayText = `${year}年${month}月`;

  // 前月への遷移
  const goToPrevMonth = useCallback(() => {
    const prevDate = new Date(year, month - 2, 1); // month-1-1 = month-2
    const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", prevYearMonth);
    router.push(`/report?${params.toString()}`);
  }, [year, month, searchParams, router]);

  // 次月への遷移
  const goToNextMonth = useCallback(() => {
    const nextDate = new Date(year, month, 1); // month+1-1 = month
    const nextYearMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextYearMonth);
    router.push(`/report?${params.toString()}`);
  }, [year, month, searchParams, router]);

  // 今月かどうか（次月ボタンを無効化するため）
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="flex items-center justify-center gap-4">
      {/* 前月ボタン */}
      <button
        onClick={goToPrevMonth}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E6E6E4] shadow-sm hover:bg-[#F6F7F6] transition-colors"
        aria-label="前月"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-[#555]"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* 年月表示 */}
      <div className="text-xl font-bold text-[#333] min-w-[140px] text-center">
        {displayText}
      </div>

      {/* 次月ボタン */}
      <button
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        className={`flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-colors ${
          isCurrentMonth
            ? "bg-[#F0F0F0] border-[#E0E0E0] cursor-not-allowed"
            : "bg-white border-[#E6E6E4] hover:bg-[#F6F7F6]"
        }`}
        aria-label="次月"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${isCurrentMonth ? "text-[#BBB]" : "text-[#555]"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
