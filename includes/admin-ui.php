<?php
/**
 * andW SideFlow 管理画面UI
 */

if (!defined('ABSPATH')) {
    exit;
}

class ANDW_SideFlow_Admin_UI {

    /**
     * インスタンス
     */
    private static $instance = null;

    /**
     * シングルトンインスタンス取得
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * コンストラクタ
     */
    private function __construct() {
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_andw_sideflow_media_search', array($this, 'ajax_media_search'));
        add_action('wp_ajax_andw_sideflow_preview_apply', array($this, 'ajax_preview_apply'));
    }

    /**
     * 管理画面スクリプト読み込み
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_andw-sideflow') {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_style('wp-color-picker');

        wp_enqueue_script(
            'andw-sideflow-admin',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-media-utils', 'wp-color-picker'),
            ANDW_SIDEFLOW_VERSION,
            true
        );

        wp_enqueue_style(
            'andw-sideflow-admin',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/css/admin.css',
            array('wp-color-picker'),
            ANDW_SIDEFLOW_VERSION
        );

        $main_instance = ANDW_SideFlow::get_instance();
        $current_config = get_option('andw_sideflow_config', $main_instance->get_default_config());

        wp_localize_script('andw-sideflow-admin', 'andwSideFlowAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('andw_sideflow_admin'),
            'previewUrl' => rest_url('andw-sideflow/v1/preview'),
            'currentConfig' => $current_config,
            'strings' => array(
                'selectMedia' => __('画像を選択', 'andw-sideflow'),
                'selectFiles' => __('ファイルを選択', 'andw-sideflow'),
                'useThis' => __('この画像を使用', 'andw-sideflow'),
                'previewApplied' => __('プレビューを適用しました', 'andw-sideflow'),
                'previewError' => __('プレビューの適用に失敗しました', 'andw-sideflow'),
                'noImage' => __('画像なし', 'andw-sideflow')
            )
        ));
    }

    /**
     * 新しい管理画面を出力
     */
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $main_instance = ANDW_SideFlow::get_instance();
        $config = get_option('andw_sideflow_config', $main_instance->get_default_config());

        ?>
        <div class="wrap andw-sideflow-admin">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="andw-sideflow-admin-layout">
                <!-- 設定フォーム -->
                <div class="andw-sideflow-settings">
                    <form method="post" action="options.php" id="andw-sideflow-form">
                        <?php
                        settings_fields('andw_sideflow_settings');
                        ?>

                        <div class="andw-sideflow-tabs">
                            <nav class="nav-tab-wrapper">
                                <a href="#slides" class="nav-tab nav-tab-active"><?php esc_html_e('スライド設定', 'andw-sideflow'); ?></a>
                                <a href="#styles" class="nav-tab"><?php esc_html_e('スタイル設定', 'andw-sideflow'); ?></a>
                                <a href="#layout" class="nav-tab"><?php esc_html_e('レイアウト設定', 'andw-sideflow'); ?></a>
                                <a href="#buttons" class="nav-tab"><?php esc_html_e('ボタン設定', 'andw-sideflow'); ?></a>
                                <a href="#advanced" class="nav-tab"><?php esc_html_e('詳細設定', 'andw-sideflow'); ?></a>
                            </nav>
                        </div>

                        <!-- スライド設定タブ -->
                        <div class="tab-content" id="slides">
                            <?php $this->render_slides_section($config); ?>
                        </div>

                        <!-- スタイル設定タブ -->
                        <div class="tab-content" id="styles" style="display:none;">
                            <?php $this->render_styles_section($config); ?>
                        </div>

                        <!-- レイアウト設定タブ -->
                        <div class="tab-content" id="layout" style="display:none;">
                            <?php $this->render_layout_section($config); ?>
                        </div>

                        <!-- ボタン設定タブ -->
                        <div class="tab-content" id="buttons" style="display:none;">
                            <?php $this->render_buttons_section($config); ?>
                        </div>

                        <!-- 詳細設定タブ -->
                        <div class="tab-content" id="advanced" style="display:none;">
                            <?php $this->render_advanced_section($config); ?>
                        </div>

                        <!-- WordPressの設定APIに合わせた隠しフィールド名 -->
                        <textarea name="andw_sideflow_config" id="andw_sideflow_config_textarea" style="display: none;"></textarea>

                        <div class="andw-sideflow-actions">
                            <button type="button" id="preview-apply" class="button button-secondary">
                                <?php esc_html_e('一時適用（プレビュー）', 'andw-sideflow'); ?>
                            </button>
                            <?php submit_button(__('設定を保存', 'andw-sideflow'), 'primary', 'submit', false); ?>
                        </div>
                    </form>
                </div>

                <!-- プレビューエリア -->
                <div class="andw-sideflow-preview">
                    <h3><?php esc_html_e('プレビュー', 'andw-sideflow'); ?></h3>
                    <div class="preview-container">
                        <iframe id="preview-iframe" src="<?php echo esc_url(home_url('?andwsideflow=preview')); ?>" frameborder="0"></iframe>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * スライド設定セクション
     */
    private function render_slides_section($config) {
        $slider_config = $config['slider'] ?? array();
        $items = $slider_config['items'] ?? array();
        ?>
        <div class="andw-sideflow-section">
            <h3><?php esc_html_e('スライド画像', 'andw-sideflow'); ?></h3>

            <div class="andw-sideflow-slides-list" id="slides-list">
                <?php foreach ($items as $index => $item): ?>
                    <?php $this->render_slide_item($item, $index); ?>
                <?php endforeach; ?>
            </div>

            <button type="button" class="button" id="add-slide">
                <?php esc_html_e('スライドを追加', 'andw-sideflow'); ?>
            </button>

            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('自動再生', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="slider-autoplay" <?php checked($slider_config['autoplay'] ?? true); ?>>
                            <?php esc_html_e('自動でスライドを切り替える', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('切り替え間隔', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="slider-interval" value="<?php echo esc_attr($slider_config['interval'] ?? 3500); ?>" min="1000" step="500">
                        <span class="description"><?php esc_html_e('ミリ秒（1000 = 1秒）', 'andw-sideflow'); ?></span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('画像の表示方法', 'andw-sideflow'); ?></th>
                    <td>
                        <select id="slider-fit">
                            <option value="cover" <?php selected($slider_config['fit'] ?? 'cover', 'cover'); ?>><?php esc_html_e('カバー（切り抜き）', 'andw-sideflow'); ?></option>
                            <option value="contain" <?php selected($slider_config['fit'] ?? 'cover', 'contain'); ?>><?php esc_html_e('全体表示', 'andw-sideflow'); ?></option>
                            <option value="blurExtend" <?php selected($slider_config['fit'] ?? 'cover', 'blurExtend'); ?>><?php esc_html_e('ぼかし背景', 'andw-sideflow'); ?></option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('アスペクト比', 'andw-sideflow'); ?></th>
                    <td>
                        <select id="slider-aspect-ratio">
                            <option value="16:9" <?php selected($slider_config['aspectRatio'] ?? '16:9', '16:9'); ?>>16:9</option>
                            <option value="4:3" <?php selected($slider_config['aspectRatio'] ?? '16:9', '4:3'); ?>>4:3</option>
                            <option value="3:2" <?php selected($slider_config['aspectRatio'] ?? '16:9', '3:2'); ?>>3:2</option>
                            <option value="1:1" <?php selected($slider_config['aspectRatio'] ?? '16:9', '1:1'); ?>>1:1</option>
                            <option value="custom" <?php selected($slider_config['aspectRatio'] ?? '16:9', 'custom'); ?>><?php esc_html_e('カスタム', 'andw-sideflow'); ?></option>
                        </select>
                        <div id="custom-aspect-ratio" style="display: <?php echo ($slider_config['aspectRatio'] ?? '16:9') === 'custom' ? 'block' : 'none'; ?>; margin-top: 8px;">
                            <input type="number" id="aspect-width" value="<?php echo esc_attr($slider_config['customAspectWidth'] ?? 16); ?>" min="1" max="50" style="width: 60px;">
                            :
                            <input type="number" id="aspect-height" value="<?php echo esc_attr($slider_config['customAspectHeight'] ?? 9); ?>" min="1" max="50" style="width: 60px;">
                            <span class="description">幅:高さ</span>
                        </div>
                        <p class="description"><?php esc_html_e('画像の表示比率を設定します。object-fit: coverで自動調整されます。', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('矢印ナビゲーション', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="slider-show-arrows" <?php checked($slider_config['showArrows'] ?? true); ?>>
                            <?php esc_html_e('左右の矢印ボタンを表示する', 'andw-sideflow'); ?>
                        </label>
                        <p class="description"><?php esc_html_e('無効にすると、矢印ナビゲーションが非表示になり、自動再生とスワイプ操作のみになります。', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * スライドアイテムを出力
     */
    private function render_slide_item($item, $index) {
        $media_id = $item['mediaId'] ?? 0;
        $alt = $item['alt'] ?? '';
        $href = $item['href'] ?? '';
        $fit = $item['fit'] ?? 'inherit';

        $image_url = '';
        if ($media_id) {
            $image_url = wp_get_attachment_image_url($media_id, 'thumbnail');
        } elseif (!empty($item['src'])) {
            $image_url = $item['src'];
        }
        ?>
        <div class="slide-item" data-index="<?php echo esc_attr($index); ?>">
            <div class="slide-preview">
                <?php if ($image_url): ?>
                    <img src="<?php echo esc_url($image_url); ?>" alt="">
                <?php else: ?>
                    <div class="no-image"><?php esc_html_e('画像なし', 'andw-sideflow'); ?></div>
                <?php endif; ?>
            </div>
            <div class="slide-controls">
                <button type="button" class="button select-media"><?php esc_html_e('画像を選択', 'andw-sideflow'); ?></button>
                <input type="hidden" class="media-id" value="<?php echo esc_attr($media_id); ?>">
                <input type="text" class="slide-alt" placeholder="<?php esc_attr_e('代替テキスト', 'andw-sideflow'); ?>" value="<?php echo esc_attr($alt); ?>">
                <input type="text" class="slide-href" placeholder="<?php esc_attr_e('リンクURL（オプション）', 'andw-sideflow'); ?>" value="<?php echo esc_attr($href); ?>" data-validation="url">
                <select class="slide-fit">
                    <option value="inherit" <?php selected($fit, 'inherit'); ?>><?php esc_html_e('全体設定に従う', 'andw-sideflow'); ?></option>
                    <option value="cover" <?php selected($fit, 'cover'); ?>><?php esc_html_e('カバー', 'andw-sideflow'); ?></option>
                    <option value="contain" <?php selected($fit, 'contain'); ?>><?php esc_html_e('全体表示', 'andw-sideflow'); ?></option>
                </select>
                <button type="button" class="button-link-delete remove-slide"><?php esc_html_e('削除', 'andw-sideflow'); ?></button>
            </div>
        </div>
        <?php
    }

    /**
     * スタイル設定セクション
     */
    private function render_styles_section($config) {
        $styles = $config['styles'] ?? array();
        $tokens = $styles['tokens'] ?? array();
        ?>
        <div class="andw-sideflow-section">
            <h3><?php esc_html_e('スタイルプリセット', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('プリセット', 'andw-sideflow'); ?></th>
                    <td>
                        <select id="style-preset">
                            <option value="light" <?php selected($styles['preset'] ?? 'light', 'light'); ?>><?php esc_html_e('ライト', 'andw-sideflow'); ?></option>
                            <option value="brand" <?php selected($styles['preset'] ?? 'light', 'brand'); ?>><?php esc_html_e('ブランド', 'andw-sideflow'); ?></option>
                            <option value="minimal" <?php selected($styles['preset'] ?? 'light', 'minimal'); ?>><?php esc_html_e('ミニマル', 'andw-sideflow'); ?></option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('カスタムCSS URL', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="custom-css-url" value="<?php echo esc_attr($styles['customCssUrl'] ?? ''); ?>" class="regular-text" data-validation="url">
                        <p class="description"><?php esc_html_e('外部CSSファイルのURL（オプション）', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
            </table>

            <h3><?php esc_html_e('カスタムトークン', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('ブランドカラー', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="token-color-brand" value="<?php echo esc_attr($tokens['colorBrand'] ?? '#667eea'); ?>" class="color-picker">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('角丸', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="token-radius" value="<?php echo esc_attr($tokens['radius'] ?? 8); ?>" min="0" max="50">
                        <span class="description">px</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('影', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="token-shadow" value="<?php echo esc_attr($tokens['shadow'] ?? '0 4px 12px rgba(0,0,0,0.15)'); ?>" class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('間隔', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="token-spacing" value="<?php echo esc_attr($tokens['spacing'] ?? 16); ?>" min="0" max="100">
                        <span class="description">px</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('アニメーション時間', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="token-duration" value="<?php echo esc_attr($tokens['durationMs'] ?? 300); ?>" min="0" max="2000">
                        <span class="description">ms</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('イージング', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="token-easing" value="<?php echo esc_attr($tokens['easing'] ?? 'cubic-bezier(0.34, 1.56, 0.64, 1)'); ?>" class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('フォントファミリー', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="token-font-family" value="<?php echo esc_attr($tokens['fontFamily'] ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'); ?>" class="regular-text">
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * レイアウト設定セクション
     */
    private function render_layout_section($config) {
        $tab = $config['tab'] ?? array();
        $drawer = $config['drawer'] ?? array();
        $layout = $config['layout'] ?? array();
        ?>
        <div class="andw-sideflow-section">
            <h3><?php esc_html_e('タブ設定', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('タブテキスト', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" id="tab-text" name="tab_text" value="<?php echo esc_attr($tab['text'] ?? '求人'); ?>" maxlength="10">
                        <span class="description">タブに表示するテキスト（10文字以内推奨）</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('タブ動作', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="radio" name="tab-action" value="drawer" <?php checked($tab['action'] ?? 'drawer', 'drawer'); ?>>
                            <?php esc_html_e('ドロワーを開く', 'andw-sideflow'); ?>
                        </label><br>
                        <label>
                            <input type="radio" name="tab-action" value="link" <?php checked($tab['action'] ?? 'drawer', 'link'); ?>>
                            <?php esc_html_e('リンク先に移動する', 'andw-sideflow'); ?>
                        </label>
                        <div id="tab-link-url" style="display: <?php echo ($tab['action'] ?? 'drawer') === 'link' ? 'block' : 'none'; ?>; margin-top: 8px;">
                            <input type="url" id="tab-link-url-input" value="<?php echo esc_attr($tab['linkUrl'] ?? ''); ?>" placeholder="https://example.com/jobs/" style="width: 100%; max-width: 400px;">
                            <span class="description">リンク先URL</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('基準位置', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="radio" name="tab-anchor" value="center" <?php checked($tab['anchor'] ?? 'center', 'center'); ?>>
                            <?php esc_html_e('画面中央', 'andw-sideflow'); ?>
                        </label><br>
                        <label>
                            <input type="radio" name="tab-anchor" value="bottom" <?php checked($tab['anchor'] ?? 'center', 'bottom'); ?>>
                            <?php esc_html_e('画面下端', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('オフセット', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="tab-offset" name="tab_offset" value="<?php echo esc_attr($tab['offsetPx'] ?? 24); ?>" min="0" max="200">
                        <span class="description">px（中央: 下方向、下端: 上方向）</span>
                    </td>
                </tr>
            </table>

            <h3><?php esc_html_e('ドロワー設定', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('ドロワー幅', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="drawer-width-percent" name="drawer_width_percent" value="<?php echo esc_attr(($drawer['widthPercent'] ?? 0.76) * 100); ?>" min="40" max="95" step="5">
                        <span class="description">%（画面幅の割合）</span>
                        <p class="description"><?php esc_html_e('PCで大きすぎる場合は小さめの値に調整してください', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('最大幅制限', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="drawer-max-width" name="drawer_max_width" value="<?php echo esc_attr($drawer['maxWidthPx'] ?? 600); ?>" min="300" max="1000">
                        <span class="description">px</span>
                        <p class="description"><?php esc_html_e('大画面での最大幅を制限します', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('背景オーバーレイ', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="drawer-backdrop" <?php checked($drawer['backdrop'] ?? false); ?>>
                            <?php esc_html_e('黒い背景を表示する', 'andw-sideflow'); ?>
                        </label>
                        <p class="description"><?php esc_html_e('falseの場合、黒バックは表示されません', 'andw-sideflow'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('最大高さ', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="layout-max-height" value="<?php echo esc_attr($layout['maxHeightPx'] ?? 640); ?>" min="50" max="1200">
                        <span class="description">px</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('ボタン行高さ', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="layout-button-row-height" value="<?php echo esc_attr($layout['buttonRowHeight'] ?? 48); ?>" min="40" max="100">
                        <span class="description">px</span>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * ボタン設定セクション
     */
    private function render_buttons_section($config) {
        $buttons = $config['buttons'] ?? array();
        ?>
        <div class="andw-sideflow-section">
            <h3><?php esc_html_e('ボタン設定', 'andw-sideflow'); ?></h3>

            <div class="andw-sideflow-buttons-list" id="buttons-list">
                <?php foreach ($buttons as $index => $button): ?>
                    <?php $this->render_button_item($button, $index); ?>
                <?php endforeach; ?>
            </div>

            <button type="button" class="button" id="add-button">
                <?php esc_html_e('ボタンを追加', 'andw-sideflow'); ?>
            </button>
        </div>
        <?php
    }

    /**
     * ボタンアイテムを出力
     */
    private function render_button_item($button, $index) {
        ?>
        <div class="button-item" data-index="<?php echo esc_attr($index); ?>">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; border-bottom: none;"><?php
                    /* translators: %d: button number */
                    echo sprintf(esc_html__('ボタン %d', 'andw-sideflow'), absint($index) + 1);
                ?></h4>
                <button type="button" class="button-link-delete remove-button" style="color: #d63638; text-decoration: none; font-size: 13px;"><?php esc_html_e('削除', 'andw-sideflow'); ?></button>
            </div>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('表示', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" class="button-visible" <?php checked($button['visible'] ?? true); ?>>
                            <?php esc_html_e('このボタンを表示する', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('ID', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" class="button-id" value="<?php echo esc_attr($button['id'] ?? ''); ?>" placeholder="btn1">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('テキスト', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" class="button-text" value="<?php echo esc_attr($button['text'] ?? ''); ?>" placeholder="ボタンテキスト">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('リンクURL', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" class="button-href" value="<?php echo esc_attr($button['href'] ?? ''); ?>" placeholder="https://example.com" data-validation="url">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('トラッキングID', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="text" class="button-tracking-id" value="<?php echo esc_attr($button['trackingId'] ?? ''); ?>" placeholder="button_click">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('スタイル', 'andw-sideflow'); ?></th>
                    <td>
                        <select class="button-variant">
                            <option value="solid" <?php selected($button['variant'] ?? 'solid', 'solid'); ?>><?php esc_html_e('単色', 'andw-sideflow'); ?></option>
                            <option value="gradient" <?php selected($button['variant'] ?? 'solid', 'gradient'); ?>><?php esc_html_e('グラデーション', 'andw-sideflow'); ?></option>
                            <option value="outline" <?php selected($button['variant'] ?? 'solid', 'outline'); ?>><?php esc_html_e('枠線', 'andw-sideflow'); ?></option>
                            <option value="line" <?php selected($button['variant'] ?? 'solid', 'line'); ?>><?php esc_html_e('LINE', 'andw-sideflow'); ?></option>
                        </select>
                    </td>
                </tr>
                <!-- LINEスタイル選択（LINEバリアント時のみ表示） -->
                <tr class="line-style-row" style="display: <?php echo ($button['variant'] ?? 'solid') === 'line' ? 'table-row' : 'none'; ?>;">
                    <th scope="row"><?php esc_html_e('LINEスタイル', 'andw-sideflow'); ?></th>
                    <td>
                        <select class="button-line-style">
                            <option value="solid" <?php selected($button['lineStyle'] ?? 'solid', 'solid'); ?>><?php esc_html_e('単色', 'andw-sideflow'); ?></option>
                            <option value="outline" <?php selected($button['lineStyle'] ?? 'solid', 'outline'); ?>><?php esc_html_e('枠線', 'andw-sideflow'); ?></option>
                        </select>
                    </td>
                </tr>

                <!-- 単色カラーピッカー -->
                <tr class="solid-colors-row" style="display: <?php echo ($button['variant'] ?? 'solid') === 'solid' ? 'table-row' : 'none'; ?>;">
                    <th scope="row"><?php esc_html_e('色設定', 'andw-sideflow'); ?></th>
                    <td>
                        <p>
                            <label><?php esc_html_e('背景色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-background" value="<?php echo esc_attr($button['colors']['background'] ?? '#f0f0f1'); ?>" />
                        </p>
                        <p>
                            <label><?php esc_html_e('文字色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-text" value="<?php echo esc_attr($button['colors']['text'] ?? '#2c3338'); ?>" />
                        </p>
                    </td>
                </tr>

                <!-- グラデーションカラーピッカー -->
                <tr class="gradient-colors-row" style="display: <?php echo ($button['variant'] ?? 'solid') === 'gradient' ? 'table-row' : 'none'; ?>;">
                    <th scope="row"><?php esc_html_e('色設定', 'andw-sideflow'); ?></th>
                    <td>
                        <p>
                            <label><?php esc_html_e('グラデーション開始色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-gradient-start" value="<?php echo esc_attr($button['colors']['gradientStart'] ?? '#0073aa'); ?>" />
                        </p>
                        <p>
                            <label><?php esc_html_e('グラデーション終了色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-gradient-end" value="<?php echo esc_attr($button['colors']['gradientEnd'] ?? '#005a87'); ?>" />
                        </p>
                        <p>
                            <label><?php esc_html_e('文字色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-text" value="<?php echo esc_attr($button['colors']['text'] ?? '#ffffff'); ?>" />
                        </p>
                    </td>
                </tr>

                <!-- 枠線カラーピッカー -->
                <tr class="outline-colors-row" style="display: <?php echo ($button['variant'] ?? 'solid') === 'outline' ? 'table-row' : 'none'; ?>;">
                    <th scope="row"><?php esc_html_e('色設定', 'andw-sideflow'); ?></th>
                    <td>
                        <p>
                            <label><?php esc_html_e('枠線色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-border" value="<?php echo esc_attr($button['colors']['border'] ?? '#0073aa'); ?>" />
                        </p>
                        <p>
                            <label><?php esc_html_e('文字色:', 'andw-sideflow'); ?></label>
                            <input type="text" class="button-color-text" value="<?php echo esc_attr($button['colors']['text'] ?? '#0073aa'); ?>" />
                        </p>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * 詳細設定セクション
     */
    private function render_advanced_section($config) {
        $dev = $config['dev'] ?? array();
        ?>
        <div class="andw-sideflow-section">
            <h3><?php esc_html_e('その他設定', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('初回吹き出し', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="show-bubble" <?php checked($config['showBubble'] ?? true); ?>>
                            <?php esc_html_e('初回訪問時に吹き出しを表示', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('光沢エフェクト間隔', 'andw-sideflow'); ?></th>
                    <td>
                        <input type="number" id="glitter-interval" value="<?php echo esc_attr($config['glitterInterval'] ?? 25000); ?>" min="10000" max="60000">
                        <span class="description">ms</span>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('オーバーシュートアニメーション', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="overshoot-animation" <?php
                                $overshoot = isset($config['motion']['overshoot']) ? $config['motion']['overshoot'] : true;
                                checked($overshoot);
                            ?>>
                            <?php esc_html_e('ドロワーを開く際にバウンス効果を使用する', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php esc_html_e('アニメーション配慮', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="respect-reduced-motion" <?php checked($config['respectReducedMotion'] ?? true); ?>>
                            <?php esc_html_e('Reduced Motionの設定を尊重する', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
            </table>

            <h3><?php esc_html_e('デバッグ', 'andw-sideflow'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('デバッグモード', 'andw-sideflow'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" id="dev-debug" <?php checked($dev['debug'] ?? false); ?>>
                            <?php esc_html_e('デバッグ情報を表示（?andwsideflow=debug）', 'andw-sideflow'); ?>
                        </label>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * メディア検索AJAX
     */
    public function ajax_media_search() {
        check_ajax_referer('andw_sideflow_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('権限がありません。', 'andw-sideflow'));
        }

        $query = sanitize_text_field(wp_unslash($_POST['query'] ?? ''));

        $args = array(
            'post_type' => 'attachment',
            'post_mime_type' => 'image',
            'post_status' => 'inherit',
            'posts_per_page' => 20,
            's' => $query
        );

        $attachments = get_posts($args);
        $results = array();

        foreach ($attachments as $attachment) {
            $results[] = array(
                'id' => $attachment->ID,
                'title' => $attachment->post_title,
                'url' => wp_get_attachment_image_url($attachment->ID, 'thumbnail'),
                'full_url' => wp_get_attachment_image_url($attachment->ID, 'full')
            );
        }

        wp_send_json_success($results);
    }

    /**
     * プレビュー適用AJAX
     */
    public function ajax_preview_apply() {
        check_ajax_referer('andw_sideflow_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('権限がありません。', 'andw-sideflow'));
        }

        $config_json = sanitize_textarea_field(wp_unslash($_POST['config'] ?? ''));
        $config = json_decode($config_json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(__('設定データの形式が正しくありません。', 'andw-sideflow'));
        }

        // サニタイズ
        $sanitized = ANDW_SideFlow::get_instance()->sanitize_config_array($config);

        // プレビュー設定として保存
        set_transient('andw_sideflow_preview_config', $sanitized, 30 * MINUTE_IN_SECONDS);

        wp_send_json_success(array(
            'message' => __('プレビュー設定を適用しました。', 'andw-sideflow')
        ));
    }
}

ANDW_SideFlow_Admin_UI::get_instance();