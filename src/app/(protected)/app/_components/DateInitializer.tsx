'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * 日付初期化コンポーネント
 * URLクエリに日付がない場合、現在の日付を設定して遷移
 */
export default function DateInitializer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URLから日付を取得
    const dateParam = searchParams.get('date');

    // 日付がない場合は、現在のローカル日付で補完
    if (!dateParam) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      router.replace(`/app?date=${today}`);
    }
  }, [router, searchParams]);

  return null; // このコンポーネントはUIをレンダリングしない
}