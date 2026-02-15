// src/app/(protected)/nuts/page.tsx
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type Nut = {
  id: string;
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
      <div className="rounded-2xl border border-border/20 bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground">ナッツの知識</h1>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました：{error.message}
        </p>
      </div>
    );
  }

  const nuts = (data ?? []) as Nut[];

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-white/20 bg-card p-5 shadow-lg dark:border-white/10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ナッツの知識
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          6種類のナッツの特徴とスコアを一覧で確認できます
        </p>
      </header>

      {/* ナッツ一覧 */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {nuts.map((nut) => {
          const miniSrc = `/nuts/mini-${nutSlugFromName(nut.name)}.png`;
          const desc = nutDescriptions[nut.name];

          return (
            <article
              key={nut.id}
              className="group flex flex-col rounded-2xl border border-white/20 bg-card p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10"
            >
              {/* ナッツ名 + 画像 */}
              <div className="mb-4 flex items-center gap-4">
                {/*  画像*/}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/30 bg-muted/30">
                  <Image
                    src={miniSrc}
                    alt={nut.name}
                    fill
                    sizes="80px"
                    className="
                      rounded-xl object-contain p-1
                      transition-transform duration-300
                      group-hover:scale-105
                    "
                  />
                </div>

                <h2 className="text-xl font-bold text-foreground">
                  {nut.name}
                </h2>
              </div>

              {/* 説明文 */}
              <div className="flex-1 space-y-4 text-sm">
                {desc && (
                  <>
                    <DescriptionSection
                      title="風味と特徴"
                      content={desc.flavor}
                    />
                    <DescriptionSection
                      title="栄養的ポイント"
                      content={desc.nutrition}
                    />
                    <DescriptionSection
                      title="活用シーン"
                      content={desc.usage}
                    />
                  </>
                )}
              </div>

              {/* スコア */}
              <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                <ScoreCell label="抗酸化力" value={nut.score_antioxidant} />
                <ScoreCell label="ミネラル" value={nut.score_mineral} />
                <ScoreCell label="食物繊維" value={nut.score_fiber} />
                <ScoreCell label="ビタミン" value={nut.score_vitamin} />
              </div>
            </article>
          );
        })}
      </section>

      {/* 内容量の目安 */}
      <section
        className="
          rounded-2xl border border-white/20 bg-card p-5 shadow-lg
          transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
          dark:border-white/10
        "
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          1日の目安量
        </h2>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
            ナッツ全体で約25g（片手ひとつかみ程度）を目安にすると、日常の食事に取り入れやすくなります。
          </p>

          <p className="flex items-start gap-2">
            <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
            無塩・素焼きタイプを選ぶと、塩分や余分な油を増やしにくく、継続しやすくなります。
          </p>

          <p className="flex items-start gap-2">
            <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
            ナッツは栄養密度が高い一方でエネルギーも高めのため、食べ過ぎには注意し、量を決めて摂取するのがおすすめです。
          </p>

          <p className="flex items-start gap-2">
            <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
            間食として少量ずつ取り入れるほか、ヨーグルトやサラダに散らすと、食感と満足感を足しやすくなります。
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- コンポーネント ---------- */

/** 説明セクション（見出し + 本文） */
function DescriptionSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-[hsl(var(--primary))]">
        {title}
      </h3>
      <p className="leading-relaxed text-muted-foreground">{content}</p>
    </div>
  );
}

/** スコア表示セル */
function ScoreCell({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div
      className="
        flex items-center justify-between gap-2 rounded-xl
        border border-border/20 bg-muted/40 px-4 py-2
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        hover:shadow-black/5 dark:bg-muted/30 dark:hover:shadow-black/20
        cursor-default
      "
    >
      <span className="w-[5.5rem] whitespace-nowrap text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="shrink-0 text-sm">
        <Stars value={v} max={5} />
      </span>
    </div>
  );
}

/** 星評価表示 */
function Stars({ value, max }: { value: number; max: number }) {
  return (
    <span className="flex items-center gap-0.5 leading-none">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={
            i < value
              ? "text-yellow-500 dark:text-yellow-400"
              : "text-foreground/20"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

/* ---------- ユーティリティ ---------- */

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

/** ナッツ説明データ */
type NutDescription = {
  flavor: string;
  nutrition: string;
  usage: string;
};

const nutDescriptions: Record<string, NutDescription> = {
  アーモンド: {
    flavor:
      "香ばしさと軽やかな歯ごたえが特長の定番ナッツ。クセが少なく、日常の食事に取り入れやすい存在です。",
    nutrition:
      "ビタミンEを含み、脂質はバランスの取れた構成。間食としても使いやすい食品です。",
    usage:
      "そのままはもちろん、ヨーグルトやサラダのトッピングにも適しています。",
  },

  くるみ: {
    flavor:
      "コクとほのかな苦みを持つ、存在感のあるナッツ。独特の風味が料理に深みを与えます。",
    nutrition: "脂質を多く含み、食事の満足感を高めやすい食品です。",
    usage:
      "刻んでサラダやパン生地に加えるなど、調理素材としても幅広く使われています。",
  },

  カシューナッツ: {
    flavor:
      "やわらかな食感とやさしい甘みが特長。刺激が少なく、幅広い層に親しまれています。",
    nutrition:
      "ミネラルを含み、エネルギー源としても活用されるナッツ。少量でも満足感を得やすく、間食として取り入れやすい食品です。",
    usage: "そのままの間食に加え、炒め物やエスニック料理にもよく合います。",
  },

  ピスタチオ: {
    flavor:
      "鮮やかな色合いと香ばしさが印象的なナッツ。殻付きで提供されることも多い食品です。",
    nutrition:
      "食物繊維を含み、咀嚼回数が自然に増えやすい食品。間食としてゆっくり摂取しやすい特性があります。",
    usage: "製菓やデザートの彩りとしても活用されることが多い素材です。",
  },

  マカダミアナッツ: {
    flavor: "クリーミーで濃厚な口当たりが特長。丸みのある味わいを持ちます。",
    nutrition:
      "脂質を多く含み、エネルギー密度が高いナッツ。少量でも満足感を得やすく、補助的なエネルギー源として利用されます。",
    usage:
      "そのままの摂取に加え、チョコレート製品などにも広く使用されています。",
  },

  ヘーゼルナッツ: {
    flavor:
      "香り高く、深みのあるコクを持つナッツ。加熱することで香ばしさが際立ちます。",
    nutrition:
      "ビタミンEを含み、脂質構成にも特徴があります。加工食品にも適し、風味と栄養の両面で活用されています。",
    usage: "スプレッドや焼き菓子など、菓子分野で多く利用される素材です。",
  },
};
