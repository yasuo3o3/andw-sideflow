=== andW SideFlow ===
Contributors: yasuo3o3
Tags: sidebar, drawer, slider, mobile, recruitment
Requires at least: 5.0
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 0.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

右サイド追従タブから展開するドロワー型求人スライドショー&ボタン群プラグイン

== Description ==

andW SideFlowは、モバイルファーストで設計された軽量なサイドドロワープラグインです。右端の追従タブをタップすることで、求人スライドショーとアクションボタンを含むドロワーが展開されます。

= 主な機能 =

* **右サイド追従タブ**: 20-30秒間隔の光沢エフェクト付き
* **自動スライドショー**: 3.5秒間隔、ユーザー操作で停止
* **スワイプ対応**: 長押し0.4秒で停止、直感的な操作
* **レスポンシブ対応**: 画面サイズに応じた最適表示
* **アクセシビリティ**: スクリーンリーダー対応、キーボード操作対応
* **動作軽量**: 依存ライブラリゼロ、Shadow DOM採用
* **カスタマイズ可能**: ボタン1-3個、配色・リンク設定可能

= 技術的特徴 =

* **Shadow DOM**: スタイル衝突を完全回避
* **Page Visibility API**: タブが非表示時は自動再生停止
* **Intersection Observer**: 画像の遅延読み込み対応
* **Visual Viewport API**: iOS SafeAreaとソフトキーボード対応
* **prefers-reduced-motion**: アクセシビリティ配慮

= 画像最適化 =

自動的に以下の画像サイズを生成し、srcset/sizesで最適配信：
* 600×338, 720×405, 960×540, 1200×675, 1440×810

== Installation ==

1. プラグインファイルを `/wp-content/plugins/andw-sideflow/` ディレクトリにアップロード
2. WordPress管理画面の「プラグイン」メニューからプラグインを有効化
3. 「設定」→「andW SideFlow」で設定を行います

== Frequently Asked Questions ==

= スライドショーが自動再生されません =

以下を確認してください：
* ブラウザのprefers-reduced-motion設定
* 設定でautoplayが有効になっているか
* ユーザーが既に操作していないか

= ボタンの配色を変更したい =

設定画面でvariantを以下から選択できます：
* default: グレー系
* accent: グラデーション
* line: アウトライン（LINE風配色対応）

= モバイルで表示がずれます =

iOS SafeAreaに対応済みです。設定のlayout.topSafeOffset, bottomSafeOffsetで微調整可能です。

== Screenshots ==

1. 右サイド追従タブの表示
2. ドロワー展開時のスライドショー
3. ボタン群の表示パターン
4. 管理画面の設定画面

== Changelog ==

= 0.0.2 =
* タブ位置をanchor（center/bottom）+offsetPxで制御可能に変更
* ドロワー展開時の背景（backdrop）を設定で無効化可能に変更
* スライド領域の高さを成り行き高さ（aspectRatio基準）に変更
* 新設定JSON仕様への対応（下位互換性維持）

= 0.0.1 =
* 初回リリース
* 基本機能の実装
* Shadow DOM対応
* アクセシビリティ対応

== Technical Notes ==

= REST API エンドポイント =

* `GET /wp-json/andw-sideflow/v1/config` - 設定取得（公開）

= トラッキングイベント =

dataLayerに以下のイベントを送信：
* `andw_sideflow_tab_open` - タブ開く
* `andw_sideflow_tab_close` - タブ閉じる
* `andw_sideflow_btn_click` - ボタンクリック
* `andw_sideflow_slider_view` - スライド表示
* `andw_sideflow_slider_swipe` - スワイプ操作
* `andw_sideflow_slider_pause` - 再生停止

= セキュリティ =

* 管理画面: nonce + current_user_can()
* 出力: esc_html(), esc_url(), esc_attr()
* 入力: sanitize_text_field(), sanitize_key()

== Privacy ==

このプラグインは以下の個人データを使用します：
* localStorage: 初回訪問判定のみ（andw_sideflow_visited）
* トラッキング: dataLayerへのイベント送信（オプション）

個人を特定する情報は収集・送信しません。