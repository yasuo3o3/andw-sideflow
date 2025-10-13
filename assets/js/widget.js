(function() {
    'use strict';

    // グローバル変数
    let config = null;
    let isDrawerOpen = false;
    let isSliderPlaying = false;
    let sliderInterval = null;
    let currentSlideIndex = 0;
    let hasUserInteracted = false;
    let isPageVisible = true;
    let shadowRoot = null;
    let widget = null;
    let focusTrap = null;

    // CSS スタイル
    const CSS_STYLES = `
        :host {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 120;
            pointer-events: none;
            font-family: var(--sf-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);

            /* 初期化完了まで非表示（フリッカー防止） */
            opacity: 0;
            transition: opacity 0.1s ease-out;

            /* CSS変数API */
            --sf-color-brand: var(--andw-sf-color-brand, #667eea);
            --sf-radius: var(--andw-sf-radius, 8px);
            --sf-shadow: var(--andw-sf-shadow, 0 4px 12px rgba(0,0,0,0.15));
            --sf-spacing: var(--andw-sf-spacing, 16px);
            --sf-font: var(--andw-sf-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        }

        :host(.sf-initialized) {
            opacity: 1;
        }

        .sf-wrap {
            position: fixed;
            right: env(safe-area-inset-right, 0px);
            display: flex;
            pointer-events: auto;
            transform: translateX(var(--sf-actualDrawerW, 400px));
            transition: transform var(--sf-duration, 300ms) var(--sf-ease, ease-out);
            z-index: var(--sf-z-index, 10000);
        }

        .sf-wrap.anchor-center {
            top: calc(50% + var(--tab-offset, 0px));
            transform: translateY(-50%) translateX(var(--sf-actualDrawerW, 400px));
        }

        .sf-wrap.anchor-center.is-opening {
            animation: slideInOvershoot var(--sf-duration, 300ms) cubic-bezier(0.68, -0.2, 0.32, 1.2) forwards;
        }

        .sf-wrap.anchor-bottom.is-opening {
            animation: slideInOvershootBottom var(--sf-duration, 300ms) cubic-bezier(0.68, -0.2, 0.32, 1.2) forwards;
        }

        .sf-wrap.anchor-center.is-opening-simple {
            animation: slideInSimple var(--sf-duration, 300ms) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .sf-wrap.anchor-bottom.is-opening-simple {
            animation: slideInSimpleBottom var(--sf-duration, 300ms) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* アニメーション中はボタン非表示 */
        .sf-wrap.is-opening .sf-close,
        .sf-wrap.is-opening-simple .sf-close {
            opacity: 0;
            pointer-events: none;
        }

        .sf-wrap.is-closing .sf-close {
            opacity: 0;
            pointer-events: none;
        }

        .sf-wrap.anchor-center.is-closing {
            animation: slideOutSmooth var(--sf-duration, 300ms) ease-out forwards;
        }

        .sf-wrap.anchor-bottom.is-closing {
            animation: slideOutSmoothBottom var(--sf-duration, 300ms) ease-out forwards;
        }

        .sf-wrap.anchor-center.is-open {
            transform: translateY(-50%) translateX(0);
        }

        .sf-wrap.anchor-bottom.is-open {
            transform: translateX(0);
        }

        .sf-wrap.anchor-bottom {
            bottom: calc(env(safe-area-inset-bottom, 0px) + var(--tab-offset, 24px));
        }

        .sf-tab {
            flex: 0 0 var(--sf-tabW);
            display: flex;
            align-items: stretch;
            background: linear-gradient(135deg, var(--sf-color-brand) 0%, color-mix(in srgb, var(--sf-color-brand) 80%, #764ba2 20%) 100%);
            border-radius: var(--sf-radius) 0 0 var(--sf-radius);
            border: none;
            cursor: pointer;
            color: white;
            font-size: 14px;
            font-weight: 600;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: var(--tab-letter-spacing, normal);
            transition: all 0.2s ease;
            box-shadow: var(--sf-shadow);
            overflow: hidden;
            font-family: var(--sf-font);
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .sf-tab:hover {
            box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.2);
            transform: translateX(-4px);
        }

        .sf-tab:focus {
            outline: 2px solid #ff6b6b;
            outline-offset: 2px;
        }

        .sf-tab.glitter::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.7), transparent);
            border-radius: inherit;
            animation: glitter 300ms ease-out;
            z-index: 1;
            pointer-events: none;
        }

        @keyframes glitter {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        @keyframes slideInOvershoot {
            0% { transform: translateY(-50%) translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
            60% { transform: translateY(-50%) translateX(var(--sf-overshoot, -15px)); }
            80% { transform: translateY(-50%) translateX(2px); }
            100% { transform: translateY(-50%) translateX(0); }
        }

        @keyframes slideInOvershootBottom {
            0% { transform: translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
            60% { transform: translateX(var(--sf-overshoot, -15px)); }
            80% { transform: translateX(2px); }
            100% { transform: translateX(0); }
        }

        @keyframes slideOutSmooth {
            0% { transform: translateY(-50%) translateX(0); }
            100% { transform: translateY(-50%) translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
        }

        @keyframes slideOutSmoothBottom {
            0% { transform: translateX(0); }
            100% { transform: translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
        }

        @keyframes slideInSimple {
            0% { transform: translateY(-50%) translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
            100% { transform: translateY(-50%) translateX(0); }
        }

        @keyframes slideInSimpleBottom {
            0% { transform: translateX(var(--sf-actualDrawerW, var(--sf-drawerW))); }
            100% { transform: translateX(0); }
        }

        .andw-sideflow-bubble {
            position: absolute;
            top: 50%;
            right: 60px;
            transform: translateY(-50%);
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: var(--sf-radius);
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            animation: bubbleAppear 0.5s ease-out forwards;
            pointer-events: none;
        }

        .andw-sideflow-bubble::after {
            content: '';
            position: absolute;
            top: 50%;
            right: -4px;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border: 4px solid transparent;
            border-left-color: #333;
        }

        @keyframes bubbleAppear {
            0% { opacity: 0; transform: translateY(-50%) translateX(10px); }
            100% { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .sf-drawer {
            flex: 0 0 var(--sf-drawerW);
            max-width: var(--sf-drawerMaxW, 600px);
            overflow: auto;
            background: white;
            border-radius: 0;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            height: auto;
            max-height: var(--max-height-px, 640px);
        }


        .sf-header {
            position: relative;
            padding: 0;
            border: none;
            flex-shrink: 0;
        }

        .sf-close {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            transition: all 0.2s ease;
            z-index: 10;
            backdrop-filter: blur(4px);
        }

        .sf-close:hover {
            background: rgba(0, 0, 0, 0.8);
            transform: scale(1.1);
        }

        .sf-close:focus {
            outline: none;
            background: rgba(0, 0, 0, 0.7);
        }

        .sf-close svg {
            width: 12px;
            height: 12px;
        }

        .sf-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sf-slider {
            position: relative;
            overflow: hidden;
            background: #f9fafb;
            width: 100%;
            aspect-ratio: var(--aspect-ratio, 16/9);
            flex-shrink: 0;
        }

        .sf-slider.auto-mode {
            width: 100%;
            aspect-ratio: var(--aspect-ratio, 16/9);
            flex-shrink: 0;
        }

        .sf-slides {
            width: 100%;
            height: 100%;
            display: flex;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sf-slide {
            width: 100%;
            height: 100%;
            flex-shrink: 0;
            position: relative;
            cursor: pointer;
        }

        .sf-slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .sf-slide.contain img {
            object-fit: contain;
        }

        .sf-slide.blur-extend {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(20px);
        }

        .sf-slide.blur-extend img {
            object-fit: contain;
            position: relative;
            z-index: 1;
        }

        .sf-nav-arrows {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            pointer-events: none;
            z-index: 2;
        }

        .sf-nav-arrow {
            width: 60px;
            height: 100%;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            margin: 0;
        }

        .sf-nav-arrow svg {
            width: 20px;
            height: 60px;
        }

        .sf-nav-arrow:focus {
        /*
            outline: 2px solid white;
            outline-offset: 2px;
            */
        }


        .sf-buttons {
            padding: 12px;
            display: flex;
            gap: 16px;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;
        }

        .sf-buttons.single {
            justify-content: center;
        }

        .sf-buttons.double {
            justify-content: space-between;
        }

        .sf-buttons.triple {
            justify-content: space-between;
        }

        .sf-button {
            flex: 1;
            border: 2px solid transparent;
            border-radius: var(--sf-radius);
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.2s ease;
            padding: 8px 12px;
            line-height: 1.3;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .sf-button.default {
            background: #f3f4f6;
            color: #374151;
        }

        .sf-button.default:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
        }

        .sf-button.accent {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .sf-button.accent:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .sf-button.line {
            background: transparent;
            border-color: #e5e7eb;
            color: #374151;
        }

        .sf-button.line:hover {
            border-color: #d1d5db;
            background: #f9fafb;
            transform: translateY(-1px);
        }

        .sf-button.line.line-branding {
            border-color: #06c755;
            color: #06c755;
        }

        .sf-button.line.line-branding:hover {
            background: #06c755;
            color: white;
        }

        .sf-button:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }

        .andw-sideflow-sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        @media (prefers-reduced-motion: reduce) {
            .sf-wrap,
            .sf-tab,
            .sf-slides,
            .sf-button {
                transition: none;
            }

            .sf-tab.glitter::before {
                animation: none;
            }

            .andw-sideflow-bubble {
                animation: none;
                opacity: 1;
            }
        }

        @media (max-width: 480px) {
            .sf-drawer {
                width: 85vw;
            }

            .sf-tab {
                width: 44px;
                font-size: 12px;
            }

            /* タブの高さ同期モードでない場合の固定高さ */
            .sf-tab:not([style*="height"]) {
                height: 100px;
            }

            .sf-button {
                font-size: 12px;
                padding: 6px 8px;
            }
        }

        /* プレースホルダースタイル */
        .sf-placeholder-slide {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .sf-placeholder-slide::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(255,255,255,0.4) 50%,
                transparent 100%);
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .sf-loading .sf-placeholder-slide {
            aspect-ratio: var(--aspect-ratio, 16/9);
        }

        /* ローディング完了後はプレースホルダーを非表示 */
        .sf-drawer:not(.sf-loading) .sf-placeholder {
            display: none;
        }

        /* 事前計算サイズ適用 */
        .sf-slider {
            width: var(--calculated-slider-width, 100%);
            height: var(--calculated-slider-height, auto);
        }

        .sf-drawer {
            height: var(--calculated-total-height, auto);
        }

        /* プレースホルダーも同じサイズを使用 */
        .sf-loading .sf-placeholder-slide {
            width: var(--calculated-slider-width, 100%);
            height: var(--calculated-slider-height, auto);
            min-height: var(--calculated-slider-height, 200px);
        }

        /* タブ高さモード制御 */
        .sf-wrap[data-tab-height="full"] .sf-tab {
            /* フルタブ：ドロワー高さに合わせる（既存の動作） */
            height: var(--calculated-total-height, auto);
        }

        .sf-wrap[data-tab-height="short"] .sf-tab {
            /* ショートタブ：文字数ベース高さ計算 */
            height: var(--char-based-height, 5rem) !important;
            padding: 1rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: var(--tab-letter-spacing, normal);
        }

        /* レスポンシブ：モバイル対応 */
        @media (max-width: 768px) {
            .sf-wrap[data-tab-height="short"] .sf-tab {
                padding: 0.75rem 0.5rem;
                min-height: 2.5rem;
                font-size: 0.9rem;
            }
        }
    `;

    // 初期化
    function init() {
        if (typeof andwSideFlowConfig === 'undefined') {
            console.warn('andW SideFlow: 設定が見つかりません');
            return;
        }

        fetchConfig()
            .then(createWidget)
            .catch(error => {
                console.error('andW SideFlow: 初期化エラー:', error);
            });
    }

    // 設定取得
    async function fetchConfig() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const debugMode = urlParams.get('andwsideflow');

            let apiUrl = andwSideFlowConfig.apiUrl;
            if (debugMode === 'preview') {
                apiUrl += '?andwsideflow=preview';
            } else if (debugMode === 'debug') {
                apiUrl += '?andwsideflow=debug';
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            config = await response.json();
            console.log('Fetched config:', config);

            // デバッグモード時は設定をログ出力
            if (debugMode === 'debug' && config.dev?.debug) {
                console.log('andW SideFlow Debug Config:', config);
                showDebugInfo();
            }

            return config;
        } catch (error) {
            console.error('andW SideFlow: 設定取得エラー:', error);

            // フェイルセーフ：設定取得失敗時は描画停止
            if (widget) {
                widget.style.display = 'none';
            }
            throw error;
        }
    }

    // ウィジェット作成
    async function createWidget() {
        // Shadow DOM作成
        widget = document.createElement('div');
        widget.setAttribute('id', 'andw-sideflow-widget');
        shadowRoot = widget.attachShadow({ mode: 'closed' });

        // CSS変数を設定
        applyCSSVariables();

        // スタイル注入
        const style = document.createElement('style');
        style.textContent = CSS_STYLES;
        shadowRoot.appendChild(style);

        // カスタムCSS読み込み
        loadCustomCSS();

        // タブのみ先に表示（同期処理）
        createTabUI();

        // ドキュメントに追加（タブを即座に表示）
        document.body.appendChild(widget);

        // ドロワー内容を非同期で作成
        setTimeout(async () => {
            try {
                await createDrawerContent();

                // イベントリスナー設定
                setupEventListeners();

                // 初回吹き出し表示
                showBubbleIfFirstVisit();

                // 光沢エフェクト開始
                startGlitterEffect();

                // Page Visibility API対応
                setupPageVisibility();

                // レスポンシブ対応
                setupResponsive();

                // 高さ同期設定
                setupHeightSync();
            } catch (error) {
                console.error('andW SideFlow: ドロワー初期化エラー:', error);
            }
        }, 0);
    }

    // タブのみ先行表示（同期処理）
    function createTabUI() {
        // 設定取得
        const tabConfig = config.tab || { anchor: 'center', offsetPx: 24, widthPx: 50, heightMode: 'full' };
        const drawerConfig = config.drawer || { backdrop: false, widthPercent: 0.76, maxWidthPx: 600 };
        const motionConfig = config.motion || { durationMs: 300, easing: 'cubic-bezier(0.2,0,0,1)' };
        const sliderConfig = config.slider || { heightMode: 'auto', aspectRatio: '16:9' };
        const layoutConfig = config.layout || { maxHeightPx: 640 };
        const uiConfig = config.ui || { startOpen: false };

        // 事前サイズ計算を実行
        const calculatedDimensions = calculateOptimalDimensions(drawerConfig, sliderConfig, layoutConfig);

        // CSS変数設定
        const container = document.createElement('div');
        container.className = 'sf-wrap';

        // 初期開閉状態の設定
        if (uiConfig.startOpen) {
            container.classList.add('is-open');
            isDrawerOpen = true;
        }

        // CSS変数を事前設定（レイアウト安定化）
        container.style.setProperty('--sf-tabW', `${tabConfig.widthPx}px`);

        // 実際のドロワー幅を計算（max-width制限を考慮）
        const viewportWidth = window.innerWidth;
        const drawerPercentWidth = drawerConfig.widthPercent * viewportWidth;
        const maxWidth = drawerConfig.maxWidthPx || 600;
        const actualDrawerWidth = Math.min(drawerPercentWidth, maxWidth);

        container.style.setProperty('--sf-drawerW', `${drawerConfig.widthPercent * 100}vw`);
        container.style.setProperty('--sf-drawerMaxW', `${maxWidth}px`);
        container.style.setProperty('--sf-actualDrawerW', `${actualDrawerWidth}px`);
        container.style.setProperty('--sf-duration', `${motionConfig.durationMs}ms`);
        container.style.setProperty('--sf-ease', motionConfig.easing);

        if (tabConfig.anchor !== 'center') {
            container.style.setProperty('--tab-offset', `${tabConfig.offsetPx}px`);
        }

        if (sliderConfig.heightMode === 'auto' && sliderConfig.aspectRatio) {
            let aspectRatio;
            if (sliderConfig.aspectRatio === 'custom') {
                const width = sliderConfig.customAspectWidth || 16;
                const height = sliderConfig.customAspectHeight || 9;
                aspectRatio = `${width}/${height}`;
            } else {
                const [width, height] = sliderConfig.aspectRatio.split(':').map(Number);
                aspectRatio = `${width}/${height}`;
            }
            container.style.setProperty('--aspect-ratio', aspectRatio);
        }

        if (layoutConfig.maxHeightPx) {
            container.style.setProperty('--max-height-px', `${layoutConfig.maxHeightPx}px`);
        }

        // z-indexを設定
        const zIndex = layoutConfig.zIndex || 10000;
        container.style.setProperty('--sf-z-index', zIndex);

        // 事前計算したサイズをCSS変数として設定（レイアウト安定化）
        if (calculatedDimensions) {
            container.style.setProperty('--calculated-slider-width', `${calculatedDimensions.sliderWidth}px`);
            container.style.setProperty('--calculated-slider-height', `${calculatedDimensions.sliderHeight}px`);
            container.style.setProperty('--calculated-total-height', `${calculatedDimensions.totalHeight}px`);
        }

        // anchor設定をコンテナに追加
        container.classList.add(`anchor-${tabConfig.anchor}`);

        // タブ高さモード属性を設定
        const tabHeightMode = tabConfig.heightMode || 'full';
        container.setAttribute('data-tab-height', tabHeightMode);

        // ショートタブモードの場合、文字数ベース高さを計算
        if (tabHeightMode === 'short') {
            calculateCharBasedHeight(container, tabConfig.text || '求人');
        }

        // レター間隔を設定
        const letterSpacing = tabConfig.letterSpacing || 0;
        container.style.setProperty('--tab-letter-spacing', `${letterSpacing}px`);

        // CSS変数を即座に適用（位置ずれ防止）
        container.style.setProperty('--sf-actualDrawerW', `${actualDrawerWidth}px`);

        // ショートタブモードの場合は計算済み高さを無効化
        if (tabHeightMode === 'short') {
            // ショートタブでは事前計算サイズを使用しない
            console.log('ショートタブモード: 事前計算サイズを無効化');
        }

        // タブのみ表示（ドロワーはプレースホルダー）
        const tabElement = tabConfig.action === 'link' && tabConfig.linkUrl ?
            `<a href="${escapeHtml(tabConfig.linkUrl)}" class="sf-tab" target="_blank" rel="noopener">
                ${escapeHtml(tabConfig.text || '求人')}
            </a>` :
            `<button class="sf-tab" aria-expanded="false" aria-controls="sf-drawer">
                ${escapeHtml(tabConfig.text || '求人')}
            </button>`;

        container.innerHTML = `
            ${tabElement}
            <div class="andw-sideflow-bubble" style="display: none;">
                タップして求人をチェック！
            </div>
            <div class="sf-drawer auto-height sf-loading" role="dialog" aria-labelledby="sf-title" aria-hidden="true" inert id="sf-drawer">
                <div class="sf-header">
                    <h2 id="sf-title" class="andw-sideflow-sr-only">求人情報</h2>
                    <div class="sf-slider auto-mode" aria-roledescription="carousel" aria-label="求人スライドショー">
                        <!-- プレースホルダー: 固定サイズ確保 -->
                        <div class="sf-slides sf-placeholder">
                            <div class="sf-slide sf-placeholder-slide"></div>
                        </div>
                        <button class="sf-close" aria-label="閉じる" tabindex="-1">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z"/>
                            </svg>
                        </button>
                        <div class="andw-sideflow-sr-only" aria-live="polite" aria-atomic="true" id="sf-slide-status"></div>
                    </div>
                </div>
                <div class="sf-content">
                    <div class="sf-buttons">
                        <!-- ボタンプレースホルダー -->
                    </div>
                </div>
            </div>
        `;

        shadowRoot.appendChild(container);

        // 初期化完了を通知（レンダリング確定後に表示）
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                widget.classList.add('sf-initialized');
            });
        });
    }

    // ドロワー内容を非同期で作成
    async function createDrawerContent() {
        const container = shadowRoot.querySelector('.sf-wrap');
        if (!container) return;

        // スライダーHTMLを非同期で生成
        const sliderHTML = await createSliderHTML();

        // ドロワー内のスライダー部分を更新
        const sliderElement = container.querySelector('.sf-slider');
        if (sliderElement) {
            // 閉じるボタンを保持
            const closeButton = sliderElement.querySelector('.sf-close');
            const statusElement = sliderElement.querySelector('#sf-slide-status');

            sliderElement.innerHTML = `
                ${sliderHTML}
                ${closeButton ? closeButton.outerHTML : ''}
                ${statusElement ? statusElement.outerHTML : ''}
            `;
        }

        // ボタン部分を更新
        const buttonsElement = container.querySelector('.sf-buttons');
        if (buttonsElement) {
            buttonsElement.className = `sf-buttons ${getButtonsClass()}`;
            buttonsElement.innerHTML = createButtonsHTML();
        }

        // ローディング状態を解除
        container.querySelector('.sf-drawer')?.classList.remove('sf-loading');

        // 実際のサイズと計算値の差異を検証・調整
        setTimeout(() => {
            adjustCalculatedSize(container);
        }, 100);
    }

    // スライダーHTML作成
    async function createSliderHTML() {
        if (!config.slider.items || config.slider.items.length === 0) {
            return '<div class="andw-sideflow-slides"></div>';
        }

        const slidePromises = config.slider.items.map(async (item, index) => {
            let imageData = null;

            // MediaIDがある場合は取得、なければ従来のsrcを使用
            if (item.mediaId && item.mediaId > 0) {
                imageData = await getMediaInfo(item.mediaId);
            }

            const src = imageData?.src || item.src || '';
            const srcset = imageData?.srcset || '';
            const sizes = imageData?.sizes || '(max-width: 480px) 85vw, 400px';
            const alt = item.alt || imageData?.alt || '';

            if (!src) return '';

            // 個別のfitかグローバルのfitを使用
            const itemFit = item.fit !== 'inherit' ? item.fit : config.slider.fit;
            const fitClass = itemFit === 'contain' ? 'contain' :
                           itemFit === 'blurExtend' ? 'blur-extend' : '';

            const imgAttributes = [
                `src="${escapeHtml(src)}"`,
                `alt="${escapeHtml(alt)}"`,
                `loading="${index === 0 ? 'eager' : 'lazy'}"`
            ];

            if (srcset) {
                imgAttributes.push(`srcset="${escapeHtml(srcset)}"`);
                imgAttributes.push(`sizes="${escapeHtml(sizes)}"`);
            }

            const backgroundStyle = itemFit === 'blurExtend' ? `style="background-image: url('${escapeHtml(src)}')"` : '';

            const slideContent = item.href ?
                `<a href="${escapeHtml(item.href)}" class="sf-slide ${fitClass}" data-index="${index}" ${backgroundStyle}>
                    <img ${imgAttributes.join(' ')}>
                </a>` :
                `<div class="sf-slide ${fitClass}" data-index="${index}" ${backgroundStyle}>
                    <img ${imgAttributes.join(' ')}>
                </div>`;

            return slideContent;
        });

        const slides = (await Promise.all(slidePromises)).filter(slide => slide).join('');

        const navigation = (config.slider.items.length > 1 && config.slider.showArrows !== false) ?
            `<div class="sf-nav-arrows">
                <button class="sf-nav-arrow sf-nav-prev" aria-label="前のスライド" type="button">
                    <svg width="20" height="60" viewBox="0 0 20 60" fill="none">
                        <path d="M14 20 L6 30 L14 40" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="sf-nav-arrow sf-nav-next" aria-label="次のスライド" type="button">
                    <svg width="20" height="60" viewBox="0 0 20 60" fill="none">
                        <path d="M6 20 L14 30 L6 40" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>` : '';

        return `
            <div class="sf-slides" style="transform: translateX(0%)">
                ${slides}
            </div>
            ${navigation}
        `;
    }

    // ボタンHTML作成
    function createButtonsHTML() {
        console.log('Creating buttons HTML, config.buttons:', config.buttons);
        const visibleButtons = config.buttons.filter(button => button.visible && button.text);
        console.log('Visible buttons:', visibleButtons);

        return visibleButtons.map(button => {
            const classes = ['sf-button', button.variant || 'solid'];

            // LINEバリアントの場合はlineStyleを追加
            if (button.variant === 'line' && button.lineStyle) {
                classes.push('line-' + button.lineStyle);
            }

            // カラー情報をstyle属性として追加
            let styleAttr = '';
            if (button.variant === 'line') {
                // LINEバリアント用の固定色設定
                const lineColor = '#06C755'; // LINEコーポレートカラー
                const styles = [];

                if (button.lineStyle === 'solid') {
                    // 単色：背景をLINEカラーで塗りつぶし、文字色を白
                    styles.push(`background-color: ${lineColor}`);
                    styles.push(`color: #ffffff`);
                    styles.push(`border: 2px solid ${lineColor}`);
                } else if (button.lineStyle === 'outline') {
                    // 枠線：背景を白、文字色と枠線をLINEカラー
                    styles.push(`background-color: #ffffff`);
                    styles.push(`color: ${lineColor}`);
                    styles.push(`border: 2px solid ${lineColor}`);
                }

                if (styles.length > 0) {
                    styleAttr = ` style="${styles.join('; ')}"`;
                }
            } else if (button.colors) {
                const styles = [];
                switch (button.variant) {
                    case 'solid':
                        if (button.colors.background) styles.push(`background-color: ${button.colors.background}`);
                        if (button.colors.text) styles.push(`color: ${button.colors.text}`);
                        break;
                    case 'gradient':
                        if (button.colors.gradientStart && button.colors.gradientEnd) {
                            styles.push(`background: linear-gradient(135deg, ${button.colors.gradientStart}, ${button.colors.gradientEnd})`);
                        }
                        if (button.colors.text) styles.push(`color: ${button.colors.text}`);
                        break;
                    case 'outline':
                        if (button.colors.border) styles.push(`border-color: ${button.colors.border}`);
                        if (button.colors.text) styles.push(`color: ${button.colors.text}`);
                        break;
                }
                if (styles.length > 0) {
                    styleAttr = ` style="${styles.join('; ')}"`;
                }
            }

            return `<a href="${escapeHtml(button.href)}" class="${classes.join(' ')}" data-tracking-id="${escapeHtml(button.trackingId)}" data-button-id="${escapeHtml(button.id)}" tabindex="-1"${styleAttr}>${escapeHtml(button.text)}</a>`;
        }).join('');
    }

    // ボタンクラス取得
    function getButtonsClass() {
        const visibleButtons = config.buttons.filter(button => button.visible && button.text);
        const count = visibleButtons.length;

        if (count === 1) return 'single';
        if (count === 2) return 'double';
        if (count === 3) return 'triple';
        return '';
    }

    // イベントリスナー設定
    function setupEventListeners() {
        const wrap = shadowRoot.querySelector('.sf-wrap');
        const tab = shadowRoot.querySelector('.sf-tab');
        const closeBtn = shadowRoot.querySelector('.sf-close');
        const drawer = shadowRoot.querySelector('.sf-drawer');
        const slides = shadowRoot.querySelector('.sf-slides');
        const navArrows = shadowRoot.querySelectorAll('.sf-nav-arrow');
        const buttons = shadowRoot.querySelectorAll('.sf-button');

        // タブクリック
        const tabConfig = config.tab || { action: 'drawer' };
        if (tabConfig.action === 'link' && tabConfig.linkUrl) {
            // リンクモードの場合はイベントリスナー不要（ネイティブリンク動作）
        } else {
            // ドロワーモードの場合
            tab.addEventListener('click', toggleDrawer);

            // タブホバー時の画像プリロード（デスクトップのみ）
            if (!('ontouchstart' in window)) {
                let preloadStarted = false;
                tab.addEventListener('mouseenter', () => {
                    if (!preloadStarted) {
                        preloadStarted = true;
                        preloadImages();
                    }
                });
            }
        }

        // 閉じるボタン
        closeBtn.addEventListener('click', closeDrawer);

        // スライダー領域のクリックイベント制御
        const sliderElement = shadowRoot.querySelector('.sf-slider');
        if (sliderElement) {
            sliderElement.addEventListener('click', function(e) {
                // 閉じるボタン、矢印ボタン以外のクリックでは何もしない
                if (!e.target.closest('.sf-close') &&
                    !e.target.closest('.sf-nav-arrow') &&
                    !e.target.closest('a')) {
                    e.stopPropagation();
                }
            });
        }

        // 画面外クリックでの閉じる機能 (Shadow DOM対応)
        document.addEventListener('click', function(e) {
            if (!isDrawerOpen) return;

            // Shadow DOM内のクリックかチェック
            let target = e.target;
            let isInsideShadow = false;

            // Shadow DOM host要素かチェック
            if (target === widget) {
                isInsideShadow = true;
            }

            // Shadow DOM内の要素かチェック
            if (target && target.getRootNode() === shadowRoot) {
                isInsideShadow = true;
            }

            // wrapの子要素かチェック
            if (wrap.contains(target)) {
                isInsideShadow = true;
            }

            if (!isInsideShadow) {
                closeDrawer();
            }
        });

        // キーボードイベント
        document.addEventListener('keydown', handleKeydown);


        // 矢印ナビゲーション
        navArrows.forEach(arrow => {
            arrow.addEventListener('click', () => {
                if (arrow.classList.contains('sf-nav-prev')) {
                    prevSlide();
                } else if (arrow.classList.contains('sf-nav-next')) {
                    nextSlide();
                }
                pauseSlider();
            });
        });

        // スライドタッチイベント
        if (slides) {
            setupSliderTouchEvents(slides);
        }

        // ボタンクリック
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const trackingId = button.dataset.trackingId;
                const buttonId = button.dataset.buttonId;
                if (trackingId) {
                    trackEvent('btn_click', { id: trackingId, buttonId });
                }
            });
        });
    }

    // スライダータッチイベント設定
    function setupSliderTouchEvents(slides) {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let longPressTimer = null;

        slides.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();

            // 長押し検出
            longPressTimer = setTimeout(() => {
                pauseSlider();
                hasUserInteracted = true;
            }, 400);
        }, { passive: true });

        slides.addEventListener('touchmove', (e) => {
            clearTimeout(longPressTimer);
        }, { passive: true });

        slides.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            const diffTime = Date.now() - startTime;

            // スワイプ判定
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && diffTime < 300) {
                if (diffX > 0) {
                    // 左スワイプ（次へ）
                    nextSlide();
                    trackEvent('slider_swipe', { dir: 'left' });
                } else {
                    // 右スワイプ（前へ）
                    prevSlide();
                    trackEvent('slider_swipe', { dir: 'right' });
                }
                pauseSlider();
                hasUserInteracted = true;
            }
        }, { passive: true });
    }

    // ドロワー開閉
    function toggleDrawer() {
        if (isDrawerOpen) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    function openDrawer() {
        isDrawerOpen = true;
        const wrap = shadowRoot.querySelector('.sf-wrap');
        const tab = shadowRoot.querySelector('.sf-tab');
        const drawer = shadowRoot.querySelector('.sf-drawer');

        tab.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');

        // inert属性を削除
        drawer.removeAttribute('inert');

        // フォーカス可能な要素を有効化
        const focusableElements = drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex="-1"]');
        focusableElements.forEach(element => {
            if (element.getAttribute('tabindex') === '-1') {
                element.removeAttribute('tabindex');
            }
        });

        // アニメーション完了後にis-openクラスを追加
        const motionConfig = config.motion || { durationMs: 300 };
        const animationDuration = motionConfig.durationMs || 300;

        // アニメーションクラスを追加（オーバーシュート設定によって分岐）
        wrap.classList.remove('is-closing', 'is-open');

        if (motionConfig.overshoot !== false) {
            wrap.classList.add('is-opening');
        } else {
            wrap.classList.add('is-opening-simple');
        }

        setTimeout(() => {
            wrap.classList.remove('is-opening', 'is-opening-simple');
            wrap.classList.add('is-open');

            // 最終位置を確実に設定
            const tabConfig = config.tab || { anchor: 'center' };
            if (tabConfig.anchor === 'center') {
                wrap.style.transform = 'translateY(-50%) translateX(0)';
            } else {
                wrap.style.transform = 'translateX(0)';
            }
        }, animationDuration);

        // フォーカストラップ設定
        setupFocusTrap();

        // スライダー開始
        if (config.slider.autoplay && !hasUserInteracted && shouldRespectReducedMotion()) {
            startSlider();
        }

        trackEvent('tab_open');
    }

    function closeDrawer() {
        isDrawerOpen = false;
        const wrap = shadowRoot.querySelector('.sf-wrap');
        const tab = shadowRoot.querySelector('.sf-tab');
        const drawer = shadowRoot.querySelector('.sf-drawer');

        // フォーカスをタブに戻す（aria-hiddenを設定する前に）
        const activeElement = shadowRoot.activeElement || document.activeElement;
        if (activeElement && drawer.contains(activeElement)) {
            tab.focus();
        }

        tab.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');

        // inert属性も設定（モダンブラウザ対応）
        drawer.setAttribute('inert', '');

        // フォーカス可能な要素を無効化
        const focusableElements = drawer.querySelectorAll('button, [href], input, select, textarea');
        focusableElements.forEach(element => {
            element.setAttribute('tabindex', '-1');
        });

        // 閉じるアニメーションクラスを追加
        wrap.classList.remove('is-opening', 'is-open');
        wrap.classList.add('is-closing');

        // アニメーション完了後にクラスとスタイルをクリア
        const motionConfig = config.motion || { durationMs: 300 };
        const animationDuration = motionConfig.durationMs || 300;

        setTimeout(() => {
            wrap.classList.remove('is-closing');
            wrap.style.transform = '';
        }, animationDuration);

        // フォーカストラップ解除
        removeFocusTrap();

        // スライダー停止
        stopSlider();

        trackEvent('tab_close');
    }

    // キーボードイベント処理
    function handleKeydown(e) {
        if (!isDrawerOpen) return;

        if (e.key === 'Escape') {
            closeDrawer();
        }
    }

    // フォーカストラップ
    function setupFocusTrap() {
        const drawer = shadowRoot.querySelector('.sf-drawer');
        const focusableElements = drawer.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        focusTrap = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', focusTrap);
        firstElement.focus();
    }

    function removeFocusTrap() {
        if (focusTrap) {
            document.removeEventListener('keydown', focusTrap);
            focusTrap = null;
        }
    }

    // スライダー制御
    function startSlider() {
        if (!config.slider.items || config.slider.items.length <= 1) return;
        if (hasUserInteracted || !isPageVisible) return;

        isSliderPlaying = true;

        sliderInterval = setInterval(() => {
            if (isPageVisible && !hasUserInteracted) {
                nextSlide();
            }
        }, config.slider.interval || 3500);
    }

    function stopSlider() {
        isSliderPlaying = false;

        if (sliderInterval) {
            clearInterval(sliderInterval);
            sliderInterval = null;
        }
    }

    function pauseSlider() {
        stopSlider();
        hasUserInteracted = true;
        trackEvent('slider_pause');
    }


    function nextSlide() {
        if (!config.slider.items || config.slider.items.length <= 1) return;

        currentSlideIndex = (currentSlideIndex + 1) % config.slider.items.length;
        updateSlidePosition();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function prevSlide() {
        if (!config.slider.items || config.slider.items.length <= 1) return;

        currentSlideIndex = currentSlideIndex === 0 ?
            config.slider.items.length - 1 : currentSlideIndex - 1;
        updateSlidePosition();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function goToSlide(index) {
        if (!config.slider.items || index < 0 || index >= config.slider.items.length) return;

        currentSlideIndex = index;
        updateSlidePosition();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function updateSlidePosition() {
        const slides = shadowRoot.querySelector('.sf-slides');
        if (slides) {
            const translateX = -currentSlideIndex * 100;
            slides.style.transform = `translateX(${translateX}%)`;
        }
    }


    function updateSlideStatus() {
        const statusElement = shadowRoot.querySelector('#sf-slide-status');
        if (statusElement && config.slider.items && config.slider.items.length > 1) {
            statusElement.textContent = `${currentSlideIndex + 1}/${config.slider.items.length}`;
        }
    }


    // 初回吹き出し表示
    function showBubbleIfFirstVisit() {
        if (!config.showBubble) return;

        const hasVisited = localStorage.getItem('andw_sideflow_visited');
        if (!hasVisited) {
            const bubble = shadowRoot.querySelector('.andw-sideflow-bubble');
            if (bubble) {
                bubble.style.display = 'block';
                setTimeout(() => {
                    bubble.style.display = 'none';
                }, 4000);
            }
            localStorage.setItem('andw_sideflow_visited', 'true');
        }
    }

    // 光沢エフェクト
    function startGlitterEffect() {
        const glitterConfig = config.glitter || { enabled: true, target: 'tab', interval: 25000 };

        // キラッ演出が無効の場合は何もしない
        if (!glitterConfig.enabled) {
            return;
        }

        // タブ限定の場合のみ実装
        if (glitterConfig.target === 'tab') {
            const tab = shadowRoot.querySelector('.sf-tab');

            function addGlitter() {
                if (!isDrawerOpen && tab) {
                    tab.classList.add('glitter');
                    setTimeout(() => {
                        tab.classList.remove('glitter');
                    }, 300);
                }
            }

            setInterval(addGlitter, glitterConfig.interval);
        }

        // 'all'や他のターゲットは実装しない（タブ限定化）
    }

    // Page Visibility API
    function setupPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;

            if (!isPageVisible) {
                stopSlider();
            } else if (isDrawerOpen && config.slider.autoplay && !hasUserInteracted && shouldRespectReducedMotion()) {
                startSlider();
            }
        });
    }

    // レスポンシブ対応
    function setupResponsive() {
        function updateLayout() {
            const wrap = shadowRoot.querySelector('.sf-wrap');
            if (!wrap) return;

            const drawerConfig = config.drawer || { widthPercent: 0.76, maxWidthPx: 600 };

            // 実際のドロワー幅を再計算（max-width制限を考慮）
            const viewportWidth = window.innerWidth;
            let drawerPercentWidth = drawerConfig.widthPercent * viewportWidth;

            // mobile時の調整
            if (viewportWidth <= 480) {
                drawerPercentWidth = 0.85 * viewportWidth;
                wrap.style.setProperty('--sf-drawerW', '85vw');
            } else {
                wrap.style.setProperty('--sf-drawerW', `${drawerConfig.widthPercent * 100}vw`);
            }

            const maxWidth = drawerConfig.maxWidthPx || 600;
            const actualDrawerWidth = Math.min(drawerPercentWidth, maxWidth);
            wrap.style.setProperty('--sf-actualDrawerW', `${actualDrawerWidth}px`);

            // 高さ同期も再計算
            updateTabHeight();
        }

        // 初回更新
        updateLayout();

        // ウィンドウリサイズ
        window.addEventListener('resize', updateLayout);

        // visualViewport対応（iOS Safari等）
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
        }
    }

    // 高さ同期機能
    function setupHeightSync() {
        const tabConfig = config.tab || { heightMode: 'full' };

        if (tabConfig.heightMode !== 'full') {
            return;
        }

        const drawer = shadowRoot.querySelector('.sf-drawer');
        const tab = shadowRoot.querySelector('.sf-tab');

        if (!drawer || !tab) return;

        // ResizeObserver でドロワー高さ変化を監視
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                updateTabHeight();
            });
            resizeObserver.observe(drawer);
        }

        // 画像読み込み完了時の高さ再計算
        const images = drawer.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete) {
                setTimeout(updateTabHeight, 0);
            } else {
                img.addEventListener('load', updateTabHeight, { once: true });
                img.addEventListener('error', updateTabHeight, { once: true });
            }
        });

        // 初回更新
        setTimeout(updateTabHeight, 0);
    }

    // タブ高さ更新
    function updateTabHeight() {
        const tabConfig = config.tab || { heightMode: 'full' };

        if (tabConfig.heightMode !== 'full') {
            return;
        }

        const drawer = shadowRoot.querySelector('.sf-drawer');
        const tab = shadowRoot.querySelector('.sf-tab');

        if (!drawer || !tab) return;

        // ドロワーの実際の高さを取得
        const drawerHeight = drawer.clientHeight;

        if (drawerHeight > 0) {
            tab.style.height = `${drawerHeight}px`;
        }
    }

    // Reduced Motion確認
    function shouldRespectReducedMotion() {
        if (!config.respectReducedMotion) return true;

        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }


    // CSS変数を適用
    function applyCSSVariables() {
        if (!config?.styles?.tokens) return;

        const tokens = config.styles.tokens;
        const host = shadowRoot.host;

        host.style.setProperty('--andw-sf-color-brand', tokens.colorBrand || '#667eea');
        host.style.setProperty('--andw-sf-radius', (tokens.radius !== undefined ? tokens.radius : 8) + 'px');
        host.style.setProperty('--andw-sf-shadow', tokens.shadow || '0 4px 12px rgba(0,0,0,0.15)');
        host.style.setProperty('--andw-sf-spacing', (tokens.spacing || 16) + 'px');
        host.style.setProperty('--andw-sf-duration', (tokens.durationMs || 300) + 'ms');
        host.style.setProperty('--andw-sf-ease', tokens.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)');
        host.style.setProperty('--andw-sf-font', tokens.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');

        // タブオフセットも設定
        const tabConfig = config.tab || {};
        if (tabConfig.anchor === 'center') {
            host.style.setProperty('--tab-offset-center', (tabConfig.offsetPx || 0) + 'px');
        } else {
            host.style.setProperty('--tab-offset-bottom', (tabConfig.offsetPx || 24) + 'px');
        }
    }

    // カスタムCSS読み込み
    function loadCustomCSS() {
        if (!config?.styles?.customCssUrl) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = config.styles.customCssUrl;
        link.onload = function() {
            console.log('andW SideFlow: カスタムCSSを読み込みました');
        };
        link.onerror = function() {
            console.warn('andW SideFlow: カスタムCSSの読み込みに失敗しました:', config.styles.customCssUrl);
        };

        shadowRoot.appendChild(link);
    }

    // デバッグ情報表示
    function showDebugInfo() {
        if (!config?.dev?.debug) return;

        const debugContainer = document.createElement('div');
        debugContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            white-space: pre-wrap;
        `;

        const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0;

        debugContainer.textContent = `andW SideFlow Debug
Config Version: ${config.configVersion || 'unknown'}
Safe Area Top: ${safeAreaTop}px
Safe Area Bottom: ${safeAreaBottom}px
Tab Anchor: ${config.tab?.anchor || 'center'}
Tab Offset: ${config.tab?.offsetPx || 24}px
Backdrop: ${config.drawer?.backdrop ? 'enabled' : 'disabled'}`;

        document.body.appendChild(debugContainer);

        // 10秒後に自動削除
        setTimeout(() => {
            if (debugContainer.parentNode) {
                debugContainer.parentNode.removeChild(debugContainer);
            }
        }, 10000);
    }

    // MediaIDから画像情報を取得
    async function getMediaInfo(mediaId) {
        if (!mediaId) return null;

        try {
            const response = await fetch(`/wp-json/wp/v2/media/${mediaId}`);
            if (!response.ok) return null;

            const media = await response.json();
            return {
                id: media.id,
                src: media.source_url,
                srcset: media.media_details?.sizes ? buildSrcSet(media.media_details.sizes) : '',
                sizes: '(max-width: 480px) 85vw, 400px',
                alt: media.alt_text || media.title?.rendered || '',
                width: media.media_details?.width || 0,
                height: media.media_details?.height || 0
            };
        } catch (error) {
            console.warn('andW SideFlow: メディア情報の取得に失敗:', error);
            return null;
        }
    }

    // srcset構築（既存のWordPress画像サイズを利用）
    function buildSrcSet(sizes) {
        const srcsetParts = [];

        // 利用可能な全サイズを取得し、幅300-1500の範囲でフィルタリング
        Object.keys(sizes).forEach(sizeName => {
            const sizeData = sizes[sizeName];
            if (sizeData && sizeData.width >= 300 && sizeData.width <= 1500) {
                srcsetParts.push({
                    url: sizeData.source_url,
                    width: sizeData.width
                });
            }
        });

        // 幅順でソート
        srcsetParts.sort((a, b) => a.width - b.width);

        // srcset文字列を構築
        return srcsetParts.map(part => `${part.url} ${part.width}w`).join(', ');
    }

    // イベント追跡（configVersionを含む）
    function trackEvent(event, data = {}) {
        const eventData = {
            event: 'andw_sideflow_' + event,
            configVersion: config?.configVersion,
            ...data
        };

        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push(eventData);
        }

        // デバッグモード時はログ出力
        if (config?.dev?.debug) {
            console.log('andW SideFlow Event:', eventData);
        }
    }

    // 画像プリロード（タブホバー時）
    async function preloadImages() {
        if (!config.slider.items || config.slider.items.length === 0) return;

        console.log('画像プリロード開始');

        // 最初の2枚の画像のみプリロード（ユーザー体験優先）
        const imagesToPreload = config.slider.items.slice(0, 2);

        const preloadPromises = imagesToPreload.map(async (item) => {
            try {
                if (item.mediaId && item.mediaId > 0) {
                    const mediaInfo = await getMediaInfo(item.mediaId);
                    if (mediaInfo?.src) {
                        const img = new Image();
                        img.src = mediaInfo.src;
                        return new Promise((resolve) => {
                            img.onload = () => resolve();
                            img.onerror = () => resolve(); // エラーでも続行
                        });
                    }
                } else if (item.src) {
                    const img = new Image();
                    img.src = item.src;
                    return new Promise((resolve) => {
                        img.onload = () => resolve();
                        img.onerror = () => resolve(); // エラーでも続行
                    });
                }
            } catch (error) {
                console.warn('画像プリロードエラー:', error);
            }
        });

        await Promise.allSettled(preloadPromises);
        console.log('画像プリロード完了');
    }

    // 実際のサイズ測定による調整
    function adjustCalculatedSize(container) {
        try {
            const drawer = container.querySelector('.sf-drawer');
            if (!drawer) return;

            // 実際の高さを測定
            const actualHeight = drawer.offsetHeight;
            const calculatedHeight = parseInt(container.style.getPropertyValue('--calculated-total-height'));

            if (calculatedHeight && Math.abs(actualHeight - calculatedHeight) > 5) {
                console.log('サイズ差異検出:', {
                    calculated: calculatedHeight,
                    actual: actualHeight,
                    diff: actualHeight - calculatedHeight
                });

                // 実測値でCSS変数を更新
                container.style.setProperty('--calculated-total-height', `${actualHeight}px`);

                // 次回のための調整値を学習
                window.andwSideFlowSizeAdjustment = actualHeight - calculatedHeight;
            }
        } catch (error) {
            console.warn('サイズ調整エラー:', error);
        }
    }

    // 最適サイズ事前計算
    function calculateOptimalDimensions(drawerConfig, sliderConfig, layoutConfig) {
        try {
            // ビューポートサイズ取得
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // ドロワー幅計算
            const drawerPercentWidth = drawerConfig.widthPercent * viewportWidth;
            const maxDrawerWidth = drawerConfig.maxWidthPx || 600;
            const actualDrawerWidth = Math.min(drawerPercentWidth, maxDrawerWidth);

            // スライダー幅（ドロワー幅と同じ）
            const sliderWidth = actualDrawerWidth;

            // アスペクト比取得
            let aspectRatio = '16:9'; // デフォルト
            if (sliderConfig.aspectRatio === 'custom') {
                const width = sliderConfig.customAspectWidth || 16;
                const height = sliderConfig.customAspectHeight || 9;
                aspectRatio = `${width}:${height}`;
            } else if (sliderConfig.aspectRatio) {
                aspectRatio = sliderConfig.aspectRatio;
            }

            // アスペクト比から高さ計算
            const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
            const aspectRatioValue = aspectWidth / aspectHeight;
            let sliderHeight = sliderWidth / aspectRatioValue;

            // 画像メタデータがある場合はより正確な計算
            if (config.slider.items && config.slider.items.length > 0) {
                const firstItem = config.slider.items[0];
                if (firstItem.mediaId && firstItem.mediaId > 0) {
                    // 注意: この時点ではmediaInfoは未取得なので、
                    // アスペクト比ベースの計算のみ行う
                    console.log('画像メタデータベースの計算は後で最適化予定');
                }
            }

            // 最大高さ制限を適用
            const maxHeight = layoutConfig.maxHeightPx || 640;
            if (sliderHeight > maxHeight) {
                sliderHeight = maxHeight;
                // 高さ制限時は幅も調整
                const adjustedWidth = sliderHeight * aspectRatioValue;
                if (adjustedWidth < sliderWidth) {
                    // 幅の調整は行わない（レイアウト安定性優先）
                }
            }

            // ボタン領域高さ（より正確な計算）
            let buttonAreaHeight = 0;
            if (config.buttons && config.buttons.length > 0) {
                const buttonRowHeight = layoutConfig.buttonRowHeight || 48;
                const buttonsPadding = 24; // .sf-buttons の padding: 12px (上下 12px ずつ)

                // 実測値との差を考慮した調整値（学習済み値または経験値）
                const learnedAdjustment = window.andwSideFlowSizeAdjustment || 0;
                const renderingAdjustment = learnedAdjustment || -10; // デフォルト調整値

                buttonAreaHeight = buttonRowHeight + buttonsPadding + renderingAdjustment;

                console.log('ボタン領域計算:', {
                    buttonRowHeight,
                    buttonsPadding,
                    renderingAdjustment,
                    buttonAreaHeight
                });
            }

            // 総高さ計算
            const totalHeight = sliderHeight + buttonAreaHeight;

            console.log('事前サイズ計算結果:', {
                sliderWidth,
                sliderHeight: Math.round(sliderHeight),
                totalHeight: Math.round(totalHeight),
                aspectRatio,
                maxHeight
            });

            return {
                sliderWidth: Math.round(sliderWidth),
                sliderHeight: Math.round(sliderHeight),
                totalHeight: Math.round(totalHeight),
                aspectRatio
            };

        } catch (error) {
            console.warn('サイズ事前計算エラー:', error);
            return null;
        }
    }

    // 文字数ベース高さ計算
    function calculateCharBasedHeight(container, tabText) {
        const charCount = tabText ? tabText.length : 0;
        const totalHeight = charCount + 3; // 文字数 + 3 = 直接rem値

        container.style.setProperty('--char-based-height', `${totalHeight}rem`);
    }

    // HTMLエスケープ
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // DOMContentLoaded時に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();