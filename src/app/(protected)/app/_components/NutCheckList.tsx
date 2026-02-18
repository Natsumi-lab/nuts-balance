"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Nut, ActionResult } from "@/lib/types";
import { upsertDailyLog, skipToday } from "../actions";

/**
 * ナッツチェックリストコンポーネントのプロパティ型
 */
interface NutCheckListProps {
  nuts: Nut[];
  selectedNutIds: Array<number | string>;
  date: string; // YYYY-MM-DD
}

const MINI_NUT_IMAGE_MAP: Record<string, string> = {
  アーモンド: "/nuts/mini-almond.png",
  くるみ: "/nuts/mini-walnuts.png",
  カシューナッツ: "/nuts/mini-cashew.png",
  ピスタチオ: "/nuts/mini-pistachio.png",
  マカダミアナッツ: "/nuts/mini-macadamia.png",
  ヘーゼルナッツ: "/nuts/mini-hazel.png",
};

/**
 * 表記ゆれ対策：空白を除去して比較しやすくする
 */
function normalizeNutName(name: string) {
  return name.replace(/\s+/g, "").trim();
}

type ScoreKey =
  | "score_antioxidant"
  | "score_mineral"
  | "score_fiber"
  | "score_vitamin";

const TAG_DEFS: Array<{ key: ScoreKey; label: string }> = [
  { key: "score_antioxidant", label: "抗酸化が強い" },
  { key: "score_vitamin", label: "ビタミン豊富" },
  { key: "score_fiber", label: "食物繊維" },
  { key: "score_mineral", label: "ミネラル" },
];

function getTopTag(nut: Nut): string {
  let best = TAG_DEFS[0];
  let bestScore = nut[best.key] ?? 0;

  for (const def of TAG_DEFS) {
    const score = nut[def.key] ?? 0;
    if (score > bestScore) {
      best = def;
      bestScore = score;
    }
  }

  if (bestScore <= 0) return "バランス";
  return best.label;
}

/**
 * JST の YYYY-MM-DD を返す（未来日判定をJSTで統一）
 */
function getJstTodayYmd(): string {
  const now = Date.now();
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * YYYY-MM-DD → Date（ローカル）
 */
function parseYmd(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date → YYYY-MM-DD（ローカル）
 */
function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 表示用：M/D（W）
 */
function formatJaLabel(date: string): string {
  const d = parseYmd(date);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

/**
 * ナッツチェックリストコンポーネント
 */
export default function NutCheckList({
  nuts,
  selectedNutIds,
  date,
}: NutCheckListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialSelected = useMemo(() => {
    return selectedNutIds
      .map((v) => (typeof v === "string" ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];
  }, [selectedNutIds]);

  const [selected, setSelected] = useState<number[]>(initialSelected);

  // propsが変わったらstateを同期（日付移動・refreshでも崩れない）
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, date]);

  //  日付が変わったら結果表示は消す（残り続ける問題の解消）
  useEffect(() => {
    setResult(null);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, [date]);

  // タイマー掃除
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showResultTemporarily = (res: ActionResult, ms = 2000) => {
    setResult(res);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setResult(null), ms);
  };

  const toggleSelection = (nutId: number) => {
    setSelected((prev) =>
      prev.includes(nutId)
        ? prev.filter((id) => id !== nutId)
        : [...prev, nutId],
    );
  };

  const saveSelection = async () => {
    setResult(null);

    startTransition(async () => {
      try {
        const res = await upsertDailyLog(date, selected);

        if (res.success) {
          showResultTemporarily(res, 2000);
          router.refresh();
        } else {
          showResultTemporarily(res, 2500);
        }
      } catch (error) {
        console.error("保存中にエラーが発生しました:", error);
        showResultTemporarily(
          { success: false, message: "予期せぬエラーが発生しました" },
          2500,
        );
      }
    });
  };

  // 前日/翌日へ（URLのdateだけ変える）
  const goPrevDay = () => {
    const prev = parseYmd(date);
    prev.setDate(prev.getDate() - 1);
    router.push(`/app?date=${formatYmd(prev)}`);
  };

  const goNextDay = () => {
    const next = parseYmd(date);
    next.setDate(next.getDate() + 1);
    router.push(`/app?date=${formatYmd(next)}`);
  };

  // 未来日の翌日を無効化（JST基準）
  const todayYmd = getJstTodayYmd();
  const isNextDisabled = date >= todayYmd;

  //  「今日のみ」スキップ可能
  const isToday = date === todayYmd;
  const isSkipDisabled = isPending || !isToday;

  const handleSkipToday = () => {
    setResult(null);

    // UI側でもブロック（念のため）
    if (!isToday) {
      showResultTemporarily(
        { success: false, message: "スキップは今日のみ可能です" },
        2500,
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await skipToday(date);

        if (res.success) {
          showResultTemporarily(res, 2000);
          router.refresh();
        } else {
          showResultTemporarily(res, 2500);
        }
      } catch (error) {
        console.error("Skip error:", error);
        showResultTemporarily(
          { success: false, message: "スキップ処理中にエラーが発生しました" },
          2500,
        );
      }
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      {/*  ヘッダー：中央に日付 + 左右に前日/翌日 */}
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={goPrevDay}
            disabled={isPending}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "border border-[#E6E6E4] bg-[#FAFAF8] text-[#2F5D4A] shadow-sm",
              "hover:bg-white hover:shadow-md transition-all",
              isPending ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            aria-label="前日へ"
          >
            ← 前日
          </button>
        </div>

        <div className="text-center">
          <div className="text-xl font-bold text-[#2F3A34] leading-tight">
            {formatJaLabel(date)}の記録
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={goNextDay}
            disabled={isPending || isNextDisabled}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "border border-[#E6E6E4] bg-[#FAFAF8] text-[#2F5D4A] shadow-sm",
              "hover:bg-white hover:shadow-md transition-all",
              isPending || isNextDisabled
                ? "opacity-60 cursor-not-allowed"
                : "",
            ].join(" ")}
            aria-label="翌日へ"
          >
            翌日 →
          </button>
        </div>
      </div>

      {/*  ナッツ：縦2×横3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {nuts.map((nut) => {
          const nutId = nut.id;
          const checked = selected.includes(nutId);

          const normalized = normalizeNutName(nut.name);
          const miniSrc = MINI_NUT_IMAGE_MAP[normalized];

          return (
            <label
              key={String(nutId)}
              className={[
                "rounded-2xl cursor-pointer border p-3",
                "transition-all duration-200 ease-out will-change-transform",
                "hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.12)] hover:ring-1 hover:ring-black/5",
                "active:translate-y-0 active:shadow-[0_10px_18px_rgba(0,0,0,0.10)]",
                checked
                  ? [
                      "bg-[#E6F1EC]/60 border-[#9FBFAF]/30",
                      "shadow-[0_10px_18px_rgba(0,0,0,0.08)]",
                      "hover:shadow-[0_20px_44px_rgba(0,0,0,0.14)]",
                    ].join(" ")
                  : "bg-white hover:bg-[#FAFAFA] border-[#E6E6E4]/70",
                isPending
                  ? "opacity-70 cursor-not-allowed pointer-events-none"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                {/* チェックボックス */}
                <div className="mt-1 relative">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(nutId)}
                    disabled={isPending}
                    className="sr-only peer"
                    id={`nut-${nutId}`}
                  />

                  <div
                    className={[
                      "w-6 h-6 rounded-md border-2 transition-all duration-200",
                      "bg-white border-[#9FBFAF]",
                      "shadow-[0_2px_0_rgba(0,0,0,0.12)]",
                      "ring-1 ring-white/60",
                      "hover:scale-110 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(0,0,0,0.14)]",
                      "peer-checked:bg-[#F4B24E] peer-checked:border-[#E9A73F]",
                      "peer-checked:shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_2px_0_rgba(0,0,0,0.12)]",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-[#F9D977]/70 peer-focus-visible:ring-offset-2",
                    ].join(" ")}
                  />

                  {checked && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* miniアイコン */}
                {miniSrc ? (
                  <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E6E6E4]/80">
                    <Image
                      src={miniSrc}
                      alt={nut.name}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#F8F8F6] border border-[#E6E6E4]/80 flex items-center justify-center">
                    <span className="text-[10px] text-[#999]">no img</span>
                  </div>
                )}

                {/* テキスト */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#333] leading-5 text-sm">
                    {nut.name}
                  </h3>

                  <div className="mt-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        checked
                          ? "border-[#9FBFAF]/40 bg-[#E6F1EC]/60 text-[#2F5D4A]"
                          : "border-[#E6E6E4] bg-[#FAFAF8] text-[#2F5D4A]",
                      ].join(" ")}
                    >
                      {getTopTag(nut)}
                    </span>
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* 保存ボタン + 結果表示 */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* 左：今日は食べなかった */}
          <button
            type="button"
            onClick={handleSkipToday}
            disabled={isSkipDisabled}
            className={[
              "rounded-2xl px-4 py-3 font-semibold",
              "bg-white border border-[#E6E6E4] text-[#333]",
              "shadow-sm transition-all duration-200 ease-out",
              "hover:-translate-y-1 hover:shadow-md",
              "active:translate-y-0 active:shadow-sm",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
            title={!isToday ? "スキップは今日のみ可能です" : undefined}
          >
            今日は食べなかった
          </button>

          {/* 右：保存 */}
          <button
            onClick={saveSelection}
            disabled={isPending || selected.length === 0}
            className={[
              "rounded-2xl px-4 py-3 font-semibold text-white",
              "bg-gradient-to-b from-[#FBE38E] via-[#F4B24E] to-[#E98A3F]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_0_rgba(0,0,0,0.08),0_14px_24px_rgba(0,0,0,0.10)]",
              "ring-1 ring-white/35",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-1 hover:scale-[1.02]",
              "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_0_rgba(0,0,0,0.12),0_24px_40px_rgba(0,0,0,0.14)]",
              "active:translate-y-1 active:scale-[0.99]",
              "active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.18),0_4px_0_rgba(0,0,0,0.18),0_10px_18px_rgba(0,0,0,0.14)]",
              "disabled:from-[#B9B9B9] disabled:via-[#AFAFAF] disabled:to-[#9B9B9B]",
              "disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>

        {/* 結果表示 */}
        {result && (
          <div
            className={[
              "p-3 rounded-xl text-sm shadow-sm border text-center",
              result.success
                ? "bg-[#E6F1EC]/40 text-[#5E8F76] border-[#9FBFAF]/30"
                : "bg-[#FEE]/40 text-[#C53030] border-[#FEE]/80",
            ].join(" ")}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
