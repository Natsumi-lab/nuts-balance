"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Nut, ActionResult } from "@/lib/types";
import { upsertDailyLog } from "../actions";

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
 * JST の YYYY-MM-DD を返す（「今日」判定をJSTで統一）
 */
function getJstTodayYmd(): string {
  const now = Date.now();
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * 総合スコア(★0〜5)を算出
 * - 選択ナッツの4項目スコア(1〜3)の平均を取り、0〜5へスケール
 */
function computeOverallStars(nuts: Nut[], selectedIds: number[]): number {
  if (selectedIds.length === 0) return 0;

  const byId = new Map<number, Nut>(nuts.map((n) => [n.id, n]));
  let sum = 0;
  let count = 0;

  for (const id of selectedIds) {
    const nut = byId.get(id);
    if (!nut) continue;

    const a = nut.score_antioxidant ?? 0;
    const m = nut.score_mineral ?? 0;
    const f = nut.score_fiber ?? 0;
    const v = nut.score_vitamin ?? 0;

    // 1ナッツあたり4項目
    sum += a + m + f + v;
    count += 4;
  }

  if (count === 0) return 0;

  const avg1to3 = sum / count; // 0〜3
  const stars0to5 = Math.round((avg1to3 / 3) * 5);
  return Math.max(0, Math.min(5, stars0to5));
}

function Stars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={[
            "text-base leading-none",
            i < clamped ? "text-[#F2B705]" : "text-[#D8D8D8]",
          ].join(" ")}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm font-medium text-[#555]">
        {clamped} / 5
      </span>
    </div>
  );
}

function TodayScoreCard({ show, stars }: { show: boolean; stars: number }) {
  return (
    <div
      className={[
        "mt-4 overflow-hidden rounded-2xl border border-[#E6E6E4] bg-[#FAFAF8] shadow-sm",
        "transition-all duration-300 ease-out",
        show
          ? "max-h-40 opacity-100 translate-y-0"
          : "max-h-0 opacity-0 -translate-y-1",
      ].join(" ")}
      aria-hidden={!show}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#333]">
              今日のスコア
            </div>
            <div className="mt-1 text-xs text-[#6B7F75]">
              保存後に表示（今日のみ）
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Stars value={stars} />
        </div>
      </div>
    </div>
  );
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

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, date]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const toggleSelection = (nutId: number) => {
    setSelected((prev) =>
      prev.includes(nutId)
        ? prev.filter((id) => id !== nutId)
        : [...prev, nutId],
    );
  };

  // ▼ 今日だけスコアを出す
  const isToday = date === getJstTodayYmd();

  // ▼ 保存後にふわっと出すための state（今日だけ）
  const [showScore, setShowScore] = useState(false);
  const [stars, setStars] = useState(0);

  // 日付が今日でなくなったら必ず隠す（過去日は非表示）
  useEffect(() => {
    if (!isToday) setShowScore(false);
  }, [isToday]);

  const saveSelection = async () => {
    setResult(null);

    startTransition(async () => {
      try {
        const res = await upsertDailyLog(date, selected);
        setResult(res);

        if (res.success) {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => setResult(null), 2000);

          // ✅ 保存成功時：今日ならスコアを計算して表示
          if (isToday) {
            const computed = computeOverallStars(nuts, selected);
            setStars(computed);
            setShowScore(true);
          } else {
            setShowScore(false);
          }

          router.refresh();
        }
      } catch (error) {
        console.error("保存中にエラーが発生しました:", error);
        setResult({
          success: false,
          message: "予期せぬエラーが発生しました",
        });
      }
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      {/* リスト */}
      <div className="space-y-2.5">
        {nuts.map((nut) => {
          const nutId = nut.id;
          const checked = selected.includes(nutId);

          const normalized = normalizeNutName(nut.name);
          const miniSrc = MINI_NUT_IMAGE_MAP[normalized];

          return (
            <label
              key={String(nutId)}
              className={[
                "flex items-start gap-3 rounded-xl cursor-pointer transition-all",
                // ▼ ここで縦余白を詰める（py-3 → py-2）
                "px-4 py-2",
                checked
                  ? "bg-[#E6F1EC]/60 border border-[#9FBFAF]/30 shadow-sm"
                  : "hover:bg-[#FAFAFA] border border-transparent hover:border-[#E6E6E4]/70",
                isPending ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {/* チェックボックス */}
              <div className="mt-1.5 relative">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelection(nutId)}
                  disabled={isPending}
                  className="sr-only peer"
                  id={`nut-${nutId}`}
                />
                <div className="w-6 h-6 bg-white border-2 border-[#9FBFAF] rounded-md peer-checked:bg-[#E38B3A] peer-checked:border-[#E38B3A] transition-colors"></div>
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
                <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E6E6E4]/80">
                  <Image
                    src={miniSrc}
                    alt={nut.name}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 shrink-0 rounded-xl bg-[#F8F8F6] border border-[#E6E6E4]/80 flex items-center justify-center">
                  <span className="text-[10px] text-[#999]">no img</span>
                </div>
              )}

              {/* テキスト */}
              <div className="min-w-0">
                <h3 className="font-medium text-[#333] leading-6">
                  {nut.name}
                </h3>

                {/* ✅ タグ1個表示（チェック時に少し強調） */}
                <div className="mt-1">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                      checked
                        ? "border-[#9FBFAF]/40 bg-[#E6F1EC]/60 text-[#2F5D4A]"
                        : "border-[#E6E6E4] bg-[#FAFAF8] text-[#2F5D4A]",
                    ].join(" ")}
                  >
                    {getTopTag(nut)}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* 保存ボタン + 結果表示 + 今日のスコア */}
      <div className="mt-6">
        <button
          onClick={saveSelection}
          disabled={isPending}
          className="w-full rounded-2xl px-6 py-3.5 text-white font-semibold
            bg-gradient-to-br from-[#F2B705] via-[#E38B3A] to-[#C46A1C]
            shadow-[0_14px_30px_rgba(0,0,0,0.20)] ring-1 ring-white/30
            transition-all duration-300 ease-out
            hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_22px_44px_rgba(0,0,0,0.26)]
            active:translate-y-0 active:scale-[0.98] active:shadow-[0_10px_22px_rgba(0,0,0,0.18)]
            disabled:from-[#B9B9B9] disabled:via-[#AFAFAF] disabled:to-[#9B9B9B]
            disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isPending ? "保存中..." : "保存する"}
        </button>

        {result ? (
          <div
            className={[
              "mt-3 p-3 rounded-xl text-sm shadow-sm border",
              result.success
                ? "bg-[#E6F1EC]/40 text-[#5E8F76] border-[#9FBFAF]/30"
                : "bg-[#FEE]/40 text-[#C53030] border-[#FEE]/80",
            ].join(" ")}
          >
            {result.message}
          </div>
        ) : null}

        {/* ✅ ふわっと出現（保存成功後 / 今日のみ） */}
        <TodayScoreCard show={isToday && showScore} stars={stars} />
      </div>
    </div>
  );
}
