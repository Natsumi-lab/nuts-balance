"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ja } from "date-fns/locale";

type Props = {
  selectedDate: string;
  recordedDates: string[];
  skippedDates: string[];
};

const APP_PATH = "/app";
const DATE_QUERY_KEY = "date";
const FIRST_DAY_OF_MONTH = "01";

/**
 * YYYY-MM-DD をローカル時刻の 00:00 の Date に変換する
 */
function toLocalDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`);
}

/**
 * Date をローカル基準の YYYY-MM-DD に変換する
 */
function formatDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * 指定した月の1日を YYYY-MM-DD で返す
 */
function formatMonthStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-${FIRST_DAY_OF_MONTH}`;
}

export default function CalendarPicker({
  selectedDate,
  recordedDates,
  skippedDates,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDay = useMemo(() => toLocalDate(selectedDate), [selectedDate]);
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDay);

  useEffect(() => {
    setDisplayMonth(selectedDay);
  }, [selectedDay]);

  const recordedDateSet = useMemo(
    () => new Set(recordedDates),
    [recordedDates],
  );
  const skippedDateSet = useMemo(() => new Set(skippedDates), [skippedDates]);

  function pushDateToQuery(nextDate: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set(DATE_QUERY_KEY, nextDate);
    router.push(`${APP_PATH}?${params.toString()}`);
  }

  function handleMonthChange(nextMonth: Date): void {
    setDisplayMonth(nextMonth);
    pushDateToQuery(formatMonthStart(nextMonth));
  }

  function handleDateSelect(date?: Date): void {
    if (!date) {
      return;
    }

    pushDateToQuery(formatDateToYmd(date));
  }

  return (
    <div className="nb-calendar rounded-2xl border border-border bg-card/75 px-4 py-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
      <style jsx global>{`
        .nb-calendar .rdp-root {
          width: fit-content;
          margin: 0 auto;
        }

        .nb-calendar .rdp-months {
          display: flex;
          justify-content: center;
        }

        .nb-calendar .rdp-month {
          width: 100%;
          max-width: 22rem;
          margin: 0;
        }

        .nb-calendar .rdp-month_grid {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .nb-calendar .rdp-week {
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
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: hsl(var(--primary));
        }

        .nb-calendar .rdp-weekday {
          padding-bottom: 0.25rem;
          font-size: 0.75rem;
          font-weight: 800;
          color: hsl(var(--muted-foreground));
          text-align: center;
        }

        .nb-calendar .rdp-day {
          position: relative;
          width: 2.45rem;
          height: 2.45rem;
          margin: 0 auto;
          border-radius: 9999px;
          font-weight: 700;
          color: hsl(var(--card-foreground));
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .nb-calendar .rdp-day:hover {
          background: hsl(var(--secondary) / 0.5);
          box-shadow: 0 12px 18px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .nb-calendar .rdp-day:active {
          transform: translateY(0) scale(0.98);
        }

        .nb-calendar .rdp-selected .rdp-day,
        .nb-calendar .rdp-day[aria-selected="true"] {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            #2dd4bf 0%,
            #60a5fa 100%
          ) !important;
          box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25) !important;
        }

        .nb-calendar .rdp-today:not(.rdp-selected) .rdp-day,
        .nb-calendar .rdp-day_today:not([aria-selected="true"]) {
          background: hsl(var(--muted) / 0.92) !important;
          box-shadow: inset 0 0 0 2px hsl(var(--secondary) / 0.9);
        }

        .nb-calendar .rdp-day_recorded:not([aria-selected="true"])::after,
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

        .nb-calendar .rdp-day_skipped:not([aria-selected="true"]),
        .nb-calendar
          .rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"]) {
          color: hsl(var(--muted-foreground) / 0.6) !important;
        }

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

        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped:not([aria-selected="true"]),
        .nb-calendar
          .rdp-day_recorded.rdp-day_skipped
          :where(.rdp-day):not([aria-selected="true"]) {
          color: hsl(var(--card-foreground)) !important;
        }

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
        selected={selectedDay}
        onSelect={handleDateSelect}
        month={displayMonth}
        onMonthChange={handleMonthChange}
        weekStartsOn={1}
        disabled={{ after: new Date() }}
        locale={ja}
        modifiers={{
          recorded: (date) => recordedDateSet.has(formatDateToYmd(date)),
          skipped: (date) => skippedDateSet.has(formatDateToYmd(date)),
        }}
        modifiersClassNames={{
          recorded: "rdp-day_recorded",
          skipped: "rdp-day_skipped",
        }}
      />
    </div>
  );
}
