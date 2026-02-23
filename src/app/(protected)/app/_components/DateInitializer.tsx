"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * JST基準で YYYY-MM-DD を取得
 */
function getJstTodayYmd(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 日付初期化コンポーネント
 * URLクエリに日付がない場合、JST現在日付で遷移
 */
export default function DateInitializer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      const todayJst = getJstTodayYmd();
      router.replace(`/app?date=${todayJst}`);
    }
  }, [router, searchParams]);

  return null;
}
