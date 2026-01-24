"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from "date-fns/locale";

type Props = {
  selectedDate: string; // YYYY-MM-DD
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
    <div className="nb-calendar rounded-2xl border border-[#E6E6E4] bg-white/75 p-4 shadow-lg ring-1 ring-black/5">
      <style jsx global>{`
        /* =========================================================
           Nuts Balance Calendar (react-day-picker)
        ========================================================= */

        /* 余白の初期化（カレンダー内だけに作用） */
        .nb-calendar .rdp {
          margin: 0;
        }

        .nb-calendar .rdp-month {
          width: 100%;
        }

        /* 見出し（年月部分） */
        .nb-calendar .rdp-caption {
          position: relative;
          margin-bottom: 0.75rem;
          padding: 0.55rem 0.75rem;
          border-radius: 1rem;
          background: rgba(250, 250, 248, 0.85);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .nb-calendar .rdp-caption_label {
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #2f5d4a;
          font-size: 0.95rem;
        }

        /* ナビ（左右ボタン） */
        .nb-calendar .rdp-nav_button {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
          color: #2f5d4a;
          transition:
            transform 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }
        .nb-calendar .rdp-nav_button:hover {
          background: rgba(230, 241, 236, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(0, 0, 0, 0.08);
        }
        .nb-calendar .rdp-nav_button:active {
          transform: translateY(0px) scale(0.98);
        }

        /* 曜日ラベル */
        .nb-calendar .rdp-head_cell {
          color: #6b7f75;
          font-weight: 800;
          font-size: 0.75rem;
          padding-bottom: 0.35rem;
        }

        /* 日付ボタン（ベース） */
        .nb-calendar .rdp-day {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          font-weight: 700;
          color: #3b2f2a;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }
        .nb-calendar .rdp-day:hover {
          background: rgba(230, 241, 236, 0.9);
          box-shadow: 0 12px 18px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }
        .nb-calendar .rdp-day:active {
          transform: translateY(0px) scale(0.98);
        }

        /* ✅ 選択日：スカイ */
        .nb-calendar .rdp-day[aria-selected="true"] {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            #2dd4bf 0%,
            #60a5fa 100%
          ) !important;
          box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25) !important;
        }

        /* ✅ 今日：背景になじむ控えめなハイライト */
        .nb-calendar .rdp-day_today:not([aria-selected="true"]) {
          background: rgba(250, 250, 248, 0.92) !important;
          box-shadow: inset 0 0 0 2px rgba(159, 191, 175, 0.9);
        }
      `}</style>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        weekStartsOn={1}
        disabled={{ after: new Date() }}
        locale={ja}
      />
    </div>
  );
}
