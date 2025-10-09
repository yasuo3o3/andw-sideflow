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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .andw-sideflow-tab {
            position: fixed;
            top: calc(env(safe-area-inset-top, 0px) + 8px);
            right: 0;
            width: 48px;
            height: 120px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px 0 0 8px;
            border: none;
            cursor: pointer;
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 600;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }

        .andw-sideflow-tab:hover {
            transform: translateX(-4px);
            box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.2);
        }

        .andw-sideflow-tab:focus {
            outline: 2px solid #ff6b6b;
            outline-offset: 2px;
        }

        .andw-sideflow-tab.glitter::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.7), transparent);
            border-radius: inherit;
            animation: glitter 300ms ease-out;
        }

        @keyframes glitter {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .andw-sideflow-bubble {
            position: absolute;
            top: 50%;
            right: 60px;
            transform: translateY(-50%);
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 16px;
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

        .andw-sideflow-drawer {
            position: fixed;
            top: calc(env(safe-area-inset-top, 0px) + 8px);
            right: 0;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
            width: 75vw;
            max-width: 400px;
            max-height: 84vh;
            background: white;
            border-radius: 16px 0 0 16px;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .andw-sideflow-drawer.open {
            transform: translateX(0);
        }

        @media (max-height: 600px) {
            .andw-sideflow-drawer {
                max-height: 70vh;
            }
        }

        .andw-sideflow-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            flex-shrink: 0;
        }

        .andw-sideflow-close {
            width: 32px;
            height: 32px;
            border: none;
            background: #f3f4f6;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.2s ease;
        }

        .andw-sideflow-close:hover {
            background: #e5e7eb;
            color: #374151;
        }

        .andw-sideflow-close:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }

        .andw-sideflow-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .andw-sideflow-slider {
            flex: 1;
            min-height: 38vh;
            max-height: 48vh;
            position: relative;
            overflow: hidden;
            background: #f9fafb;
        }

        .andw-sideflow-slides {
            width: 100%;
            height: 100%;
            display: flex;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .andw-sideflow-slide {
            width: 100%;
            height: 100%;
            flex-shrink: 0;
            position: relative;
            cursor: pointer;
        }

        .andw-sideflow-slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .andw-sideflow-slide.contain img {
            object-fit: contain;
        }

        .andw-sideflow-slide.blur-extend {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(20px);
        }

        .andw-sideflow-slide.blur-extend img {
            object-fit: contain;
            position: relative;
            z-index: 1;
        }

        .andw-sideflow-indicators {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 2;
        }

        .andw-sideflow-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .andw-sideflow-indicator.active {
            background: white;
            transform: scale(1.2);
        }

        .andw-sideflow-controls {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 3;
        }

        .andw-sideflow-play-pause {
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .andw-sideflow-play-pause:hover {
            background: rgba(0, 0, 0, 0.8);
        }

        .andw-sideflow-play-pause:focus {
            outline: 2px solid white;
            outline-offset: 2px;
        }

        .andw-sideflow-buttons {
            padding: 12px;
            display: flex;
            gap: 16px;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;
            min-height: 48px;
        }

        .andw-sideflow-buttons.single {
            justify-content: center;
        }

        .andw-sideflow-buttons.double {
            justify-content: space-between;
        }

        .andw-sideflow-buttons.triple {
            justify-content: space-between;
        }

        .andw-sideflow-button {
            flex: 1;
            min-height: 44px;
            border: 2px solid transparent;
            border-radius: 8px;
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

        .andw-sideflow-button.default {
            background: #f3f4f6;
            color: #374151;
        }

        .andw-sideflow-button.default:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
        }

        .andw-sideflow-button.accent {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .andw-sideflow-button.accent:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .andw-sideflow-button.line {
            background: transparent;
            border-color: #e5e7eb;
            color: #374151;
        }

        .andw-sideflow-button.line:hover {
            border-color: #d1d5db;
            background: #f9fafb;
            transform: translateY(-1px);
        }

        .andw-sideflow-button.line.line-branding {
            border-color: #06c755;
            color: #06c755;
        }

        .andw-sideflow-button.line.line-branding:hover {
            background: #06c755;
            color: white;
        }

        .andw-sideflow-button:focus {
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

        .andw-sideflow-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 110;
            pointer-events: auto;
        }

        .andw-sideflow-overlay.visible {
            opacity: 1;
            visibility: visible;
        }

        @media (prefers-reduced-motion: reduce) {
            .andw-sideflow-tab,
            .andw-sideflow-drawer,
            .andw-sideflow-slides,
            .andw-sideflow-button,
            .andw-sideflow-overlay {
                transition: none;
            }

            .andw-sideflow-tab.glitter::before {
                animation: none;
            }

            .andw-sideflow-bubble {
                animation: none;
                opacity: 1;
            }
        }

        @media (max-width: 480px) {
            .andw-sideflow-drawer {
                width: 85vw;
            }

            .andw-sideflow-tab {
                width: 44px;
                height: 100px;
                font-size: 12px;
            }

            .andw-sideflow-button {
                font-size: 12px;
                padding: 6px 8px;
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
            const response = await fetch(andwSideFlowConfig.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            config = await response.json();
            return config;
        } catch (error) {
            console.error('andW SideFlow: 設定取得エラー:', error);
            throw error;
        }
    }

    // ウィジェット作成
    function createWidget() {
        // Shadow DOM作成
        widget = document.createElement('div');
        widget.setAttribute('id', 'andw-sideflow-widget');
        shadowRoot = widget.attachShadow({ mode: 'closed' });

        // スタイル注入
        const style = document.createElement('style');
        style.textContent = CSS_STYLES;
        shadowRoot.appendChild(style);

        // UI作成
        createUI();

        // イベントリスナー設定
        setupEventListeners();

        // ドキュメントに追加
        document.body.appendChild(widget);

        // 初回吹き出し表示
        showBubbleIfFirstVisit();

        // 光沢エフェクト開始
        startGlitterEffect();

        // Page Visibility API対応
        setupPageVisibility();
    }

    // UI作成
    function createUI() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="andw-sideflow-overlay" role="presentation"></div>
            <button class="andw-sideflow-tab" aria-expanded="false" aria-controls="andw-sideflow-drawer">
                求人
            </button>
            <div class="andw-sideflow-bubble" style="display: none;">
                タップして求人をチェック！
            </div>
            <div class="andw-sideflow-drawer" role="dialog" aria-labelledby="andw-sideflow-title" aria-hidden="true" id="andw-sideflow-drawer">
                <div class="andw-sideflow-header">
                    <h2 id="andw-sideflow-title" class="andw-sideflow-sr-only">求人情報</h2>
                    <button class="andw-sideflow-close" aria-label="閉じる">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z"/>
                        </svg>
                    </button>
                </div>
                <div class="andw-sideflow-content">
                    <div class="andw-sideflow-slider" aria-roledescription="carousel" aria-label="求人スライドショー">
                        ${createSliderHTML()}
                        <div class="andw-sideflow-controls">
                            <button class="andw-sideflow-play-pause" aria-label="再生/停止">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="play-icon">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M6.271 5.055a.5.5 0 0 1 .52.033L11 7.055a.5.5 0 0 1 0 .89L6.791 9.912a.5.5 0 0 1-.791-.39V5.478a.5.5 0 0 1 .271-.423z"/>
                                </svg>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="pause-icon" style="display: none;">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="andw-sideflow-sr-only" aria-live="polite" aria-atomic="true" id="andw-sideflow-slide-status"></div>
                    </div>
                    <div class="andw-sideflow-buttons ${getButtonsClass()}">
                        ${createButtonsHTML()}
                    </div>
                </div>
            </div>
        `;

        shadowRoot.appendChild(container);
    }

    // スライダーHTML作成
    function createSliderHTML() {
        if (!config.slider.items || config.slider.items.length === 0) {
            return '<div class="andw-sideflow-slides"></div>';
        }

        const slides = config.slider.items.map((item, index) => {
            const fitClass = config.slider.fit === 'contain' ? 'contain' :
                           config.slider.fit === 'blurExtend' ? 'blur-extend' : '';

            const slideContent = item.href ?
                `<a href="${escapeHtml(item.href)}" class="andw-sideflow-slide ${fitClass}" data-index="${index}" ${config.slider.fit === 'blurExtend' ? `style="background-image: url('${escapeHtml(item.src)}')"` : ''}>
                    <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="${index === 0 ? 'eager' : 'lazy'}">
                </a>` :
                `<div class="andw-sideflow-slide ${fitClass}" data-index="${index}" ${config.slider.fit === 'blurExtend' ? `style="background-image: url('${escapeHtml(item.src)}')"` : ''}>
                    <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="${index === 0 ? 'eager' : 'lazy'}">
                </div>`;

            return slideContent;
        }).join('');

        const indicators = config.slider.items.length > 1 ?
            `<div class="andw-sideflow-indicators">
                ${config.slider.items.map((_, index) =>
                    `<button class="andw-sideflow-indicator ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="スライド ${index + 1}へ移動"></button>`
                ).join('')}
            </div>` : '';

        return `
            <div class="andw-sideflow-slides" style="transform: translateX(0%)">
                ${slides}
            </div>
            ${indicators}
        `;
    }

    // ボタンHTML作成
    function createButtonsHTML() {
        const visibleButtons = config.buttons.filter(button => button.visible && button.text);

        return visibleButtons.map(button => {
            const classes = ['andw-sideflow-button', button.variant || 'default'];
            if (button.variant === 'line' && button.lineBranding) {
                classes.push('line-branding');
            }

            return `<a href="${escapeHtml(button.href)}" class="${classes.join(' ')}" data-tracking-id="${escapeHtml(button.trackingId)}" data-button-id="${escapeHtml(button.id)}">${escapeHtml(button.text)}</a>`;
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
        const tab = shadowRoot.querySelector('.andw-sideflow-tab');
        const overlay = shadowRoot.querySelector('.andw-sideflow-overlay');
        const closeBtn = shadowRoot.querySelector('.andw-sideflow-close');
        const drawer = shadowRoot.querySelector('.andw-sideflow-drawer');
        const playPauseBtn = shadowRoot.querySelector('.andw-sideflow-play-pause');
        const slides = shadowRoot.querySelector('.andw-sideflow-slides');
        const indicators = shadowRoot.querySelectorAll('.andw-sideflow-indicator');
        const buttons = shadowRoot.querySelectorAll('.andw-sideflow-button');

        // タブクリック
        tab.addEventListener('click', toggleDrawer);

        // オーバーレイクリック
        overlay.addEventListener('click', closeDrawer);

        // 閉じるボタン
        closeBtn.addEventListener('click', closeDrawer);

        // キーボードイベント
        document.addEventListener('keydown', handleKeydown);

        // 再生/停止ボタン
        playPauseBtn.addEventListener('click', toggleSlider);

        // インジケーター
        indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                goToSlide(index);
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
        const tab = shadowRoot.querySelector('.andw-sideflow-tab');
        const overlay = shadowRoot.querySelector('.andw-sideflow-overlay');
        const drawer = shadowRoot.querySelector('.andw-sideflow-drawer');

        tab.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.classList.add('visible');
        drawer.classList.add('open');

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
        const tab = shadowRoot.querySelector('.andw-sideflow-tab');
        const overlay = shadowRoot.querySelector('.andw-sideflow-overlay');
        const drawer = shadowRoot.querySelector('.andw-sideflow-drawer');

        tab.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('visible');
        drawer.classList.remove('open');

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
        const drawer = shadowRoot.querySelector('.andw-sideflow-drawer');
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
        updatePlayPauseButton();

        sliderInterval = setInterval(() => {
            if (isPageVisible && !hasUserInteracted) {
                nextSlide();
            }
        }, config.slider.interval || 3500);
    }

    function stopSlider() {
        isSliderPlaying = false;
        updatePlayPauseButton();

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

    function toggleSlider() {
        if (isSliderPlaying) {
            pauseSlider();
        } else if (!hasUserInteracted) {
            startSlider();
        }
    }

    function nextSlide() {
        if (!config.slider.items || config.slider.items.length <= 1) return;

        currentSlideIndex = (currentSlideIndex + 1) % config.slider.items.length;
        updateSlidePosition();
        updateIndicators();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function prevSlide() {
        if (!config.slider.items || config.slider.items.length <= 1) return;

        currentSlideIndex = currentSlideIndex === 0 ?
            config.slider.items.length - 1 : currentSlideIndex - 1;
        updateSlidePosition();
        updateIndicators();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function goToSlide(index) {
        if (!config.slider.items || index < 0 || index >= config.slider.items.length) return;

        currentSlideIndex = index;
        updateSlidePosition();
        updateIndicators();
        updateSlideStatus();
        trackEvent('slider_view', { index: currentSlideIndex });
    }

    function updateSlidePosition() {
        const slides = shadowRoot.querySelector('.andw-sideflow-slides');
        if (slides) {
            const translateX = -currentSlideIndex * 100;
            slides.style.transform = `translateX(${translateX}%)`;
        }
    }

    function updateIndicators() {
        const indicators = shadowRoot.querySelectorAll('.andw-sideflow-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlideIndex);
        });
    }

    function updateSlideStatus() {
        const statusElement = shadowRoot.querySelector('#andw-sideflow-slide-status');
        if (statusElement && config.slider.items && config.slider.items.length > 1) {
            statusElement.textContent = `${currentSlideIndex + 1}/${config.slider.items.length}`;
        }
    }

    function updatePlayPauseButton() {
        const playIcon = shadowRoot.querySelector('.play-icon');
        const pauseIcon = shadowRoot.querySelector('.pause-icon');

        if (playIcon && pauseIcon) {
            if (isSliderPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
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
        const tab = shadowRoot.querySelector('.andw-sideflow-tab');

        function addGlitter() {
            if (!isDrawerOpen) {
                tab.classList.add('glitter');
                setTimeout(() => {
                    tab.classList.remove('glitter');
                }, 300);
            }
        }

        setInterval(addGlitter, config.glitterInterval || 25000);
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

    // Reduced Motion確認
    function shouldRespectReducedMotion() {
        if (!config.respectReducedMotion) return true;

        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // トラッキングイベント
    function trackEvent(event, data = {}) {
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                event: 'andw_sideflow_' + event,
                ...data
            });
        }
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