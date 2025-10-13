<?php
/**
 * Plugin Name: andW SideFlow
 * Description: 右サイド追従タブから展開するドロワー型求人スライドショー&ボタン群プラグイン
 * Version: 0.2.1
 * Author: yasuo3o3
 * Author URI: https://yasuo-o.xyz/
 * License: GPLv2 or later
 * Text Domain: andw-sideflow
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

// プラグインの定数定義
define('ANDW_SIDEFLOW_VERSION', '0.2.1');
define('ANDW_SIDEFLOW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ANDW_SIDEFLOW_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('ANDW_SIDEFLOW_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * メインプラグインクラス
 */
class ANDW_SideFlow {

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
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }

    /**
     * 初期化
     */
    public function init() {
        // 管理画面の初期化
        if (is_admin()) {
            $this->admin_init();
        }

        // フロントエンドの初期化
        if (!is_admin()) {
            $this->frontend_init();
        }

        // REST APIの初期化
        $this->rest_api_init();

        // 画像サイズの追加（削除済み - 既存のWordPress画像サイズを利用）
    }

    /**
     * 管理画面初期化
     */
    private function admin_init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_settings_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_andw_sideflow_clean_legacy', array($this, 'ajax_clean_legacy'));
        add_action('wp_ajax_andw_sideflow_update_config', array($this, 'ajax_update_config'));

        // 新しい管理UIを読み込み
        require_once ANDW_SIDEFLOW_PLUGIN_PATH . 'includes/admin-ui.php';
    }

    /**
     * フロントエンド初期化
     */
    private function frontend_init() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
    }

    /**
     * REST API初期化
     */
    private function rest_api_init() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }


    /**
     * 管理メニュー追加
     */
    public function add_admin_menu() {
        add_options_page(
            __('andW SideFlow 設定', 'andw-sideflow'),
            __('andW SideFlow', 'andw-sideflow'),
            'manage_options',
            'andw-sideflow',
            array($this, 'admin_page')
        );
    }

    /**
     * 設定項目初期化
     */
    public function admin_settings_init() {
        register_setting('andw_sideflow_settings', 'andw_sideflow_config', array(
            'type' => 'array',
            'description' => 'andW SideFlow configuration',
            'sanitize_callback' => array($this, 'sanitize_config'),
            'default' => $this->get_default_config(),
            'show_in_rest' => false
        ));

        add_settings_section(
            'andw_sideflow_main',
            __('メイン設定', 'andw-sideflow'),
            null,
            'andw_sideflow_settings'
        );

        add_settings_field(
            'config_json',
            __('設定JSON', 'andw-sideflow'),
            array($this, 'config_json_field'),
            'andw_sideflow_settings',
            'andw_sideflow_main'
        );

        add_settings_field(
            'clean_legacy',
            __('レガシー設定の削除', 'andw-sideflow'),
            array($this, 'clean_legacy_field'),
            'andw_sideflow_settings',
            'andw_sideflow_main'
        );

        add_settings_field(
            'update_config',
            __('設定の更新', 'andw-sideflow'),
            array($this, 'update_config_field'),
            'andw_sideflow_settings',
            'andw_sideflow_main'
        );
    }

    /**
     * 設定ページ
     */
    public function admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }


        // 保存完了メッセージのカスタマイズ（権限と nonce を確認）
        if (current_user_can('manage_options')) {
            $nonce_valid = isset($_GET['andw_sideflow_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['andw_sideflow_nonce'])), 'andw_sideflow_action');
            if ($nonce_valid) {
                $settings_updated = isset($_GET['settings-updated']) ? sanitize_text_field(wp_unslash($_GET['settings-updated'])) : '';
                if ($settings_updated === 'true') {
                    echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('andW SideFlow設定を保存しました。', 'andw-sideflow') . '</p></div>';
                }
            }
        }

        // 設定エラーの表示
        $errors = get_settings_errors('andw_sideflow_config');
        if (!empty($errors)) {
            foreach ($errors as $error) {
                // 成功メッセージは上記で統一表示するためスキップ
                if ($error['type'] === 'success') {
                    continue;
                }
                echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error['message']) . '</p></div>';
            }
        }

        // 新しいUIモードかチェック（権限確認）
        // 常に新しいUIを使用（古い管理画面を非表示）
        $use_new_ui = true;

        if ($use_new_ui) {
            // 新しい管理画面UI
            if (class_exists('ANDW_SideFlow_Admin_UI')) {
                ANDW_SideFlow_Admin_UI::get_instance()->render_admin_page();
            }
            return;
        }

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div style="margin: 15px 0; padding: 10px; background: #e7f3ff; border-left: 4px solid #007cba;">
                <p><strong><?php esc_html_e('新しい管理画面が利用可能です！', 'andw-sideflow'); ?></strong></p>
                <p>
                    <a href="<?php echo esc_url(add_query_arg(array('ui' => 'new', 'andw_sideflow_nonce' => wp_create_nonce('andw_sideflow_action')))); ?>" class="button button-primary">
                        <?php esc_html_e('新しい管理画面を試す', 'andw-sideflow'); ?>
                    </a>
                </p>
            </div>

            <form action="options.php" method="post">
                <?php
                settings_fields('andw_sideflow_settings');
                wp_nonce_field('andw_sideflow_action', 'andw_sideflow_nonce');
                do_settings_sections('andw_sideflow_settings');
                submit_button(__('設定を保存', 'andw-sideflow'));
                ?>
            </form>

            <h2><?php esc_html_e('プレビュー', 'andw-sideflow'); ?></h2>
            <p><?php esc_html_e('設定内容のプレビュー：', 'andw-sideflow'); ?></p>
            <pre id="andw-sideflow-preview" style="background: #f1f1f1; padding: 15px; overflow: auto; max-height: 400px; border: 1px solid #ccd0d4;"></pre>

            <h2><?php esc_html_e('現在の保存済み設定', 'andw-sideflow'); ?></h2>
            <pre style="background: #f9f9f9; padding: 15px; overflow: auto; max-height: 300px; border: 1px solid #ccd0d4;">
                <?php
                $saved_config = get_option('andw_sideflow_config', $this->get_default_config());
                echo esc_html(json_encode($saved_config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                ?>
            </pre>

        </div>
        <?php
    }

    /**
     * 設定JSON入力フィールド
     */
    public function config_json_field() {
        $config = get_option('andw_sideflow_config', $this->get_default_config());

        // 配列の場合はJSONエンコード、既にJSONの場合はそのまま
        if (is_array($config)) {
            $json = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } else {
            $json = $config;
        }

        ?>
        <textarea id="config_json" name="andw_sideflow_config" rows="20" cols="80" style="width: 100%; font-family: monospace; font-size: 13px;"><?php echo esc_textarea($json); ?></textarea>
        <p class="description">
            <?php esc_html_e('JSON形式で設定を入力してください。保存ボタンを押すと設定が反映されます。', 'andw-sideflow'); ?>
        </p>
        <p class="description">
            <strong><?php esc_html_e('現在のDBの値:', 'andw-sideflow'); ?></strong>
            <code><?php echo esc_html(is_array($config) ? 'Array' : gettype($config)); ?></code>
        </p>
        <?php
    }

    /**
     * レガシー設定削除フィールド
     */
    public function clean_legacy_field() {
        ?>
        <button type="button" id="clean-legacy-btn" class="button button-secondary">古い設定項目を削除</button>
        <p class="description">
            <?php esc_html_e('topSafeOffset等の古い設定項目をDBから完全に削除します。', 'andw-sideflow'); ?>
        </p>
        <div id="clean-legacy-result" style="margin-top: 10px;"></div>

        <?php
    }

    /**
     * 設定更新フィールド
     */
    public function update_config_field() {
        ?>
        <button type="button" id="update-config-btn" class="button button-primary">設定を最新版に更新</button>
        <p class="description">
            <?php esc_html_e('デフォルト設定に不足している項目を現在の設定に追加します。', 'andw-sideflow'); ?>
        </p>
        <div id="update-config-result" style="margin-top: 10px;"></div>

        <?php
    }

    /**
     * 設定のサニタイズ
     */
    public function sanitize_config($input) {
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                try {
                    $sanitized = $this->sanitize_config_array($decoded);

                    // フックでDBへの保存確認
                    add_action('updated_option', array($this, 'debug_option_updated'), 10, 3);

                    return $sanitized;
                } catch (Exception $e) {
                    add_settings_error(
                        'andw_sideflow_config',
                        'sanitize_error',
                        /* translators: %s: error message */
                        sprintf(__('設定の処理中にエラーが発生しました: %s', 'andw-sideflow'), $e->getMessage()),
                        'error'
                    );
                }
            } else {
                $error_msg = json_last_error_msg();
                add_settings_error(
                    'andw_sideflow_config',
                    'json_error',
                    /* translators: %s: JSON error message */
                    sprintf(__('JSON形式エラー: %s', 'andw-sideflow'), $error_msg),
                    'error'
                );
            }
        } else {
            add_settings_error(
                'andw_sideflow_config',
                'input_error',
                __('設定データの形式が正しくありません。', 'andw-sideflow'),
                'error'
            );
        }

        $default = $this->get_default_config();
        return $default;
    }

    /**
     * 設定配列のサニタイズ
     */
    public function sanitize_config_array($config) {
        $sanitized = array();

        // ボタン設定
        if (isset($config['buttons']) && is_array($config['buttons'])) {
            $sanitized['buttons'] = array();
            foreach ($config['buttons'] as $button) {
                if (is_array($button)) {
                    $variant = $button['variant'] ?? 'solid';
                    $validVariants = array('solid', 'gradient', 'outline', 'line');
                    if (!in_array($variant, $validVariants)) {
                        $variant = 'solid';
                    }

                    $sanitizedButton = array(
                        'id' => sanitize_key($button['id'] ?? ''),
                        'text' => sanitize_text_field($button['text'] ?? ''),
                        'href' => esc_url_raw($button['href'] ?? ''),
                        'trackingId' => sanitize_key($button['trackingId'] ?? ''),
                        'variant' => $variant,
                        'visible' => (bool)($button['visible'] ?? true)
                    );

                    // colors設定のサニタイズ
                    if (isset($button['colors']) && is_array($button['colors'])) {
                        $colors = $button['colors'];
                        $sanitizedButton['colors'] = array();

                        // variant別の色設定
                        switch ($variant) {
                            case 'solid':
                                $sanitizedButton['colors']['background'] = sanitize_hex_color($colors['background'] ?? '#f0f0f1');
                                $sanitizedButton['colors']['text'] = sanitize_hex_color($colors['text'] ?? '#2c3338');
                                break;
                            case 'gradient':
                                $sanitizedButton['colors']['gradientStart'] = sanitize_hex_color($colors['gradientStart'] ?? '#0073aa');
                                $sanitizedButton['colors']['gradientEnd'] = sanitize_hex_color($colors['gradientEnd'] ?? '#005a87');
                                $sanitizedButton['colors']['text'] = sanitize_hex_color($colors['text'] ?? '#ffffff');
                                break;
                            case 'outline':
                                $sanitizedButton['colors']['border'] = sanitize_hex_color($colors['border'] ?? '#0073aa');
                                $sanitizedButton['colors']['text'] = sanitize_hex_color($colors['text'] ?? '#0073aa');
                                break;
                        }
                    }

                    // LINEスタイル設定（LINEバリアントの場合のみ）
                    if ($variant === 'line') {
                        $lineStyle = $button['lineStyle'] ?? 'solid';
                        $validLineStyles = array('solid', 'outline');
                        $sanitizedButton['lineStyle'] = in_array($lineStyle, $validLineStyles) ? $lineStyle : 'solid';
                    }

                    $sanitized['buttons'][] = $sanitizedButton;
                }
            }
        }

        // タブ設定
        $tab = $config['tab'] ?? array();
        $sanitized['tab'] = array(
            'anchor' => in_array($tab['anchor'] ?? 'center', array('center', 'bottom')) ? $tab['anchor'] ?? 'center' : 'center',
            'offsetPx' => max(0, intval($tab['offsetPx'] ?? 24)),
            'widthPx' => max(30, min(80, intval($tab['widthPx'] ?? 50))),
            'heightMode' => in_array($tab['heightMode'] ?? 'matchDrawer', array('fixed', 'matchDrawer')) ? $tab['heightMode'] ?? 'matchDrawer' : 'matchDrawer',
            'text' => sanitize_text_field($tab['text'] ?? '求人'),
            'action' => in_array($tab['action'] ?? 'drawer', array('drawer', 'link')) ? $tab['action'] ?? 'drawer' : 'drawer',
            'linkUrl' => esc_url_raw($tab['linkUrl'] ?? '')
        );

        // ドロワー設定
        $drawer = $config['drawer'] ?? array();
        $sanitized['drawer'] = array(
            'backdrop' => (bool)($drawer['backdrop'] ?? false),
            'widthPercent' => max(0.5, min(0.95, floatval($drawer['widthPercent'] ?? 0.76))),
            'maxWidthPx' => max(300, min(1000, intval($drawer['maxWidthPx'] ?? 600)))
        );

        // モーション設定
        $motion = $config['motion'] ?? array();
        $sanitized['motion'] = array(
            'durationMs' => max(100, min(1000, intval($motion['durationMs'] ?? 300))),
            'easing' => sanitize_text_field($motion['easing'] ?? 'cubic-bezier(0.2,0,0,1)'),
            'overshoot' => (bool)($motion['overshoot'] ?? true)
        );

        // スライダー設定
        $slider = $config['slider'] ?? array();
        $sanitized['slider'] = array(
            'autoplay' => (bool)($slider['autoplay'] ?? true),
            'interval' => max(1000, intval($slider['interval'] ?? 3500)),
            'fit' => in_array($slider['fit'] ?? 'cover', array('cover', 'contain', 'blurExtend')) ? $slider['fit'] ?? 'cover' : 'cover',
            'heightMode' => in_array($slider['heightMode'] ?? 'auto', array('auto', 'vh')) ? $slider['heightMode'] ?? 'auto' : 'auto',
            'aspectRatio' => $this->validate_aspect_ratio($slider['aspectRatio'] ?? '16:9'),
            'customAspectWidth' => max(1, min(50, intval($slider['customAspectWidth'] ?? 16))),
            'customAspectHeight' => max(1, min(50, intval($slider['customAspectHeight'] ?? 9))),
            'showArrows' => (bool)($slider['showArrows'] ?? true),
            'items' => array()
        );

        if (isset($slider['items']) && is_array($slider['items'])) {
            foreach ($slider['items'] as $item) {
                if (is_array($item)) {
                    $sanitized_item = array(
                        'mediaId' => intval($item['mediaId'] ?? 0),
                        'alt' => sanitize_text_field($item['alt'] ?? ''),
                        'href' => esc_url_raw($item['href'] ?? ''),
                        'fit' => in_array($item['fit'] ?? 'inherit', array('cover', 'contain', 'inherit')) ? $item['fit'] : 'inherit'
                    );

                    // 後方互換：srcがある場合は優先
                    if (!empty($item['src'])) {
                        $sanitized_item['src'] = esc_url_raw($item['src']);
                    }

                    $sanitized['slider']['items'][] = $sanitized_item;
                }
            }
        }

        // スタイル設定（新規）
        $styles = $config['styles'] ?? array();
        $sanitized['styles'] = array(
            'preset' => in_array($styles['preset'] ?? 'light', array('light', 'brand', 'minimal')) ? $styles['preset'] : 'light',
            'customCssUrl' => esc_url_raw($styles['customCssUrl'] ?? ''),
            'tokens' => array(
                'colorBrand' => sanitize_hex_color($styles['tokens']['colorBrand'] ?? '#667eea'),
                'radius' => max(0, intval($styles['tokens']['radius'] ?? 8)),
                'shadow' => sanitize_text_field($styles['tokens']['shadow'] ?? '0 4px 12px rgba(0,0,0,0.15)'),
                'spacing' => max(0, intval($styles['tokens']['spacing'] ?? 16)),
                'durationMs' => max(0, intval($styles['tokens']['durationMs'] ?? 300)),
                'easing' => sanitize_text_field($styles['tokens']['easing'] ?? 'cubic-bezier(0.34, 1.56, 0.64, 1)'),
                'fontFamily' => sanitize_text_field($styles['tokens']['fontFamily'] ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
            )
        );

        // レイアウト設定（新形式のみ、古い項目は除外）
        $layout = $config['layout'] ?? array();
        $sanitized['layout'] = array(
            'maxHeightPx' => max(50, intval($layout['maxHeightPx'] ?? 640)),
            'buttonRowHeight' => max(40, intval($layout['buttonRowHeight'] ?? 48))
        );

        // 開発・デバッグ設定（新規）
        $dev = $config['dev'] ?? array();
        $sanitized['dev'] = array(
            'previewMode' => (bool)($dev['previewMode'] ?? false),
            'debug' => (bool)($dev['debug'] ?? false)
        );

        // UI設定（新規）
        $ui = $config['ui'] ?? array();
        $sanitized['ui'] = array(
            'startOpen' => (bool)($ui['startOpen'] ?? false)
        );

        // キラッ設定（新規）
        $glitter = $config['glitter'] ?? array();
        $sanitized['glitter'] = array(
            'enabled' => (bool)($glitter['enabled'] ?? true),
            'target' => in_array($glitter['target'] ?? 'tab', array('tab', 'all')) ? $glitter['target'] ?? 'tab' : 'tab',
            'interval' => max(10000, intval($glitter['interval'] ?? 25000))
        );

        // その他設定
        $sanitized['showBubble'] = (bool)($config['showBubble'] ?? true);
        $sanitized['respectReducedMotion'] = (bool)($config['respectReducedMotion'] ?? true);

        // 後方互換：glitterInterval
        if (isset($config['glitterInterval'])) {
            $sanitized['glitter']['interval'] = max(10000, intval($config['glitterInterval']));
        }

        return $sanitized;
    }

    /**
     * アスペクト比の検証
     */
    private function validate_aspect_ratio($ratio) {
        // 定義済みの比率またはカスタムを許可
        $allowed_ratios = array('16:9', '4:3', '3:2', '1:1', 'custom');
        if (in_array($ratio, $allowed_ratios)) {
            return $ratio;
        }

        // フォールバック: 数値:数値形式の場合は有効とする
        if (preg_match('/^(\d+):(\d+)$/', $ratio, $matches)) {
            $width = intval($matches[1]);
            $height = intval($matches[2]);
            if ($width > 0 && $height > 0) {
                return $ratio;
            }
        }
        return '16:9';
    }

    /**
     * オプション更新デバッグ
     */
    public function debug_option_updated($option, $old_value, $value) {
        if ($option === 'andw_sideflow_config') {
            // フックを削除（一度だけ実行）
            remove_action('updated_option', array($this, 'debug_option_updated'), 10);
        }
    }

    /**
     * レガシー設定削除AJAX処理
     */
    public function ajax_clean_legacy() {
        // nonce確認
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'andw_sideflow_clean')) {
            wp_die(esc_html__('セキュリティチェックに失敗しました。', 'andw-sideflow'));
        }

        // 権限確認
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('権限がありません。', 'andw-sideflow'));
        }

        try {
            // 現在の設定を取得
            $config = get_option('andw_sideflow_config', array());

            if (is_array($config)) {
                // レガシー項目を削除
                $legacy_keys = array('topSafeOffset', 'bottomSafeOffset', 'maxVh', 'sliderMinVh', 'sliderMaxVh');
                $removed_keys = array();

                if (isset($config['layout']) && is_array($config['layout'])) {
                    foreach ($legacy_keys as $key) {
                        if (isset($config['layout'][$key])) {
                            unset($config['layout'][$key]);
                            $removed_keys[] = $key;
                        }
                    }
                }

                // 設定を更新
                update_option('andw_sideflow_config', $config);

                if (empty($removed_keys)) {
                    wp_send_json_success('削除する古い設定項目はありませんでした。');
                } else {
                    wp_send_json_success('古い設定項目を削除しました: ' . implode(', ', $removed_keys));
                }
            } else {
                wp_send_json_error('設定データが見つかりません。');
            }
        } catch (Exception $e) {
            wp_send_json_error('処理中にエラーが発生しました: ' . $e->getMessage());
        }
    }

    /**
     * 設定更新AJAX処理
     */
    public function ajax_update_config() {
        // nonce確認
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'andw_sideflow_update')) {
            wp_die(esc_html__('セキュリティチェックに失敗しました。', 'andw-sideflow'));
        }

        // 権限確認
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('権限がありません。', 'andw-sideflow'));
        }

        try {
            // 現在の設定を取得
            $existing_config = get_option('andw_sideflow_config', array());
            $default_config = $this->get_default_config();

            if (is_array($existing_config)) {
                // デフォルト設定でマージ
                $merged_config = $this->deep_merge_config($default_config, $existing_config);

                // 設定を更新
                update_option('andw_sideflow_config', $merged_config);

                wp_send_json_success('設定を最新版に更新しました。不足していた項目が追加されました。');
            } else {
                // 既存設定がない場合はデフォルト設定をセット
                update_option('andw_sideflow_config', $default_config);
                wp_send_json_success('デフォルト設定を保存しました。');
            }
        } catch (Exception $e) {
            wp_send_json_error('処理中にエラーが発生しました: ' . $e->getMessage());
        }
    }

    /**
     * デフォルト設定取得
     */
    public function get_default_config() {
        return array(
            'buttons' => array(
                array(
                    'id' => 'btn1',
                    'text' => '求人を見る',
                    'href' => '/jobs/',
                    'trackingId' => 'job_list',
                    'variant' => 'gradient',
                    'colors' => array(
                        'gradientStart' => '#0073aa',
                        'gradientEnd' => '#005a87',
                        'text' => '#ffffff'
                    ),
                    'visible' => true
                ),
                array(
                    'id' => 'btn2',
                    'text' => 'お問い合わせ',
                    'href' => '/contact/',
                    'trackingId' => 'contact',
                    'variant' => 'line',
                    'lineStyle' => 'solid',
                    'visible' => true
                )
            ),
            'tab' => array(
                'anchor' => 'center',
                'offsetPx' => 24,
                'widthPx' => 50,
                'heightMode' => 'matchDrawer',
                'text' => '求人',
                'action' => 'drawer',
                'linkUrl' => ''
            ),
            'drawer' => array(
                'backdrop' => false,
                'widthPercent' => 0.76,
                'maxWidthPx' => 600
            ),
            'slider' => array(
                'autoplay' => true,
                'interval' => 3500,
                'fit' => 'cover',
                'heightMode' => 'auto',
                'aspectRatio' => '16:9',
                'customAspectWidth' => 16,
                'customAspectHeight' => 9,
                'showArrows' => true,
                'items' => array(
                    array(
                        'mediaId' => 0,
                        'src' => '/wp-content/uploads/2025/10/名称未設定のデザイン.jpg',
                        'alt' => '求人募集の画像',
                        'href' => '',
                        'fit' => 'inherit'
                    )
                )
            ),
            'styles' => array(
                'preset' => 'light',
                'customCssUrl' => '',
                'tokens' => array(
                    'colorBrand' => '#667eea',
                    'radius' => 8,
                    'shadow' => '0 4px 12px rgba(0,0,0,0.15)',
                    'spacing' => 16,
                    'durationMs' => 300,
                    'easing' => 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    'fontFamily' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                )
            ),
            'layout' => array(
                'maxHeightPx' => 640,
                'buttonRowHeight' => 48
            ),
            'motion' => array(
                'durationMs' => 300,
                'easing' => 'cubic-bezier(0.2,0,0,1)',
                'overshoot' => true
            ),
            'ui' => array(
                'startOpen' => false
            ),
            'dev' => array(
                'previewMode' => false,
                'debug' => false
            ),
            'showBubble' => true,
            'glitterInterval' => 25000,
            'respectReducedMotion' => true
        );
    }

    /**
     * REST APIルート登録
     */
    public function register_rest_routes() {
        register_rest_route('andw-sideflow/v1', '/config', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_config_api'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('andw-sideflow/v1', '/preview', array(
            'methods' => 'POST',
            'callback' => array($this, 'set_preview_config_api'),
            'permission_callback' => array($this, 'preview_permission_callback'),
            'args' => array(
                'config' => array(
                    'required' => true,
                    'type' => 'object',
                    'sanitize_callback' => array($this, 'sanitize_config_array')
                )
            )
        ));

        register_rest_route('andw-sideflow/v1', '/preview', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_preview_config_api'),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * 設定取得API
     */
    public function get_config_api($request) {
        $preview_mode = $request->get_param('andwsideflow');

        if ($preview_mode === 'preview') {
            return $this->get_preview_config_api($request);
        }

        $config = get_option('andw_sideflow_config', $this->get_default_config());
        $config_version = md5(json_encode($config));

        $response = rest_ensure_response($config);
        $response->header('ETag', '"' . $config_version . '"');
        $response->data['configVersion'] = $config_version;

        return $response;
    }

    /**
     * プレビュー設定保存API
     */
    public function set_preview_config_api($request) {
        $config = $request->get_param('config');

        if (empty($config)) {
            return new WP_Error('missing_config', __('設定データが必要です。', 'andw-sideflow'), array('status' => 400));
        }

        set_transient('andw_sideflow_preview_config', $config, 30 * MINUTE_IN_SECONDS);

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('プレビュー設定を一時保存しました。', 'andw-sideflow')
        ));
    }

    /**
     * プレビュー設定取得API
     */
    public function get_preview_config_api($request) {
        $preview_config = get_transient('andw_sideflow_preview_config');

        if (false === $preview_config) {
            $config = get_option('andw_sideflow_config', $this->get_default_config());
        } else {
            $config = $preview_config;
        }

        $config_version = md5(json_encode($config) . '_preview');

        $response = rest_ensure_response($config);
        $response->header('ETag', '"' . $config_version . '"');
        $response->data['configVersion'] = $config_version;

        return $response;
    }

    /**
     * プレビュー権限チェック
     */
    public function preview_permission_callback() {
        return current_user_can('manage_options');
    }

    /**
     * MediaID から srcset 情報を取得
     */
    public function get_media_srcset($media_id) {
        if (empty($media_id)) {
            return array();
        }

        $attachment = get_post($media_id);
        if (!$attachment || $attachment->post_type !== 'attachment') {
            return array();
        }

        $image_sizes = array(
            'andw_sideflow_600',
            'andw_sideflow_720',
            'andw_sideflow_960',
            'andw_sideflow_1200',
            'andw_sideflow_1440'
        );

        $srcset = array();
        $sizes = array();

        foreach ($image_sizes as $size) {
            $image_data = wp_get_attachment_image_src($media_id, $size);
            if ($image_data) {
                $srcset[] = $image_data[0] . ' ' . $image_data[1] . 'w';
                $sizes[] = '(max-width: ' . $image_data[1] . 'px) ' . $image_data[1] . 'px';
            }
        }

        return array(
            'src' => wp_get_attachment_image_url($media_id, 'andw_sideflow_960'),
            'srcset' => implode(', ', $srcset),
            'sizes' => implode(', ', $sizes),
            'width' => 960,
            'height' => 540
        );
    }

    /**
     * フロントエンドスクリプト読み込み
     */
    public function enqueue_frontend_scripts() {
        wp_enqueue_script(
            'andw-sideflow-widget',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/js/widget.js',
            array(),
            ANDW_SIDEFLOW_VERSION,
            true
        );

        wp_localize_script('andw-sideflow-widget', 'andwSideFlowConfig', array(
            'apiUrl' => rest_url('andw-sideflow/v1/config'),
            'nonce' => wp_create_nonce('wp_rest')
        ));
    }

    /**
     * 管理画面スクリプトの読み込み
     */
    public function enqueue_admin_scripts($hook) {
        // andW SideFlow設定ページでのみ読み込み
        if ($hook !== 'settings_page_andw_sideflow') {
            return;
        }

        // WordPressカラーピッカーを読み込み
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');

        // メインの管理画面機能（設定保存、タブ切り替えなど）
        wp_enqueue_script(
            'andw-sideflow-admin',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-media-utils', 'wp-color-picker'),
            ANDW_SIDEFLOW_VERSION,
            true
        );

        // 新しいカラーピッカー機能
        wp_enqueue_script(
            'andw-sideflow-admin-extra',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/js/admin-scripts.js',
            array('jquery', 'wp-color-picker', 'andw-sideflow-admin'),
            ANDW_SIDEFLOW_VERSION,
            true
        );

        // 管理画面CSS
        wp_enqueue_style(
            'andw-sideflow-admin',
            ANDW_SIDEFLOW_PLUGIN_URL . 'assets/css/admin.css',
            array('wp-color-picker'),
            ANDW_SIDEFLOW_VERSION
        );

        // 現在の設定を取得
        $current_config = get_option('andw_sideflow_config', $this->get_default_config());

        wp_localize_script('andw-sideflow-admin', 'andwSideFlowAdmin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'clean_nonce' => wp_create_nonce('andw_sideflow_clean'),
            'update_nonce' => wp_create_nonce('andw_sideflow_update'),
            'currentConfig' => $current_config,
            'strings' => array(
                'selectMedia' => __('画像を選択', 'andw-sideflow'),
                'selectFiles' => __('ファイルを選択', 'andw-sideflow'),
                'useThis' => __('この画像を使用', 'andw-sideflow'),
                'noImage' => __('画像なし', 'andw-sideflow')
            )
        ));
    }

    /**
     * 旧形式のbutton設定を新形式に変換
     */
    private function migrate_button_config($button) {
        // 既に新形式の場合はそのまま返す
        if (isset($button['colors']) || ($button['variant'] ?? '') === 'line') {
            return $button;
        }

        $migrated = $button;
        $variant = $button['variant'] ?? 'solid';
        $lineBranding = $button['lineBranding'] ?? false;

        // variant変換ルール
        if ($lineBranding) {
            $migrated['variant'] = 'line';
            $migrated['lineStyle'] = ($variant === 'line') ? 'outline' : 'solid';
            unset($migrated['lineBranding']);
        } else {
            switch ($variant) {
                case 'accent':
                    $migrated['variant'] = 'gradient';
                    $migrated['colors'] = array(
                        'gradientStart' => '#0073aa',
                        'gradientEnd' => '#005a87',
                        'text' => '#ffffff'
                    );
                    break;
                case 'line':
                    $migrated['variant'] = 'outline';
                    $migrated['colors'] = array(
                        'border' => '#0073aa',
                        'text' => '#0073aa'
                    );
                    break;
                default: // 'default'
                    $migrated['variant'] = 'solid';
                    $migrated['colors'] = array(
                        'background' => '#f0f0f1',
                        'text' => '#2c3338'
                    );
                    break;
            }
            unset($migrated['lineBranding']);
        }

        return $migrated;
    }

    /**
     * 設定の深いマージ（デフォルト値を保持しつつ既存設定を優先）
     */
    private function deep_merge_config($default, $existing) {
        $merged = $default;

        foreach ($existing as $key => $value) {
            if (is_array($value) && isset($merged[$key]) && is_array($merged[$key])) {
                // buttons配列の場合はマイグレーションを実行
                if ($key === 'buttons') {
                    $merged[$key] = array();
                    foreach ($value as $button) {
                        $merged[$key][] = $this->migrate_button_config($button);
                    }
                } else {
                    $merged[$key] = $this->deep_merge_config($merged[$key], $value);
                }
            } else {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    /**
     * プラグイン有効化
     */
    public function activate() {
        // デフォルト設定を保存（強制的に初期化）
        $default_config = $this->get_default_config();
        $existing_config = get_option('andw_sideflow_config');

        if (!$existing_config) {
            $result = add_option('andw_sideflow_config', $default_config, '', 'no');
        } else {
            // 既存設定がある場合は新しい項目のみマージ（深いマージ）
            $merged_config = $this->deep_merge_config($default_config, $existing_config);
            $result = update_option('andw_sideflow_config', $merged_config);
        }

        // 画像がない場合はサンプル画像を追加（一回だけ）
        if (empty($final_config['slider']['items'])) {
            $final_config['slider']['items'] = array(
                array(
                    'src' => '/wp-content/uploads/2025/10/名称未設定のデザイン.jpg',
                    'alt' => '求人募集の画像',
                    'href' => ''
                )
            );
            update_option('andw_sideflow_config', $final_config);
        }

        // 画像サイズを追加（削除済み - 既存のWordPress画像サイズを利用）

        // リライトルールをフラッシュ
        flush_rewrite_rules();
    }

    /**
     * プラグイン無効化
     */
    public function deactivate() {
        // リライトルールをフラッシュ
        flush_rewrite_rules();
    }
}

// プラグイン初期化
ANDW_SideFlow::get_instance();