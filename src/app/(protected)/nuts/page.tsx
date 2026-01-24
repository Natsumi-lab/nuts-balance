import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type Nut = {
  id: string; // uuid
  name: string;
  description: string;
  image_path: string;
  score_antioxidant: number;
  score_mineral: number;
  score_fiber: number;
  score_vitamin: number;
};

export default async function NutsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nuts")
    .select(
      "id, name, description, image_path, score_antioxidant, score_mineral, score_fiber, score_vitamin",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-black/5">
        <h1 className="text-2xl font-bold">ナッツの知識</h1>
        <p className="mt-2 text-sm text-red-600">
          読み込みに失敗しました：{error.message}
        </p>
      </div>
    );
  }

  const nuts = (data ?? []) as Nut[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">ナッツの知識</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          6種類のナッツの特徴とスコアを一覧で確認できます
        </p>
      </header>

      {/* 3列固定（lg以上で3列） */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {nuts.map((nut) => {
          const miniSrc = `/nuts/mini-${nutSlugFromName(nut.name)}.png`;

          return (
            <article
              key={nut.id}
              className={[
                "group rounded-2xl bg-white/80 p-5 ring-1 ring-black/5",
                "shadow-sm transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10",
                "hover:bg-white",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                {/* 画像 */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5 bg-[#FAFAF8]">
                  <Image
                    src={miniSrc}
                    alt={nut.name}
                    fill
                    className="object-contain p-1 rounded-2xl transition-transform duration-300 ease-out group-hover:scale-105"
                    sizes="64px"
                  />
                </div>

                {/* テキスト */}
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{nut.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                    {nutDescriptions[nut.name] ?? nut.description}
                  </p>
                </div>
              </div>

              {/* スコア */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                <StarScore label="抗酸化力" value={nut.score_antioxidant} />
                <StarScore label="ミネラル" value={nut.score_mineral} />
                <StarScore label="食物繊維" value={nut.score_fiber} />
                <StarScore label="ビタミン" value={nut.score_vitamin} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

/**
 * ナッツ名 → 画像用スラッグ
 */
function nutSlugFromName(name: string) {
  const map: Record<string, string> = {
    アーモンド: "almond",
    くるみ: "walnuts",
    カシューナッツ: "cashew",
    ピスタチオ: "pistachio",
    マカダミアナッツ: "macadamia",
    ヘーゼルナッツ: "hazel",
  };

  return map[name] ?? "almond";
}

/**
 * 図鑑用　説明文
 */
const nutDescriptions: Record<string, string> = {
  アーモンド:
    "香ばしくて食べやすい、定番のナッツ。\nビタミンEを含み、毎日の間食にも取り入れやすいのが魅力です。",
  くるみ:
    "コクのある味わいが特徴のナッツ。\nバランスの良い脂質を含み、食事や間食にそっと加えやすい存在です。",
  カシューナッツ:
    "やさしい甘みと、やわらかな食感が特徴。\nミネラルを含み、少量でも満足感を得やすいナッツです。",
  ピスタチオ:
    "鮮やかな色合いと香ばしさが印象的。\n食物繊維も含まれ、ゆっくり味わう間食に向いています。",
  マカダミアナッツ:
    "クリーミーでコクのある味わいが魅力。\n少量でも満足しやすく、ちょっとしたご褒美にぴったりです。",
  ヘーゼルナッツ:
    "独特の香りと深いコクが特徴。\nそのままでも、砕いて使っても風味を楽しめます。",
};

function StarScore({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Stars value={v} max={5} />
    </div>
  );
}

function Stars({ value, max }: { value: number; max: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`星 ${value}/${max}`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <span
            key={i}
            className={filled ? "text-yellow-500" : "text-black/20"}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
