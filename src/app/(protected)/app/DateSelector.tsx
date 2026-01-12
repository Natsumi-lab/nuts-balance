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
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">日付選択</h2>

      <div className="text-center mb-4">
        <div className="text-lg font-medium">{formatDateForDisplay(date)}</div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={goToPreviousDay}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          前日
        </button>

        <button
          onClick={goToNextDay}
          disabled={isNextDayDisabled}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          翌日
        </button>
      </div>
    </div>
  );
}