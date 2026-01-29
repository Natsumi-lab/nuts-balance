"use client";

type Props = {
  show: boolean;
  stars: number; // 0〜5
};

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

export default function TodayScore({ show, stars }: Props) {
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
