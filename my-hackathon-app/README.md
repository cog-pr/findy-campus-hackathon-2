# WakeMate

大事な朝を、信頼できる人が起こす共有アラーム。

Cloudflare Workers 上でグループ招待・ワンショットアラーム・起床確認までを一本のデモ導線で回せます。

## 公開 URL

https://findy-campus-hackathon-2.trco0430.workers.dev

`wrangler.jsonc` の `name` は `wakemate`（Workers の公開サブドメイン名）。

## ローカル起動

前提: Node.js v20+

```sh
cd my-hackathon-app
npm install
npm run dev
```

ブラウザで表示されたローカル URL を開く。

## デプロイ

```sh
npx wrangler login   # 初回のみ
npm run build
npm run deploy
```

Windows でも `npm run deploy`（内部で `vite build && wrangler deploy`）が使えます。認証エラーや scope 不足のときは `npx wrangler login` をやり直してください。

## アーキテクチャ

実装の芯は **Cloudflare Agents（Durable Objects）** です。

| 要素 | 役割 |
|------|------|
| `GroupAgent`（DO） | グループ・メンバー・アラーム状態を保持 |
| `schedule(発火時刻)` | サーバー側で発火時刻を予約（端末の `setTimeout` に依存しない） |
| `setState` | 発火・起床確認・タイムアウトを接続中クライアントへリアルタイム配信 |
| Hono + Vite + React | Workers 上で API と UI を同一デプロイ |

今回やらないもの（仕様 Won't）: **Web Push** / **D1**。

## 2ブラウザ・デモ手順（3分以内）

審査デモ向けの口頭メモは [`DEMO.md`](./DEMO.md)、5分台本は [`../docs/PITCH.md`](../docs/PITCH.md)。

**準備:** ブラウザを2つ（または通常＋シークレット／別プロファイル）。両方とも公開 URL を開き、**デモ中はタブを閉じない**。

1. **ブラウザ A（Setter）**: 「グループを作成」→ 表示名を入れて作成 → **招待コード**をコピー
2. **ブラウザ B（Wakee）**: 「招待コードで参加」→ コードと表示名を入れて参加
3. **A**: 相手（B）向けにワンショットアラームを作成（デモでは「1分後」または「3分後」）
4. **発火時刻**:
   - **B**: 赤いフルスクリーン警報 → 「起きた！」を押す
   - **A**: 「起床待ち」バナーが出たあと、B の確認で起床済みになりバナーが消える
5. （任意・時間があれば）確認せず放置 → A に「未確認のまま」タイムアウト表示

### 既知の制約

- **両方のタブを開いたまま**にする（接続中クライアントへ `setState` で配信するため）
- **Web Push 非対応**（バックグラウンド通知はない。画面フルスクリーン警報で見せる）
- 端末をスリープ／タブ破棄すると発火表示を逃すことがある → 開き直して再接続

### デモ失敗時のフォールバック

1. Push／通知の話はしない。「タブを開いた状態でサーバー発火を画面に出す」と説明する
2. 両方のタブをリロードして再接続し、短い発火（1分後）でやり直す
3. それでも不安定なら、ローカル `npm run dev` の画面録画／事前スクショで Must 導線（招待→発火→起きた）を補足する
4. 公開 URL が落ちている場合は正直に伝え、ローカル or 録画へ切り替える

## 主なスクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | ローカル開発 |
| `npm run build` | 本番ビルド |
| `npm run deploy` | ビルドして Cloudflare へデプロイ |
| `npm run cf-typegen` | `wrangler.jsonc` 変更後の型再生成 |

---

## スターターについて

本アプリは [Findy Campus Hackathon #2](https://www.craftstadium.com/hackathon/findy-campus-hackathon-202608) の全部入りスターター（Hono + Vite + React + Agents SDK）をベースにしています。伴走スキルを入れ直す場合:

```sh
npm run setup:skills
```
