"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from "date-fns/locale";

type Props = {
  selectedDate: string; // YYYY-MM-DD
  recordedDates: string[]; // YYYY-MM-DD[]
  skippedDates: string[]; // YYYY-MM-DD[]
};

function toDateAtLocalMidnight(ymd: string) {
  return new Date(`${ymd}T00:00:00`);
}

/** Date -> YYYY-MM-DD（ローカル基準） */
function toYmdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPicker({
  selectedDate,
  recordedDates,
  skippedDates,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 選択日（ローカル00:00で固定）
  const selected = useMemo(
    () => toDateAtLocalMidnight(selectedDate),
    [selectedDate],
  );

  // ✅ 表示月を外側で制御
  const [month, setMonth] = useState<Date>(() => selected);

  useEffect(() => {
    setMonth(selected);
  }, [selected]);

  // ✅ 文字列Setにして O(1) 参照
  const recordedSet = useMemo(() => new Set(recordedDates), [recordedDates]);
  const skippedSet = useMemo(() => new Set(skippedDates), [skippedDates]);

  const onSelect = (date?: Date) => {
    if (!date) return;

    const nextDate = toYmdLocal(date);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);
    router.push(`/app?${params.toString()}`);
  };

  return (
    <div className="nb-calendar rounded-2xl border border-border bg-card/75 px-4 py-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
      <style jsx global>{`
        /* =========================================================
           Nuts Balance Calendar (react-day-picker)
        ========================================================= */
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

        .nb-calendar .rdp-caption {
          position: relative;
          margin-bottom: 0.6rem;
          padding: 0.55rem 0.75rem;
          border-radius: 1rem;
          background: hsl(var(--muted) / 0.85);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
          border: 1px solid hsl(var(--border) / 0.5);
        }

        .nb-calendar .rdp-caption_label {
          font-weight: 800;
          letter-spacing: 0.02em;
          color: hsl(var(--primary));
          font-size: 0.95rem;
        }

        .nb-calendar .rdp-head_cell {
          color: hsl(var(--muted-foreground));
          font-weight: 800;
          font-size: 0.75rem;
          padding-bottom: 0.25rem;
        }

        .nb-calendar .rdp-day {
          width: 2.45rem;
          height: 2.45rem;
          border-radius: 9999px;
          font-weight: 700;
          color: hsl(var(--card-foreground));
          position: relative;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
          margin: 0 auto;
        }

        .nb-calendar .rdp-day:hover {
          background: hsl(var(--secondary) / 0.5);
          box-shadow: 0 12px 18px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .nb-calendar .rdp-day:active {
          transform: translateY(0px) scale(0.98);
        }

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

        .nb-calendar .rdp-day[aria-selected="true"] {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            #2dd4bf 0%,
            #60a5fa 100%
          ) !important;
          box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25) !important;
        }

        .nb-calendar .rdp-day_today:not([aria-selected="true"]) {
          background: hsl(var(--muted) / 0.92) !important;
          box-shadow: inset 0 0 0 2px hsl(var(--secondary) / 0.9);
        }

        /* =========================================================
           記録日 / スキップ日 マーカー
           - react-day-picker v9 では modifiers の class が
             「.rdp-day(ボタン)」ではなく「親要素(.rdp-cellなど)」に付く場合がある。
           - そのため、どちらに付いても効くように “両対応セレクタ” を使う。
        ========================================================= */

        /* ----------------------------
            記録がある日（摂取日）
           ---------------------------- */

        /* パターンA: class がボタン(.rdp-day)に付く場合 */
        .nb-calendar .rdp-day_recorded:not([aria-selected="true"])::after,
        /* パターンB: class が親要素(.rdp-cell等)に付く場合 → 子の .rdp-day に対して描画 */
        .nb-calendar
          .rdp-day_recorded
          :where(.rdp-day):not([aria-selected="true"])::after {
          content: "";
          position: absolute;
          inset: 0.28rem;
          border-radius: 9999px;
          background: rgba(147, 197, 253, 0.35);
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
          pointer-events: none;
        }

        /* ----------------------------
            スキップ日（グレー表示）
           ---------------------------- */

        /* テキスト色（両対応） */
        .nb-calendar .rdp-day_skipped:not([aria-selected="true"]),
        .nb-calendar
          .rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"]) {
          color: hsl(var(--muted-foreground) / 0.6) !important;
        }

        /* 背景マーカー（両対応） */
        .nb-calendar .rdp-day_skipped:not([aria-selected="true"])::after,
        .nb-calendar
          .rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"])::after {
          content: "";
          position: absolute;
          inset: 0.28rem;
          border-radius: 9999px;
          background: hsl(var(--muted) / 0.5);
          box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.5);
          pointer-events: none;
        }

        /* ----------------------------
            recorded と skipped が両方付いたら recorded を優先
           （基本は起きないはずだが、保険）
           ---------------------------- */

        /* テキスト色を recorded 寄りに戻す（両対応） */
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped:not([aria-selected="true"]),
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"]) {
          color: hsl(var(--card-foreground)) !important;
        }

        /* マーカーも recorded を優先（両対応） */
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped:not([aria-selected="true"])::after,
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"])::after {
          background: rgba(147, 197, 253, 0.35);
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
        }
      `}</style>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        weekStartsOn={1}
        disabled={{ after: new Date() }}
        locale={ja}
        // ✅ Date[] をやめて、関数 matcher にする（これが決定打）
        modifiers={{
          recorded: (d) => recordedSet.has(toYmdLocal(d)),
          skipped: (d) => skippedSet.has(toYmdLocal(d)),
        }}
        modifiersClassNames={{
          recorded: "rdp-day_recorded",
          skipped: "rdp-day_skipped",
        }}
      />
    </div>
  );
}
