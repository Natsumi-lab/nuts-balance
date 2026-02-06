import type { ScoreKey, ScoreResult } from "./score";

type CommentCategory = "balance" | "strength";

const LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

/**
 * 文字列を安定した数値へ（簡易ハッシュ）
 * - 日付seed固定の「擬似ランダム」に使う
 */
function hashToUint32(input: string): number {
  let h = 2166136261; // FNV-1a 32bitベース
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic<T>(list: readonly T[], seed: string): T {
  const idx = hashToUint32(seed) % list.length;
  return list[idx];
}

/**
 * カテゴリ別のコメントテンプレート
 * - strength は strongestKey を埋め込む（混合はしない）
 */
const BALANCE_TEMPLATES = [
  "今日は全体がきれいに揃っています。偏りが少なく、習慣としてとても理想的なバランスです。",
  "どの項目も大きな差がなく安定しています。無理なく続けられる良いペースですね。",
  "全体がなだらかで整った記録です。こうした日を重ねることが健康習慣につながります。",
  "突出や不足が少なく、バランスの良い内容です。継続に強い理想的なパターンです。",
  "今日は全体が安定しています。毎日の積み重ねとして、とても良い状態です。",
  "バランスが取れていて安心感のある記録です。この流れを保てると理想的です。",
  "偏りが見られず、全体が整っています。習慣として完成度が高い日です。",
] as const;

const STRENGTH_TEMPLATES = [
  "今日は「{label}」が特に伸びています。この調子で継続しましょう。",
  "今日も「{label}」がしっかり確保できています。習慣化できてきています。",
  "今日は「{label}」が主役の日です。明日からも無理なく続けましょう。",
  "「{label}」がしっかり取れています。明日もバランスよく続けたいですね。",
  "今日の記録は「{label}」がポイントです。明日も無理なく積み重ねていきましょう。",
  "「{label}」が目立つ内容でした。得意な部分を伸ばせていて良い調子です。",
  "今日は「{label}」が強い構成です。自分に合った選択ができています。",
] as const;

export type CommentInput = {
  date: string;           // YYYY-MM-DD
  streak: number;         
  scoreResult: ScoreResult;
};

/**
 * ひとことコメントを生成（その日単位で固定）
 * - ルール：isBalanced なら balance、そうでなければ strength
 * - ランダム：date + category をseedにして固定
 */
export function generateDailyComment({ date, scoreResult }: CommentInput): string {
  const category: CommentCategory = scoreResult.isBalanced ? "balance" : "strength";
  const seedBase = `${date}:${category}`;

  if (category === "balance") {
    return pickDeterministic(BALANCE_TEMPLATES, seedBase);
  }

  const label = LABELS[scoreResult.strongestKey];
  const tmpl = pickDeterministic(STRENGTH_TEMPLATES, seedBase);
  return tmpl.replace("{label}", label);
}

/**
 * isSaved=false の時に出すメッセージ
 */
export const SCORE_EMPTY_MESSAGE = "保存するとスコアが表示されます";

// ========================================
// 月次コメント生成
// ========================================

/** 月次用スコアラベル */
const MONTHLY_SCORE_LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

/** 記録0日の場合のコメント */
export const MONTHLY_EMPTY_MESSAGE =
  "今月はまだ記録がありません。ナッツを食べて記録を始めましょう！";

/** バランスが良い場合のテンプレート */
const MONTHLY_BALANCE_TEMPLATES = [
  "今月は全体的にバランスの取れた摂取ができました。この調子で続けましょう。",
  "どの栄養素も偏りなく摂取できています。素晴らしい習慣です。",
  "今月は栄養バランスが整っていました。来月も継続できると良いですね。",
  "バランスの良い月でした。健康的なナッツ生活が続いています。",
] as const;

/** 特定のスコアが強い場合のテンプレート */
const MONTHLY_STRENGTH_TEMPLATES = [
  "今月は「{label}」が特に充実していました。来月は他の栄養素も意識してみましょう。",
  "「{label}」をしっかり摂取できた月でした。バランスも意識するとさらに良いですね。",
  "今月の強みは「{label}」でした。得意分野を活かしつつ、幅を広げていきましょう。",
  "「{label}」が際立った月でした。この調子で他の栄養素も補っていきましょう。",
] as const;

/** 記録日数が多い場合の追加コメント */
const HIGH_RECORD_DAYS_TEMPLATES = [
  "今月は{days}日も記録できました！",
  "{days}日間の記録、お疲れさまでした。",
  "素晴らしい！{days}日間継続できています。",
] as const;

/**
 * 月次コメント生成入力
 */
export type MonthlyCommentInput = {
  yearMonth: string;
  monthlyScore: {
    recordDays: number;
    isBalanced: boolean;
    strongestKey: ScoreKey;
  };
};

/**
 * 月次コメントを生成
 */
export function generateMonthlyComment(
  input: MonthlyCommentInput
): string {
  const { yearMonth, monthlyScore } = input;

  if (monthlyScore.recordDays === 0) {
    return MONTHLY_EMPTY_MESSAGE;
  }

  const seedBase = `${yearMonth}:monthly`;
  let comment: string;

  if (monthlyScore.isBalanced) {
    comment = pickDeterministic(MONTHLY_BALANCE_TEMPLATES, seedBase);
  } else {
    const label = MONTHLY_SCORE_LABELS[monthlyScore.strongestKey];
    const tmpl = pickDeterministic(MONTHLY_STRENGTH_TEMPLATES, seedBase);
    comment = tmpl.replace("{label}", label);
  }

  if (monthlyScore.recordDays >= 15) {
    const daysComment = pickDeterministic(
      HIGH_RECORD_DAYS_TEMPLATES,
      `${seedBase}:days`
    ).replace("{days}", String(monthlyScore.recordDays));
    comment = `${daysComment} ${comment}`;
  }

  return comment;
}

