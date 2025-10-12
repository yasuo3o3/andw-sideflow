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