/**
 * andW SideFlow 管理画面JavaScript
 * WordPress.org審査基準準拠版
 */

document.addEventListener('DOMContentLoaded', function() {

    // 1. JSON設定プレビュー機能
    initConfigPreview();

    // 2. レガシー設定削除ボタン
    initCleanLegacyButton();

    // 3. 設定更新ボタン
    initUpdateConfigButton();

    // 4. ボタンvariant動的表示制御
    initButtonVariantControl();

    // 5. WordPressカラーピッカー初期化
    initColorPickers();

    // 6. タブ機能初期化
    initTabNavigation();

    // 7. フォーム処理初期化
    initFormHandling();

    // 8. リアルタイム設定更新
    initConfigUpdates();
});

/**
 * JSON設定プレビュー機能の初期化
 */
function initConfigPreview() {
    const textarea = document.getElementById('config_json');
    const preview = document.getElementById('andw-sideflow-preview');

    if (!textarea || !preview) {
        return;
    }

    function updatePreview() {
        try {
            const config = JSON.parse(textarea.value);
            preview.textContent = JSON.stringify(config, null, 2);
            preview.style.color = '#333';
            preview.style.backgroundColor = '#f1f1f1';
        } catch (e) {
            preview.textContent = 'JSON形式エラー: ' + e.message;
            preview.style.color = '#d63638';
            preview.style.backgroundColor = '#fcf0f1';
        }
    }

    textarea.addEventListener('input', updatePreview);
    updatePreview();
}

/**
 * レガシー設定削除ボタンの初期化
 */
function initCleanLegacyButton() {
    const btn = document.getElementById('clean-legacy-btn');
    const result = document.getElementById('clean-legacy-result');

    if (!btn || !result || typeof andwSideFlowAdmin === 'undefined') {
        return;
    }

    btn.addEventListener('click', function() {
        btn.disabled = true;
        btn.textContent = '処理中...';

        fetch(andwSideFlowAdmin.ajaxurl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=andw_sideflow_clean_legacy&nonce=' + andwSideFlowAdmin.clean_nonce
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                result.innerHTML = '<div style="color: green;">✓ ' + data.data + '</div>';
                // ページをリロードして更新された設定を表示
                setTimeout(() => location.reload(), 1000);
            } else {
                result.innerHTML = '<div style="color: red;">✗ ' + (data.data || 'エラーが発生しました') + '</div>';
            }
        })
        .catch(error => {
            result.innerHTML = '<div style="color: red;">✗ 通信エラーが発生しました</div>';
            console.error('Error:', error);
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = 'レガシー設定を削除';
        });
    });
}

/**
 * 設定更新ボタンの初期化
 */
function initUpdateConfigButton() {
    const btn = document.getElementById('update-config-btn');
    const result = document.getElementById('update-config-result');

    if (!btn || !result || typeof andwSideFlowAdmin === 'undefined') {
        return;
    }

    btn.addEventListener('click', function() {
        btn.disabled = true;
        btn.textContent = '処理中...';

        fetch(andwSideFlowAdmin.ajaxurl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=andw_sideflow_update_config&nonce=' + andwSideFlowAdmin.update_nonce
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                result.innerHTML = '<div style="color: green;">✓ ' + data.data + '</div>';
                // ページをリロードして更新された設定を表示
                setTimeout(() => location.reload(), 1000);
            } else {
                result.innerHTML = '<div style="color: red;">✗ ' + (data.data || 'エラーが発生しました') + '</div>';
            }
        })
        .catch(error => {
            result.innerHTML = '<div style="color: red;">✗ 通信エラーが発生しました</div>';
            console.error('Error:', error);
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = '設定を更新';
        });
    });
}

/**
 * ボタンvariant変更時の動的表示制御
 */
function initButtonVariantControl() {
    const variantSelects = document.querySelectorAll('.button-variant');

    variantSelects.forEach(function(select) {
        const buttonContainer = select.closest('.button-item');
        if (!buttonContainer) return;

        // 初期状態を設定
        updateVariantDisplay(buttonContainer, select.value);

        // 変更時のイベントリスナー
        select.addEventListener('change', function() {
            updateVariantDisplay(buttonContainer, this.value);
        });
    });
}

/**
 * variant選択に応じて表示要素を制御
 */
function updateVariantDisplay(container, variant) {
    const lineStyleRow = container.querySelector('.line-style-row');
    const solidColorsRow = container.querySelector('.solid-colors-row');
    const gradientColorsRow = container.querySelector('.gradient-colors-row');
    const outlineColorsRow = container.querySelector('.outline-colors-row');

    // 全て非表示に
    [lineStyleRow, solidColorsRow, gradientColorsRow, outlineColorsRow].forEach(function(row) {
        if (row) row.style.display = 'none';
    });

    // variant別の表示制御
    switch (variant) {
        case 'line':
            if (lineStyleRow) lineStyleRow.style.display = 'table-row';
            break;
        case 'solid':
            if (solidColorsRow) solidColorsRow.style.display = 'table-row';
            break;
        case 'gradient':
            if (gradientColorsRow) gradientColorsRow.style.display = 'table-row';
            break;
        case 'outline':
            if (outlineColorsRow) outlineColorsRow.style.display = 'table-row';
            break;
    }
}

/**
 * WordPressカラーピッカーの初期化
 */
function initColorPickers() {
    // WordPress のカラーピッカーが使用可能かチェック
    if (typeof jQuery === 'undefined' || typeof jQuery.fn.wpColorPicker === 'undefined') {
        console.warn('WordPress カラーピッカーが利用できません');
        return;
    }

    jQuery(document).ready(function($) {
        // カラーピッカー対象の入力フィールド
        const colorInputs = [
            '.button-color-background',
            '.button-color-text',
            '.button-color-gradient-start',
            '.button-color-gradient-end',
            '.button-color-border'
        ];

        colorInputs.forEach(function(selector) {
            $(selector).wpColorPicker({
                change: function(event, ui) {
                    // カラー変更時の処理（必要に応じて追加）
                },
                clear: function() {
                    // カラークリア時の処理（必要に応じて追加）
                }
            });
        });
    });
}

/**
 * タブナビゲーション機能の初期化
 */
function initTabNavigation() {
    // jQueryが利用可能かチェック
    if (typeof jQuery === 'undefined') {
        console.warn('タブ機能にはjQueryが必要です');
        return;
    }

    jQuery(document).ready(function($) {
        // 初期タブの表示
        let initialTab = $('.nav-tab-active').attr('href');
        if (!initialTab) {
            initialTab = localStorage.getItem('andw-sideflow-active-tab');
        }

        // 有効なタブかチェック
        if (initialTab && $('.nav-tab[href="' + initialTab + '"]').length > 0) {
            showTab(initialTab);
        } else {
            // デフォルトで最初のタブを表示
            const firstTab = $('.nav-tab').first().attr('href');
            if (firstTab) {
                showTab(firstTab);
            }
        }

        // タブクリックイベント
        $('.nav-tab').on('click', function(e) {
            e.preventDefault();
            const target = $(this).attr('href');

            // タブ状態を保存
            localStorage.setItem('andw-sideflow-active-tab', target);
            showTab(target);
        });

        /**
         * タブ表示関数
         */
        function showTab(target) {
            $('.nav-tab').removeClass('nav-tab-active');
            $('.nav-tab[href="' + target + '"]').addClass('nav-tab-active');
            $('.tab-content').hide();
            $(target).show();
        }
    });
}

/**
 * フォーム処理の初期化
 */
function initFormHandling() {
    if (typeof jQuery === 'undefined') {
        console.warn('フォーム処理にはjQueryが必要です');
        return;
    }

    jQuery(document).ready(function($) {
        // フォーム送信時の処理
        $('#andw-sideflow-form').on('submit', function(e) {
            const config = collectFormData();
            const configJson = JSON.stringify(config);

            // WordPressの設定APIに合わせたフィールドに設定
            $('#andw_sideflow_config_textarea, #config_json').val(configJson);

            // 現在のアクティブなタブを保存
            const activeTab = $('.nav-tab-active').attr('href');
            if (activeTab) {
                localStorage.setItem('andw-sideflow-active-tab', activeTab);
            }

            console.log('Form submission - config data:', config);
            console.log('Form submission - JSON length:', configJson.length);
        });

        // 初期設定の読み込み
        loadInitialConfig();
        updateConfig();
    });
}

/**
 * リアルタイム設定更新の初期化
 */
function initConfigUpdates() {
    if (typeof jQuery === 'undefined') {
        console.warn('設定更新にはjQueryが必要です');
        return;
    }

    jQuery(document).ready(function($) {
        // リアルタイムプレビューのためのイベント
        $(document).on('input change', 'input, select, textarea', function() {
            clearTimeout(window.configUpdateTimer);
            window.configUpdateTimer = setTimeout(function() {
                updateConfig();
            }, 500);
        });
    });
}

/**
 * 設定データを収集
 */
function collectFormData() {
    if (typeof jQuery === 'undefined') {
        console.warn('設定収集にはjQueryが必要です');
        return {};
    }

    const $ = jQuery;

    return {
        buttons: collectButtonsData(),
        tab: {
            anchor: $('input[name="tab-anchor"]:checked').val() || 'center',
            offsetPx: parseInt($('#tab-offset').val()) || 24,
            text: $('#tab-text').val() || '求人',
            action: $('input[name="tab-action"]:checked').val() || 'drawer',
            linkUrl: $('#tab-link-url-input').val() || ''
        },
        drawer: {
            backdrop: $('#drawer-backdrop').is(':checked'),
            widthPercent: parseFloat($('#drawer-width-percent').val()) / 100 || 0.76,
            maxWidthPx: parseInt($('#drawer-max-width').val()) || 600
        },
        slider: {
            autoplay: $('#slider-autoplay').is(':checked'),
            interval: parseInt($('#slider-interval').val()) || 3500,
            fit: $('#slider-fit').val() || 'cover',
            heightMode: 'auto',
            aspectRatio: $('#slider-aspect-ratio').val() || '16:9',
            customAspectWidth: parseInt($('#aspect-width').val()) || 16,
            customAspectHeight: parseInt($('#aspect-height').val()) || 9,
            showArrows: $('#slider-show-arrows').is(':checked'),
            items: collectSlidesData()
        },
        styles: {
            preset: $('#style-preset').val() || 'light',
            customCssUrl: $('#custom-css-url').val() || '',
            tokens: {
                colorBrand: $('#token-color-brand').val() || '#667eea',
                radius: parseInt($('#token-radius').val()) || 8,
                shadow: $('#token-shadow').val() || '0 4px 12px rgba(0,0,0,0.15)',
                spacing: parseInt($('#token-spacing').val()) || 16,
                durationMs: parseInt($('#token-duration').val()) || 300,
                easing: $('#token-easing').val() || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontFamily: $('#token-font-family').val() || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }
        },
        layout: {
            maxHeightPx: parseInt($('#layout-max-height').val()) || 640,
            buttonRowHeight: parseInt($('#layout-button-row-height').val()) || 48
        },
        motion: {
            durationMs: parseInt($('#token-duration').val()) || 300,
            easing: $('#token-easing').val() || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            overshoot: $('#overshoot-animation').is(':checked')
        },
        dev: {
            previewMode: false,
            debug: $('#dev-debug').is(':checked')
        },
        ui: {
            startOpen: $('#ui-start-open').is(':checked')
        },
        glitter: {
            enabled: $('#glitter-enabled').is(':checked'),
            target: $('input[name="glitter-target"]:checked').val() || 'tab',
            interval: parseInt($('#glitter-interval').val()) || 25000
        }
    };
}

/**
 * ボタンデータを収集
 */
function collectButtonsData() {
    if (typeof jQuery === 'undefined') {
        return [];
    }

    const $ = jQuery;
    const buttons = [];

    $('.button-item').each(function() {
        const $item = $(this);
        const variant = $item.find('.button-variant').val() || 'solid';

        const button = {
            id: $item.find('.button-id').val() || '',
            text: $item.find('.button-text').val() || '',
            href: $item.find('.button-href').val() || '',
            trackingId: $item.find('.button-tracking-id').val() || '',
            variant: variant,
            visible: $item.find('.button-visible').is(':checked')
        };

        // カラー設定を収集
        if (variant !== 'line') {
            button.colors = {};
            switch (variant) {
                case 'solid':
                    button.colors.background = $item.find('.button-color-background').val() || '#f0f0f1';
                    button.colors.text = $item.find('.button-color-text').val() || '#2c3338';
                    break;
                case 'gradient':
                    button.colors.gradientStart = $item.find('.button-color-gradient-start').val() || '#0073aa';
                    button.colors.gradientEnd = $item.find('.button-color-gradient-end').val() || '#005a87';
                    button.colors.text = $item.find('.button-color-text').val() || '#ffffff';
                    break;
                case 'outline':
                    button.colors.border = $item.find('.button-color-border').val() || '#0073aa';
                    button.colors.text = $item.find('.button-color-text').val() || '#0073aa';
                    break;
            }
        }

        // LINEスタイル設定
        if (variant === 'line') {
            button.lineStyle = $item.find('.button-line-style').val() || 'solid';
        }

        buttons.push(button);
    });

    return buttons;
}

/**
 * スライドデータを収集
 */
function collectSlidesData() {
    if (typeof jQuery === 'undefined') {
        return [];
    }

    const $ = jQuery;
    const slides = [];

    $('.slide-item').each(function() {
        const $item = $(this);
        slides.push({
            mediaId: parseInt($item.find('.media-id').val()) || 0,
            src: $item.find('.slide-src').val() || '',
            alt: $item.find('.slide-alt').val() || '',
            href: $item.find('.slide-href').val() || '',
            fit: $item.find('.slide-fit').val() || 'inherit'
        });
    });

    return slides;
}

/**
 * 設定を更新
 */
function updateConfig() {
    if (typeof jQuery === 'undefined') {
        return;
    }

    const config = collectFormData();
    const configJson = JSON.stringify(config);
    jQuery('#andw_sideflow_config_textarea, #config_json').val(configJson);
}

/**
 * 初期設定を読み込み
 */
function loadInitialConfig() {
    if (typeof andwSideFlowAdmin === 'undefined' || !andwSideFlowAdmin.currentConfig) {
        console.log('Loading initial config: no data available');
        return;
    }

    console.log('Loading initial config:', andwSideFlowAdmin.currentConfig);

    // 初期設定をフォームに反映する処理をここに追加
    // 現在はJSONテキストエリアの更新のみ
    const configJson = JSON.stringify(andwSideFlowAdmin.currentConfig, null, 2);
    if (typeof jQuery !== 'undefined') {
        jQuery('#config_json').val(configJson);
    }
}