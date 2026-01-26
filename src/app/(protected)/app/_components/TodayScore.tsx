"use client";

type TodayScoreCardProps = {
  /**
   * 表示制御：保存成功後に true を渡す想定
   * false のときは「非表示（高さ0）」でスペースを取らない
   */
  isVisible: boolean;

  /**
   * 仮表示用（後でスコア算出に置き換える）
   * null のときは「—」表示
   */
  stars?: number | null;

  /**
   * 見出し（任意）
   */
  title?: string;
};

function StarsRow({ value }: { value: number | null }) {
  const v = value == null ? null : Math.max(0, Math.min(5, value));

  return (
    <div className="flex items-center gap-0.5" aria-label="栄養スコア">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={[
            "text-lg leading-none",
            v != null && i < v ? "text-[#F2B705]" : "text-[#D8D8D8]",
          ].join(" ")}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm font-medium text-[#555]">
        {v == null ? "— / 5" : `${v} / 5`}
      </span>
    </div>
  );
}

export default function TodayScoreCard({
  isVisible,
  stars = null,
  title = "今日のスコア",
}: TodayScoreCardProps) {
  return (
    <section
      className={[
        // 非表示時はスペースを取らない（重要）
        "overflow-hidden transition-all duration-300 ease-out",
        isVisible
          ? "max-h-56 opacity-100 translate-y-0"
          : "max-h-0 opacity-0 -translate-y-1",
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <div className="mt-4 rounded-2xl border border-[#E6E6E4] bg-[#FAFAF8] shadow-sm">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#333]">{title}</h3>
              <p className="mt-1 text-xs text-[#6B7F75]">
                保存後に表示（今日はこの結果だけ確認）
              </p>
            </div>

            {/* バッジ（仮） */}
            <span className="inline-flex items-center rounded-full border border-[#E6E6E4] bg-white px-2.5 py-1 text-[11px] font-medium text-[#2F5D4A] shadow-sm">
              Result
            </span>
          </div>

          {/* Body */}
          <div className="mt-4">
            <StarsRow value={stars} />
          </div>

          {/* Footer（仮の説明・後で差し替えOK） */}
          <div className="mt-3 rounded-xl border border-[#E6E6E4] bg-white/70 p-3">
            <p className="text-xs text-[#555] leading-relaxed">
              ここにスコア算出ロジックの結果を表示します（現在はダミー表示）。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
