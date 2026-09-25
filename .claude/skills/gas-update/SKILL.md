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
4. **正本へ戻す**: `cp /tmp/Code.gs "$ICLOUD/Code.gs"`。`.gs` は関連付けが無く開けないので `cp /tmp/Code.gs "$ICLOUD/Code_貼り付け用.txt"` も置く（Desktop には置かない）。
5. **Apps Script に反映（Claude が Chrome でやる。iller に頼まない）**:
   - Claude in Chrome（illerのログイン済み Chrome）で `https://script.google.com/home` を開く。一覧に「業務管理API」が9個並ぶ（週次バックアップの複製にも同名の bound script が付く）。**本物＝紐づくスプレッドシートが `1YY_gjeSK20Ln2PdkUOfExNOymftsEBxOHgIt1We4KDI`（業務管理）の行**。他の ID は `業務管理_backup_*` の複製。行の「プロジェクトの概要」ボタンでエディタが開く（2026-09-16 時点の URL: `https://script.google.com/home/projects/1EZjYNJR3fi_qPslk36JIf4fVzJLXvJ5OZ3htsTBkjmwjOZO7nkNffnSD/edit`）。
   - クリップボード（pbcopy）はこのセッションからは使えない。代わりに scratchpad に CORS 付きの小さな配信サーバー（`Access-Control-Allow-Origin: *` を返す python http.server、port 8772）を `.claude/launch.json` に一時登録して preview_start で立て、エディタのページで `javascript_tool`:
     `const t=await (await fetch('http://localhost:8772/Code.gs')).text(); const m=monaco.editor.getModels()[0]; monaco.editor.getEditors()[0].executeEdits('claude',[{range:m.getFullModelRange(),text:t}]); m.getLineCount()`
     で流し込む → エディタをクリック → `cmd+s`（画面上部に「ドライブに保存しました」）。終わったら launch.json の一時登録は `git checkout` で戻し、サーバーを止める。
   - 手動関数を動かす時は、関数選択のドロップダウン（find で listbox「実行する関数を選択」）をクリック → **Down/Up キーで移動 → Return**（09-17：タイプすると文字がエディタ本文に入って壊れる。入ったら正本を流し直して保存）→ 実行 → 実行ログで確認。スクリプトプロパティは `…/settings` 画面の「スクリプト プロパティを追加」で手入力できる。
   - デプロイのバージョン欄は「クリックで開く → リスト内の『新バージョン』を座標クリック」（Return が効かない時がある）。終わったら「バージョン N」が増えたことをダイアログで確認。エディタから実行する関数は `SpreadsheetApp.getUi().alert` が使えないので **`Logger.log` で書く**。
6. **デプロイ（必要な時だけ）**: doGet/doPost 経由で動く **web handler を変えた時だけ** 「デプロイ ▼ → デプロイを管理 → 既存デプロイの鉛筆(編集) → バージョン=新しいバージョン → デプロイ」。手動関数・トリガーは **保存だけで反映**（再デプロイ不要）。
7. **既存データの一括処理**が要る変更は、手動関数を Apps Script で1回実行（例: `recalcAllCases`）。SpreadsheetApp しか使わない関数は承認ダイアログが出ない＝それが正常。

## 鉄則

- **正本は実プロジェクトで編集**。`weeklyBackup` が作るスプレッドシート複製にも編集可能な bound script が付く。tell-tale: 「デプロイを管理」にデプロイが **0個** なら開いてるのはバックアップコピー → 開き直す。
- **API URL は変えない**。既存デプロイの「新バージョン」は URL 不変。デプロイを **作り直す** と URL が変わり全12画面が一斉に死ぬ。万一変わったら最優先で `spa/spa.html` の `const API=` を新 URL に書き換え。
- **守るべきトリガー（消さない）**: `keepAlive`(5分・コールドスタート防止)、`weeklyBackup`(月4時)、`emailBackupXlsx`(月5時)。朝だけ遅い→ keepAlive を疑う。

## Claude が Chrome で Apps Script を操作する時のコツ（2026-09-18）

- **保存**：cmd+s は効かないことが多い。ツールバーの「ドライブにプロジェクトを保存」ボタンを押し、タイトル横が「ドライブに保存しました」になるのを確認してから次へ。保存前に実行すると古いコードが走る。
- **関数の選択**：一覧の項目をクリックしても変わらないことがある。一覧を開いて関数名の頭文字を打つ（type-ahead）→ Return。表示が変わったのを確認。
- **選び直した直後の1回目の実行は前の関数が走ることがある**（実行ログが「開始・完了」だけで Logger の行が出ない）。結果を API で確かめ、変わっていなければもう一度実行。
- **エディタから実行する一回実行用の関数は `SpreadsheetApp.getUi().alert` を使わない**（エディタからは例外になる）。`Logger.log` にする。
- **デプロイのバージョン選択**：一覧をクリックで選ぶと1〜2行ずれる。開いたら Up キーで「新バージョン」まで上げて Return、表示が「新バージョン」なのを確認してから「デプロイ」。

## Claude が自分で貼る手順（2026-09-25 実績）

iller 不在でも Chrome（claude-in-chrome）で反映できる。
1. `/tmp/Code.gs` を CORS 付きの小サーバ（`.claude/launch.json` に一時エントリ `gascors`、port 8772、`Access-Control-Allow-Origin: *`）で配る。終わったら `git checkout -- .claude/launch.json`。
2. `https://script.google.com/home` → 「業務管理API」は weeklyBackup のコピーが 8 個並ぶ。**本物＝行のリンク先スプレッドシートが `1YY_gjeSK20Ln2PdkUOfExNOymftsEBxOHgIt1We4KDI` の行**（JS で `[role="option"]` の outerHTML から `spreadsheets/d/…` を拾う）。行の `div[role=button]` に `dispatchEvent(new MouseEvent('click',{bubbles:true}))` で同じタブに `/projects/<id>/edit` が開く（普通のクリックは別タブに逃げて掴めない）。プロジェクト ID＝`1EZjYNJR3fi_qPslk36JIf4fVzJLXvJ5OZ3htsTBkjmwjOZO7nkNffnSD`。
3. 差し替え前に `monaco.editor.getEditors()[0].getModel().getValue()` を 8772 に POST して `diff` で「自分の変更だけ」を確認（JS の戻り値に鍵を含めない＝ブロックされる）。
4. `ed.executeEdits('claude',[{range:m.getFullModelRange(),text:new}])` → ツールバー「ドライブにプロジェクトを保存」→ 「デプロイ ▼」→「デプロイを管理」→ 鉛筆「編集」→ バージョンのプルダウン → **find で option「新バージョン」を取って ref クリック**（座標クリックは一覧がスクロールして 95 を掴んだ）→ 右下「デプロイ」→ 「バージョン N（日時）」と同じデプロイ ID を確認 → 完了。
5. `/tmp/editor_dump.txt`・`/tmp/Code.gs` は鍵入りなので消す。
