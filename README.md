# Form Manager

Next.js と Hono を使用して構築された、フォーム管理アプリケーションです。
ドラッグ＆ドロップによるフォーム作成、投稿管理、メールテンプレートなどの機能を提供します。

## 機能

- **フォームビルダー**: Dnd Kit を使用した直感的なドラッグ＆ドロップインターフェースでフォームを作成。
- **投稿管理**: フォームからの投稿データを一覧表示・管理。
- **CSV エクスポート**: 投稿データを CSV 形式でダウンロード。
- **メールテンプレート**: 自動返信メールなどのテンプレート管理。
- **認証**: Better Auth によるセキュアな認証システム。
- **データベース**: Drizzle ORM と LibSQL (Turso/SQLite) を採用。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **バックエンド API**: Hono
- **スタイリング**: TailwindCSS v4, Shadcn UI
- **データベース**: LibSQL, Drizzle ORM
- **認証**: Better Auth
- **フォーム機能**: React Hook Form, Zod
- **状態管理**: TanStack Query

## データベース設計

主要なエンティティ構成は以下の通りです：

- **Users / Auth**: Better Auth によるユーザー管理（Users, Sessions, Accounts, Verifications）
- **Forms**: フォームの基本設定（タイトル、公開状態、完了メッセージなど）
- **Form Fields**: 各フォームのフィールド定義（入力タイプ、バリデーション設定、配置順）
- **Entries**: ユーザーからの投稿データ（JSON 形式でフィールド値を保持）
- **Mail Templates**: 自動返信メールや通知メールのテンプレート設定

## 始め方

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

必要な環境変数は以下の通りです：

```env
# Database (Turso / LibSQL)
TURSO_DATABASE_URL="file:local.db" # ローカル開発用、または Turso の URL
TURSO_AUTH_TOKEN="" # Turso を使用する場合のみ必要

# Auth (Better Auth)
BETTER_AUTH_SECRET="your-generated-secret" # openssl rand -base64 32 などで生成
BETTER_AUTH_URL="http://localhost:3000" # 本番環境ではドメインを指定
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

## スクリプト

- `pnpm dev`: 開発サーバーを起動 (TurboPack 使用)
- `pnpm build`: 本番用にビルド
- `pnpm start`: 本番サーバーを起動
- `pnpm lint`: コードの静的解析を実行
- `pnpm db:studio`: Drizzle Studio を起動してデータベースを GUI で管理
