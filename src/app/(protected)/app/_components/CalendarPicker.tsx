"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from "date-fns/locale";

type Props = {
  selectedDate: string; // YYYY-MM-DD（選択中の日付）
  recordedDates: string[]; // 摂取記録がある日（YYYY-MM-DD配列）
  skippedDates: string[]; // スキップ日（YYYY-MM-DD配列）
};

export default function CalendarPicker({
  selectedDate,
  recordedDates,
  skippedDates,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // react-day-picker は Date を前提にしているので、文字列を Date に変換
  const selected = new Date(selectedDate);

  // YYYY-MM-DD → Date（タイムゾーン差異で日付ズレしないように 00:00 を明示）
  const recordedDateObjects = recordedDates.map(
    (d) => new Date(d + "T00:00:00"),
  );

  const skippedDateObjects = skippedDates.map((d) => new Date(d + "T00:00:00"));

  /**
   * 日付クリック時に URL の query を更新して、表示日を切り替える
   * /app?date=YYYY-MM-DD
   */
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
    <div className="nb-calendar rounded-2xl border border-[#E6E6E4] bg-white/75 px-4 py-3 shadow-lg ring-1 ring-black/5">
      <style jsx global>{`
        /* =========================================================
           Nuts Balance Calendar (react-day-picker)
        ========================================================= */

        /* ----------------------------
           react-day-picker の余白をリセット
           ---------------------------- */
        .nb-calendar .rdp {
          margin: 0;
        }

        .nb-calendar .rdp-month {
          width: 100%;
          margin: 0;
        }

        .nb-calendar .rdp-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
        }

        .nb-calendar .rdp-row {
          height: 2.5rem;
        }

        /* ----------------------------
           見出し（年月）エリア
           ---------------------------- */
        .nb-calendar .rdp-caption {
          position: relative;
          margin-bottom: 0.6rem;
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

        /* ----------------------------
           曜日ラベル
           ---------------------------- */
        .nb-calendar .rdp-head_cell {
          color: #6b7f75;
          font-weight: 800;
          font-size: 0.75rem;
          padding-bottom: 0.25rem;
        }

        /* ----------------------------
           日付ボタン（ベース）
           ---------------------------- */
        .nb-calendar .rdp-day {
          width: 2.45rem;
          height: 2.45rem;
          border-radius: 9999px;
          font-weight: 700;
          color: #3b2f2a;
          position: relative;
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

        /* --- テーブルを7列均等に広げて、右余白を消す --- */
        .nb-calendar .rdp-tbody,
        .nb-calendar .rdp-thead,
        .nb-calendar .rdp-table {
          width: 100%;
        }

        .nb-calendar .rdp-head_row,
        .nb-calendar .rdp-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }

        .nb-calendar .rdp-head_cell,
        .nb-calendar .rdp-cell {
          width: 100%;
        }

        .nb-calendar .rdp-day {
          margin: 0 auto;
        }

        /*  選択日 */
        .nb-calendar .rdp-day[aria-selected="true"] {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            #2dd4bf 0%,
            #60a5fa 100%
          ) !important;
          box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25) !important;
        }

        /*  今日 */
        .nb-calendar .rdp-day_today:not([aria-selected="true"]) {
          background: rgba(250, 250, 248, 0.92) !important;
          box-shadow: inset 0 0 0 2px rgba(159, 191, 175, 0.9);
        }

        /*  記録がある日（摂取日） */
        .nb-calendar .rdp-day_recorded:not([aria-selected="true"])::after {
          content: "";
          position: absolute;
          inset: 0.28rem;
          border-radius: 9999px;
          background: rgba(147, 197, 253, 0.35);
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
          pointer-events: none;
        }

        /*  スキップ日（グレー表示） */
        .nb-calendar .rdp-day_skipped:not([aria-selected="true"]) {
          color: rgba(59, 47, 42, 0.45) !important; /* 文字を薄く */
        }

        .nb-calendar .rdp-day_skipped:not([aria-selected="true"])::after {
          content: "";
          position: absolute;
          inset: 0.28rem;
          border-radius: 9999px;

          /* グレーの薄塗り */
          background: rgba(0, 0, 0, 0.06);

          /* 薄い枠 */
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);

          pointer-events: none;
        }

        /*  万が一 recorded と skipped が両方付いたら recorded を優先 */
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped:not([aria-selected="true"]) {
          color: #3b2f2a !important;
        }
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped:not([aria-selected="true"])::after {
          background: rgba(147, 197, 253, 0.35);
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
        }
      `}</style>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        weekStartsOn={1}
        disabled={{ after: new Date() }}
        locale={ja}
        modifiers={{
          recorded: recordedDateObjects,
          skipped: skippedDateObjects,
        }}
        modifiersClassNames={{
          recorded: "rdp-day_recorded",
          skipped: "rdp-day_skipped",
        }}
      />
    </div>
  );
}
