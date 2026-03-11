import type { ScoreKey, ScoreResult } from "./score";

type CommentCategory = "balance" | "strength";
type TemplateValues = Record<string, string | number>;

/**
 * スコア軸の表示ラベル
 */
const SCORE_LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

/**
 * 月次コメントの先頭に記録日数コメントを追加する閾値
 */
const HIGH_RECORD_DAYS_THRESHOLD = 15;

/**
 * 保存前のスコア表示メッセージ
 */
export const SCORE_EMPTY_MESSAGE = "保存するとスコアが表示されます";

/**
 * 月次で記録がない場合のメッセージ
 */
export const MONTHLY_EMPTY_MESSAGE =
  "今月はまだ記録がありません。ナッツを食べて記録を始めましょう！";

/**
 * 文字列を安定した 32bit 整数へ変換する簡易ハッシュ
 *
 * 用途:
 * - 同じ入力から常に同じテンプレートを選ぶための seed 生成
 * - 日付や年月ごとにコメントの見た目だけを安定して変える
 */
function hashToUint32(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * seed に基づいて配列から 1 件選ぶ
 *
 * 前提:
 * - list は空でないこと
 */
function pickDeterministic<T>(list: readonly [T, ...T[]], seed: string): T {
  const selectedIndex = hashToUint32(seed) % list.length;
  return list[selectedIndex];
}

/**
 * テンプレート内の {key} を値で置換する
 */
function fillTemplate(template: string, values: TemplateValues): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }

  return result;
}

/**
 * 日次コメントテンプレート
 * isBalanced が true の場合に使う
 */
const DAILY_BALANCE_TEMPLATES = [
  "今日は全体がきれいに揃っています。偏りが少なく、習慣としてとても理想的なバランスです。",
  "どの項目も大きな差がなく安定しています。無理なく続けられる良いペースですね。",
  "全体がなだらかで整った記録です。こうした日を重ねることが健康習慣につながります。",
  "突出や不足が少なく、バランスの良い内容です。継続に強い理想的なパターンです。",
  "今日は全体が安定しています。毎日の積み重ねとして、とても良い状態です。",
  "バランスが取れていて安心感のある記録です。この流れを保てると理想的です。",
  "偏りが見られず、全体が整っています。習慣として完成度が高い日です。",
] as const satisfies readonly [string, ...string[]];

/**
 * 日次コメントテンプレート
 * strongestKey を使う場合に使う
 */
const DAILY_STRENGTH_TEMPLATES = [
  "今日は「{label}」が特に伸びています。この調子で継続しましょう。",
  "今日も「{label}」がしっかり確保できています。習慣化できてきています。",
  "今日は「{label}」が主役の日です。明日からも無理なく続けましょう。",
  "「{label}」がしっかり取れています。明日もバランスよく続けたいですね。",
  "今日の記録は「{label}」がポイントです。明日も無理なく積み重ねていきましょう。",
  "「{label}」が目立つ内容でした。得意な部分を伸ばせていて良い調子です。",
  "今日は「{label}」が強い構成です。自分に合った選択ができています。",
] as const satisfies readonly [string, ...string[]];

/**
 * 月次コメントテンプレート
 * isBalanced が true の場合に使う
 */
const MONTHLY_BALANCE_TEMPLATES = [
  "今月は全体的にバランスの取れた摂取ができました。この調子で続けましょう。",
  "どの栄養素も偏りなく摂取できています。素晴らしい習慣です。",
  "今月は栄養バランスが整っていました。来月も継続できると良いですね。",
  "バランスの良い月でした。健康的なナッツ生活が続いています。",
] as const satisfies readonly [string, ...string[]];

/**
 * 月次コメントテンプレート
 * strongestKey を使う場合に使う
 */
const MONTHLY_STRENGTH_TEMPLATES = [
  "今月は「{label}」が特に充実していました。来月は他の栄養素も意識してみましょう。",
  "「{label}」をしっかり摂取できた月でした。バランスも意識するとさらに良いですね。",
  "今月の強みは「{label}」でした。得意分野を活かしつつ、幅を広げていきましょう。",
  "「{label}」が際立った月でした。この調子で他の栄養素も補っていきましょう。",
] as const satisfies readonly [string, ...string[]];

/**
 * 月間の記録日数が多い場合に先頭へ付けるコメント
 */
const HIGH_RECORD_DAYS_TEMPLATES = [
  "今月は{days}日も記録できました！",
  "{days}日間の記録、お疲れさまでした。",
  "素晴らしい！{days}日間継続できています。",
] as const satisfies readonly [string, ...string[]];

export type CommentInput = {
  /** YYYY-MM-DD */
  date: string;
  scoreResult: ScoreResult;
};

export type MonthlyCommentInput = {
  /** YYYY-MM */
  yearMonth: string;
  monthlyScore: {
    recordDays: number;
    isBalanced: boolean;
    strongestKey: ScoreKey;
  };
};

/**
 * スコア結果からコメントカテゴリを決定する
 *
 * ルール:
 * - isBalanced が true の場合は balance
 * - それ以外は strength
 */
function getCommentCategory(
  scoreResult: Pick<ScoreResult, "isBalanced">
): CommentCategory {
  return scoreResult.isBalanced ? "balance" : "strength";
}

/**
 * strongestKey から表示ラベルを返す
 */
function getScoreLabel(scoreKey: ScoreKey): string {
  return SCORE_LABELS[scoreKey];
}

/**
 * 日次コメントを生成する
 *
 * 同じ date と同じカテゴリであれば、毎回同じテンプレートを返す。
 */
export function generateDailyComment({
  date,
  scoreResult,
}: CommentInput): string {
  const category = getCommentCategory(scoreResult);
  const seed = `${date}:daily:${category}`;

  if (category === "balance") {
    return pickDeterministic(DAILY_BALANCE_TEMPLATES, seed);
  }

  const template = pickDeterministic(DAILY_STRENGTH_TEMPLATES, seed);
  const label = getScoreLabel(scoreResult.strongestKey);

  return fillTemplate(template, { label });
}

/**
 * 月次コメントを生成する
 *
 * ルール:
 * - recordDays が 0 の場合は固定メッセージを返す
 * - isBalanced が true の場合は balance テンプレートを使う
 * - それ以外は strongestKey を使った strength テンプレートを使う
 * - recordDays が一定以上なら、記録日数コメントを先頭に追加する
 */
export function generateMonthlyComment({
  yearMonth,
  monthlyScore,
}: MonthlyCommentInput): string {
  if (monthlyScore.recordDays === 0) {
    return MONTHLY_EMPTY_MESSAGE;
  }

  const category: CommentCategory = monthlyScore.isBalanced
    ? "balance"
    : "strength";

  const seed = `${yearMonth}:monthly:${category}`;

  const baseComment =
    category === "balance"
      ? pickDeterministic(MONTHLY_BALANCE_TEMPLATES, seed)
      : fillTemplate(
          pickDeterministic(MONTHLY_STRENGTH_TEMPLATES, seed),
          { label: getScoreLabel(monthlyScore.strongestKey) }
        );

  if (monthlyScore.recordDays < HIGH_RECORD_DAYS_THRESHOLD) {
    return baseComment;
  }

  const recordDaysComment = fillTemplate(
    pickDeterministic(HIGH_RECORD_DAYS_TEMPLATES, `${yearMonth}:monthly:days`),
    { days: monthlyScore.recordDays }
  );

  return `${recordDaysComment} ${baseComment}`;
}