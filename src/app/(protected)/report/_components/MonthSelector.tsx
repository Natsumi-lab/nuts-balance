"use client";

import { useRouter, useSearchParams } from "next/navigation";

type MonthSelectorProps = {
  currentYearMonth: string; // YYYY-MM
};

const REPORT_PATH = "/report";
const MONTH_QUERY_KEY = "month";

/**
 * Date → YYYY-MM
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * URLの month クエリを更新
 */
function buildMonthUrl(searchParams: URLSearchParams, nextMonth: string) {
  const params = new URLSearchParams(searchParams.toString());
  params.set(MONTH_QUERY_KEY, nextMonth);
  return `${REPORT_PATH}?${params.toString()}`;
}

/**
 * 月切り替えUI
 */
export default function MonthSelector({
  currentYearMonth,
}: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, month] = currentYearMonth.split("-").map(Number);

  const displayText = `${year}年${month}月`;

  function changeMonth(offset: number) {
    const date = new Date(year, month - 1 + offset, 1);
    const nextMonth = formatYearMonth(date);
    const url = buildMonthUrl(searchParams, nextMonth);

    router.push(url);
  }

  function goToPrevMonth() {
    changeMonth(-1);
  }

  function goToNextMonth() {
    changeMonth(1);
  }

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="flex items-center justify-center gap-4">
      {/* 前月 */}
      <button
        onClick={goToPrevMonth}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E6E4] bg-white shadow-sm transition-colors hover:bg-[#F6F7F6]"
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

      {/* 年月 */}
      <div className="min-w-[140px] text-center text-xl font-bold text-foreground">
        {displayText}
      </div>

      {/* 次月 */}
      <button
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
          isCurrentMonth
            ? "cursor-not-allowed border-[#E0E0E0] bg-[#F0F0F0]"
            : "border-[#E6E6E4] bg-white hover:bg-[#F6F7F6]"
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
