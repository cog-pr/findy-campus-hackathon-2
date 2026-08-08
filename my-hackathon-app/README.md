# WakeMate — アプリ本体

プロジェクトの概要・技術スタック・アーキテクチャは **[リポジトリ直下の README](../README.md)** を見てください。ここには開発時に必要な操作だけをまとめています。

**公開URL**: https://findy-campus-hackathon-2.trco0430.workers.dev

---

## コマンド

```sh
npm install
npm run dev        # ローカル開発サーバー
npm run build      # 本番ビルド
npm run cf-typegen # wrangler.jsonc を変更したあとの型再生成
npm run deploy     # 手動デプロイ（通常は不要。下記参照）
```

`npm run dev` で表示されるURLを開きます。2人分を試すときは、シークレットウィンドウか別のブラウザプロファイルを使ってください（`deviceId` を localStorage に持つため、同じウィンドウの別タブでは同一人物になります）。

---

## デプロイ

**mainにマージすれば Cloudflare Workers Builds が自動でビルド・デプロイします。** 手動デプロイは基本不要です。

手動で行う場合の注意:

- `wrangler.jsonc` の `name`（`findy-campus-hackathon-2`）を変更しない。公開URLが変わります
- 本番は `trco0430` のCloudflareアカウントに紐づいています。別アカウントから `wrangler deploy` しないでください

自動ビルドの設定はルートディレクトリ `/my-hackathon-app`、ビルドコマンド `npm run build`、デプロイコマンド `npx wrangler deploy`、本番ブランチ `main` です。

---

## 構成

```
src/
├── index.tsx              # Honoルーター（agentsMiddleware をマウント）
├── agents/
│   └── group-agent.ts     # GroupAgent（state + schedule + RPC + Whisper判定）
├── client/
│   ├── app.tsx            # 画面の出し分け
│   ├── screens/
│   │   ├── EntryScreen.tsx     # グループ作成 / コードで参加
│   │   ├── GroupRoomScreen.tsx # メンバー・アラーム一覧・ステータス
│   │   ├── AlarmForm.tsx       # アラーム作成
│   │   └── AlarmOverlay.tsx    # 発火時の全画面警報・音声確認
│   └── lib/               # deviceId管理・JST変換・アラーム音
└── style.css
```

サーバー側の状態とRPCは `src/agents/group-agent.ts` に集約されています。REST APIは持たず、Agents SDK の `@callable()` によるRPCで完結しています。

---

## 開発時のメモ

- **AIバインディングはローカル開発でも本物のWorkers AIに接続します**（`wrangler.jsonc` の `ai` バインディング）。オフラインでは音声確認が動きません
- マイクの利用には `localhost` かHTTPSが必要です
- `wrangler.jsonc` を変更したら `npm run cf-typegen` で型を再生成してください
- エージェント用スキルを入れ直したいときは `npm run setup:skills`（Hono / Cloudflare / Agents SDK / Durable Objects などの公式スキルが `.claude/skills/` に入ります）
