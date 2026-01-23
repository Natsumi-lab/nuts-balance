"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from 'date-fns/locale';
import { useState, useEffect } from "react";

type Props = {
  selectedDate: string; // YYYY-MM-DD
};

// 曜日を日本語表記に変更するためのカスタムフォーマット
const weekdayLabels = {
  0: '日',
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
};

export default function CalendarPicker({ selectedDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみレンダリング
  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = new Date(selectedDate);

  // 今日の日付
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onSelect = (date?: Date) => {
    if (!date) return;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const nextDate = `${yyyy}-${mm}-${dd}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);

    router.push(`/app?${params.toString()}`);
  };

  // DayPickerのカスタムスタイル
  const dayPickerClassNames = {
    months: "flex flex-col space-y-4",
    month: "space-y-4",
    caption: "flex justify-center relative items-center px-2",
    caption_label: "text-base font-medium text-[#333]",
    nav: "flex items-center space-x-1",
    nav_button: "h-8 w-8 bg-[#F8F8F6] hover:bg-[#E6F1EC] text-[#5E8F76] rounded-full flex items-center justify-center transition-colors",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse",
    head_row: "flex w-full justify-between py-2",
    head_cell: "text-[#5E8F76] font-medium text-center w-10",
    row: "flex w-full justify-between mt-1",
    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal rounded-full hover:bg-[#E6F1EC] hover:text-[#333] flex items-center justify-center transition-colors",
    day_selected: "bg-gradient-to-br from-[#F2B705] to-[#E38B3A] text-white hover:bg-none hover:text-white font-semibold shadow-sm",
    day_today: "border border-[#9FBFAF] bg-[#FAFAF8] font-semibold",
    day_outside: "text-[#AAA] opacity-50",
    day_disabled: "text-[#CCC]",
    day_hidden: "invisible",
  };

  if (!mounted) {
    return <div className="rounded-xl border border-[#E6E6E4] p-3 bg-white h-64 animate-pulse"></div>;
  }

  return (
    <div className="rounded-xl border border-[#E6E6E4] p-3 bg-white shadow-sm">
      <style jsx global>{`
        .rdp-month {
          width: 100%;
        }
        .rdp-caption {
          margin-bottom: 0.75rem;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        weekStartsOn={1} // 月曜始まり
        disabled={{ after: new Date() }} // 未来日を選択不可
        locale={ja}
        classNames={dayPickerClassNames}
        formatters={{
          formatWeekday: (weekday) => {
            const day = weekday.getDay();
            return weekdayLabels[day as keyof typeof weekdayLabels];
          }
        }}
        modifiersClassNames={{
          selected: "day-selected",
          today: "day-today",
        }}
      />
    </div>
  );
}
