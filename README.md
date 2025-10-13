# andW SideFlow

右サイド追従タブから展開するドロワー型求人スライドショー&ボタン群WordPressプラグイン

## 概要

andW SideFlowは、サイト右側に固定表示されるタブから展開するドロワー型のスライドショー＆ボタン群を表示するWordPressプラグインです。求人情報の表示に特化した設計となっており、美しいアニメーションとレスポンシブデザインを提供します。

## 主な機能

- **ドロワー型UI**: 右サイド固定タブからスライドアウトする美しいドロワー
- **スライドショー**: 自動再生・矢印ナビゲーション対応の画像スライダー
- **カスタムボタン**: 4種類のスタイル（単色・グラデーション・枠線・LINE）
- **レスポンシブ対応**: デスクトップ・タブレット・スマートフォン最適化
- **アクセシビリティ**: ARIA属性・キーボードナビゲーション対応
- **パフォーマンス最適化**: 遅延読み込み・プリロード機能

## インストール

1. プラグインファイルを `/wp-content/plugins/andw-sideflow/` にアップロード
2. WordPress管理画面でプラグインを有効化
3. 「andW SideFlow」設定ページで初期設定を実行

## 多言語対応 (i18n)

このプラグインは国際化対応しており、複数の言語で利用できます。

### 翻訳ファイルの作成方法

1. **POTファイルから言語ファイルを作成**:
   ```bash
   # 日本語の場合
   cp languages/andw-sideflow.pot languages/andw-sideflow-ja.po

   # 英語の場合
   cp languages/andw-sideflow.pot languages/andw-sideflow-en_US.po
   ```

2. **POファイルを編集**:
   - Poedit、LocoTranslate、または任意のPOエディタを使用
   - 各メッセージの翻訳を入力

3. **MOファイルを生成**:
   ```bash
   # msgfmtコマンドを使用（Poeditorでも自動生成）
   msgfmt languages/andw-sideflow-ja.po -o languages/andw-sideflow-ja.mo
   ```

4. **ファイル配置**:
   ```
   /wp-content/plugins/andw-sideflow/languages/
   ├── andw-sideflow.pot          # テンプレート
   ├── andw-sideflow-ja.po        # 日本語翻訳
   ├── andw-sideflow-ja.mo        # 日本語バイナリ
   ├── andw-sideflow-en_US.po     # 英語翻訳
   └── andw-sideflow-en_US.mo     # 英語バイナリ
   ```

### サポート言語

- 日本語 (ja)
- 英語 (en_US) - 準備中

翻訳の貢献を歓迎します！

## 設定項目

### スライドショー設定
- 自動再生の有効/無効
- 再生間隔（ミリ秒）
- 画像表示方法（カバー/全体表示）
- アスペクト比（2:1, 16:9, 4:3, 3:2, 1:1, カスタム）
- 矢印ナビゲーション

### ボタン設定
- 表示/非表示
- テキスト・リンクURL・トラッキングID
- スタイル（単色/グラデーション/枠線/LINE）
- 色設定

### タブ・レイアウト設定
- タブ位置（中央/下部）
- オフセット・テキスト
- アクション（ドロワー開く/リンク移動）
- ドロワー幅・最大幅

### スタイル・デザイン
- プリセット（ライト/ダーク）
- ブランドカラー・角丸・影・余白
- アニメーション設定
- カスタムCSS

## 開発者向け

### 要件
- WordPress 5.0以上
- PHP 7.4以上

### バージョン履歴
- **0.2.3**: パフォーマンス最適化、国際化対応
- **0.2.0**: 遅延ロード実装、表示安定化
- **0.1.0**: 初期リリース

### ライセンス
GPLv2 or later

### サポート
[GitHub Issues](https://github.com/your-repo/andw-sideflow) でバグ報告・機能要望をお待ちしています。

## 作者

**yasuo3o3**
- Website: https://yasuo-o.xyz/