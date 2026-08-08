# WakeMate ピッチ — ビジュアル設計メモ（調査 → 適用）

CSS変数いじりで「見た目が変わった風」にするのは不合格。  
このデッキは **イラスト／ストーリーボードで意味を運ぶ** ことがゴール。

---

## 1. 調査サマリー（ソース付き）

### A. ハッカソン・短ピッチは「課題の鮮明さ」が先

[How to Build a Hackathon Pitch Deck That Judges Remember](https://www.inknarrates.com/post/hackathon-pitch-deck) — Ink Narrates

- 最初の数十秒で **課題が本物**だと刺す。自己紹介から入らない。
- デザインはメッセージの下請け。派手さより明瞭さ。
- 解決は「何が違うか」をビジュアルで見せる（モック／フロー／デモ物語）。

### B. ビジュアルは装飾ではなくコミュニケーション

[Visual Storytelling in Pitch Decks](https://www.pitchai.com/blog/visual-storytelling-in-pitch-decks-design-principles-that-work) — Pitch AI

- Design is communication。要素はメッセージを明確にするためだけに置く。
- 階層（どこを最初に見るか）をサイズとコントラストで固定。
- ストック写真・握手・電球は避ける。**カスタムイラストでブランドの物語を補強**。
- プロダクトは「言え」ではなく「見せろ」。

### C. ストーリーボード／コミック型ピッチは記憶に残る

- [Moonshot Tech Pitch Storyboards](https://storyboard.top/visualizing-high-risk-high-reward-ideas-designing-dramatic-s): 主張ごとに **visual witness（視覚的な証人）** を置く。Before/After・操作フロー・現場の一枚。
- [Thinknum comic book pitch](https://www.businessinsider.com/thinknum-comic-book-pitch-deck-series-a-2019-8): 通常デッキで差別化できないとき、コミックで文化と物語を見せた事例。
- [How I made a comic book pitch deck](https://monkiebusiness.substack.com/p/how-i-made-a-comic-book-pitch-deck): サムネ → パネル拡大。**4コマでシーンを固定**する手法。

→ WakeMate のデモ説明は **Must 4コマの漫画ストーリーボード** にする（fake-UIの文字壁ではない）。

### D. ソフトウェア系は図で技術意図を見せる

[Software Startup Pitch Deck Design & Storytelling](https://qubit.capital/blog/design-storytelling-best-practices-software-startup) — Qubit Capital

- 1スライド1メッセージ。
- 技術は bullet 壁ではなく **プロセス図／ユーザー旅程図**。
- カスタムビジュアルで UVP を補強。

### E. 字は大きく・1アイデア・採点直結（前回調査の継承）

- YC Kevin Hale: [How to design a better pitch deck](https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck) — legible / simple / obvious。
- [Made Good Designs](https://madegooddesigns.com/pitch-deck-design/) — 見出しは一点主張、会場後方から読めるサイズ。
- 採点マップは `RUBRIC_MAP.md` が最優先。課題/完成/技術/熱量の構造は壊さない。

---

## 2. 素材ライセンス判断

### いらすとや（検討したが、リポジトリ同梱は避けた）

公式: [ご利用について](https://www.irasutoya.com/p/terms.html) / FAQ 要約（二次情報含む）

| 項目 | 内容 |
|------|------|
| プレゼン利用 | 一般的に可。1制作物あたり商用は概ね **20点まで無料** |
| クレジット | 通常不要 |
| NG | 素材の再配布・販売、イラスト自体がメインの商品化 |
| 本リポでの判断 | GitHub に PNG を同梱すると **二次配布に近い** リスクがあるため不採用 |

参考解説: [著作権ドットコム — 商用20点ルール](https://tyosakuken.com/irasutoya-commercial-use/)、[パワポ大学 — プレゼン利用](https://powerpoint-univ.com/irasutoya-presentation/)

### unDraw（代替候補）

[unDraw License](https://undraw.co/license): 商用可・帰属不要。競合素材サービス化・パック再配布・AI学習利用は不可。  
→ 使えるが、**汎用フラット人物は「どのSaaSでも同じ」**になりやすい。WakeMate の信頼ループには弱い。

### 採用方針: カスタム SVG（`presentation/assets/`）

- 自作ストーリーパネル（Setter / Wakee / 目覚まし / 信頼線 / 4コマ漫画 / 技術フロー）。
- ライセンス問題なし・プロジェクター向けに線を太く・色数を絞る。
- いらすとや風の「かわいい」ではなく、**夜明け＋二人の信頼**のメタファーに寄せる。
- SVG内ラベルは **ASCII**（日本語はHTML側）。Chromium `<img>` が壊れたUTF-8／`role`属性で落ちるのを避けるため。

### 自己QA（必須ループ）

- Playwrightで全スライドPNG → `presentation/qa/slide-XX.png` → Readで目視。
- **Pass 1 失敗:** SVGの `role`/`aria-label`＋PowerShell文字化けでイラスト全滅 → ASCIIラベル化＋属性削除。
- **Pass 2 失敗:** 4枚目が横ストリップだけスカスカ → loopにSetter/Wakee＋4ステップを縦に再設計。
- **Pass 3:** 9枚目に `team-bet.svg`（3役→MUST x1）追加。カード内余白は名前プレースホルダ分が残る（実名差し替えで埋まる）。
- **残リスク:** Workers URL未差し替え／チーム実名未差し替え／SVG内英語ラベル（意図的）。

---

## 3. WakeMate の視覚メタファー

| メタファー | 意味 | どこで使う |
|------------|------|------------|
| 夜明けの太陽 | 「大事な朝」 | タイトル・締め |
| Setter → Wakee の線 | 他人がセットする信頼 | タイトル・ループ |
| スヌーズ地獄 vs 誰かに起こされる | Before / After | ギャップスライド |
| 4コマ漫画 | Must 導線の物語 | デモ（完成度） |
| サーバー時計 vs 端末タイマー | 技術の賭け | 技術チャレンジ |
| ステータス3状態 | 完成の定義（返事まで） | Proof |

色: 夜明けネイビー `#0a0e18` × サンライズ `#ff4d1a` × 起床シグナル `#12b89a`。  
避けた定番: 紫グラデ / クリーム＋テラコッタ / 新聞紙レイアウト。

---

## 4. スライドごとのビジュアル仕事（10枚維持）

| # | 採点 | ビジュアルの仕事（テキストの色替えではない） |
|---|------|-----------------------------------------------|
| 1 | ④ | 夜明けシーン＋Setter/Wakee の信頼線イラスト |
| 2 | ① | 二人のキャラクター並置（Wakee / Setter） |
| 3 | ① | Before/After の情景パネル（スヌーズ vs 起こし） |
| 4 | ① | ループ4ステップをアイコン付きパネルで |
| 5 | ② | **コミック4コマ** ＋ Workers URL 帯 |
| 6 | ② | ステータス3態をイラスト＋色で一瞬で判別 |
| 7 | ③ | アーキ図（Client→Edge→Alarm→Push）のダイアグラム |
| 8 | ③ | 切った選択 vs 賭けた実装の対比ビジュアル |
| 9 | ④ | 役割3席＋Ship/Cut の決断ボード |
| 10 | ④ | 夜明けクローズ＋4軸エコー |

レイアウト原則: **大きい字のまま密度を上げる**（余白でスカスカにしない）。イラストは意味を運ぶ面積を取る。

---

## 5. 意図的にやらなかったこと

- 色変数だけ変えて「リデザインした」と言うこと
- いらすとや素材のリポ同梱（再配布リスク）
- unDraw の汎用人物を並べて「イラスト入れた」と言うこと
- 偽スクショで完成済み UI を断言すること
- スライド枚数を増やして台本を壊すこと（10枚維持 → `SCRIPT.md` 変更なし）
