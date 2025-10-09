<?php
/**
 * Plugin Name: andW SideFlow
 * Description: 右サイド追従タブから展開するドロワー型求人スライドショー&ボタン群プラグイン
 * Version: 0.0.2
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
define('ANDW_SIDEFLOW_VERSION', '0.0.2');
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

        // 画像サイズの追加
        $this->add_image_sizes();
    }

    /**
     * 管理画面初期化
     */
    private function admin_init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_settings_init'));
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
     * 画像サイズ追加
     */
    private function add_image_sizes() {
        // スライド用画像サイズ（16:9比率）
        add_image_size('andw_sideflow_600', 600, 338, true);
        add_image_size('andw_sideflow_720', 720, 405, true);
        add_image_size('andw_sideflow_960', 960, 540, true);
        add_image_size('andw_sideflow_1200', 1200, 675, true);
        add_image_size('andw_sideflow_1440', 1440, 810, true);
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
            'sanitize_callback' => array($this, 'sanitize_config'),
            'default' => $this->get_default_config()
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
    }

    /**
     * 設定ページ
     */
    public function admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // nonce確認
        if (isset($_POST['submit'])) {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'andw_sideflow_settings-options')) {
                wp_die(__('セキュリティチェックに失敗しました。', 'andw-sideflow'));
            }
        }

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('andw_sideflow_settings');
                do_settings_sections('andw_sideflow_settings');
                submit_button();
                ?>
            </form>

            <h2><?php esc_html_e('プレビュー', 'andw-sideflow'); ?></h2>
            <p><?php esc_html_e('設定内容のプレビュー：', 'andw-sideflow'); ?></p>
            <pre id="andw-sideflow-preview" style="background: #f1f1f1; padding: 15px; overflow: auto; max-height: 400px;"></pre>

            <script>
            document.addEventListener('DOMContentLoaded', function() {
                const textarea = document.getElementById('config_json');
                const preview = document.getElementById('andw-sideflow-preview');

                function updatePreview() {
                    try {
                        const config = JSON.parse(textarea.value);
                        preview.textContent = JSON.stringify(config, null, 2);
                    } catch (e) {
                        preview.textContent = 'JSON形式エラー: ' + e.message;
                    }
                }

                textarea.addEventListener('input', updatePreview);
                updatePreview();
            });
            </script>
        </div>
        <?php
    }

    /**
     * 設定JSON入力フィールド
     */
    public function config_json_field() {
        $config = get_option('andw_sideflow_config', $this->get_default_config());
        $json = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        ?>
        <textarea id="config_json" name="andw_sideflow_config" rows="20" cols="80" style="width: 100%; font-family: monospace;"><?php echo esc_textarea($json); ?></textarea>
        <p class="description">
            <?php esc_html_e('JSON形式で設定を入力してください。', 'andw-sideflow'); ?>
        </p>
        <?php
    }

    /**
     * 設定のサニタイズ
     */
    public function sanitize_config($input) {
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $this->sanitize_config_array($decoded);
            }
        }
        return $this->get_default_config();
    }

    /**
     * 設定配列のサニタイズ
     */
    private function sanitize_config_array($config) {
        $sanitized = array();

        // ボタン設定
        if (isset($config['buttons']) && is_array($config['buttons'])) {
            $sanitized['buttons'] = array();
            foreach ($config['buttons'] as $button) {
                if (is_array($button)) {
                    $sanitized['buttons'][] = array(
                        'id' => sanitize_key($button['id'] ?? ''),
                        'text' => sanitize_text_field($button['text'] ?? ''),
                        'href' => esc_url_raw($button['href'] ?? ''),
                        'trackingId' => sanitize_key($button['trackingId'] ?? ''),
                        'variant' => in_array($button['variant'] ?? '', array('default', 'accent', 'line')) ? $button['variant'] : 'default',
                        'lineBranding' => (bool)($button['lineBranding'] ?? false),
                        'visible' => (bool)($button['visible'] ?? true)
                    );
                }
            }
        }

        // タブ設定
        if (isset($config['tab']) && is_array($config['tab'])) {
            $tab = $config['tab'];
            $sanitized['tab'] = array(
                'anchor' => in_array($tab['anchor'] ?? '', array('center', 'bottom')) ? $tab['anchor'] : 'center',
                'offsetPx' => max(0, intval($tab['offsetPx'] ?? 24))
            );
        }

        // ドロワー設定
        if (isset($config['drawer']) && is_array($config['drawer'])) {
            $drawer = $config['drawer'];
            $sanitized['drawer'] = array(
                'backdrop' => (bool)($drawer['backdrop'] ?? false)
            );
        }

        // スライダー設定
        if (isset($config['slider']) && is_array($config['slider'])) {
            $slider = $config['slider'];
            $sanitized['slider'] = array(
                'autoplay' => (bool)($slider['autoplay'] ?? true),
                'interval' => max(1000, intval($slider['interval'] ?? 3500)),
                'fit' => in_array($slider['fit'] ?? '', array('cover', 'contain', 'blurExtend')) ? $slider['fit'] : 'cover',
                'heightMode' => in_array($slider['heightMode'] ?? '', array('auto', 'vh')) ? $slider['heightMode'] : 'auto',
                'aspectRatio' => $this->validate_aspect_ratio($slider['aspectRatio'] ?? '16:9'),
                'items' => array()
            );

            if (isset($slider['items']) && is_array($slider['items'])) {
                foreach ($slider['items'] as $item) {
                    if (is_array($item)) {
                        $sanitized['slider']['items'][] = array(
                            'src' => esc_url_raw($item['src'] ?? ''),
                            'alt' => sanitize_text_field($item['alt'] ?? ''),
                            'href' => esc_url_raw($item['href'] ?? '')
                        );
                    }
                }
            }
        }

        // レイアウト設定（新形式優先、旧形式は下位互換用）
        if (isset($config['layout']) && is_array($config['layout'])) {
            $layout = $config['layout'];
            $sanitized['layout'] = array(
                'maxHeightPx' => max(400, intval($layout['maxHeightPx'] ?? 640)),
                'buttonRowHeight' => max(40, intval($layout['buttonRowHeight'] ?? 48)),
                // 下位互換用
                'topSafeOffset' => max(0, intval($layout['topSafeOffset'] ?? 8)),
                'bottomSafeOffset' => max(0, intval($layout['bottomSafeOffset'] ?? 16)),
                'maxVh' => max(50, min(95, intval($layout['maxVh'] ?? 84))),
                'sliderMinVh' => max(20, min(60, intval($layout['sliderMinVh'] ?? 38))),
                'sliderMaxVh' => max(40, min(80, intval($layout['sliderMaxVh'] ?? 48)))
            );
        }

        // その他設定
        $sanitized['showBubble'] = (bool)($config['showBubble'] ?? true);
        $sanitized['glitterInterval'] = max(10000, intval($config['glitterInterval'] ?? 25000));
        $sanitized['respectReducedMotion'] = (bool)($config['respectReducedMotion'] ?? true);

        return $sanitized;
    }

    /**
     * アスペクト比の検証
     */
    private function validate_aspect_ratio($ratio) {
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
     * デフォルト設定取得
     */
    private function get_default_config() {
        return array(
            'buttons' => array(
                array(
                    'id' => 'btn1',
                    'text' => '求人を見る',
                    'href' => '/jobs/',
                    'trackingId' => 'job_list',
                    'variant' => 'accent',
                    'lineBranding' => false,
                    'visible' => true
                ),
                array(
                    'id' => 'btn2',
                    'text' => 'お問い合わせ',
                    'href' => '/contact/',
                    'trackingId' => 'contact',
                    'variant' => 'line',
                    'lineBranding' => true,
                    'visible' => true
                )
            ),
            'tab' => array(
                'anchor' => 'center',
                'offsetPx' => 24
            ),
            'drawer' => array(
                'backdrop' => false
            ),
            'slider' => array(
                'autoplay' => true,
                'interval' => 3500,
                'fit' => 'cover',
                'heightMode' => 'auto',
                'aspectRatio' => '16:9',
                'items' => array()
            ),
            'layout' => array(
                'maxHeightPx' => 640,
                'buttonRowHeight' => 48,
                // 下位互換用
                'topSafeOffset' => 8,
                'bottomSafeOffset' => 16,
                'maxVh' => 84,
                'sliderMinVh' => 38,
                'sliderMaxVh' => 48
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
    }

    /**
     * 設定取得API
     */
    public function get_config_api($request) {
        $config = get_option('andw_sideflow_config', $this->get_default_config());
        return rest_ensure_response($config);
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
     * プラグイン有効化
     */
    public function activate() {
        // デフォルト設定を保存
        if (!get_option('andw_sideflow_config')) {
            add_option('andw_sideflow_config', $this->get_default_config());
        }

        // 画像サイズを追加
        $this->add_image_sizes();

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