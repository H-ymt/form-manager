# Form Manager

Next.js と Hono を使用して構築された、フォーム管理アプリケーションです。
ドラッグ＆ドロップによるフォーム作成、投稿管理、メールテンプレートなどの機能を提供します。

## ✨ 機能

- **フォームビルダー**: Dnd Kit を使用した直感的なドラッグ＆ドロップインターフェースでフォームを作成。
- **投稿管理**: フォームからの投稿データを一覧表示・管理。
- **CSV エクスポート**: 投稿データを CSV 形式でダウンロード。
- **メールテンプレート**: 自動返信メールなどのテンプレート管理。
- **認証**: Better Auth によるセキュアな認証システム。
- **データベース**: Drizzle ORM と LibSQL (Turso/SQLite) を採用。

## 🛠 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Backend API**: Hono
- **Styling**: TailwindCSS v4, Shadcn UI
- **Database**: LibSQL, Drizzle ORM
- **Auth**: Better Auth
- **Forms**: React Hook Form, Zod
- **State Management**: TanStack Query

## 🚀 始め方

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd form-manager
```

### 2. 依存関係のインストール

このプロジェクトは pnpm を使用しています。

```bash
pnpm install
```

### 3. 環境変数の設定

`.env.example` ファイルをコピーして `.env.local` を作成し、必要な値を設定してください。

```bash
cp .env.example .env.local
```

### 4. データベースのセットアップ

```bash
# マイグレーションの生成
pnpm db:generate

# データベースへの反映
pnpm db:migrate

# (開発用) データベースへの直接プッシュ
pnpm db:push
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## 📜 スクリプト

- `pnpm dev`: 開発サーバーを起動 (TurboPack 使用)
- `pnpm build`: 本番用にビルド
- `pnpm start`: 本番サーバーを起動
- `pnpm lint`: コードの静的解析を実行
- `pnpm db:studio`: Drizzle Studio を起動してデータベースを GUI で管理
