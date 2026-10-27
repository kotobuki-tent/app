---
description: iller との仕事の進め方（口調・判断・デプロイ作法・見せ方）。常時適用。
---

# iller 仕様

## 口調・判断
- **簡潔に**。前置き・お世辞・選択肢メニューを並べない。言われたらやる。
- 勝手に作業を段階分けしない。「これ価値ある？」「影響軽微」で後回し・矮小化しない。バグに自己判断でランクを貼らない。
- 推奨は1つに絞って言う。網羅的な比較は要らない。
- 日本語で返す（コードと識別子は原文ママ）。iller を「iller」と呼ぶ（岸田ではない）。

## デプロイ・コミット
- **デプロイ = commit + `git push origin main`**（GitHub Pages が main を直配信）。**不具合の直し（iller が今見ている画面の崩れ・動かない・見えない）は commit したらそのまま push**（10/23「それくらい push しとけよ」）。新しい機能・作りの変更は iller の「push」を待つ。リモートは SSH `git@github.com:kotobuki-tent/app.git`。
- 編集は **diff で**。ファイル丸ごとの消して貼り直しはしない。
- コミットメッセージ末尾は必ず: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **版の表示**：画面右下（ポータルでは足元）の「Ver. N」＝その端末が読み込んでいる spa.html の通し番号（`const APP_BUILD`＝コミット数、`.git/hooks/pre-commit` が毎コミット自動で書き換える＝spa.html を触らないコミットでも版は進む（2026-10-21〜、通し番号とずれないように）。手で触らない）。「最新版か」は `git rev-list --count HEAD` と見比べる。マウスを乗せるとコミット日時（`const APP_VER`、新版検知に使う）が出る。
- **実機反映は最大10分**（GitHub Pages CDN cache）＋ SW が spa.html を stale-while-revalidate でキャッシュしている（2026-09-03〜）ので**開き直し1回分遅れて反映**（1回目の開き直しで裏取得→2回目で新版）。「更新」ボタンはデータ再取得のみ。開きっぱなしの端末は 10 分以内に新しい版に気づき、10 分放置で黙って読み直す（2026-09-17〜、`spa/ver.txt` をフックが書く。お知らせのバナーは 09-18 に撤去＝iller「混乱の元」）。

## 検証・見せ方
- 変更後は preview（`python3 -m http.server`、`.claude/launch.json` の "spa" 設定）で検証 → コンソールエラー無しを確認 → push。
- **iller に視覚物を見せる時は `show_widget`**（チャットに表示される）。`preview_screenshot` は自分の検証専用で **iller には見えない** — 「スクショ出した」は通じない。
- **iller が見ている画面を iller の指示で直した物（並び・名前・寄せ・隠す程度）は commit したらそのまま push**（10/27「そのくらい push しとくって決めなかったか？」）。「push」を待つのは、作りを変える物・データの扱いが変わる物・iller がまだ見ていない新しい機能だけ。
