"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_QUERY_KEY = "date";
const APP_PATH = "/app";

/**
 * JST基準の今日の日付を YYYY-MM-DD 形式で返す
 */
function getTodayJstDate(): string {
  return new Date(Date.now() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * URLに date クエリがない場合、JST の当日日付を付与して遷移する
 */
export default function DateInitializer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const selectedDate = searchParams.get(DATE_QUERY_KEY);

    if (selectedDate) {
      return;
    }

    const today = getTodayJstDate();
    router.replace(`${APP_PATH}?${DATE_QUERY_KEY}=${today}`);
  }, [router, searchParams]);

  return null;
}
