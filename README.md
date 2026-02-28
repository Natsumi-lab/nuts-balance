# Nuts Balance

健康に良いスーパーフード「ナッツ」を無理なく習慣化するための記録アプリです。  
毎日の摂取を可視化し、月次レポートで自分の傾向を振り返ることができます。  

---

## 🌱 アプリ概要

Nuts Balance は、ナッツ摂取を「記録 → 可視化 → 習慣化」するための Web アプリです。

- 今日のナッツをチェック形式で簡単記録
- 月次レポートで摂取傾向を可視化
- 成長ステージ表示による継続モチベーション設計
- ナッツごとの栄養特性の確認

---

##  解決する課題  

ナッツは栄養価が高く健康効果が期待できる一方、  
種類が多く、栄養の違いが分かりにくいため、  
特定のナッツに偏ったり、継続できないことが多いです。  

本アプリでは栄養素の違いから「種類」に着目し、  
日々どのナッツを食べたかを簡単に記録することで、  
栄養のバランスと継続性の両立を目指します。  

---

## 🚀 デモ

**本番URL：**  
デプロイURL：

**テストアカウント：**

Email:   
Password: 

### 推奨デモ動線

1. `/` → ログイン
2. `/app` → 今日のナッツを選択して保存
3. `/report` → 月次レポート確認
4. `/nuts` → ナッツ知識確認

---

## 🧩 主な機能

- **ナッツ記録**: 毎日食べたナッツを選択して記録
- **栄養スコア**: 5軸（抗酸化、ミネラル、食物繊維、ビタミン、多様性）で栄養バランスを可視化
- **ストリーク追跡**: 連続記録日数をキャラクターの成長で表現
- **月次レポート**: 月ごとの摂取傾向とスコア推移を確認
- **ダークモード**: ライト/ダークテーマの切り替え対応

---

## 🛠 技術スタック

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- next-themes（ダークモード）

### Backend
- Supabase (PostgreSQL / Auth / RLS)
- `@supabase/ssr`

### その他
- react-hook-form + zod
- react-day-picker
- Recharts
- sonner（トースト）
- Vitest（ユニットテスト）

---

## 🧠 技術選定理由

### Next.js + Supabase を選んだ理由

- App Router による Server / Client の明確な分離
- Server Actions による安全なデータ更新
- Supabase の RLS による堅牢なデータ保護
- PostgreSQL + RPC によるトランザクション保証

フロントエンドとバックエンドを分離しつつ、  
**セキュリティと設計の明確さを重視した構成**を採用しています。

---

## 🏗 設計の見どころ

### 1. Server / Client 境界の明確化
- SupabaseクエリはすべてServer側で実行
- Clientからの直接DB操作はゼロ
- Server Action経由でのみ更新処理

### 2. RPCによるトランザクション保証
- `upsert_daily_log`
- `mark_daily_skip`
- `delete_user_account`

複数テーブル操作をDB側で一括管理し、不整合を防止。

### 3. RLSによるデータ保護
- ユーザーは自分のデータのみ参照・更新可能
- anonロールではユーザーデータ取得不可

### 4. ドメインロジックの分離
`lib/domain/` にビジネスロジックを分離。  
UIやDBに依存しない純粋関数設計。

例：
- `getGrowthStage()`
- `aggregateMonthlyReport()`

### 5. 型安全な ActionResult 設計
Server Actionsの戻り値を `{ success: boolean; message: string }` で統一し、  
成功/失敗を一貫して扱える設計。

---

## 🧪 テスト

Vitest を使用し、ドメインロジックのユニットテストを導入しています。

例：
- `getGrowthStage()` の閾値判定テスト

```bash
npm run test

```
---

## 🔐 セキュリティ設計  

- RLS全テーブル適用
- Server Action での認証チェック
- Open Redirect対策済み
- XSS対策済み
- Service Role Key はサーバー専用使用

---

## 🖥 ローカル開発  
```
npm install
npm run dev
```
Node.js 20以上が必要です。  

---

## 📌 今後の改善  
- 初期表示のパフォーマンス最適化
- エラーメッセージの日本語統一・UX改善
- ユニットテストの拡充


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

## 実装こだわりのポイント  
ユーザー削除：Auth削除を先に行い、失敗時にユーザーが残ることを避けました。  
DB側削除が失敗した場合は冪等なRPCのため再実行で回復可能です。  