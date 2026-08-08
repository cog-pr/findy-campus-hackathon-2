# Pitch QA Notes（自己精査）

撮影: `node capture.mjs` → `slide-01.png` … `slide-09.png`  
ビューポート: 1600×1000（`#stage` 切り出し）

## 手順どおりの構成結果

- STRUCTURE §1 で P0 を9本洗い出し → §2 で一文化 → §3 でマージ不可と判断し **9枚**
- 先に枚数ありきではない

## 直した点（スクショ → 修正 → 再撮影）

| 問題 | 対応 |
|------|------|
| #3 `scene-before` 下端欠け（GAP REMAINS） | `object-fit: contain` |
| #4 cover で左右カード欠け | `status-triptych` + contain |
| #6 URL が箱に対して小さい | URL拡大 + `WORKERS · LIVE` タグ |
| #5 コミック下キャプション欠け気味 | flow 画像を contain |
| #9 文字だけ＋余白 | `close-dawn` 背景＋結論文オーバーレイ |
| #8 役割カードがスカスカ | 字拡大 + 「実名に差し替え」 |
| 途中で10枚HTMLに上書きされ `#stage` 消失 | STRUCTURE同期の9枚に書き戻し・再撮影 |

## 差し替え必須（本番前）

- `https://findy-campus-hackathon-2.trco0430.workers.dev`（固定・差し替え不要）
- #8 の（名前）×3

## 残メモ（許容）

- #4/#7 は横長SVGのため上下に帯余白（contain優先＝文字欠け回避）
- 日本語化けSVG（`loop-strip` / `tech-diagram`）は未使用
