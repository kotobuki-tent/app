---
description: 壊すとアプリ全体・データに波及する禁止事項（コードから推測できない）。常時適用。
---

# ガードレール（絶対にやらない）

- **`sw.js` の編集は可（2026-07-28 iller が解禁）。ただし細心に。** プリキャッシュ資産（`PRECACHE_URLS` のファイル・icons）を変更した時は `CACHE_VERSION` をバンプする。install/activate ハンドラのロジックは壊すと全端末のキャッシュ・オフライン動作が死ぬので、変更は最小限＋変更後に registration の更新を実機/プレビューで確認。
- **2つの manifest を混同しない。** `spa/manifest.json`(SPA, `start_url`=`./spa.html`) と ルート `manifest.json`(`start_url`=`./spa/spa.html`) は別ファイル。過去に `start_url` を壊した。編集前にどっちか確認。両方 `theme_color`=#ffffff。
- **Google シートの row1（ヘッダ行）・列A（`id` 列）を触らない。** GAS ハンドラがこれをキーにする。壊すと読み書きが app-wide で死ぬ。
- **`.hidden` CSS ルール（`display:none!important`）を消さない。** SPA 全体の画面切替・表示制御が依存。

GAS（`Code.gs`）を変更する手順は別途 `gas-update` skill を参照。
