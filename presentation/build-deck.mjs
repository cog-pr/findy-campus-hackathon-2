import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "pitch-5min.html");

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>WakeMate — 5分ピッチ</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
<style>
:root{
  --ink:#12151c;--muted:#4a5568;--paper:#e8ecf2;--panel:#fff;--line:#c5cede;
  --night:#0a0e18;--dawn:#162033;--sunrise:#ff4d1a;--sunrise-soft:#ffe2d6;
  --signal:#12b89a;--signal-soft:#d4f5ee;--warn:#e11d48;
  --slide-w:min(100vw,calc(100vh*16/9));--slide-h:min(100vh,calc(100vw*9/16));
  --fs-body:clamp(1.45rem,2vw,1.95rem);--fs-sm:clamp(1.15rem,1.55vw,1.5rem);
  --fs-label:clamp(.88rem,1.05vw,1.05rem);--fs-h2:clamp(2.1rem,4.4vw,3.35rem);
  --fs-brand:clamp(3.4rem,8vw,6.2rem);--pad-x:clamp(.65rem,1.6vw,1.2rem);--pad-y:clamp(.45rem,1.1vw,.85rem);
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#05070d;color:var(--ink);font-family:Figtree,system-ui,sans-serif;overflow:hidden}
.deck{height:100%;display:grid;place-items:center;padding:.25rem;gap:.2rem}
.stage{width:var(--slide-w);height:var(--slide-h);position:relative;border-radius:8px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.55)}
.slide{display:none;width:100%;height:100%;position:relative;padding:var(--pad-y) var(--pad-x);padding-top:clamp(1rem,2.2vw,1.4rem);padding-bottom:clamp(1.3rem,2.5vw,1.7rem);background:var(--paper);flex-direction:column;gap:.22rem;overflow:hidden}
.slide.active{display:flex}
.slide.dark{background:radial-gradient(ellipse 65% 50% at 85% 0%,rgba(255,77,26,.3),transparent 55%),linear-gradient(155deg,var(--night) 0%,var(--dawn) 55%,#1c2740 100%);color:#f4f6fa}
.chip{position:absolute;top:.4rem;right:var(--pad-x);font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.08em;padding:.2rem .45rem;border-radius:6px;border:1px solid transparent;z-index:3}
.chip.r1{color:#ff4d1a;background:rgba(255,77,26,.12);border-color:rgba(255,77,26,.3)}
.chip.r2{color:#0f766e;background:var(--signal-soft);border-color:rgba(14,165,160,.4)}
.chip.r3{color:#1d4ed8;background:#dbeafe;border-color:rgba(37,99,235,.35)}
.chip.r4{color:#be185d;background:#fce7f3;border-color:rgba(219,39,119,.35)}
.dark .chip.r4{color:#f9a8d4;background:rgba(219,39,119,.2)}
h1,h2,.brand{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;letter-spacing:-.035em;line-height:1.02}
h1{font-size:clamp(3rem,7vw,5.4rem)}
h2{font-size:var(--fs-h2);max-width:22ch}
.kicker{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sunrise);margin-bottom:.1rem}
.dark .kicker{color:#ffb199}
.meta{position:absolute;bottom:.3rem;left:var(--pad-x);right:var(--pad-x);display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:clamp(.78rem,.95vw,.92rem);font-weight:500;color:var(--muted);z-index:2}
.dark .meta{color:rgba(244,246,250,.45)}
.take{margin-top:auto;font-size:var(--fs-sm);font-weight:800;padding:.3rem .45rem;border-left:5px solid var(--sunrise);background:rgba(255,255,255,.7);max-width:52rem;line-height:1.2}
.dark .take{color:#fff;background:rgba(0,0,0,.25);border-color:#ff8a5c}
img.ill{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}
.title-grid{display:grid;grid-template-columns:1.15fr .95fr;gap:.55rem;align-items:stretch;flex:1;min-height:0}
.brand{font-size:var(--fs-brand);line-height:.9}
.brand span{display:block;color:var(--sunrise)}
.hook{margin-top:.35rem;font-size:clamp(1.6rem,2.7vw,2.3rem);font-weight:800;line-height:1.18;max-width:18ch}
.hook em{font-style:normal;color:#ff8a5c}
.lead{margin-top:.3rem;font-size:var(--fs-sm);font-weight:600;color:rgba(244,246,250,.72);max-width:34ch;line-height:1.3}
.title-visual{border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#0d1424;min-height:0}
.duo{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-top:.15rem}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:grid;grid-template-rows:minmax(0,1.15fr) auto;min-height:0}
.card .art{min-height:0;padding:.2rem;background:#1a1d26}
.card.setter .art{background:#fff7f2}
.card .copy{padding:.4rem .6rem .5rem;border-top:4px solid var(--warn)}
.card.setter .copy{border-top-color:var(--sunrise)}
.card .role{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.card.wakee .role{color:var(--warn)}.card.setter .role{color:var(--sunrise)}
.card h3{font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1.25rem,2vw,1.75rem);font-weight:800;line-height:1.15;margin:.08rem 0}
.card p{font-size:clamp(1rem,1.3vw,1.25rem);font-weight:600;color:var(--muted);line-height:1.25}
.ba{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-top:.1rem}
.ba-col{border-radius:12px;overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:0;border:1px solid var(--line);background:var(--panel)}
.ba-col.before{background:#141820;border-color:#334155;color:#e8eaef}
.ba-col .lbl{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .55rem 0}
.ba-col.before .lbl{color:#f87171}.ba-col.after .lbl{color:var(--signal)}
.ba-col .art{min-height:0;padding:.15rem .3rem}
.ba-col h3{font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1.25rem,1.9vw,1.65rem);font-weight:800;padding:.15rem .55rem .4rem;line-height:1.15}
.loop-art{flex:1;min-height:0;margin-top:.1rem;display:flex;flex-direction:column;gap:.35rem}
.loop-art .strip{flex:1;min-height:clamp(9rem,28vh,14rem);border-radius:12px;overflow:hidden;background:#fff;border:1px solid var(--line)}
.pills{display:flex;flex-wrap:wrap;gap:.28rem;flex:0 0 auto}
.pill{font-size:clamp(1.05rem,1.4vw,1.3rem);font-weight:700;padding:.28rem .55rem;border-radius:8px;background:var(--sunrise-soft);color:#9a3412}
.pill.alt{background:var(--signal-soft);color:#0f766e}.pill.blue{background:#dbeafe;color:#1d4ed8}
.cast{font-size:var(--fs-sm);font-weight:700;color:var(--muted)}.cast strong{color:var(--ink)}
.comic{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);gap:.3rem;margin-top:.1rem}
.cpanel{background:#0f172a;border-radius:10px;overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:0;border:2px solid #1e293b}
.cpanel .cap{display:flex;justify-content:space-between;padding:.25rem .4rem;font-family:"JetBrains Mono",monospace;font-size:clamp(.78rem,.95vw,.92rem);font-weight:700;color:#94a3b8;background:#020617}
.cpanel .cap b{color:#ffb199}
.cpanel .art{min-height:0;background:#0f172a}
.cpanel h3{font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1rem,1.4vw,1.3rem);font-weight:800;color:#f4f6fa;padding:.25rem .4rem .35rem;background:#020617;line-height:1.15}
.deploy{display:grid;grid-template-columns:1.5fr 1fr;gap:.3rem;margin-top:.2rem}
.dbox{border-radius:10px;padding:.35rem .5rem;border:1px solid var(--line);background:var(--panel)}
.dbox.live{border-color:rgba(14,165,160,.5);background:linear-gradient(135deg,var(--signal-soft),#fff 70%)}
.dbox .lbl{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e}
.dbox .url{font-family:"JetBrains Mono",monospace;font-size:clamp(1.05rem,1.5vw,1.4rem);font-weight:700;word-break:break-all;line-height:1.2}
.dbox .hint{font-size:clamp(.9rem,1.15vw,1.1rem);font-weight:600;color:var(--muted);margin-top:.05rem}
.status-art{flex:1;min-height:0;margin-top:.1rem;border-radius:12px;overflow:hidden;background:#fff;border:1px solid var(--line)}
.slabs{display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;margin-top:.25rem}
.slabs div{font-size:clamp(1.1rem,1.5vw,1.4rem);font-weight:800;text-align:center;padding:.3rem;border-radius:8px;line-height:1.2}
.slabs .w{background:#fffbeb;color:#b45309}.slabs .u{background:var(--signal-soft);color:#0f766e}.slabs .m{background:#fff1f2;color:#be123c}
.tech-art,.choice-art{flex:1;min-height:0;margin-top:.1rem;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#fff}
.cnotes{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.2rem}
.cnotes article{padding:.35rem .5rem;border-radius:8px;font-size:clamp(1rem,1.3vw,1.2rem);font-weight:600;line-height:1.25}
.cnotes .cut{background:#1a1d26;color:#fca5a5}.cnotes .bet{background:var(--signal-soft);color:#0f766e}
.cnotes strong{display:block;font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1.2rem,1.65vw,1.5rem);font-weight:800;margin-bottom:.08rem}
.team-art{height:clamp(4.5rem,12vh,6.5rem);border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#0a0e18;flex:0 0 auto;margin-top:.1rem}
.team{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;margin-top:.2rem}
.seat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:.55rem .65rem;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto 1fr;column-gap:.55rem;row-gap:.12rem;position:relative;overflow:hidden;align-content:start}
.seat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--sunrise)}
.seat:nth-child(2)::before{background:var(--signal)}.seat:nth-child(3)::before{background:#2563eb}
.seat .av{width:3.4rem;height:3.4rem;border-radius:50%;display:grid;place-items:center;font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:1.35rem;background:var(--sunrise-soft);color:#9a3412;grid-row:1 / span 2;align-self:center}
.seat:nth-child(2) .av{background:var(--signal-soft);color:#0f766e}.seat:nth-child(3) .av{background:#dbeafe;color:#1d4ed8}
.seat .who{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:clamp(1.55rem,2.2vw,2rem);grid-column:2}
.seat .hat{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sunrise);grid-column:2}
.seat:nth-child(2) .hat{color:#0f766e}.seat:nth-child(3) .hat{color:#1d4ed8}
.seat p{font-size:var(--fs-sm);font-weight:600;color:var(--muted);line-height:1.25;grid-column:1 / -1;margin-top:.35rem;padding-top:.35rem;border-top:1px solid var(--line)}
.shipcut{display:grid;grid-template-columns:1.2fr 1fr;gap:.3rem;margin-top:.2rem}
.shipcut>div{border-radius:10px;padding:.35rem .55rem}
.shipcut .ship{background:var(--signal-soft)}.shipcut .cut{background:#1a1d26;color:#e8eaef}
.shipcut .lbl{font-family:"JetBrains Mono",monospace;font-size:var(--fs-label);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.shipcut .ship .lbl{color:#0f766e}.shipcut .cut .lbl{color:#f87171}
.shipcut h3{font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1.25rem,1.8vw,1.6rem);font-weight:800}
.shipcut li{font-size:clamp(1rem,1.3vw,1.2rem);font-weight:600;list-style:none;line-height:1.25}
.close-grid{flex:1;min-height:0;display:grid;grid-template-columns:1.2fr .8fr;gap:.65rem;align-items:center}
.brand-sm{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:clamp(1.7rem,2.8vw,2.3rem);color:var(--sunrise);margin-bottom:.2rem}
.echo{margin-top:.45rem;display:grid;gap:.18rem;max-width:40rem}
.echo div{font-size:clamp(1.05rem,1.4vw,1.3rem);font-weight:700;color:rgba(244,246,250,.8);line-height:1.25}
.echo b{color:#ffb199;margin-right:.3rem;font-family:"JetBrains Mono",monospace;font-size:var(--fs-label)}
.ask{margin-top:.4rem;font-size:var(--fs-sm);font-weight:700;color:rgba(244,246,250,.7)}
.close-visual{border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.1);height:min(40vh,17rem);min-height:0}
.chrome{width:var(--slide-w);display:flex;justify-content:space-between;align-items:center;color:#94a3b8;font-size:.78rem;font-weight:600;gap:.75rem}
.chrome button{appearance:none;border:1px solid #334155;background:#1e293b;color:#e2e8f0;border-radius:8px;padding:.28rem .55rem;font:inherit;font-weight:700;cursor:pointer}
.note-panel{width:var(--slide-w);max-height:15vh;overflow:auto;background:#111827;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:.45rem .75rem;font-size:.92rem;line-height:1.4}
.note-panel .nr{display:inline-block;margin-right:.4rem;font-family:"JetBrains Mono",monospace;font-size:.68rem;font-weight:700;color:#0f172a;background:#ff8a5c;padding:.12rem .35rem;border-radius:4px}
</style>
</head>
<body>
<div class="deck">
  <div class="chrome">
    <div><span id="counter">1 / 10</span> · WakeMate 5分 · ← → / Space · N=メモ</div>
    <div>
      <button type="button" id="prevBtn">前へ</button>
      <button type="button" id="nextBtn">次へ</button>
      <button type="button" id="notesBtn">話すこと</button>
    </div>
  </div>
  <div class="stage" id="stage">

    <section class="slide dark active" data-rubric="④熱量" data-note="最大15秒。自分アラームは甘い→大事な朝は人が起こす。すぐ課題へ。">
      <span class="chip r4">④ 熱量</span>
      <div class="title-grid">
        <div>
          <p class="kicker">Findy Campus · 5:00</p>
          <p class="brand">Wake<span>Mate</span></p>
          <p class="hook">自分のアラームは<br>自分に甘くなる。<br><em>大事な朝は、<br>信頼できる人が起こす。</em></p>
          <p class="lead">共有アラーム — Setterがセットし、Wakeeが「起きた！」まで閉じる。</p>
        </div>
        <div class="title-visual"><img class="ill" src="assets/hero-trust.svg" alt="" /></div>
      </div>
      <div class="meta"><span>01 · HOOK · 0:00–0:15</span><span>すぐ課題へ</span></div>
    </section>

    <section class="slide" data-rubric="①課題" data-note="WakeeとSetter、両方のペイン。">
      <span class="chip r1">① 課題</span>
      <p class="kicker">Who · 誰の朝か</p>
      <h2>困ってるのは、<br>起きる側だけじゃない。</h2>
      <div class="duo">
        <article class="card wakee">
          <div class="art"><img class="ill" src="assets/persona-wakee.svg" alt="" /></div>
          <div class="copy">
            <p class="role">Wakee · 起きられない側</p>
            <h3>明日、絶対起きなきゃいけない人</h3>
            <p>受験・旅行集合・初出勤。自分セットでもスヌーズか設定忘れで負ける。</p>
          </div>
        </article>
        <article class="card setter">
          <div class="art"><img class="ill" src="assets/persona-setter.svg" alt="" /></div>
          <div class="copy">
            <p class="role">Setter · 起こしたい側</p>
            <h3>その朝を心配してる人</h3>
            <p>LINEで「起きて」は言える。端末は鳴らないし、起きたかは見えない。</p>
          </div>
        </article>
      </div>
      <p class="take">審査に残す: 課題の当事者は二人いる。</p>
      <div class="meta"><span>02 · PERSONA · 0:15–0:40</span><span>課題と解決策 /10</span></div>
    </section>

    <section class="slide" data-rubric="①課題" data-note="自分アラームとLINEの穴。右は解決の予告。">
      <span class="chip r1">① 課題</span>
      <p class="kicker">Gap · なぜ既存では足りない</p>
      <h2>今ある手段じゃ、<br>朝が守れない。</h2>
      <div class="ba">
        <div class="ba-col before">
          <p class="lbl">Before · いま</p>
          <div class="art"><img class="ill" src="assets/scene-before.svg" alt="" /></div>
          <h3>自分アラーム × LINE催促 → 穴が残る</h3>
        </div>
        <div class="ba-col after">
          <p class="lbl">After · 必要な穴埋め</p>
          <div class="art"><img class="ill" src="assets/scene-after.svg" alt="" /></div>
          <h3>他人セット × 起床確認 → 朝が閉じる</h3>
        </div>
      </div>
      <p class="take">審査に残す: 自分依存でも相手依存の催促でも穴が残る。</p>
      <div class="meta"><span>03 · GAP · 0:40–1:00</span><span>課題と解決策 /10</span></div>
    </section>

    <section class="slide" data-rubric="①解決" data-note="独自性3つ。他人セット／起床確認／サーバー時刻。">
      <span class="chip r1">① 解決</span>
      <p class="kicker">Solution · 独自のループ</p>
      <h2>信頼できる人が、<br>アラームをセットする。</h2>
      <div class="loop-art">
        <div class="strip"><img class="ill" src="assets/loop-strip.svg" alt="" /></div>
        <div class="pills">
          <span class="pill">他人がセットできる</span>
          <span class="pill alt">起床確認まで閉じる</span>
          <span class="pill blue">サーバー側で時刻を守る</span>
        </div>
      </div>
      <p class="take">審査に残す: 独自性＝他人セット ＋ 起床確認ループ。</p>
      <div class="meta"><span>04 · UNIQUE LOOP · 1:00–1:25</span><span>課題と解決策 /10</span></div>
    </section>

    <section class="slide" data-rubric="②完成度" data-note="Must一本を口で追う。URL必ず言う。">
      <span class="chip r2">② 完成度</span>
      <p class="kicker">Ship · 動く一本 ＋ Workers</p>
      <h2>Must を、公開URLで通す。</h2>
      <p class="cast"><strong>デモ物語:</strong> 彼女（Setter）→彼氏（Wakee）・明日の大事な朝</p>
      <div class="comic">
        <article class="cpanel"><div class="cap"><b>MUST 1</b><span>CONNECT</span></div><div class="art"><img class="ill" src="assets/comic-1-connect.svg" alt="" /></div><h3>グループ作成／コード参加</h3></article>
        <article class="cpanel"><div class="cap"><b>MUST 2</b><span>SET</span></div><div class="art"><img class="ill" src="assets/comic-2-set.svg" alt="" /></div><h3>相手を選んでセット</h3></article>
        <article class="cpanel"><div class="cap"><b>MUST 3</b><span>FIRE</span></div><div class="art"><img class="ill" src="assets/comic-3-fire.svg" alt="" /></div><h3>時刻に端末へ届く</h3></article>
        <article class="cpanel"><div class="cap"><b>MUST 4</b><span>CONFIRM</span></div><div class="art"><img class="ill" src="assets/comic-4-confirm.svg" alt="" /></div><h3>「起きた！」で確定</h3></article>
      </div>
      <div class="deploy">
        <div class="dbox live">
          <div class="lbl">Cloudflare Workers · 公開</div>
          <div class="url">https://findy-campus-hackathon-2.trco0430.workers.dev</div>
          <div class="hint">固定公開URL（まをデプロイ）。口でも言う。</div>
        </div>
        <div class="dbox">
          <div class="lbl">完成度の定義</div>
          <div class="url" style="font-family:Figtree,sans-serif;font-size:clamp(1.05rem,1.45vw,1.3rem)">この4コマが一本で通ること。Push弱ければ画面内警報で同じ物語。</div>
        </div>
      </div>
      <div class="meta"><span>05 · DEMO + DEPLOY · 1:25–2:25</span><span>プロダクト完成度 /10</span></div>
    </section>

    <section class="slide" data-rubric="②完成度" data-note="鳴るだけじゃなくステータスまで。">
      <span class="chip r2">② 完成度</span>
      <p class="kicker">Proof · メイン機能が閉じる</p>
      <h2>鳴るだけじゃない。<br>返事まで見える。</h2>
      <div class="status-art"><img class="ill" src="assets/status-triptych.svg" alt="" /></div>
      <div class="slabs">
        <div class="w">待機中 · 見守りの状態</div>
        <div class="u">起床済み · Must完了</div>
        <div class="m">未確認 · 甘えを放置しない</div>
      </div>
      <p class="take">審査に残す: 完成＝招待→セット→発火→起床確認が通ること。</p>
      <div class="meta"><span>06 · CLOSED LOOP · 2:25–2:55</span><span>プロダクト完成度 /10</span></div>
    </section>

    <section class="slide" data-rubric="③技術" data-note="部品ごとになぜ。主役はDO Alarms。">
      <span class="chip r3">③ 技術</span>
      <p class="kicker">Tech · Cloudflare をこう使った</p>
      <h2>部品ごとに、<br>選んだ理由がある。</h2>
      <div class="tech-art"><img class="ill" src="assets/tech-diagram.svg" alt="" /></div>
      <div class="meta"><span>07 · CF STACK · 2:55–3:40</span><span>技術チャレンジ /10</span></div>
    </section>

    <section class="slide" data-rubric="③技術" data-note="切った選択 vs DO Alarm。">
      <span class="chip r3">③ 技術</span>
      <p class="kicker">Challenge · 難所と意図</p>
      <h2>クライアントの<br>タイマーには賭けない。</h2>
      <div class="choice-art"><img class="ill" src="assets/choice-vs.svg" alt="" /></div>
      <div class="cnotes">
        <article class="cut"><strong>切った: 端末 setTimeout</strong>タブ落とす・スリープで時刻が死ぬ。大事な朝の基盤にできない。</article>
        <article class="bet"><strong>賭けた: Durable Object Alarm</strong>アラーム1件＝サーバー予約。発火→D1→Push→confirm。CFの芯。</article>
      </div>
      <p class="take">審査に残す: 技術チャレンジ＝サーバー側スケジュールで朝を守る。</p>
      <div class="meta"><span>08 · INTENT · 3:40–4:15</span><span>技術チャレンジ /10</span></div>
    </section>

    <section class="slide" data-rubric="④熱量" data-note="名前を実名に。Must一本に賭けた。">
      <span class="chip r4">④ 熱量</span>
      <p class="kicker">Team · 役割と覚悟</p>
      <h2>今日、Must一本に<br>賭けた。</h2>
      <div class="team-art"><img class="ill" src="assets/team-bet.svg" alt="" /></div>
      <div class="team">
        <article class="seat"><div class="av">P</div><div class="hat">Product / Pitch</div><div class="who">（名前）</div><p>課題定義・デモ物語・5分のタイムキープ</p></article>
        <article class="seat"><div class="av">W</div><div class="hat">Workers / DO</div><div class="who">（名前）</div><p>API・Durable Object Alarm・発火フロー</p></article>
        <article class="seat"><div class="av">C</div><div class="hat">Client / Push</div><div class="who">（名前）</div><p>グループUI・Web Push・「起きた！」</p></article>
      </div>
      <div class="shipcut">
        <div class="ship"><p class="lbl">Ship</p><h3>通す導線だけ</h3><ul><li>招待 → セット → Push → 起きた</li><li>Workers 本番デプロイ</li></ul></div>
        <div class="cut"><p class="lbl">Cut</p><h3>今日はやらない</h3><ul><li>本格認証・通話起こし・AI</li></ul></div>
      </div>
      <div class="meta"><span>09 · TEAM · 4:15–4:45</span><span>プレゼン・熱量 /10</span></div>
    </section>

    <section class="slide dark" data-rubric="④熱量" data-note="4軸を超短く反芻。質問どうぞ。">
      <span class="chip r4">④ 熱量</span>
      <div class="close-grid">
        <div>
          <p class="brand-sm">WakeMate</p>
          <h1>大事な朝は、<br>信頼できる人が<br>起こす。</h1>
          <div class="echo">
            <div><b>課題</b>自分アラームもLINEも穴 → 当事者は二人</div>
            <div><b>完成</b>Must一本を Workers 公開URLで通す</div>
            <div><b>技術</b>DO Alarm で時刻を守る。端末タイマーは切った</div>
            <div><b>熱量</b>役割を分けて、共有アラーム一本に賭けた</div>
          </div>
          <p class="ask">ご清聴ありがとう。質問どうぞ。</p>
        </div>
        <div class="close-visual"><img class="ill" src="assets/close-dawn.svg" alt="" /></div>
      </div>
      <div class="meta"><span>10 · CLOSE · 4:45–5:00</span><span>余韻で4軸を閉じる</span></div>
    </section>

  </div>
  <aside class="note-panel" id="notePanel" hidden><div id="noteText"></div></aside>
</div>
<script>
const slides=[...document.querySelectorAll(".slide")];
const counter=document.getElementById("counter");
const notePanel=document.getElementById("notePanel");
const noteText=document.getElementById("noteText");
let i=0, notesOn=false;
function show(n){
  i=Math.max(0,Math.min(slides.length-1,n));
  slides.forEach((s,idx)=>s.classList.toggle("active",idx===i));
  counter.textContent=\`\${i+1} / \${slides.length}\`;
  noteText.innerHTML=\`<span class="nr">\${slides[i].dataset.rubric||""}</span>\${slides[i].dataset.note||""}\`;
  history.replaceState(null,"",\`#\${i+1}\`);
}
function toggleNotes(){notesOn=!notesOn;notePanel.hidden=!notesOn;}
document.getElementById("prevBtn").onclick=()=>show(i-1);
document.getElementById("nextBtn").onclick=()=>show(i+1);
document.getElementById("notesBtn").onclick=toggleNotes;
window.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){e.preventDefault();show(i+1);}
  else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();show(i-1);}
  else if(e.key==="n"||e.key==="N")toggleNotes();
  else if(e.key==="Home")show(0);
  else if(e.key==="End")show(slides.length-1);
});
const hash=parseInt(location.hash.replace("#",""),10);
show(Number.isFinite(hash)&&hash>0?hash-1:0);
</script>
</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
const check = fs.readFileSync(out, "utf8");
console.log("wrote", out, check.length, "bytes");
console.log("slides", (check.match(/<section class="slide/g) || []).length);
console.log("assets", (check.match(/assets\/[a-z0-9.-]+\.svg/g) || []).length);
console.log("hero", check.includes("hero-trust.svg"));
console.log("tech", check.includes("tech-diagram.svg"));
