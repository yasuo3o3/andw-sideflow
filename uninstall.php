<?php
/**
 * andW SideFlow アンインストール処理
 *
 * プラグイン削除時に実行される処理
 * プラグイン停止時では実行されない
 */

// 直接アクセスまたは不正なアンインストールを防ぐ
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// アンインストール処理
andw_sideflow_uninstall();

/**
 * アンインストール処理メイン関数
 */
function andw_sideflow_uninstall() {
    // 当プラグインが作成したオプションを削除
    delete_option('andw_sideflow_config');

    // マルチサイト対応
    if (is_multisite()) {
        delete_site_option('andw_sideflow_config');

        // 各サイトのオプションも削除
        $sites = get_sites();
        foreach ($sites as $site) {
            switch_to_blog($site->blog_id);
            delete_option('andw_sideflow_config');
            restore_current_blog();
        }
    }

    // 当プラグイン関連のトランジェントを削除
    andw_sideflow_delete_transients();

    // 当プラグイン関連のオブジェクトキャッシュを削除
    andw_sideflow_delete_cache();
}

/**
 * 当プラグインのトランジェントを削除
 */
function andw_sideflow_delete_transients() {
    global $wpdb;

    // andw_sideflow_ プレフィックスのトランジェントを検索・削除
    // WordPress.org ガイドラインに基づくアンインストール処理：
    // トランジェント検索にはキャッシュAPIが存在せず、$wpdb->prepare() による安全な直接照会が必要
    // phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching
    $transient_keys = $wpdb->get_col(
        $wpdb->prepare(
            "SELECT option_name FROM {$wpdb->options}
             WHERE option_name LIKE %s
             OR option_name LIKE %s",
            '_transient_andw_sideflow_%',
            '_transient_timeout_andw_sideflow_%'
        )
    );

    foreach ($transient_keys as $key) {
        if (strpos($key, '_transient_timeout_') === 0) {
            // timeout は削除処理で自動削除されるのでスキップ
            continue;
        }

        $transient_name = str_replace('_transient_', '', $key);
        delete_transient($transient_name);
    }
}

/**
 * 当プラグインのオブジェクトキャッシュを削除
 */
function andw_sideflow_delete_cache() {
    // wp_cache_flush() は使用禁止（サイト全体に影響）
    // 当プラグイン固有のキャッシュのみ削除

    $cache_keys = array(
        'andw_sideflow_config',
        'andw_sideflow_image_sizes',
        'andw_sideflow_settings'
    );

    foreach ($cache_keys as $key) {
        wp_cache_delete($key, 'andw_sideflow');
    }
}