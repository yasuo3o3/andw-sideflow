# andW SideFlow

A floating drawer-style slideshow and button plugin for WordPress, designed for mobile-first recruitment displays.

**📋 Status**: Ready for WordPress.org submission | **🌐 Text Domain**: `andw-sideflow` | **⚡ Version**: 0.4.3

## Overview

andW SideFlow is a lightweight WordPress plugin that provides a right-side floating tab that expands into a drawer containing a slideshow and action buttons. Designed with mobile-first approach and optimized for recruitment content with beautiful animations and responsive design.

## Key Features

- **🎯 Drawer UI**: Beautiful slide-out drawer from right-side fixed tab
- **🖼️ Slideshow**: Auto-playing image slider with arrow navigation and swipe support
- **🎨 Custom Buttons**: 4 styles (solid, gradient, outline, LINE-style) with customizable colors
- **📱 Responsive**: Optimized for desktop, tablet, and mobile devices
- **♿ Accessibility**: ARIA attributes and keyboard navigation support
- **⚡ Performance**: Lazy loading, zero dependencies, Shadow DOM isolation
- **🛡️ Security**: Comprehensive nonce validation and permission checks

## Quick Start

1. Upload plugin files to `/wp-content/plugins/andw-sideflow/`
2. Activate the plugin through WordPress admin
3. Configure settings in **andW SideFlow** settings page
4. Customize your slideshow and buttons

## WordPress.org Submission

This plugin is prepared for **WordPress.org Plugin Directory** submission with:
- ✅ Full WPCS compliance
- ✅ Plugin Check validation passed
- ✅ Security best practices implemented
- ✅ Internationalization ready (i18n)
- ✅ Uninstall cleanup procedures

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

### Version History
- **0.4.3**: DEBUG_MODE implementation for production environments (current)
- **0.4.2**: Mobile viewport fixes (Android, iPhone portrait overflow)
- **0.4.1**: iOS Safe Area positioning improvements
- **0.3.1**: Bug fixes and code quality improvements
- **0.3.0**: Initial stable release with complete feature set
- **0.2.x**: Development versions (beta testing)

### ライセンス
GPLv2 or later

### サポート
[GitHub Issues](https://github.com/your-repo/andw-sideflow) でバグ報告・機能要望をお待ちしています。

## 作者

**yasuo3o3**
- Website: https://yasuo-o.xyz/