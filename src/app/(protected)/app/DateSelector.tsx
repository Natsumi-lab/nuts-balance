'use client';

import { useRouter } from 'next/navigation';

/**
 * DateSelectorコンポーネントのプロパティ型
 */
interface DateSelectorProps {
  date: string;
}

/**
 * 日付セレクターコンポーネント
 * 前日、翌日への移動ボタンを提供
 */
export default function DateSelector({ date }: DateSelectorProps) {
  const router = useRouter();

  // 表示用に日付をフォーマット（YYYY-MM-DD -> YYYY年MM月DD日）
  const formatDateForDisplay = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  };

  // 指定した日数オフセットの日付を取得
  const getOffsetDate = (dateStr: string, offset: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  // 前日へ移動
  const goToPreviousDay = () => {
    const prevDate = getOffsetDate(date, -1);
    router.push(`/app?date=${prevDate}`);
  };

  // 翌日へ移動
  const goToNextDay = () => {
    const nextDate = getOffsetDate(date, 1);
    router.push(`/app?date=${nextDate}`);
  };

  // 今日の日付を取得
  const today = new Date().toISOString().split('T')[0];
  // 翌日ボタンを無効化する条件（未来の日付は選べないようにする）
  const isNextDayDisabled = date >= today;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E6E6E4]">
      <div className="text-center mb-5">
        <div className="text-xl font-medium text-[#333]">{formatDateForDisplay(date)}</div>
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={goToPreviousDay}
          className="flex-1 bg-gradient-to-br from-[#E38B3A]/90 to-[#E38B3A] text-white px-4 py-2.5 rounded-xl hover:shadow-md hover:from-[#E38B3A] hover:to-[#E38B3A] transition-all duration-300 text-sm font-medium"
          aria-label="前の日へ"
        >
          前日
        </button>

        <button
          onClick={goToNextDay}
          disabled={isNextDayDisabled}
          className="flex-1 bg-gradient-to-br from-[#E38B3A]/90 to-[#E38B3A] text-white px-4 py-2.5 rounded-xl hover:shadow-md hover:from-[#E38B3A] hover:to-[#E38B3A] transition-all duration-300 text-sm font-medium disabled:from-[#AAA] disabled:to-[#AAA] disabled:cursor-not-allowed"
          aria-label="次の日へ"
        >
          翌日
        </button>
      </div>
    </div>
  );
}