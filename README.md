# WakeMate — 大事な朝は、信頼できる人が起こす

**公開URL**: https://findy-campus-hackathon-2.trco0430.workers.dev

家族・恋人・同居人が「誰に・いつ」アラームをセットし、相手の画面を鳴らして、**声で起床を確認できる**まで見守れる共有アラームです。

Findy Campus Hackathon #2（2026/8/8）の成果物。

---

## 何を解決するのか

| 誰 | 課題 |
|----|------|
| 起きられない人 | 大事な日（受験・旅行・出勤）なのにスヌーズ地獄、そもそも設定を忘れる |
| 起こしたい人（親・恋人・同居人） | LINEで催促しても相手の端末は鳴らない。本当に起きたのか分からない |

既存のアラームとの違いは2つです。

1. **他人がセットできる** — 自分の意思に依存しない
2. **起床確認まで閉じる** — しかも「起きた」ボタンだけでは閉じられない（後述）

---

## 使い方（デモの流れ）

対象者・見守る側の**両方がタブを開いた状態**で使います（Web Pushは使っていないため）。

1. **Aさん**が「グループ作成」→ 6桁の招待コードが出る
2. **Bさん**が別のブラウザ（またはシークレットウィンドウ）で「コードで参加」
3. **Aさん**が「+ アラームを作成」→ 対象にBさんを選び、時刻を指定（デモ用に「1分後」「3分後」ボタンあり）
4. 時間になると **Bさんの画面が全画面の赤い警報**になり、確認フレーズが表示される
5. **Bさんがフレーズを声に出して読む** → AIが判定 → 通れば「起床済み」
6. **Aさんの画面**に自動で反映される（何も操作しなくて良い）

確認しないまま5分経つと、Aさんの画面に「未確認のまま」バナーが出ます。

---

## 技術スタック

ベースは [hono-agents-starter](https://github.com/yusukebe/hono-agents-starter)（Hono + Vite + React + Cloudflare Agents SDK）。**追加のデータベースも通知サービスも使っていません。**

### 使用技術一覧

| 分類 | 技術 | バージョン | 用途 |
|---|---|---|---|
| 言語 | **TypeScript** | ESNext / strict | フロント・バックエンドとも全面採用 |
| 実行環境 | **Cloudflare Workers** | 互換性日付 `2026-06-14`<br>`nodejs_compat` | サーバーサイドの実行基盤 |
| Webフレームワーク | **[Hono](https://hono.dev/)** | 4.12 | ルーティング、SSRの配信 |
| UIライブラリ | **React** | 19.2 | 画面の構築（SPA + SSRエントリ） |
| ビルドツール | **Vite** | 8.2 | 開発サーバー、本番ビルド |
| ステートフル基盤 | **[Cloudflare Agents SDK](https://developers.cloudflare.com/agents/)**（`agents`） | 0.20 | Durable Objects のラッパー。状態管理・スケジュール・RPC |
| Hono連携 | `hono-agents` | 3.0 | HonoにAgents SDKをミドルウェアとしてマウント |
| 永続化 | **Durable Objects**（内蔵SQLite） | — | グループ・メンバー・アラームの状態。外部DBなし |
| スケジューラ | **Durable Object Alarms** | — | アラーム発火時刻のサーバー側管理 |
| リアルタイム通信 | **WebSocket**（Agents SDKが内包） | — | 状態変更の自動配信。自前実装なし |
| AI | **Workers AI** `@cf/openai/whisper` | — | 起床確認の音声を文字起こし |
| SSR補助 | `vite-ssr-components` | 0.6 | SSR時のスクリプト/スタイル注入 |
| CLI / デプロイ | **Wrangler** | 4.x | 型生成、デプロイ |
| CI/CD | **Cloudflare Workers Builds** | — | mainへのマージで自動ビルド・デプロイ |

### 使用しているブラウザAPI

音声確認とアラーム体験のために、ライブラリを足さず標準APIだけで実装しています。

| API | 用途 |
|---|---|
| `MediaRecorder` / `navigator.mediaDevices` | 起床確認の音声録音 |
| `AudioContext`（Web Audio API） | アラーム音の生成・ループ再生 |
| `navigator.vibrate` | 発火時の端末バイブレーション |
| `navigator.clipboard` | 招待コードのコピー |
| `localStorage` | `deviceId` / ニックネーム / 参加中グループの保持 |
| `crypto.randomUUID` | `deviceId`・アラームIDの生成 |

### 意図的に使っていないもの

| 技術 | 理由 |
|---|---|
| **D1 / KV などのデータベース** | グループ単位で状態が完結し、グループ横断の検索が不要なため。Durable Objects の `state` だけで足りる |
| **Web Push（VAPID）** | 実装工数とデモでの伝わりにくさ。WebSocketによるリアルタイム配信で代替した |
| **認証基盤（OAuth等）** | ハッカソンのスコープ外。`deviceId` をクライアント生成して localStorage に保持するのみ |
| **状態管理ライブラリ（Redux等）** | Agents SDK の `useAgent` が状態の購読と同期を担うため不要 |
| **CSSフレームワーク** | 画面数が少なく、素のCSSで十分だったため |

### レイヤごとの選定意図

| 層 | 使ったもの | 選定の意図 |
|---|---|---|
| 入口 | **Hono** on Cloudflare Workers | APIとUIを1デプロイで配信。`hono-agents` の `agentsMiddleware` でAgents SDKをマウント |
| 状態 | **Agentの `state`**（Durable Objects / 内蔵SQLite） | DBを持たない。グループ1つ＝Agentインスタンス1つで完結 |
| 時間 | **Agentの `schedule()`**（Durable Object Alarms） | アラーム時刻をサーバー側が持つ。端末の `setTimeout` に賭けない |
| 配信 | **Agentの自動WebSocket配信** | `setState()` で接続中の全クライアントに自動反映。ポーリング不要 |
| 起床判定 | **Workers AI `@cf/openai/whisper`** | 読み上げ音声を文字起こしして本人が本当に起きているか判定 |

### 設計の要点

**1. 時間をサーバーが持つ**

ブラウザの `setTimeout` では、タブを閉じた時点でもスリープした時点でも終わりです。共有アラームとして成立しません。Durable Object Alarms なら「そのアラーム専用のタイマー」をサーバー側に持てるので、時間になるとサーバー自身が起きて処理を実行します。

**2. データベースを1つも使わない**

グループ1つ＝Agentインスタンス1つとし、**招待コードをそのままインスタンス名**にしています。そのため「コードからグループを探す」ためのテーブルすら必要ありません。状態は `state` にJSONで持つだけで自動的にSQLiteへ永続化され、接続中のクライアントへ自動配信されます。ポーリングもWebSocket管理も自前で書いていません。

**3. AIを飾りにしない**

「起きた！」ボタンだけでは寝ぼけたまま反射で押せてしまい、起床確認として機能しません。そこで**フレーズを声に出して読まないと起床が認められない**ようにしました。判定は必ずサーバー側で行うので、クライアントから「合っていた」とごまかすことはできません。

---

## アーキテクチャ

```
アラーム作成
   └─ GroupAgent.schedule(発火時刻, "fireAlarm")   … Durable Object Alarm を登録
          │
          ▼  時間になるとサーバーが自分で起きる
      status = "fired" に setState()               … 同時に確認フレーズを割り当て
          │
          ▼  接続中の全クライアントへ自動配信（WebSocket）
      対象者: 全画面警報 + フレーズ表示
          │
          ▼  読み上げた音声を送信
      env.AI.run("@cf/openai/whisper")             … 文字起こし
          │
          ▼  サーバー側で照合
      status = "confirmed" に setState()
          │
          ▼  自動配信
      作成者: 「起床済み」に変わる
```

### アラームの状態

```
scheduled → fired → confirmed
                 ↘ timed_out（発火から5分で未確認）
scheduled → cancelled
```

### 音声判定の仕組み

Whisperは同じ発話でも漢字とかなの表記が揺れます（「がんばります」→「頑張ります」）。そのため完全一致は求めていません。

- 記号・空白を除去し、カタカナをひらがなに正規化する
- 2文字単位（bigram）の重なりで類似度を出し、**0.6以上**を合格とする
- フレーズごとに「合格とみなす表記」を複数持てるようにして、揺れを吸収する
- フレーズは**実際に読み上げて合格を確認できた2種類だけ**に絞っている（早口言葉は書き起こしが安定せず、正しく読んでも落ちるため不採用）

マイクが使えない環境向けに、従来の「起きた！」ボタンもフォールバックとして残してあります。

---

## GroupAgent の API

REST APIは持たず、Agents SDK の `@callable()` によるRPCで完結しています。クライアントは `useAgent` 経由で呼びます。

| メソッド | 説明 |
|---|---|
| `initGroup(name, creatorDeviceId, displayName)` | グループ作成（インスタンス名＝招待コード） |
| `join(deviceId, displayName)` | 招待コードで参加 |
| `createAlarm(creatorDeviceId, targetDeviceId, fireAt, message)` | アラーム作成 → `schedule()` に登録 |
| `confirmAlarm(deviceId, alarmId)` | 起床確認（ボタン。フォールバック） |
| `confirmAlarmByVoice(deviceId, alarmId, audio)` | 起床確認（音声。Whisperで判定） |
| `cancelAlarm(deviceId, alarmId)` | 予約中のアラームを取消 |

スケジュールから呼ばれる内部ハンドラ（クライアントからは呼ばない）:

- `fireAlarm({ alarmId })` — `fired` に更新し、フレーズを割り当て、5分後の `timeoutAlarm` を登録
- `timeoutAlarm({ alarmId })` — まだ未確認なら `timed_out` に更新

---

## ディレクトリ

```
.
├── README.md              # このファイル
├── 仕様書.md               # 仕様の正本（スコープ・データモデル・審査基準）
├── docs/
│   ├── PITCH.md           # 5分ピッチ台本
│   └── slides/            # 発表スライド（index.html でフルスクリーン発表）
└── my-hackathon-app/      # アプリ本体
    ├── DEMO.md            # デモ手順の詳細メモ
    ├── wrangler.jsonc     # Worker設定（name / Durable Object / AIバインディング）
    └── src/
        ├── index.tsx              # Honoルーター（agentsMiddleware をマウント）
        ├── agents/
        │   └── group-agent.ts     # GroupAgent（state + schedule + RPC + Whisper判定）
        └── client/
            ├── app.tsx            # 画面の出し分け
            ├── screens/           # 入口 / グループルーム / アラーム作成 / 発火警報
            └── lib/               # deviceId管理・JST変換・アラーム音
```

---

## ローカルで動かす

Node.js v20以上が必要です。

```sh
cd my-hackathon-app
npm install
npm run dev
```

表示されたURL（`http://localhost:5173/` など）を開きます。**2人分を試すときは、シークレットウィンドウか別のブラウザプロファイル**を使ってください。`deviceId` を localStorage に持たせているため、同じウィンドウの別タブでは同一人物として扱われます。

音声確認を試す場合、マイクの利用には `localhost` かHTTPSが必要です（本番URLはHTTPSなので問題ありません）。またローカル開発でもAIバインディングは実際のCloudflare上のWorkers AIに接続します。

```sh
npm run build      # 本番ビルド
npm run cf-typegen # wrangler.jsonc を変更したあとの型再生成
```

---

## デプロイ

**mainにマージすると、Cloudflare Workers Builds が自動でビルド・デプロイします。** 通常は手動デプロイ不要です。

自動ビルドの設定:

| 項目 | 値 |
|---|---|
| ルートディレクトリ | `/my-hackathon-app` |
| ビルドコマンド | `npm run build` |
| デプロイコマンド | `npx wrangler deploy` |
| 本番ブランチ | `main` |

> **注意**: `wrangler.jsonc` の `name`（`findy-campus-hackathon-2`）は変更しないでください。公開URLが変わります。本番は `trco0430` のCloudflareアカウントに紐づいているため、別アカウントから `wrangler deploy` しないでください。

---

## 既知の制約

正直に書いておきます。

- **タブを開いておく必要があります。** Web Push を使っていないため、アプリを閉じている相手を起こすことはできません。実装工数とデモでの伝わりにくさを理由に、意図的に見送りました
- **音が鳴らないことがあります。** ブラウザの自動再生制限のためです。そのため全画面の赤い警報（視覚）を主にしています
- **ログイン機能はありません。** `deviceId` は端末のlocalStorageにのみ保存しているので、ブラウザのデータを消すと別人扱いになります
- **タイムゾーンは Asia/Tokyo 固定です**
- 動作確認は Desktop Chrome と iOS Safari で行っています

---

## ドキュメント

| ファイル | 内容 |
|---|---|
| [仕様書.md](./仕様書.md) | スコープ（Must / Should / Won't）、データモデル、審査基準への対応 |
| [docs/PITCH.md](./docs/PITCH.md) | 5分ピッチの台本 |
| [my-hackathon-app/DEMO.md](./my-hackathon-app/DEMO.md) | デモ手順の詳細 |
