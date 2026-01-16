"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="rounded-lg border p-3 bg-white">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        weekStartsOn={1} // 月曜始まり
        disabled={{ after: new Date() }} // 未来日を選択不可
      />
    </div>
  );
}
