# 寿テント 業務管理アプリ

テント・イベント設営会社の工程管理・在庫管理・時間外管理・車両管理・日報・工数管理を一元化するWebアプリ（**SEQUENCE LAB**）。  
Google スプレッドシートをデータベースとして使い、GitHub Pages でホスティング。

## URL

- **HOME**: https://kotobuki-tent.github.io/app/portal.html
- **日報**: https://kotobuki-tent.github.io/app/daily.html
- **時間外ボード**: https://kotobuki-tent.github.io/app/overtime.html
- **生産部**: https://kotobuki-tent.github.io/app/
- **企画制作部**: https://kotobuki-tent.github.io/app/project.html
- **工数管理**: https://kotobuki-tent.github.io/app/labor.html
- **在庫管理**: https://kotobuki-tent.github.io/app/inventory.html
- **車両管理**: https://kotobuki-tent.github.io/app/vehicle.html
- **台帳登録**: https://kotobuki-tent.github.io/app/register.html

## 構成

| ファイル | 役割 |
|---|---|
| `portal.html` | HOME（全アプリへのカード型リンク集） |
| `daily.html` | 日報（作業時間の記録・みんなの日報閲覧・編集） |
| `overtime.html` | 時間外ボード（残業申告・休日出勤希望・出勤管理） |
| `index.html` | 生産部（工場ボード・出荷済・管理・製作図連携） |
| `project.html` | 企画制作部（ガントチャート・車両バッティング・貸出期間表示・管理） |
| `labor.html` | 工数管理（案件ごとの延べ作業時間・人別内訳） |
| `inventory.html` | 在庫管理（商品台帳・貸出/予約・メンテ・在庫確認） |
| `vehicle.html` | 車両管理（車両台帳・期限アラート・メンテ履歴） |
| `register.html` | 台帳登録（スマホ特化・商品追加専用） |
| Apps Script（外部） | API（スプレッドシートCRUD・Driveファイル一覧） |

全アプリ共通のChromeタブ風ヘッダー：`HOME｜日報｜時間外  [spacer]  生産部｜企画制作部｜工数管理｜在庫管理｜車両管理  [≡]  [↻更新]`

## スプレッドシート構成

| シート | 内容 |
|---|---|
| `orders` | 生産部の案件データ（files・invoicedカラム含む） |
| `projects` | 企画制作部の現場データ（貸出/返却日程・invoicedカラム含む） |
| `inventory` | 商品マスタ（カテゴリ・商品名・保有数） |
| `rentals` | 貸出/予約台帳（ステータス・期間・数量） |
| `vehicles` | 車両台帳（車検・保険期限・メンテ履歴） |
| `staff` | スタッフ名簿（employee_no・name・dept・position） |
| `overtime` | 時間外申告データ |
| `ot_requests` | 休日出勤希望データ |
| `daily_reports` | 日報データ（date・employee_no・project・work・minutes） |
| `attendance` | 出勤管理データ |

## 機能

### HOME（portal.html）

- 全アプリへのカード型リンク

### 日報（daily.html）

- 自分で書くタブ：案件と作業内容を選んで分単位で記録
- 案件プルダウンは選択中の氏名の部署に応じて並び替え（生産部の人なら生産部案件が上）
- 作業内容は固定リスト（22項目＋自由記述）を案件の部署に応じて並び替え
- 日付ピッカーで過去3日まで遡って記入可能
- カードタップで編集モード／削除ボタン
- みんなの日報タブ：日付別に全員の日報を閲覧、自分のエントリは編集ボタン付き

### 時間外ボード（overtime.html）

- 申告タブ：週次グリッドで曜日ごとの時間外希望を登録
  - 平日：18:00〜20:00の30分刻みで終了時刻を申告
  - 土日祝：午前/午後/終日の3択
  - 日本の祝日2025〜2027年を内蔵
- 管理タブ：週間の申告状況を一覧表示、管理者から社員への一括メッセージ機能

### 生産部（index.html）

- 工場ボード：受注・製作中・完成の案件を納期順にカード表示、緊急度バッジ、ステータス/作業場所フィルター、検索
- 案件詳細モーダル：ステータス変更ボタン（受注→製作中→完成→出荷済をワンタップ）
- 製作図連携：Google Driveフォルダからファイルを案件に紐づけ、タップでDriveプレビュー表示
- 出荷済タブ：見積番号・伝票チェックボックス付き、ヘッダークリックソート、検索
- 管理タブ：ステータスフィルターボタン（件数表示）、全案件テーブル、ソート・検索
- ソート：納期は日付比較（空欄末尾）、ステータスはカスタム順序

### 企画制作部（project.html）

- スケジュール：ガントチャート（搬入/設営/本番/撤去/貸出/返却を色分け表示、祝日表示対応）
- 貸出期間表示：貸出日〜返却日の期間を薄紫の帯で表示（長期レンタル対応）
- 日付範囲表示：各現場に「4/14〜4/15」のような日程表示
- 車両バッティング確認：同一車両の日程重複を自動検出
- 完了タブ：見積番号・完了日（撤去日or返却日の遅い方）・伝票チェックボックス、ヘッダークリックソート、検索
- 管理タブ：見積番号・伝票チェックボックス付き、全現場テーブル、ソート・検索
- 現場詳細モーダル：日程・人数・車両・在庫管理連携レンタル品を表示
- 編集モーダル：日程6フェーズ（搬入/設営/本番/撤去/貸出/返却）を2列グリッド表示

### 工数管理（labor.html）

- 工場ボードタブ：進行中の案件ごとの延べ作業時間、人別内訳
- 出荷済タブ：完了案件の工数集計
- ステータスフィルター、納期順ソート
- 日報データ（daily_reports）から集計

### 在庫管理（inventory.html）

- 商品台帳：カテゴリ別に商品を管理、ヘッダークリックソート（カテゴリ・商品名・保有数）、検索
- 貸出/予約：ステータス管理（予約→貸出中→返却済→メンテ待ち→メンテ中）、期限超過アラート、検索
- メンテタブ：メンテ待ち・メンテ中の商品だけ表示、検索
- 在庫確認：期間指定で使用率バー表示、貸出/メンテの内訳表示、カテゴリフィルター
- 案件連携：企画制作部の現場と紐づけて貸出登録

### 車両管理（vehicle.html）

- ダッシュボード：車検・自賠責・任意保険・オイル交換の期限アラートを要対応/注意に分類表示
- 車両一覧：全車両をカード表示、各期限の残日数をバッジで色分け
- 管理タブ：車両の新規登録・編集・削除・検索・ソート
- 車両詳細モーダル：全情報＋メンテナンス履歴の閲覧・追加・削除
- アラート設定：閾値（何日前から表示するか、オイル交換のkm/日数）をカスタマイズ

## 技術

- HTML / CSS / JavaScript（フレームワークなし、各アプリ1ファイル完結）
- Google Apps Script（API・v6、deptパラメータで部門振り分け：production / project / inventory / overtime / vehicle / daily / labor / attendance / drive）
- Google スプレッドシート（データベース）
- Google Drive（製作図ファイル連携、フォルダID: `16iDJrBWXdbIHq-aqJVgHZpA9tRGXMUwc`）
- GitHub Pages（ホスティング）
- 楽観的更新（no-cors POST + ローカル配列即時反映）
- 新規作成時のtmp_id残留対策：新規保存後にloadAll自動実行（GASの実ID採番を待つ）
- 並行実行競合対策：attendanceはLockServiceでシリアライズ、cleanupはclearContent + setValues一括書き込みで高速化
- スマホ対応：全アプリでメディアクエリ（max-width:768px）対応、Chromeタブ風ヘッダーは≡メニューで右グループを折り畳み、テーブルは `:nth-of-type` + `::before` 疑似要素でカード型に変換
- iOS Safari対策：nav-rightをモバイル時のみbody直下にJSで移動（祖先overflow影響回避）
- DOMフィルター方式の検索（全タブ対応、input focus維持）
- favicon：インラインSVG漢字アイコン（寿・日・時・製・企・工・庫・車・登）

## Credit

Built by **iller** with Claude — 2026
