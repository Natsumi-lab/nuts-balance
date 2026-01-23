"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from "date-fns/locale";

type Props = {
  selectedDate: string; // YYYY-MM-DD
};

const weekdayLabels = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

export default function CalendarPicker({ selectedDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selected = new Date(selectedDate);

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

  return (
    <div className="rounded-2xl border border-[#E6E6E4] bg-white/75 p-4 shadow-lg ring-1 ring-black/5">
      <style jsx global>{`
        /* --- ベース --- */
        .rdp {
          margin: 0;
        }
        .rdp-month {
          width: 100%;
        }

        /* --- 見出し（Pixarっぽい“カード感”） --- */
        .rdp-caption {
          position: relative;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 1rem;
          background: rgba(250, 250, 248, 0.85);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .rdp-caption_label {
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #2f5d4a;
          font-size: 0.95rem;
        }

        /* --- ナビ（左右ボタン） --- */
        .rdp-nav_button {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
          color: #2f5d4a;
        }
        .rdp-nav_button:hover {
          background: rgba(230, 241, 236, 0.9);
        }

        /* --- 曜日ラベル --- */
        .rdp-head_cell {
          color: #6b7f75;
          font-weight: 700;
          font-size: 0.75rem;
          padding-bottom: 0.35rem;
        }

        /* --- 日付ボタン --- */
        .rdp-day {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          font-weight: 600;
          color: #3b2f2a;
        }
        .rdp-day:hover {
          background: rgba(230, 241, 236, 0.9);
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
        }

        /* ✅ 選択日：オレンジ〜イエローのグラデ（強制） */
        .rdp-day[aria-selected="true"] {
          color: #fff !important;
          background: linear-gradient(135deg, #f2b705, #e38b3a) !important;
          box-shadow: 0 12px 22px rgba(227, 139, 58, 0.28) !important;
        }

        /* ✅ 今日：ライトグリーンのリング（強制） */
        .rdp-day_today:not([aria-selected="true"]) {
          outline: 2px solid rgba(159, 191, 175, 1) !important; /* #9FBFAF */
          outline-offset: 2px !important;
          background: rgba(250, 250, 248, 0.9) !important;
        }
      `}</style>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        weekStartsOn={1}
        disabled={{ after: new Date() }}
        locale={ja}
        formatters={{
          formatWeekday: (weekday) => {
            const day = weekday.getDay();
            return weekdayLabels[day as keyof typeof weekdayLabels];
          },
        }}
      />
    </div>
  );
}
