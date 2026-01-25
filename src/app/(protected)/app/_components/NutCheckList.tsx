"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Nut, ActionResult } from "@/lib/types";
import { upsertDailyLog } from "../actions";

/**
 * ナッツチェックリストコンポーネントのプロパティ型
 * - nuts.id は bigint（Supabaseからは number）想定
 * - selectedNutIds も number[] に寄せるのが理想だが、移行中なので (number|string) を許容
 */
interface NutCheckListProps {
  nuts: Nut[];
  selectedNutIds: Array<number | string>;
  date: string;
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

/**
 * ナッツチェックリストコンポーネント
 * ナッツの選択と保存機能を提供
 */
export default function NutCheckList({
  nuts,
  selectedNutIds,
  date,
}: NutCheckListProps) {
  const router = useRouter();

  // 保存中のUI制御（disabled / ボタン文言など）
  const [isPending, startTransition] = useTransition();

  // 保存結果メッセージ表示用
  const [result, setResult] = useState<ActionResult | null>(null);

  // 「保存しました」などの表示を一定時間後に消すためのタイマー参照
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * selectedNutIds を number[] に正規化（bigint列に合わせる）
   * - Supabaseから string/number が混在しても同じロジックで扱えるようにする
   */
  const initialSelected = useMemo(() => {
    return selectedNutIds
      .map((v) => (typeof v === "string" ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];
  }, [selectedNutIds]);

  // 選択されたナッツIDを管理するローカル状態（numberで統一）
  const [selected, setSelected] = useState<number[]>(initialSelected);

  // 重要：props が変わったら state を同期し直す（保存後の refresh / 日付移動でも崩れない）
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, date]);

  // コンポーネント破棄時にタイマーを掃除（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ナッツの選択状態を切り替える
  const toggleSelection = (nutId: number) => {
    setSelected((prev) =>
      prev.includes(nutId)
        ? prev.filter((id) => id !== nutId)
        : [...prev, nutId],
    );
  };

  // 選択したナッツを保存する
  const saveSelection = async () => {
    setResult(null);

    startTransition(async () => {
      try {
        // Server Actionを呼び出し（actions.ts 側で number|string どちらでも受けられる）
        const res = await upsertDailyLog(date, selected);
        setResult(res);

        if (res.success) {
          // 既存タイマーがあればクリア（連続保存でも表示時間が正しくなる）
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

          // 2秒後にメッセージを消す
          hideTimerRef.current = setTimeout(() => {
            setResult(null);
          }, 2000);

          // サーバー側データを最新にする（選択済み状態など）
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
      {/* リスト - 見出しを削除し親のh3をメインの見出しとして活用 */}
      <div className="space-y-3">
        {nuts.map((nut) => {
          const nutId = nut.id;
          const checked = selected.includes(nutId);

          // mini画像のパスを決定（DBではなく対応表で固定）
          const normalized = normalizeNutName(nut.name);
          const miniSrc = MINI_NUT_IMAGE_MAP[normalized];

          return (
            <label
              key={String(nutId)}
              className={[
                "flex items-start gap-4 rounded-xl px-4 py-3 cursor-pointer transition-all",
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
                  className="sr-only peer" // 非表示にして独自スタイルで表現
                  id={`nut-${nutId}`}
                />
                <div className="w-6 h-6 bg-white border-2 border-[#9FBFAF] rounded-md peer-checked:bg-[#E38B3A] peer-checked:border-[#E38B3A] transition-colors"></div>
                {/* チェック時のアイコン */}
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

              {/* miniアイコン（public/nuts の固定画像） */}
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
                // 対応表に無い場合でもレイアウトが崩れないようプレースホルダーを出す
                <div className="w-16 h-16 shrink-0 rounded-xl bg-[#F8F8F6] border border-[#E6E6E4]/80 flex items-center justify-center">
                  <span className="text-[10px] text-[#999]">no img</span>
                </div>
              )}

              {/* テキスト */}
              <div className="min-w-0">
                <h3 className="font-medium text-[#333] leading-6">
                  {nut.name}
                </h3>
                {nut.description ? (
                  <p className="text-sm text-[#555] leading-relaxed mt-1.5">
                    {nut.description}
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      {/* 保存ボタン + 結果表示 */}
      <div className="mt-8">
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
      </div>
    </div>
  );
}
