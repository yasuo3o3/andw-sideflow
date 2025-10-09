(function($) {
    'use strict';

    let mediaModal = null;
    let currentSlideIndex = null;

    $(document).ready(function() {
        initializeTabs();
        initializeColorPickers();
        initializeSortables();
        initializeMediaSelection();
        initializePreview();
        initializeFormHandling();
    });

    // タブ切り替え
    function initializeTabs() {
        $('.nav-tab').on('click', function(e) {
            e.preventDefault();

            const target = $(this).attr('href');

            $('.nav-tab').removeClass('nav-tab-active');
            $(this).addClass('nav-tab-active');

            $('.tab-content').hide();
            $(target).show();
        });
    }

    // カラーピッカー初期化
    function initializeColorPickers() {
        $('.color-picker').wpColorPicker({
            change: function() {
                updateConfig();
            }
        });
    }

    // 並び替え初期化
    function initializeSortables() {
        if ($.fn.sortable) {
            $('#slides-list').sortable({
                placeholder: 'ui-sortable-placeholder',
                update: function() {
                    updateConfig();
                }
            });

            $('#buttons-list').sortable({
                placeholder: 'ui-sortable-placeholder',
                update: function() {
                    updateConfig();
                }
            });
        }
    }

    // メディア選択初期化
    function initializeMediaSelection() {
        // スライド画像選択
        $(document).on('click', '.select-media', function(e) {
            e.preventDefault();

            currentSlideIndex = $(this).closest('.slide-item').data('index');

            if (mediaModal) {
                mediaModal.close();
            }

            mediaModal = wp.media({
                title: andwSideFlowAdmin.strings.selectMedia,
                button: {
                    text: andwSideFlowAdmin.strings.useThis
                },
                multiple: false,
                library: {
                    type: 'image'
                }
            });

            mediaModal.on('select', function() {
                const attachment = mediaModal.state().get('selection').first().toJSON();
                const slideItem = $(`.slide-item[data-index="${currentSlideIndex}"]`);

                slideItem.find('.media-id').val(attachment.id);
                slideItem.find('.slide-preview img').attr('src', attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url);

                if (!slideItem.find('.slide-alt').val()) {
                    slideItem.find('.slide-alt').val(attachment.alt || attachment.title);
                }

                updateConfig();
            });

            mediaModal.open();
        });

        // スライド追加
        $('#add-slide').on('click', function() {
            addSlideItem();
        });

        // スライド削除
        $(document).on('click', '.remove-slide', function() {
            $(this).closest('.slide-item').remove();
            updateSlideIndices();
            updateConfig();
        });

        // ボタン追加
        $('#add-button').on('click', function() {
            addButtonItem();
        });

        // ボタン削除
        $(document).on('click', '.remove-button', function() {
            $(this).closest('.button-item').remove();
            updateButtonIndices();
            updateConfig();
        });
    }

    // プレビュー機能初期化
    function initializePreview() {
        $('#preview-apply').on('click', function() {
            const config = collectFormData();
            applyPreview(config);
        });

        // リアルタイムプレビューのためのイベント
        $(document).on('input change', 'input, select, textarea', function() {
            clearTimeout(window.configUpdateTimer);
            window.configUpdateTimer = setTimeout(function() {
                updateConfig();
            }, 500);
        });
    }

    // フォーム処理初期化
    function initializeFormHandling() {
        $('#andw-sideflow-form').on('submit', function(e) {
            const config = collectFormData();
            const configJson = JSON.stringify(config);

            // WordPressの設定APIに合わせたフィールドに設定
            $('#andw_sideflow_config_textarea').val(configJson);

            console.log('Form submission - config data:', config);
            console.log('Form submission - JSON length:', configJson.length);
        });

        // 初期設定の読み込み
        loadInitialConfig();
        updateConfig();
    }

    // スライドアイテム追加
    function addSlideItem() {
        const index = $('#slides-list .slide-item').length;
        const template = `
            <div class="slide-item" data-index="${index}">
                <div class="slide-preview">
                    <div class="no-image">${andwSideFlowAdmin.strings.noImage || '画像なし'}</div>
                </div>
                <div class="slide-controls">
                    <button type="button" class="button select-media">${andwSideFlowAdmin.strings.selectMedia}</button>
                    <input type="hidden" class="media-id" value="0">
                    <input type="text" class="slide-alt" placeholder="代替テキスト">
                    <input type="url" class="slide-href" placeholder="リンクURL（オプション）">
                    <select class="slide-fit">
                        <option value="inherit">全体設定に従う</option>
                        <option value="cover">カバー</option>
                        <option value="contain">全体表示</option>
                    </select>
                    <button type="button" class="button-link-delete remove-slide">削除</button>
                </div>
            </div>
        `;

        $('#slides-list').append(template);
        updateConfig();
    }

    // ボタンアイテム追加
    function addButtonItem() {
        const index = $('#buttons-list .button-item').length;
        const template = `
            <div class="button-item" data-index="${index}">
                <h4>ボタン ${index + 1}</h4>
                <table class="form-table">
                    <tr>
                        <th scope="row">表示</th>
                        <td>
                            <label>
                                <input type="checkbox" class="button-visible" checked>
                                このボタンを表示する
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">ID</th>
                        <td>
                            <input type="text" class="button-id" placeholder="btn${index + 1}">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">テキスト</th>
                        <td>
                            <input type="text" class="button-text" placeholder="ボタンテキスト">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">リンクURL</th>
                        <td>
                            <input type="url" class="button-href" placeholder="https://example.com">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">トラッキングID</th>
                        <td>
                            <input type="text" class="button-tracking-id" placeholder="button_click">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">スタイル</th>
                        <td>
                            <select class="button-variant">
                                <option value="default">デフォルト</option>
                                <option value="accent">アクセント</option>
                                <option value="line">ライン</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">LINEブランディング</th>
                        <td>
                            <label>
                                <input type="checkbox" class="button-line-branding">
                                LINEカラーを使用（lineスタイル時のみ）
                            </label>
                        </td>
                    </tr>
                </table>
                <button type="button" class="button-link-delete remove-button">このボタンを削除</button>
            </div>
        `;

        $('#buttons-list').append(template);
        updateButtonIndices();
        updateConfig();
    }

    // スライドインデックス更新
    function updateSlideIndices() {
        $('#slides-list .slide-item').each(function(index) {
            $(this).attr('data-index', index);
        });
    }

    // ボタンインデックス更新
    function updateButtonIndices() {
        $('#buttons-list .button-item').each(function(index) {
            $(this).attr('data-index', index);
            $(this).find('h4').text(`ボタン ${index + 1}`);
        });
    }

    // フォームデータ収集
    function collectFormData() {
        const config = {
            buttons: collectButtonsData(),
            tab: {
                anchor: $('input[name="tab-anchor"]:checked').val() || 'center',
                offsetPx: parseInt($('#tab-offset').val()) || 24
            },
            drawer: {
                backdrop: $('#drawer-backdrop').is(':checked')
            },
            slider: {
                autoplay: $('#slider-autoplay').is(':checked'),
                interval: parseInt($('#slider-interval').val()) || 3500,
                fit: $('#slider-fit').val() || 'cover',
                heightMode: 'auto',
                aspectRatio: $('#slider-aspect-ratio').val() || '16:9',
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
            dev: {
                previewMode: false,
                debug: $('#dev-debug').is(':checked')
            },
            showBubble: $('#show-bubble').is(':checked'),
            glitterInterval: parseInt($('#glitter-interval').val()) || 25000,
            respectReducedMotion: $('#respect-reduced-motion').is(':checked')
        };

        return config;
    }

    // スライドデータ収集
    function collectSlidesData() {
        const slides = [];

        $('#slides-list .slide-item').each(function() {
            const mediaId = parseInt($(this).find('.media-id').val()) || 0;
            const alt = $(this).find('.slide-alt').val() || '';
            const href = $(this).find('.slide-href').val() || '';
            const fit = $(this).find('.slide-fit').val() || 'inherit';

            if (mediaId > 0 || alt || href) {
                slides.push({
                    mediaId: mediaId,
                    alt: alt,
                    href: href,
                    fit: fit
                });
            }
        });

        return slides;
    }

    // ボタンデータ収集
    function collectButtonsData() {
        const buttons = [];

        $('#buttons-list .button-item').each(function() {
            const visible = $(this).find('.button-visible').is(':checked');
            const id = $(this).find('.button-id').val() || '';
            const text = $(this).find('.button-text').val() || '';
            const href = $(this).find('.button-href').val() || '';
            const trackingId = $(this).find('.button-tracking-id').val() || '';
            const variant = $(this).find('.button-variant').val() || 'default';
            const lineBranding = $(this).find('.button-line-branding').is(':checked');

            buttons.push({
                id: id,
                text: text,
                href: href,
                trackingId: trackingId,
                variant: variant,
                lineBranding: lineBranding,
                visible: visible
            });
        });

        return buttons;
    }

    // プレビュー適用
    function applyPreview(config) {
        const $button = $('#preview-apply');
        const originalText = $button.text();

        $button.text('適用中...').prop('disabled', true);

        $.ajax({
            url: andwSideFlowAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'andw_sideflow_preview_apply',
                nonce: andwSideFlowAdmin.nonce,
                config: JSON.stringify(config)
            },
            success: function(response) {
                if (response.success) {
                    showNotice(response.data.message || andwSideFlowAdmin.strings.previewApplied, 'success');

                    // プレビューフレームをリロード
                    const iframe = document.getElementById('preview-iframe');
                    if (iframe) {
                        iframe.src = iframe.src;
                    }
                } else {
                    showNotice(response.data || andwSideFlowAdmin.strings.previewError, 'error');
                }
            },
            error: function() {
                showNotice(andwSideFlowAdmin.strings.previewError, 'error');
            },
            complete: function() {
                $button.text(originalText).prop('disabled', false);
            }
        });
    }

    // 通知表示
    function showNotice(message, type = 'info') {
        const $notice = $(`<div class="preview-notice ${type}">${message}</div>`);
        $('.andw-sideflow-preview').prepend($notice);

        setTimeout(function() {
            $notice.fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }

    // 初期設定読み込み
    function loadInitialConfig() {
        if (typeof andwSideFlowAdmin === 'undefined' || !andwSideFlowAdmin.currentConfig) {
            console.warn('Initial config not found');
            return;
        }

        const config = andwSideFlowAdmin.currentConfig;
        console.log('Loading initial config:', config);

        // スライダー設定
        if (config.slider) {
            $('#slider-autoplay').prop('checked', config.slider.autoplay || false);
            $('#slider-interval').val(config.slider.interval || 3500);
            $('#slider-fit').val(config.slider.fit || 'cover');
            $('#slider-aspect-ratio').val(config.slider.aspectRatio || '16:9');

            // スライドアイテム
            if (config.slider.items && config.slider.items.length > 0) {
                $('#slides-list').empty();
                config.slider.items.forEach((item, index) => {
                    addSlideItemWithData(item, index);
                });
            }
        }

        // ボタン設定
        if (config.buttons && config.buttons.length > 0) {
            $('#buttons-list').empty();
            config.buttons.forEach((button, index) => {
                addButtonItemWithData(button, index);
            });
        }

        // スタイル設定
        if (config.styles) {
            $('#style-preset').val(config.styles.preset || 'light');
            $('#custom-css-url').val(config.styles.customCssUrl || '');

            if (config.styles.tokens) {
                $('#token-color-brand').val(config.styles.tokens.colorBrand || '#667eea');
                $('#token-radius').val(config.styles.tokens.radius || 8);
                $('#token-shadow').val(config.styles.tokens.shadow || '0 4px 12px rgba(0,0,0,0.15)');
                $('#token-spacing').val(config.styles.tokens.spacing || 16);
                $('#token-duration').val(config.styles.tokens.durationMs || 300);
                $('#token-easing').val(config.styles.tokens.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)');
                $('#token-font-family').val(config.styles.tokens.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
            }
        }

        // タブ・レイアウト設定
        if (config.tab) {
            $('input[name="tab-anchor"][value="' + (config.tab.anchor || 'center') + '"]').prop('checked', true);
            $('#tab-offset').val(config.tab.offsetPx || 24);
        }

        if (config.drawer) {
            $('#drawer-backdrop').prop('checked', config.drawer.backdrop || false);
        }

        if (config.layout) {
            $('#layout-max-height').val(config.layout.maxHeightPx || 640);
            $('#layout-button-row-height').val(config.layout.buttonRowHeight || 48);
        }

        // その他設定
        $('#show-bubble').prop('checked', config.showBubble !== false);
        $('#glitter-interval').val(config.glitterInterval || 25000);
        $('#respect-reduced-motion').prop('checked', config.respectReducedMotion !== false);

        if (config.dev) {
            $('#dev-debug').prop('checked', config.dev.debug || false);
        }

        // カラーピッカーの再初期化
        $('.color-picker').wpColorPicker('color', config.styles?.tokens?.colorBrand || '#667eea');
    }

    // データ付きスライドアイテム追加
    function addSlideItemWithData(item, index) {
        const mediaId = item.mediaId || 0;
        const imageUrl = mediaId > 0 ? '' : (item.src || ''); // MediaIDがある場合は後で取得

        const template = `
            <div class="slide-item" data-index="${index}">
                <div class="slide-preview">
                    ${imageUrl ? `<img src="${imageUrl}" alt="">` : `<div class="no-image">${andwSideFlowAdmin.strings.noImage || '画像なし'}</div>`}
                </div>
                <div class="slide-controls">
                    <button type="button" class="button select-media">${andwSideFlowAdmin.strings.selectMedia}</button>
                    <input type="hidden" class="media-id" value="${mediaId}">
                    <input type="text" class="slide-alt" placeholder="代替テキスト" value="${item.alt || ''}">
                    <input type="url" class="slide-href" placeholder="リンクURL（オプション）" value="${item.href || ''}">
                    <select class="slide-fit">
                        <option value="inherit" ${item.fit === 'inherit' ? 'selected' : ''}>全体設定に従う</option>
                        <option value="cover" ${item.fit === 'cover' ? 'selected' : ''}>カバー</option>
                        <option value="contain" ${item.fit === 'contain' ? 'selected' : ''}>全体表示</option>
                    </select>
                    <button type="button" class="button-link-delete remove-slide">削除</button>
                </div>
            </div>
        `;

        $('#slides-list').append(template);

        // MediaIDがある場合はサムネイルを取得
        if (mediaId > 0) {
            fetchMediaThumbnail(mediaId, index);
        }
    }

    // データ付きボタンアイテム追加
    function addButtonItemWithData(button, index) {
        const template = `
            <div class="button-item" data-index="${index}">
                <h4>ボタン ${index + 1}</h4>
                <table class="form-table">
                    <tr>
                        <th scope="row">表示</th>
                        <td>
                            <label>
                                <input type="checkbox" class="button-visible" ${button.visible !== false ? 'checked' : ''}>
                                このボタンを表示する
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">ID</th>
                        <td>
                            <input type="text" class="button-id" value="${button.id || ''}" placeholder="btn${index + 1}">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">テキスト</th>
                        <td>
                            <input type="text" class="button-text" value="${button.text || ''}" placeholder="ボタンテキスト">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">リンクURL</th>
                        <td>
                            <input type="url" class="button-href" value="${button.href || ''}" placeholder="https://example.com">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">トラッキングID</th>
                        <td>
                            <input type="text" class="button-tracking-id" value="${button.trackingId || ''}" placeholder="button_click">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">スタイル</th>
                        <td>
                            <select class="button-variant">
                                <option value="default" ${button.variant === 'default' ? 'selected' : ''}>デフォルト</option>
                                <option value="accent" ${button.variant === 'accent' ? 'selected' : ''}>アクセント</option>
                                <option value="line" ${button.variant === 'line' ? 'selected' : ''}>ライン</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">LINEブランディング</th>
                        <td>
                            <label>
                                <input type="checkbox" class="button-line-branding" ${button.lineBranding ? 'checked' : ''}>
                                LINEカラーを使用（lineスタイル時のみ）
                            </label>
                        </td>
                    </tr>
                </table>
                <button type="button" class="button-link-delete remove-button">このボタンを削除</button>
            </div>
        `;

        $('#buttons-list').append(template);
    }

    // メディアサムネイル取得
    function fetchMediaThumbnail(mediaId, slideIndex) {
        wp.media.attachment(mediaId).fetch().then(function(attachment) {
            const thumbnail = attachment.get('sizes')?.thumbnail?.url || attachment.get('url');
            $(`.slide-item[data-index="${slideIndex}"] .slide-preview`).html(`<img src="${thumbnail}" alt="">`);
        });
    }

    // 設定更新
    function updateConfig() {
        const config = collectFormData();
        $('#andw_sideflow_config_textarea').val(JSON.stringify(config));
    }

})(jQuery);