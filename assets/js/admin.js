(function($) {
    'use strict';

    let mediaModal = null;
    let currentSlideIndex = null;

    $(document).ready(function() {
        initializeTabs();
        initializeColorPickers();
        initializeButtonVariantControl();
        initializeSortables();
        initializeMediaSelection();
        initializePreview();
        initializeFormHandling();
        initializeCustomValidation();
        initializeAspectRatioControl();
        initializeTabActionControl();
        initializeVisibilityControl();
        initializePreviewSizeControl();
        populateFormWithCurrentConfig();
    });

    // タブ切り替え
    function initializeTabs() {
        // URLハッシュをチェック
        let initialTab = window.location.hash;

        // URLハッシュがない場合は保存されたタブを使用
        if (!initialTab) {
            initialTab = localStorage.getItem('andw-sideflow-active-tab');
        }

        // 有効なタブかチェック
        if (initialTab && $('.nav-tab[href="' + initialTab + '"]').length > 0) {
            showTab(initialTab);
        }

        $('.nav-tab').on('click', function(e) {
            e.preventDefault();

            const target = $(this).attr('href');

            // タブ状態を保存
            localStorage.setItem('andw-sideflow-active-tab', target);

            showTab(target);
        });
    }

    // タブ表示関数
    function showTab(target) {
        $('.nav-tab').removeClass('nav-tab-active');
        $('.nav-tab[href="' + target + '"]').addClass('nav-tab-active');

        $('.tab-content').hide();
        $(target).show();
    }

    // カラーピッカー初期化
    function initializeColorPickers() {
        // 従来のカラーピッカー
        $('.color-picker').each(function() {
            const $this = $(this);
            if (!$this.hasClass('wp-color-picker') && $this.closest('.wp-picker-container').length === 0) {
                $this.wpColorPicker({
                    change: function(event, ui) {
                        // カラーピッカーの値が変更されたときに元のinput要素の値も更新
                        const color = ui.color.toString();
                        $this.val(color).trigger('change');
                        updateConfig();
                    },
                    clear: function() {
                        $this.val('').trigger('change');
                        updateConfig();
                    }
                });
            }
        });

        // ボタン用カラーピッカー（重複初期化を防ぐ）
        $('.button-color-background, .button-color-text, .button-color-gradient-start, .button-color-gradient-end, .button-color-border').each(function() {
            const $this = $(this);
            if (!$this.hasClass('wp-color-picker') && $this.closest('.wp-picker-container').length === 0) {
                $this.wpColorPicker({
                    change: function(event, ui) {
                        // カラーピッカーの値が変更されたときに元のinput要素の値も更新
                        const color = ui.color.toString();
                        $this.val(color).trigger('change');
                        updateConfig();
                    },
                    clear: function() {
                        $this.val('').trigger('change');
                        updateConfig();
                    }
                });
            }
        });
    }

    // ボタンバリアント制御
    function initializeButtonVariantControl() {
        // 初期状態の設定（遅延実行でDOM構築完了を待つ）
        setTimeout(function() {
            $('.button-variant').each(function() {
                const buttonContainer = $(this).closest('.button-item');
                updateVariantDisplay(buttonContainer, $(this).val());
            });
        }, 100);

        // バリアント変更時のイベントリスナー
        $(document).on('change', '.button-variant', function() {
            const buttonContainer = $(this).closest('.button-item');
            updateVariantDisplay(buttonContainer, $(this).val());
        });
    }

    // バリアント別表示制御
    function updateVariantDisplay(container, variant) {
        const lineStyleRow = container.find('.line-style-row');
        const solidColorsRow = container.find('.solid-colors-row');
        const gradientColorsRow = container.find('.gradient-colors-row');
        const outlineColorsRow = container.find('.outline-colors-row');

        // 全て非表示に
        [lineStyleRow, solidColorsRow, gradientColorsRow, outlineColorsRow].forEach(function(row) {
            if (row.length) row.hide();
        });

        // バリアント別の表示制御
        switch (variant) {
            case 'line':
                if (lineStyleRow.length) lineStyleRow.show();
                break;
            case 'solid':
                if (solidColorsRow.length) {
                    solidColorsRow.show();
                    // カラーピッカーを初期化（既存のものは破棄してから再初期化）
                    initializeColorPickersInContainer(container, ['.button-color-background', '.button-color-text']);
                }
                break;
            case 'gradient':
                if (gradientColorsRow.length) {
                    gradientColorsRow.show();
                    // カラーピッカーを初期化
                    initializeColorPickersInContainer(container, ['.button-color-gradient-start', '.button-color-gradient-end', '.button-color-text']);
                }
                break;
            case 'outline':
                if (outlineColorsRow.length) {
                    outlineColorsRow.show();
                    // カラーピッカーを初期化
                    initializeColorPickersInContainer(container, ['.button-color-border', '.button-color-text']);
                }
                break;
        }
    }

    // コンテナ内の特定のカラーピッカーを初期化
    function initializeColorPickersInContainer(container, selectors) {
        // 既存のカラーピッカーを完全に削除
        container.find('.wp-picker-container').each(function() {
            const $pickerContainer = $(this);
            const $originalInput = $pickerContainer.find('input').first();

            if ($originalInput.length > 0) {
                // 元の値と属性を保存
                const originalValue = $originalInput.val();
                const originalClasses = $originalInput.attr('class') || '';
                const originalId = $originalInput.attr('id') || '';
                const originalName = $originalInput.attr('name') || '';

                // wp-color-pickerクラスを除去したクラス
                const cleanClasses = originalClasses.replace(/\bwp-color-picker\b/g, '').trim();

                // 新しいinput要素を作成
                const $newInput = $('<input type="text">');
                $newInput.val(originalValue);
                $newInput.attr('class', cleanClasses);
                if (originalId) $newInput.attr('id', originalId);
                if (originalName) $newInput.attr('name', originalName);

                // 元のwp-picker-containerの直前に新しいinputを挿入
                $pickerContainer.before($newInput);

                // wp-picker-containerを完全に削除
                $pickerContainer.remove();
            }
        });

        // セレクタで指定された要素に対してカラーピッカーを初期化
        selectors.forEach(function(selector) {
            const colorInputs = container.find(selector);
            colorInputs.each(function() {
                const $this = $(this);

                // 既に初期化済みでないことを確認
                if (!$this.hasClass('wp-color-picker') &&
                    $this.closest('.wp-picker-container').length === 0) {

                    $this.wpColorPicker({
                        change: function() {
                            updateConfig();
                        }
                    });
                }
            });
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

            // デバッグ: 全てのカラーピッカーの値を詳しくログ出力
            console.log('=== COLOR PICKER DEBUG START ===');

            // ブランドカラーのデバッグ
            const $brandColorElement = $('#token-color-brand');
            const brandColorValue = getColorPickerValue('#token-color-brand');
            console.log('DEBUG - Brand color input val():', $brandColorElement.val());
            console.log('DEBUG - Brand color getColorPickerValue():', brandColorValue);
            console.log('DEBUG - Brand color in config:', config.styles?.tokens?.colorBrand);

            // タブ文字色のデバッグ
            const $tabColorElement = $('#token-tab-text-color');
            const tabTextColorValue = getColorPickerValue('#token-tab-text-color');
            console.log('DEBUG - Tab text color input val():', $tabColorElement.val());
            console.log('DEBUG - Tab text color getColorPickerValue():', tabTextColorValue);
            console.log('DEBUG - Tab text color in config:', config.styles?.tokens?.tabTextColor);

            // ボタンカラーのデバッグ
            $('#buttons-list .button-item').each(function(index) {
                const $container = $(this);
                const variant = $container.find('.button-variant').val();
                console.log(`DEBUG - Button ${index} variant:`, variant);

                if (variant === 'solid') {
                    const bgColor = getColorPickerValueInContainer($container, '.button-color-background');
                    const textColor = getColorPickerValueInContainer($container, '.button-color-text');
                    console.log(`DEBUG - Button ${index} bg color:`, bgColor);
                    console.log(`DEBUG - Button ${index} text color:`, textColor);
                }
            });

            console.log('=== COLOR PICKER DEBUG END ===');

            // 設定データ全体をログ出力
            console.log('=== FULL CONFIG DEBUG ===');
            console.log('Full config object:', config);
            console.log('Config JSON:', configJson);
            console.log('Config JSON length:', configJson.length);
            console.log('=== END FULL CONFIG DEBUG ===');

            // 設定データが空でないことを確認
            if (!config || configJson.length < 10) {
                e.preventDefault();
                alert('設定データが正しく収集できませんでした。再度お試しください。');
                console.error('Form submission blocked: config too small or empty');
                return false;
            }

            // WordPressの設定APIに合わせたフィールドに設定
            $('#andw_sideflow_config_textarea').val(configJson);

            // 現在のアクティブなタブを保存
            const activeTab = $('.nav-tab-active').attr('href');
            if (activeTab) {
                localStorage.setItem('andw-sideflow-active-tab', activeTab);
            }

            console.log('Form submission - config data:', config);
            console.log('Form submission - JSON length:', configJson.length);
            console.log('Form submission - active tab saved:', activeTab);
        });

        // 初期設定の読み込み
        loadInitialConfig();
        updateConfig();
    }

    // カラーピッカーの値を取得するヘルパー関数
    function getColorPickerValue(selector) {
        const $element = (typeof selector === 'string') ? $(selector) : selector;

        if (!$element.length) {
            console.warn('getColorPickerValue: Element not found for selector:', selector);
            return '';
        }

        const elementId = $element.attr('id') || 'unknown';
        console.log(`getColorPickerValue for ${elementId}: Starting value retrieval`);

        // 方法1: 通常のinput値を最初に試す（最も確実）
        const inputValue = $element.val();
        if (inputValue && inputValue !== '') {
            console.log(`getColorPickerValue for ${elementId}: Found input value:`, inputValue);
            return inputValue;
        }

        // 方法2: WordPressカラーピッカーコンテナ内での値取得を試行
        const $container = $element.closest('.wp-picker-container');
        if ($container.length) {
            console.log(`getColorPickerValue for ${elementId}: Found wp-picker-container`);

            // 2a. 隠されたinput要素から値を取得
            const $hiddenInput = $container.find('input.wp-color-picker');
            if ($hiddenInput.length) {
                const hiddenValue = $hiddenInput.val();
                console.log(`getColorPickerValue for ${elementId}: Hidden input value:`, hiddenValue);
                if (hiddenValue && hiddenValue !== '') return hiddenValue;
            }

            // 2b. wp-color-result-textから値を取得
            const $resultText = $container.find('.wp-color-result-text');
            if ($resultText.length && $resultText.text().trim()) {
                const colorText = $resultText.text().trim();
                console.log(`getColorPickerValue for ${elementId}: Result text:`, colorText);
                if (colorText && colorText !== '') return colorText;
            }

            // 2c. wpColorPickerメソッドを試行
            try {
                const color = $element.wpColorPicker('color');
                console.log(`getColorPickerValue for ${elementId}: wpColorPicker method:`, color);
                if (color && color !== '') return color;
            } catch (e) {
                console.warn(`getColorPickerValue for ${elementId}: wpColorPicker method failed:`, e);
            }
        }

        // 方法3: データ属性を確認
        const dataValue = $element.data('color') || $element.attr('data-color');
        if (dataValue && dataValue !== '') {
            console.log(`getColorPickerValue for ${elementId}: Data attribute value:`, dataValue);
            return dataValue;
        }

        console.warn(`getColorPickerValue for ${elementId}: No color value found, returning empty string`);
        return '';
    }

    // コンテナ内のカラーピッカーの値を取得するヘルパー関数
    function getColorPickerValueInContainer($container, selector) {
        const $element = $container.find(selector);
        return getColorPickerValue($element);
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
                    <input type="text" class="slide-href" placeholder="リンクURL（オプション）" data-validation="url">
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                    <h4 style="margin: 0; border-bottom: none;">ボタン ${index + 1}</h4>
                    <button type="button" class="button-link-delete remove-button" style="color: #d63638; text-decoration: none; font-size: 13px;">削除</button>
                </div>
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
                            <input type="text" class="button-href" placeholder="https://example.com" data-validation="url">
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
                                <option value="solid">単色</option>
                                <option value="gradient">グラデーション</option>
                                <option value="outline">枠線</option>
                                <option value="line">LINE</option>
                            </select>
                        </td>
                    </tr>
                    <!-- LINEスタイル選択（LINEバリアント時のみ表示） -->
                    <tr class="line-style-row" style="display: none;">
                        <th scope="row">LINEスタイル</th>
                        <td>
                            <select class="button-line-style">
                                <option value="solid">単色</option>
                                <option value="outline">枠線</option>
                            </select>
                        </td>
                    </tr>

                    <!-- 単色カラーピッカー -->
                    <tr class="solid-colors-row" style="display: table-row;">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>背景色:</label>
                                <input type="text" class="button-color-background" value="#f0f0f1" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="#2c3338" />
                            </p>
                        </td>
                    </tr>

                    <!-- グラデーションカラーピッカー -->
                    <tr class="gradient-colors-row" style="display: none;">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>グラデーション開始色:</label>
                                <input type="text" class="button-color-gradient-start" value="#0073aa" />
                            </p>
                            <p>
                                <label>グラデーション終了色:</label>
                                <input type="text" class="button-color-gradient-end" value="#005a87" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="#ffffff" />
                            </p>
                        </td>
                    </tr>

                    <!-- 枠線カラーピッカー -->
                    <tr class="outline-colors-row" style="display: none;">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>枠線色:</label>
                                <input type="text" class="button-color-border" value="#0073aa" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="#0073aa" />
                            </p>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 15px; text-align: left;">
                    <button type="submit" class="button button-primary" style="min-width: 120px;">このボタンを保存</button>
                </div>
            </div>
        `;

        $('#buttons-list').append(template);

        // 新しく追加されたボタンのカラーピッカーを初期化
        const $newButton = $('#buttons-list .button-item').last();
        $newButton.find('.button-color-background, .button-color-text, .button-color-gradient-start, .button-color-gradient-end, .button-color-border').each(function() {
            const $this = $(this);
            if (!$this.hasClass('wp-color-picker') && $this.closest('.wp-picker-container').length === 0) {
                $this.wpColorPicker({
                    change: function(event, ui) {
                        const color = ui.color.toString();
                        $this.val(color).trigger('change');
                        updateConfig();
                    },
                    clear: function() {
                        $this.val('').trigger('change');
                        updateConfig();
                    }
                });
            }
        });

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
                offsetPx: parseInt($('#tab-offset').val()) || 24,
                widthPx: parseInt($('#tab-width').val()) || 50,
                text: $('#tab-text').val() || '求人',
                action: $('input[name="tab-action"]:checked').val() || 'drawer',
                linkUrl: $('#tab-link-url-input').val() || '',
                heightMode: $('input[name="tab-height-mode"]:checked').val() || 'full',
                letterSpacing: parseFloat($('#tab-letter-spacing').val()) || 0
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
                    colorBrand: getColorPickerValue('#token-color-brand') || '#667eea',
                    tabTextColor: getColorPickerValue('#token-tab-text-color') || '#ffffff',
                    radius: parseInt($('#token-radius').val()) >= 0 ? parseInt($('#token-radius').val()) : 0,
                    shadow: $('#token-shadow').val() || '0 4px 12px rgba(0,0,0,0.15)',
                    spacing: parseInt($('#token-spacing').val()) || 16,
                    durationMs: parseInt($('#token-duration').val()) || 300,
                    easing: $('#token-easing').val() || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    fontFamily: $('#token-font-family').val() || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }
            },
            layout: {
                maxHeightPx: parseInt($('#layout-max-height').val()) || 640,
                buttonRowHeight: parseInt($('#layout-button-row-height').val()) || 48,
                zIndex: parseInt($('#layout-z-index').val()) || 10000
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
            glitterInterval: parseInt($('#glitter-interval').val()) || 25000,
            respectReducedMotion: $('#respect-reduced-motion').is(':checked'),
            visibility: {
                mode: $('input[name="visibility_mode"]:checked').val() || 'all',
                exclude: {
                    pages: $('select[name="visibility_exclude_pages[]"]').val() || [],
                    post_types: $('input[name="visibility_exclude_post_types[]"]:checked').map(function() {
                        return $(this).val();
                    }).get(),
                    tax_terms: {},
                    url_prefixes: $('textarea[name="visibility_exclude_url_prefixes"]').val().split('\n').filter(line => line.trim() !== ''),
                    special: $('input[name="visibility_exclude_special[]"]:checked').map(function() {
                        return $(this).val();
                    }).get()
                }
            }
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
            const variant = $(this).find('.button-variant').val() || 'solid';

            console.log('Collecting button data:', { visible, id, text, href, trackingId, variant });

            const button = {
                id: id,
                text: text,
                href: href,
                trackingId: trackingId,
                variant: variant,
                visible: visible
            };

            // カラー設定を収集
            if (variant !== 'line') {
                button.colors = {};
                const $container = $(this);
                switch (variant) {
                    case 'solid':
                        button.colors.background = getColorPickerValueInContainer($container, '.button-color-background') || '#f0f0f1';
                        button.colors.text = getColorPickerValueInContainer($container, '.button-color-text') || '#2c3338';
                        break;
                    case 'gradient':
                        button.colors.gradientStart = getColorPickerValueInContainer($container, '.button-color-gradient-start') || '#0073aa';
                        button.colors.gradientEnd = getColorPickerValueInContainer($container, '.button-color-gradient-end') || '#005a87';
                        button.colors.text = getColorPickerValueInContainer($container, '.button-color-text') || '#ffffff';
                        break;
                    case 'outline':
                        button.colors.border = getColorPickerValueInContainer($container, '.button-color-border') || '#0073aa';
                        button.colors.text = getColorPickerValueInContainer($container, '.button-color-text') || '#0073aa';
                        break;
                }
            }

            // LINEスタイル設定
            if (variant === 'line') {
                button.lineStyle = $(this).find('.button-line-style').val() || 'solid';
            }

            buttons.push(button);
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
            $('#aspect-width').val(config.slider.customAspectWidth || 16);
            $('#aspect-height').val(config.slider.customAspectHeight || 9);
            $('#slider-show-arrows').prop('checked', config.slider.showArrows !== false);

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
                $('#token-tab-text-color').val(config.styles.tokens.tabTextColor || '#ffffff');
                $('#token-radius').val(config.styles.tokens.radius !== undefined ? config.styles.tokens.radius : 0);
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
            $('#tab-width').val(config.tab.widthPx || 50);
            $('#tab-text').val(config.tab.text || '求人');
            $('input[name="tab-action"][value="' + (config.tab.action || 'drawer') + '"]').prop('checked', true);
            $('#tab-link-url-input').val(config.tab.linkUrl || '');
            $('input[name="tab-height-mode"][value="' + (config.tab.heightMode || 'full') + '"]').prop('checked', true);
            $('#tab-letter-spacing').val(config.tab.letterSpacing || 0);
        }

        if (config.drawer) {
            $('#drawer-backdrop').prop('checked', config.drawer.backdrop || false);
            $('#drawer-width-percent').val((config.drawer.widthPercent || 0.76) * 100);
            $('#drawer-max-width').val(config.drawer.maxWidthPx || 600);
        }

        // モーション設定
        if (config.motion) {
            $('#overshoot-animation').prop('checked', config.motion.overshoot !== false);
        }

        if (config.layout) {
            $('#layout-max-height').val(config.layout.maxHeightPx || 640);
            $('#layout-button-row-height').val(config.layout.buttonRowHeight || 48);
            $('#layout-z-index').val(config.layout.zIndex || 10000);
        }

        // その他設定
        $('#glitter-interval').val(config.glitterInterval || 25000);
        $('#respect-reduced-motion').prop('checked', config.respectReducedMotion !== false);

        if (config.dev) {
            $('#dev-debug').prop('checked', config.dev.debug || false);
        }

        // カラーピッカーの個別設定
        $('#token-color-brand').wpColorPicker('color', config.styles?.tokens?.colorBrand || '#667eea');
        $('#token-tab-text-color').wpColorPicker('color', config.styles?.tokens?.tabTextColor || '#ffffff');
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
                    <input type="text" class="slide-href" placeholder="リンクURL（オプション）" value="${item.href || ''}" data-validation="url">
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                    <h4 style="margin: 0; border-bottom: none;">ボタン ${index + 1}</h4>
                    <button type="button" class="button-link-delete remove-button" style="color: #d63638; text-decoration: none; font-size: 13px;">削除</button>
                </div>
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
                            <input type="text" class="button-href" value="${button.href || ''}" placeholder="https://example.com" data-validation="url">
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
                                <option value="solid" ${button.variant === 'solid' ? 'selected' : ''}>単色</option>
                                <option value="gradient" ${button.variant === 'gradient' ? 'selected' : ''}>グラデーション</option>
                                <option value="outline" ${button.variant === 'outline' ? 'selected' : ''}>枠線</option>
                                <option value="line" ${button.variant === 'line' ? 'selected' : ''}>LINE</option>
                            </select>
                        </td>
                    </tr>
                    <!-- LINEスタイル選択（LINEバリアント時のみ表示） -->
                    <tr class="line-style-row" style="display: ${button.variant === 'line' ? 'table-row' : 'none'};">
                        <th scope="row">LINEスタイル</th>
                        <td>
                            <select class="button-line-style">
                                <option value="solid" ${button.lineStyle === 'solid' ? 'selected' : ''}>単色</option>
                                <option value="outline" ${button.lineStyle === 'outline' ? 'selected' : ''}>枠線</option>
                            </select>
                        </td>
                    </tr>

                    <!-- 単色カラーピッカー -->
                    <tr class="solid-colors-row" style="display: ${button.variant === 'solid' ? 'table-row' : 'none'};">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>背景色:</label>
                                <input type="text" class="button-color-background" value="${button.colors?.background || '#f0f0f1'}" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="${button.colors?.text || '#2c3338'}" />
                            </p>
                        </td>
                    </tr>

                    <!-- グラデーションカラーピッカー -->
                    <tr class="gradient-colors-row" style="display: ${button.variant === 'gradient' ? 'table-row' : 'none'};">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>グラデーション開始色:</label>
                                <input type="text" class="button-color-gradient-start" value="${button.colors?.gradientStart || '#0073aa'}" />
                            </p>
                            <p>
                                <label>グラデーション終了色:</label>
                                <input type="text" class="button-color-gradient-end" value="${button.colors?.gradientEnd || '#005a87'}" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="${button.colors?.text || '#ffffff'}" />
                            </p>
                        </td>
                    </tr>

                    <!-- 枠線カラーピッカー -->
                    <tr class="outline-colors-row" style="display: ${button.variant === 'outline' ? 'table-row' : 'none'};">
                        <th scope="row">色設定</th>
                        <td>
                            <p>
                                <label>枠線色:</label>
                                <input type="text" class="button-color-border" value="${button.colors?.border || '#0073aa'}" />
                            </p>
                            <p>
                                <label>文字色:</label>
                                <input type="text" class="button-color-text" value="${button.colors?.text || '#0073aa'}" />
                            </p>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 15px; text-align: left;">
                    <button type="submit" class="button button-primary" style="min-width: 120px;">このボタンを保存</button>
                </div>
            </div>
        `;

        $('#buttons-list').append(template);

        // 追加したボタン要素に対してバリアント制御を適用
        const addedButtonItem = $('#buttons-list .button-item').last();

        // 新しく追加されたボタンのカラーピッカーを初期化
        addedButtonItem.find('.button-color-background, .button-color-text, .button-color-gradient-start, .button-color-gradient-end, .button-color-border').each(function() {
            const $this = $(this);
            if (!$this.hasClass('wp-color-picker') && $this.closest('.wp-picker-container').length === 0) {
                $this.wpColorPicker({
                    change: function(event, ui) {
                        const color = ui.color.toString();
                        $this.val(color).trigger('change');
                        updateConfig();
                    },
                    clear: function() {
                        $this.val('').trigger('change');
                        updateConfig();
                    }
                });
            }
        });

        const variant = addedButtonItem.find('.button-variant').val();
        updateVariantDisplay(addedButtonItem, variant);
    }

    // メディアサムネイル取得
    function fetchMediaThumbnail(mediaId, slideIndex) {
        if (!mediaId || !wp.media) {
            return;
        }

        const attachment = wp.media.attachment(mediaId);
        if (!attachment) {
            return;
        }

        attachment.fetch().then(function() {
            if (typeof attachment.get === 'function') {
                const sizes = attachment.get('sizes');
                const thumbnail = sizes?.thumbnail?.url || attachment.get('url');
                $(`.slide-item[data-index="${slideIndex}"] .slide-preview`).html(`<img src="${thumbnail}" alt="">`);
            }
        }).catch(function(error) {
            console.warn('メディア取得エラー:', error);
        });
    }

    // カスタムバリデーション初期化
    function initializeCustomValidation() {
        // URL形式のバリデーション
        $(document).on('blur', 'input[data-validation="url"]', function() {
            const input = $(this);
            const value = input.val().trim();

            // 空値は許可
            if (!value) {
                input.removeClass('field-error');
                input.next('.error-message').remove();
                return;
            }

            // 相対URL（/で始まる）は許可
            if (value.startsWith('/')) {
                input.removeClass('field-error');
                input.next('.error-message').remove();
                return;
            }

            // 絶対URLの場合は形式チェック
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            const isValidUrl = urlPattern.test(value) || value.startsWith('http://') || value.startsWith('https://');

            if (!isValidUrl) {
                input.addClass('field-error');
                if (!input.next('.error-message').length) {
                    input.after('<span class="error-message">有効なURLまたは相対パス（/から始まる）を入力してください</span>');
                }
            } else {
                input.removeClass('field-error');
                input.next('.error-message').remove();
            }
        });

        // フォーム送信時のバリデーション
        $('#andw-sideflow-form').on('submit', function(e) {
            let hasErrors = false;

            $('input[data-validation="url"]').each(function() {
                const input = $(this);
                const value = input.val().trim();

                if (value && !value.startsWith('/')) {
                    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                    const isValidUrl = urlPattern.test(value) || value.startsWith('http://') || value.startsWith('https://');

                    if (!isValidUrl) {
                        input.addClass('field-error');
                        hasErrors = true;
                    }
                }
            });

            if (hasErrors) {
                e.preventDefault();
                alert('入力エラーがあります。赤枠のフィールドを修正してください。');
                return false;
            }
        });
    }

    // 設定更新
    function updateConfig() {
        const config = collectFormData();
        $('#andw_sideflow_config_textarea').val(JSON.stringify(config));
    }

    // アスペクト比制御
    function initializeAspectRatioControl() {
        function toggleCustomAspectRatio() {
            const isCustom = $('#slider-aspect-ratio').val() === 'custom';
            $('#custom-aspect-ratio').toggle(isCustom);
        }

        // 初期表示
        toggleCustomAspectRatio();

        // 選択変更時
        $('#slider-aspect-ratio').on('change', toggleCustomAspectRatio);
    }

    // タブアクション制御
    function initializeTabActionControl() {
        function toggleTabLinkUrl() {
            const isLink = $('input[name="tab-action"]:checked').val() === 'link';
            $('#tab-link-url').toggle(isLink);
        }

        // 初期表示
        toggleTabLinkUrl();

        // 選択変更時
        $('input[name="tab-action"]').on('change', function() {
            toggleTabLinkUrl();
            updateConfig();
        });
    }

    // 表示制御
    function initializeVisibilityControl() {
        function toggleManualExcludeSettings() {
            const isManualExclude = $('input[name="visibility_mode"]:checked').val() === 'manual_exclude';
            $('#manual-exclude-settings').toggle(isManualExclude);
        }

        // 初期表示
        toggleManualExcludeSettings();

        // 選択変更時
        $('input[name="visibility_mode"]').on('change', function() {
            toggleManualExcludeSettings();
            updateConfig();
        });
    }

    // 設定データでフォームを初期化
    function populateFormWithCurrentConfig() {
        if (typeof andwSideFlowAdmin === 'undefined' || !andwSideFlowAdmin.currentConfig) {
            return;
        }

        const config = andwSideFlowAdmin.currentConfig;
        const visibility = config.visibility || {};

        // 表示モードの設定
        if (visibility.mode) {
            $(`input[name="visibility_mode"][value="${visibility.mode}"]`).prop('checked', true);
        }

        // 除外設定
        const exclude = visibility.exclude || {};

        // ページ除外
        if (exclude.pages && Array.isArray(exclude.pages)) {
            exclude.pages.forEach(function(pageId) {
                $(`select[name="visibility_exclude_pages[]"] option[value="${pageId}"]`).prop('selected', true);
            });
        }

        // 投稿タイプ除外
        if (exclude.post_types && Array.isArray(exclude.post_types)) {
            exclude.post_types.forEach(function(postType) {
                $(`input[name="visibility_exclude_post_types[]"][value="${postType}"]`).prop('checked', true);
            });
        }

        // URL前方一致除外
        if (exclude.url_prefixes && Array.isArray(exclude.url_prefixes)) {
            $('textarea[name="visibility_exclude_url_prefixes"]').val(exclude.url_prefixes.join('\n'));
        }

        // 特殊ページ除外
        if (exclude.special && Array.isArray(exclude.special)) {
            exclude.special.forEach(function(special) {
                $(`input[name="visibility_exclude_special[]"][value="${special}"]`).prop('checked', true);
            });
        }

        // 手動除外設定の表示状態を更新
        toggleManualExcludeSettings();

        function toggleManualExcludeSettings() {
            const isManualExclude = $('input[name="visibility_mode"]:checked').val() === 'manual_exclude';
            $('#manual-exclude-settings').toggle(isManualExclude);
        }
    }

    // スクロールバー幅を計算
    function getScrollbarWidth() {
        // キャッシュされた値があれば使用
        if (window.andwScrollbarWidth !== undefined) {
            return window.andwScrollbarWidth;
        }

        // スクロールバー幅測定用の一時要素を作成
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        outer.style.msOverflowStyle = 'scrollbar'; // IE/Edge対応
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

        // 要素を削除
        document.body.removeChild(outer);

        // 結果をキャッシュ
        window.andwScrollbarWidth = scrollbarWidth;
        return scrollbarWidth;
    }

    // プレビューサイズ制御
    function initializePreviewSizeControl() {
        // スクロールバー幅を取得
        const scrollbarWidth = getScrollbarWidth();

        // サイズ切り替えボタンのイベント
        $(document).on('click', '.preview-size-btn', function(e) {
            e.preventDefault();

            const $button = $(this);
            const targetWidth = parseInt($button.data('width'));

            // ボタンのアクティブ状態を切り替え
            $('.preview-size-btn').removeClass('active');
            $button.addClass('active');

            // プレビューコンテナのサイズを変更（スクロールバー幅を考慮）
            const containerWidth = targetWidth + scrollbarWidth;
            $('.preview-container')
                .attr('data-width', targetWidth)
                .css('width', containerWidth + 'px');

            // 設定を保存（ローカルストレージ）
            localStorage.setItem('andw-sideflow-preview-width', targetWidth);
        });

        // 保存されたサイズを復元
        const savedWidth = localStorage.getItem('andw-sideflow-preview-width');
        if (savedWidth && (savedWidth === '320' || savedWidth === '375' || savedWidth === '390' || savedWidth === '420')) {
            const targetWidth = parseInt(savedWidth);
            const containerWidth = targetWidth + scrollbarWidth;

            $('.preview-size-btn').removeClass('active');
            $(`.preview-size-btn[data-width="${savedWidth}"]`).addClass('active');
            $('.preview-container')
                .attr('data-width', targetWidth)
                .css('width', containerWidth + 'px');
        } else {
            // デフォルト320pxを設定
            const defaultWidth = 320;
            const containerWidth = defaultWidth + scrollbarWidth;
            $('.preview-container').css('width', containerWidth + 'px');
        }
    }

})(jQuery);