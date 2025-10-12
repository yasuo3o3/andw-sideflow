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