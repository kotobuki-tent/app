---
name: gas-update
description: SEQUENCE LAB の GAS バックエンド (Code.gs) を変更・デプロイする手順。dept ハンドラ・cascade・rollup・トリガーなどサーバー側ロジックを触る時に使う。
---

# GAS (Code.gs) を変更する手順

GAS 正本 = `Code.gs`（iCloud `~/Library/Mobile Documents/com~apple~CloudDocs/♿️SEQUENCE LAB/Code.gs`、git リポジトリ外・約1500行）。フロント (`spa/spa.html`) は単一エンドポイント `const API=...exec` に `?dept=` で投げるだけ。サーバー側の振り分け・cascade・rollup は全部ここ。

## 手順

1. **取り出す**: `cp "$ICLOUD/Code.gs" /tmp/Code.gs`（`ICLOUD="$HOME/Library/Mobile Documents/com~apple~CloudDocs/♿️SEQUENCE LAB"`）。Bash は iCloud のテキストを cp で読める。
2. **編集**: `/tmp/Code.gs` を diff で編集（丸ごと書き直さない）。
3. **構文チェック**: JavaScriptCore で `new Function(src)`。
   ```sh
   JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
   cat > /tmp/chk.js <<'EOF'
   var s=read('/tmp/Code.gs');
   try{ new Function(s); print('OK lines='+s.split('\n').length); }
   catch(e){ print('SYNTAX ERROR: '+e); }
   EOF
   "$JSC" /tmp/chk.js
   ```
   （`node` は無い。jsc を使う。）
4. **正本へ戻す**: `cp /tmp/Code.gs "$ICLOUD/Code.gs"`。`.gs` は関連付けが無く開けないので、iller が貼り付けやすいよう `cp /tmp/Code.gs "$ICLOUD/Code_貼り付け用.txt"`（＋ Desktop にも）も置く。
5. **iller が Apps Script に反映**: 業務管理スプレッドシート → 拡張機能 → Apps Script → 全消し → 貼付 → 保存。
6. **デプロイ（必要な時だけ）**: doGet/doPost 経由で動く **web handler を変えた時だけ** 「デプロイ ▼ → デプロイを管理 → 既存デプロイの鉛筆(編集) → バージョン=新しいバージョン → デプロイ」。手動関数・トリガーは **保存だけで反映**（再デプロイ不要）。
7. **既存データの一括処理**が要る変更は、手動関数を Apps Script で1回実行（例: `recalcAllCases`）。SpreadsheetApp しか使わない関数は承認ダイアログが出ない＝それが正常。

## 鉄則

- **正本は実プロジェクトで編集**。`weeklyBackup` が作るスプレッドシート複製にも編集可能な bound script が付く。tell-tale: 「デプロイを管理」にデプロイが **0個** なら開いてるのはバックアップコピー → 開き直す。
- **API URL は変えない**。既存デプロイの「新バージョン」は URL 不変。デプロイを **作り直す** と URL が変わり全12画面が一斉に死ぬ。万一変わったら最優先で `spa/spa.html` の `const API=` を新 URL に書き換え。
- **守るべきトリガー（消さない）**: `keepAlive`(5分・コールドスタート防止)、`weeklyBackup`(月4時)、`emailBackupXlsx`(月5時)。朝だけ遅い→ keepAlive を疑う。
