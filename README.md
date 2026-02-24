# Nuts Balance

毎日のナッツ摂取を記録し、栄養バランスとストリークを追跡するWebアプリです。

## 機能

- **ナッツ記録**: 毎日食べたナッツを選択して記録
- **栄養スコア**: 5軸（抗酸化、ミネラル、食物繊維、ビタミン、多様性）で栄養バランスを可視化
- **ストリーク追跡**: 連続記録日数をキャラクターの成長で表現
- **月次レポート**: 月ごとの摂取傾向とスコア推移を確認
- **ダークモード**: ライト/ダークテーマの切り替え対応

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router), React 19, TypeScript 5 |
| スタイリング | Tailwind CSS 4, next-themes |
| バックエンド | Supabase (PostgreSQL, Auth, RLS) |
| フォーム | react-hook-form, zod |
| UI | react-day-picker, Recharts, sonner |

## セットアップ

### 前提条件

- Node.js 20以上
- npm
- Supabaseプロジェクト

```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。


## プロジェクト構成

```
src/
├── app/
│   ├── (public)/       # 認証不要ページ（ログイン、サインアップ等）
│   ├── (protected)/    # 認証必須ページ
│   │   ├── app/        # メインダッシュボード
│   │   ├── report/     # 月次レポート
│   │   ├── nuts/       # ナッツ図鑑
│   │   └── settings/   # 設定
│   └── api/            # APIルート
├── lib/
│   ├── supabase/       # Supabaseクライアント
│   ├── domain/         # ビジネスロジック
│   └── types.ts        # 型定義
└── middleware.ts       # ルート保護
```
