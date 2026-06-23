---
description: 壊すとアプリ全体・データに波及する禁止事項（コードから推測できない）。常時適用。
---

# ガードレール（絶対にやらない）

- **`sw.js` は編集しない。** `CACHE_VERSION` は iller が手動管理。触らない・バンプしない・「push したか」も聞かない。
- **2つの manifest を混同しない。** `spa/manifest.json`(SPA, `start_url`=`./spa.html`) と ルート `manifest.json`(`start_url`=`./spa/spa.html`) は別ファイル。過去に `start_url` を壊した。編集前にどっちか確認。両方 `theme_color`=#ffffff。
- **Google シートの row1（ヘッダ行）・列A（`id` 列）を触らない。** GAS ハンドラがこれをキーにする。壊すと読み書きが app-wide で死ぬ。
- **`.hidden` CSS ルール（`display:none!important`）を消さない。** SPA 全体の画面切替・表示制御が依存。

GAS（`Code.gs`）を変更する手順は別途 `gas-update` skill を参照。
