//ここに追加したいJavaScript、jQueryを記入してください。
//このJavaScriptファイルは、親テーマのJavaScriptファイルのあとに呼び出されます。
//JavaScriptやjQueryで親テーマのjavascript.jsに加えて関数を記入したい時に使用します。

/**
 * クリック&ドラッグ対応版：peek-slider
 * クリックでリンク移動、ドラッグでスライド操作
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 クリック&ドラッグ版 peek-slider 開始');
  
  const slider = document.querySelector('.peek-slider-container');
  const originalSlides = document.querySelectorAll('.peek-slide');
  const prevButton = document.querySelector('.peek-slider-button.prev');
  const nextButton = document.querySelector('.peek-slider-button.next');
  const dots = document.querySelectorAll('.peek-slider-dot');
  const sliderWrapper = document.querySelector('.peek-slider');
  
  if (!slider || originalSlides.length === 0) {
    console.error('❌ スライダー要素が見つかりません');
    return;
  }
  
  const originalSlideCount = originalSlides.length;
  let currentIndex = 0;
  let autoplayTimer = null;
  let isTransitioning = false;
  let isDragging = false;
  let hasDragged = false; // ドラッグしたかどうかの判定用
  let startX = 0;
  let currentX = 0;
  let startScrollLeft = 0;
  let clonesToAdd = Math.min(3, originalSlideCount);
  let totalSlides = 0;
  let clickTimeout = null;
  
  // 無限ループ設定
  function setupInfiniteLoop() {
    if (originalSlideCount <= 1) return;
    
    const existingClones = slider.querySelectorAll('[data-clone="true"]');
    existingClones.forEach(clone => clone.remove());
    
    for (let i = clonesToAdd - 1; i >= 0; i--) {
      const cloneIndex = originalSlideCount - clonesToAdd + i;
      const clone = originalSlides[cloneIndex].cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      slider.insertBefore(clone, slider.firstChild);
    }
    
    for (let i = 0; i < clonesToAdd; i++) {
      const clone = originalSlides[i].cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      slider.appendChild(clone);
    }
    
    totalSlides = originalSlideCount + (clonesToAdd * 2);
    currentIndex = clonesToAdd;
  }
  
  // スライド設定
  function getSlideConfig() {
    const windowWidth = window.innerWidth;
    let slideWidth = 476;
    let gap = 20;
    
    if (windowWidth <= 480) {
      slideWidth = 250;
      gap = 10;
    } else if (windowWidth <= 768) {
      slideWidth = 280;
      gap = 10;
    } else if (windowWidth <= 1024) {
      slideWidth = 350;
      gap = 12;
    } else if (windowWidth <= 1380) {
      slideWidth = 400;
      gap = 15;
    }
    
    return { slideWidth, gap };
  }
  
  // スライダー更新
  function updateSlider(animate = true) {
    if (!slider) return;
    
    const { slideWidth, gap } = getSlideConfig();
    const containerWidth = sliderWrapper.offsetWidth;
    const centerOffset = (containerWidth - slideWidth) / 2;
    const moveDistance = (currentIndex * (slideWidth + gap)) - centerOffset;
    
    if (animate && !isTransitioning) {
      slider.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      isTransitioning = true;
      setTimeout(() => { isTransitioning = false; }, 400);
    } else if (!animate) {
      slider.style.transition = 'none';
    }
    
    slider.style.transform = `translateX(-${moveDistance}px)`;
    updateDots();
  }
  
  // ドット更新
  function updateDots() {
    const realIndex = ((currentIndex - clonesToAdd) + originalSlideCount) % originalSlideCount;
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === realIndex);
    });
  }
  
  // スライド移動
  function goToNextSlide() {
    if (isTransitioning || isDragging) return;
    console.log('➡️ 次のスライドへ');
    currentIndex++;
    updateSlider();
    checkAndResetPosition();
  }
  
  function goToPrevSlide() {
    if (isTransitioning || isDragging) return;
    console.log('⬅️ 前のスライドへ');
    currentIndex--;
    updateSlider();
    checkAndResetPosition();
  }
  
  // 位置リセット
  function checkAndResetPosition() {
    if (originalSlideCount <= 1) return;
    
    setTimeout(() => {
      if (currentIndex >= totalSlides - clonesToAdd) {
        currentIndex = clonesToAdd + (currentIndex - (totalSlides - clonesToAdd));
        updateSlider(false);
      } else if (currentIndex < clonesToAdd) {
        currentIndex = totalSlides - clonesToAdd - (clonesToAdd - currentIndex);
        updateSlider(false);
      }
    }, 400);
  }
  
  // 自動再生
  function startAutoplay() {
    stopAutoplay();
    if (originalSlideCount > 1) {
      autoplayTimer = setInterval(goToNextSlide, 3000);
    }
  }
  
  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }
  
  // ドラッグ処理
  function handleDragStart(clientX) {
    if (isTransitioning) return false;
    
    isDragging = false;
    hasDragged = false;
    startX = clientX;
    currentX = clientX;
    
    const computedStyle = window.getComputedStyle(slider);
    const transform = computedStyle.transform;
    
    if (transform && transform !== 'none') {
      const matrix = transform.match(/matrix.*\((.+)\)/);
      if (matrix) {
        const values = matrix[1].split(', ');
        startScrollLeft = -parseFloat(values[4]) || 0;
      } else {
        startScrollLeft = 0;
      }
    } else {
      startScrollLeft = 0;
    }
    
    stopAutoplay();
    return true;
  }
  
  function handleDragMove(clientX) {
    currentX = clientX;
    const deltaX = Math.abs(currentX - startX);
    
    // 10px以上移動した場合のみドラッグとして認識
    if (deltaX > 10 && !isDragging) {
      isDragging = true;
      hasDragged = true;
      slider.classList.add('dragging');
      console.log('🎯 ドラッグ認識');
      
      // ドラッグ中はリンククリックを無効化
      const allLinks = slider.querySelectorAll('a');
      allLinks.forEach(link => {
        link.style.pointerEvents = 'none';
      });
    }
    
    if (isDragging) {
      const moveDistance = currentX - startX;
      const newPosition = startScrollLeft - moveDistance;
      
      slider.style.transition = 'none';
      slider.style.transform = `translateX(-${newPosition}px)`;
    }
  }
  
  function handleDragEnd() {
    const wasReallyDragging = isDragging;
    
    if (isDragging) {
      isDragging = false;
      slider.classList.remove('dragging');
      
      const deltaX = currentX - startX;
      const threshold = 60;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          console.log('⬅️ 前のスライドへ');
          goToPrevSlide();
        } else {
          console.log('➡️ 次のスライドへ');
          goToNextSlide();
        }
      } else {
        console.log('🔄 元の位置に戻す');
        updateSlider();
      }
    }
    
    // リンクを再有効化（少し遅延して）
    setTimeout(() => {
      const allLinks = slider.querySelectorAll('a');
      allLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
      });
      hasDragged = false; // ドラッグフラグをリセット
    }, 100);
    
    setTimeout(startAutoplay, 200);
  }
  
  // マウスイベント
  let isMouseDown = false;
  let mouseDownTime = 0;
  
  slider.addEventListener('mousedown', function(e) {
    // ナビゲーションボタンやドットは除外
    if (e.target.closest('.peek-slider-button') || 
        e.target.closest('.peek-slider-dot')) {
      return;
    }
    
    console.log('🖱️ マウスダウン:', e.target.tagName);
    
    isMouseDown = true;
    mouseDownTime = Date.now();
    hasDragged = false;
    
    if (handleDragStart(e.clientX)) {
      console.log('✅ ドラッグ準備完了');
    }
    
    // クリックによるリンク移動の処理
    const clickedLink = e.target.closest('.slide-link');
    if (clickedLink) {
      const linkHref = clickedLink.getAttribute('href');
      if (linkHref) {
        // 短時間後にドラッグしていなければリンクに移動
        clickTimeout = setTimeout(() => {
          if (!hasDragged && !isDragging) {
            console.log('🔗 リンククリック:', linkHref);
            window.location.href = linkHref;
          }
        }, 150); // 150ms以内にドラッグが開始されなければクリック扱い
      }
    }
  });
  
  document.addEventListener('mousemove', function(e) {
    if (isMouseDown) {
      // クリックタイマーをクリア（ドラッグが開始されたため）
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      
      handleDragMove(e.clientX);
    }
  });
  
  document.addEventListener('mouseup', function(e) {
    if (isMouseDown) {
      isMouseDown = false;
      
      // クリックタイマーをクリア
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      
      const clickDuration = Date.now() - mouseDownTime;
      
      // 短時間のクリックで、ドラッグしていない場合はリンク移動
      if (clickDuration < 200 && !hasDragged && !isDragging) {
        const clickedElement = document.elementFromPoint(e.clientX, e.clientY);
        const clickedLink = clickedElement ? clickedElement.closest('.slide-link') : null;
        
        if (clickedLink) {
          const linkHref = clickedLink.getAttribute('href');
          if (linkHref) {
            console.log('🔗 クイッククリック:', linkHref);
            window.location.href = linkHref;
            return;
          }
        }
      }
      
      handleDragEnd();
    }
  });
  
  // タッチイベント
  let touchStartTime = 0;
  
  slider.addEventListener('touchstart', function(e) {
    if (e.target.closest('.peek-slider-button') || 
        e.target.closest('.peek-slider-dot')) {
      return;
    }
    
    if (e.touches.length === 1) {
      console.log('👆 タッチ開始');
      touchStartTime = Date.now();
      hasDragged = false;
      handleDragStart(e.touches[0].clientX);
      
      // タッチによるリンク移動の処理
      const touchedLink = e.target.closest('.slide-link');
      if (touchedLink) {
        const linkHref = touchedLink.getAttribute('href');
        if (linkHref) {
          clickTimeout = setTimeout(() => {
            if (!hasDragged && !isDragging) {
              console.log('🔗 タッチリンク:', linkHref);
              window.location.href = linkHref;
            }
          }, 200);
        }
      }
    }
  }, { passive: true });
  
  slider.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1) {
      // タッチタイマーをクリア（ドラッグが開始されたため）
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      
      handleDragMove(e.touches[0].clientX);
      
      if (isDragging) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  slider.addEventListener('touchend', function(e) {
    console.log('👆 タッチ終了');
    
    // タッチタイマーをクリア
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    
    const touchDuration = Date.now() - touchStartTime;
    
    // 短時間のタッチで、ドラッグしていない場合はリンク移動
    if (touchDuration < 300 && !hasDragged && !isDragging && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const touchedLink = touchedElement ? touchedElement.closest('.slide-link') : null;
      
      if (touchedLink) {
        const linkHref = touchedLink.getAttribute('href');
        if (linkHref) {
          console.log('🔗 タッチクリック:', linkHref);
          window.location.href = linkHref;
          return;
        }
      }
    }
    
    handleDragEnd();
  }, { passive: true });
  
  // ボタンイベント
  if (prevButton) {
    prevButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 前ボタン');
      goToPrevSlide();
      stopAutoplay();
      setTimeout(startAutoplay, 100);
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 次ボタン');
      goToNextSlide();
      stopAutoplay();
      setTimeout(startAutoplay, 100);
    });
  }
  
  // ドットイベント
  dots.forEach((dot, index) => {
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 ドット', index);
      currentIndex = index + clonesToAdd;
      updateSlider();
      stopAutoplay();
      setTimeout(startAutoplay, 100);
    });
  });
  
  // リサイズ対応
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => updateSlider(false), 250);
  });
  
  // ホバー時の自動再生制御
  if (sliderWrapper) {
    sliderWrapper.addEventListener('mouseenter', stopAutoplay);
    sliderWrapper.addEventListener('mouseleave', startAutoplay);
  }
  
  // 画像ドラッグ防止
  slider.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });
  
  // 初期化
  setupInfiniteLoop();
  updateSlider(false);
  startAutoplay();
  
  console.log('✅ クリック&ドラッグ版スライダー初期化完了');
});
/**
 * 求人検索フォーム用のJavaScript
 */
jQuery(document).ready(function($) {
    console.log('求人検索スクリプトを読み込みました'); // デバッグ用
    
    // グローバル変数を定義
    var ajaxurl = job_search_params.ajax_url;
    var site_url = job_search_params.site_url;
    
    // 現在の日付を設定
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    $('#update-date').text(year + '年' + month + '月' + day + '日');
    
    // 詳細検索の表示/非表示切り替え
    $('#detail-toggle-btn').on('click', function() {
        var $detailSection = $('.detail-search-section');
        if ($detailSection.is(':visible')) {
            $detailSection.slideUp();
            $(this).text('詳細を指定');
        } else {
            $detailSection.slideDown();
            $(this).text('詳細条件を閉じる');
        }
    });
    
    // 選択フィールドをクリックしたときの処理
    $('#area-field').on('click', function() {
        console.log('エリアフィールドがクリックされました'); // デバッグ用
        openModal('area-modal-overlay');
        // 最初のステップを表示
        $('#area-selection-modal').show();
        $('#prefecture-selection-modal').hide();
        $('#city-selection-modal').hide();
    });
    
    $('#position-field').on('click', function() {
        console.log('職種フィールドがクリックされました'); // デバッグ用
        openModal('position-modal-overlay');
    });
    
    $('#job-type-field').on('click', function() {
        console.log('雇用形態フィールドがクリックされました'); // デバッグ用
        openModal('job-type-modal-overlay');
    });
    
    $('#facility-type-field').on('click', function() {
        console.log('施設形態フィールドがクリックされました'); // デバッグ用
        openModal('facility-type-modal-overlay');
    });
    
    $('#feature-field').on('click', function() {
        console.log('特徴フィールドがクリックされました'); // デバッグ用
        // チェックボックスの状態を初期化
        resetFeatureCheckboxes();
        openModal('feature-modal-overlay');
    });
    
    // モーダルを開く
    function openModal(modalId) {
        console.log('モーダルを開きます: ' + modalId); // デバッグ用
        // すべてのモーダルを非表示にする
        $('.modal-overlay').removeClass('active');
        
        // 指定されたモーダルのみ表示する
        $('#' + modalId).addClass('active');
    }
    
    // モーダルを閉じる
    $('.modal-close').on('click', function() {
        var target = $(this).data('target');
        $('#' + target).removeClass('active'); // activeクラスを削除
    });
    
    // 背景クリックでモーダルを閉じる
    $('.modal-overlay').on('click', function(e) {
        if ($(e.target).is('.modal-overlay')) {
            $(this).removeClass('active'); // activeクラスを削除
        }
    });
    
    // トップレベルのエリア選択時の処理
    $(document).on('click', '.area-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        
        // エリア情報を一時保存
        sessionStorage.setItem('selectedAreaId', termId);
        sessionStorage.setItem('selectedAreaName', termName);
        sessionStorage.setItem('selectedAreaSlug', termSlug);
        
        // 選択したエリア名を表示
        $('#selected-area-name').text(termName);
        $('#selected-area-btn-name').text(termName);
        
        // 第2階層のタームをロード
        loadSecondLevelTerms(termId);
        
        // モーダルを切り替え
        $('#area-selection-modal').hide();
        $('#prefecture-selection-modal').fadeIn(300);
    });
    
    // 「全域で検索」ボタン（第1階層）の処理
    $('#select-area-btn').on('click', function() {
        var areaName = sessionStorage.getItem('selectedAreaName');
        var areaSlug = sessionStorage.getItem('selectedAreaSlug');
        var areaId = sessionStorage.getItem('selectedAreaId');
        
        // URLを構築するために使用するTermオブジェクトを取得
        var termUrl = getTermUrl('job_location', areaId);
        
        // 表示テキストを更新
        updateSelectionDisplay('#area-field', areaName);
        
        // hidden inputに値をセット
        $('#location-input').val(areaSlug);
        $('#location-name-input').val(areaName);
        $('#location-term-id-input').val(areaId);
        
        // 第1階層のURLを保存
        sessionStorage.setItem('selectedLocationUrl', termUrl);
        
        // モーダルを閉じる
        $('#area-modal-overlay').removeClass('active');
    });
    
    // 第2階層のターム選択時の処理
    $(document).on('click', '.prefecture-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        
        // 都道府県情報を一時保存
        sessionStorage.setItem('selectedPrefectureId', termId);
        sessionStorage.setItem('selectedPrefectureName', termName);
        sessionStorage.setItem('selectedPrefectureSlug', termSlug);
        
        // URLを構築するために使用するTermオブジェクトを取得
        var termUrl = getTermUrl('job_location', termId);
        sessionStorage.setItem('selectedPrefectureUrl', termUrl);
        
        // 選択した都道府県名を表示
        $('#selected-prefecture-name').text(termName);
        $('#selected-prefecture-btn-name').text(termName);
        
        // 第3階層の市区町村タームを取得
        loadThirdLevelTerms(termId);
        
        // モーダルを切り替え
        $('#prefecture-selection-modal').hide();
        $('#city-selection-modal').fadeIn(300);
    });
    
    // 「全域で検索」ボタン（第2階層）の処理
    $('#select-prefecture-btn').on('click', function() {
        var prefectureName = sessionStorage.getItem('selectedPrefectureName');
        var prefectureSlug = sessionStorage.getItem('selectedPrefectureSlug');
        var prefectureId = sessionStorage.getItem('selectedPrefectureId');
        
        // 表示テキストを更新
        updateSelectionDisplay('#area-field', prefectureName);
        
        // hidden inputに値をセット
        $('#location-input').val(prefectureSlug);
        $('#location-name-input').val(prefectureName);
        $('#location-term-id-input').val(prefectureId);
        
        // モーダルを閉じる
        $('#area-modal-overlay').removeClass('active');
    });
    
    // 第3階層のターム選択時の処理
    $(document).on('click', '.city-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        var prefectureName = sessionStorage.getItem('selectedPrefectureName');
        
        // URLを構築するために使用するTermオブジェクトを取得
        var termUrl = getTermUrl('job_location', termId);
        
        // 表示テキストを更新
        var displayText = prefectureName + ' ' + termName;
        updateSelectionDisplay('#area-field', displayText);
        
        // hidden inputに値をセット
        $('#location-input').val(termSlug);
        $('#location-name-input').val(displayText);
        $('#location-term-id-input').val(termId);
        
        // 市区町村のURLを保存
        sessionStorage.setItem('selectedLocationUrl', termUrl);
        
        // モーダルを閉じる
        $('#area-modal-overlay').removeClass('active');
    });
    
    // 職種選択時の処理
    $(document).on('click', '.position-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        var termUrl = $(this).data('url');
        
        // 表示テキストを更新
        updateSelectionDisplay('#position-field', termName);
        
        // hidden inputに値をセット
        $('#position-input').val(termSlug);
        $('#position-name-input').val(termName);
        $('#position-term-id-input').val(termId);
        
        // URLを一時保存
        sessionStorage.setItem('selectedPositionUrl', termUrl);
        
        // モーダルを閉じる
        $('#position-modal-overlay').removeClass('active');
    });
    
    // 雇用形態選択時の処理
    $(document).on('click', '.job-type-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        var termUrl = $(this).data('url');
        
        // 表示テキストを更新
        updateSelectionDisplay('#job-type-field', termName);
        
        // hidden inputに値をセット
        $('#job-type-input').val(termSlug);
        $('#job-type-name-input').val(termName);
        $('#job-type-term-id-input').val(termId);
        
        // URLを一時保存
        sessionStorage.setItem('selectedJobTypeUrl', termUrl);
        
        // モーダルを閉じる
        $('#job-type-modal-overlay').removeClass('active');
    });
    
    // 施設形態選択時の処理
    $(document).on('click', '.facility-type-btn', function() {
        var termId = $(this).data('term-id');
        var termName = $(this).data('name');
        var termSlug = $(this).data('slug');
        var termUrl = $(this).data('url');
        
        // 表示テキストを更新
        updateSelectionDisplay('#facility-type-field', termName);
        
        // hidden inputに値をセット
        $('#facility-type-input').val(termSlug);
        $('#facility-type-name-input').val(termName);
        $('#facility-type-term-id-input').val(termId);
        
        // URLを一時保存
        sessionStorage.setItem('selectedFacilityTypeUrl', termUrl);
        
        // モーダルを閉じる
        $('#facility-type-modal-overlay').removeClass('active');
    });
    
    // 特徴の適用ボタンの処理
    $('#apply-features-btn').on('click', function() {
        var selectedFeatures = [];
        var featureSlugs = [];
        var featureIds = [];
        
        // チェックされた特徴を取得
        $('.feature-checkbox:checked').each(function() {
            var termId = $(this).data('term-id');
            var termName = $(this).data('name');
            var termSlug = $(this).data('slug');
            
            selectedFeatures.push({
                id: termId,
                name: termName,
                slug: termSlug
            });
            
            featureSlugs.push(termSlug);
            featureIds.push(termId);
        });
        
        // 選択した特徴を表示
        updateFeatureSelection(selectedFeatures);
        
        // hidden inputに値をセット
        $('#job-feature-input').val(featureSlugs.join(','));
        
        // モーダルを閉じる
        $('#feature-modal-overlay').removeClass('active');
    });
    
    // 戻るボタンの処理
    $('.back-btn').on('click', function() {
        var target = $(this).data('target');
        
        // 現在のモーダルを非表示
        $(this).closest('.modal-panel').hide();
        
        // ターゲットモーダルを表示
        $('#' + target).fadeIn(300);
    });
    
    // 検索ボタンクリック時の処理
$('#search-btn').on('click', function() {
    console.log('検索ボタンがクリックされました'); // デバッグ用
    var baseUrl = site_url + '/jobs/';
    var filters = [];
    var queryParams = [];
    var hasPathFilters = false;
    
    // キーワード検索の処理を追加
    var keyword = $('#keyword-input').val().trim();
    if (keyword) {
        queryParams.push('s=' + encodeURIComponent(keyword));
    }
    
    // エリア
    var locationSlug = $('#location-input').val();
    if (locationSlug) {
        filters.push('location/' + locationSlug);
        hasPathFilters = true;
    }
    
    // 職種
    var positionSlug = $('#position-input').val();
    if (positionSlug) {
        filters.push('position/' + positionSlug);
        hasPathFilters = true;
    }
    
    // 詳細条件が表示されている場合
    if ($('.detail-search-section').is(':visible')) {
        // 雇用形態
        var jobTypeSlug = $('#job-type-input').val();
        if (jobTypeSlug) {
            filters.push('type/' + jobTypeSlug);
            hasPathFilters = true;
        }
        
        // 施設形態
        var facilityTypeSlug = $('#facility-type-input').val();
        if (facilityTypeSlug) {
            filters.push('facility/' + facilityTypeSlug);
            hasPathFilters = true;
        }
        
        // 特徴（複数選択をクエリパラメータとして扱う）
        var featureSlugStr = $('#job-feature-input').val();
        if (featureSlugStr) {
            var featureSlugs = featureSlugStr.split(',');
            if (featureSlugs.length === 1) {
                // 単一の特徴はURLパスに組み込む
                filters.push('feature/' + featureSlugs[0]);
                hasPathFilters = true;
            } else if (featureSlugs.length > 1) {
                // 複数の特徴はクエリパラメータとして処理
                for (var i = 0; i < featureSlugs.length; i++) {
                    queryParams.push('features[]=' + featureSlugs[i]);
                }
            }
        }
    }
    
    // 選択条件がなく、キーワード検索もない場合
    if (!hasPathFilters && queryParams.length === 0) {
        alert('検索条件またはキーワードを1つ以上入力してください');
        return;
    }
    
    // キーワードのみで検索する場合
    if (!hasPathFilters && keyword) {
        // WordPressの標準検索を使用
        window.location.href = site_url + '/?s=' + encodeURIComponent(keyword) + '&post_type=job';
        return;
    }
    
    // URLの構築
    var targetUrl;
    
    if (hasPathFilters) {
        // 主要条件がある場合は通常のパスベースURL
        targetUrl = baseUrl + filters.join('/') + '/';
    } else {
        // 特徴のみの場合は専用のエンドポイント
        targetUrl = baseUrl + 'features/';
    }
    
    // クエリパラメータを追加
    if (queryParams.length > 0) {
        targetUrl += '?' + queryParams.join('&');
    }
    
    console.log('生成されたURL:', targetUrl);
    
    // 検索結果ページに遷移
    window.location.href = targetUrl;
});
    
    // 選択表示の更新
    function updateSelectionDisplay(fieldSelector, text) {
        var $field = $(fieldSelector);
        $field.find('.selection-display').text(text);
        $field.find('.selection-display').removeClass('selection-placeholder');
    }
    
    // 特徴選択の表示を更新
    function updateFeatureSelection(features) {
        var $selectedFeatures = $('#selected-features');
        var $featureField = $('#feature-field');
        
        if (features.length === 0) {
            $featureField.find('.feature-selection-display').text('特徴を選択（複数選択可）');
            $featureField.find('.feature-selection-display').addClass('feature-placeholder');
            $selectedFeatures.empty();
            return;
        }
        
        $featureField.find('.feature-selection-display').text('選択済み：' + features.length + '件');
        $featureField.find('.feature-selection-display').removeClass('feature-placeholder');
        
        $selectedFeatures.empty();
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var $tag = $('<div class="feature-tag">' + feature.name + '</div>');
            $selectedFeatures.append($tag);
        }
    }
    
    // 特徴チェックボックスのリセット
    function resetFeatureCheckboxes() {
        $('.feature-checkbox').prop('checked', false);
        
        // 現在選択されている特徴に基づいてチェックを復元
        var selectedFeatureSlugs = $('#job-feature-input').val();
        if (selectedFeatureSlugs) {
            var slugs = selectedFeatureSlugs.split(',');
            for (var i = 0; i < slugs.length; i++) {
                $('.feature-checkbox[data-slug="' + slugs[i] + '"]').prop('checked', true);
            }
        }
    }
    
    // 第2階層のタームをロードする関数
    function loadSecondLevelTerms(parentId) {
        $.ajax({
            url: ajaxurl,
            type: 'post',
            data: {
                action: 'get_taxonomy_children',
                parent_id: parentId,
                taxonomy: 'job_location',
                nonce: job_search_params.nonce
            },
            success: function(response) {
                if (response.success) {
                    displaySecondLevelTerms(response.data);
                } else {
                    $('#prefecture-grid').html('<p>階層が見つかりませんでした</p>');
                }
            },
            error: function() {
                $('#prefecture-grid').html('<p>エラーが発生しました</p>');
            }
        });
    }
    
    // 第2階層のタームを表示する関数
    function displaySecondLevelTerms(terms) {
        var $grid = $('#prefecture-grid');
        $grid.empty();
        
        if (terms.length === 0) {
            $grid.html('<p>該当するエリアがありません</p>');
            return;
        }
        
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            var $btn = $('<div class="prefecture-btn" data-term-id="' + term.term_id + '" data-name="' + term.name + '" data-slug="' + term.slug + '">' + term.name + '</div>');
            $grid.append($btn);
        }
    }
    
    // 第3階層のタームをロードする関数
    function loadThirdLevelTerms(parentId) {
        $.ajax({
            url: ajaxurl,
            type: 'post',
            data: {
                action: 'get_taxonomy_children',
                parent_id: parentId,
                taxonomy: 'job_location',
                nonce: job_search_params.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayThirdLevelTerms(response.data);
                } else {
                    $('#city-grid').html('<p>市区町村が見つかりませんでした</p>');
                }
            },
            error: function() {
                $('#city-grid').html('<p>エラーが発生しました</p>');
            }
        });
    }
    
    // 第3階層のタームを表示する関数
    function displayThirdLevelTerms(terms) {
        var $grid = $('#city-grid');
        $grid.empty();
        
        if (terms.length === 0) {
            $grid.html('<p>該当する市区町村がありません</p>');
            return;
        }
        
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            var $btn = $('<div class="city-btn" data-term-id="' + term.term_id + '" data-name="' + term.name + '" data-slug="' + term.slug + '">' + term.name + '</div>');
            $grid.append($btn);
        }
    }
    
    // タクソノミーのURLを取得する関数
    function getTermUrl(taxonomy, termId) {
        var url = '';
        
        $.ajax({
            url: ajaxurl,
            type: 'post',
            async: false, // 同期リクエスト
            data: {
                action: 'get_term_link',
                term_id: termId,
                taxonomy: taxonomy,
                nonce: job_search_params.nonce
            },
            success: function(response) {
                if (response.success) {
                    url = response.data;
                }
            }
        });
        
        return url;
    }
});



/**
 * 新着求人情報カルーセル - モバイル1枚ずつスライド修正版
 */
jQuery(document).ready(function($) {
  // 必要な要素の取得
  const jobSliderWrapper = $('.job-slider-wrapper');
  const jobContainer = $('.job-container');
  let jobCards = $('.jo-card');
  let indicators = $('.indicator');
  
  // 既存のナビゲーションボタンを非表示に
  $('.next-job-btn, .prev-job-btn').hide();
  
  // モバイル判定
  const isMobile = window.innerWidth <= 768;
  
  // モバイルの場合、非表示カードを除外
  if (isMobile) {
    jobCards = $('.jo-card:not(.mobile-hide)');
    indicators = $('.indicators-mobile .indicator');
  } else {
    indicators = $('.indicators-pc .indicator');
  }
  
  // 基本変数の初期化
  const totalCards = jobCards.length;
  let currentSlide = 0;
  
  // モバイル用の正確な幅計算
  let cardWidth, containerWidth, cardsPerView;
  
  function calculateDimensions() {
    if (isMobile) {
      // モバイルでは1枚ずつ表示
      containerWidth = jobSliderWrapper.width();
      cardWidth = containerWidth; // 1枚がコンテナ幅いっぱい
      cardsPerView = 1;
    } else {
      // PC版の処理
      cardWidth = jobCards.first().outerWidth(true);
      containerWidth = jobSliderWrapper.width();
      cardsPerView = Math.max(1, Math.floor(containerWidth / cardWidth));
    }
  }
  
  // 初期計算
  calculateDimensions();
  
  const totalSlides = Math.ceil(totalCards / cardsPerView);
  
  // ドラッグ用変数
  let isMouseDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  
  // 各カードをクリック可能に
  jobCards.each(function() {
    const $card = $(this);
    const detailLink = $card.find('.detail-btn').attr('href');
    
    if (detailLink) {
      $card.css('cursor', 'pointer');
      
      $card.on('click', function(e) {
        if ($(e.target).is('a') || $(e.target).parents('a').length > 0) {
          return;
        }
        
        if (!isDragging) {
          window.location.href = detailLink;
        }
      });
    }
  });
  
  // 指定したスライドに移動する関数（修正版）
  function goToSlide(slideIndex) {
    currentSlide = Math.max(0, Math.min(slideIndex, totalSlides - 1));
    
    if (isMobile) {
      // モバイルでは実際のカード幅+マージンを計算して移動
      const actualCardWidth = jobCards.first().outerWidth(true); // margin込みの実際の幅
      const containerWidth = jobSliderWrapper.width();
      const movePercentage = (actualCardWidth / containerWidth) * 100;
      
      const slideOffset = -currentSlide * movePercentage;
      jobContainer.css('transition', 'transform 0.3s ease-out');
      jobContainer.css('transform', `translateX(${slideOffset}%)`);
      
      // カードの幅は元のまま維持
      // 実際の幅ベースで移動量を計算
      
    } else {
      // PC版の処理
      const slideOffset = -currentSlide * (cardsPerView * cardWidth);
      const maxOffset = -((totalCards * cardWidth) - containerWidth);
      const adjustedOffset = Math.max(slideOffset, maxOffset);
      
      jobContainer.css('transition', 'transform 0.3s ease-out');
      jobContainer.css('transform', `translateX(${adjustedOffset}px)`);
    }
    
    // インジケーターの更新
    indicators.removeClass('active');
    indicators.eq(currentSlide).addClass('active');
  }
  
  // マウスダウン（ドラッグ開始）イベント
  jobContainer.on('mousedown', function(e) {
    e.preventDefault();
    
    isMouseDown = true;
    isDragging = false;
    
    startX = e.pageX;
    
    // 現在のtransform値を取得
    const transform = jobContainer.css('transform');
    const matrix = transform.match(/matrix\((.+)\)/);
    if (matrix) {
      startScrollLeft = parseFloat(matrix[1].split(', ')[4]);
    } else {
      startScrollLeft = 0;
    }
    
    jobContainer.addClass('grabbing');
    jobContainer.css('transition', 'none');
    
    stopAutoplay();
  });
  
  // マウスムーブ（ドラッグ中）イベント
  $(document).on('mousemove', function(e) {
    if (!isMouseDown) return;
    
    const x = e.pageX;
    const walk = (x - startX);
    
    if (Math.abs(walk) > 5) {
      isDragging = true;
    }
    
    if (isDragging) {
      if (isMobile) {
        // モバイルでの実際のカード幅ベースでの移動計算
        const actualCardWidth = jobCards.first().outerWidth(true);
        const containerWidth = jobSliderWrapper.width();
        const walkPixels = (walk / containerWidth) * containerWidth;
        const newScrollPixels = startScrollLeft + walkPixels;
        
        // パーセンテージに変換
        const newScrollPercent = (newScrollPixels / containerWidth) * 100;
        
        // 限界設定（実際のカード数ベース）
        const maxScrollPercent = 0;
        const cardWidthPercent = (actualCardWidth / containerWidth) * 100;
        const minScrollPercent = -((totalCards - 1) * cardWidthPercent);
        
        let adjustedScroll = newScrollPercent;
        if (newScrollPercent > maxScrollPercent) {
          adjustedScroll = maxScrollPercent + (newScrollPercent - maxScrollPercent) * 0.3;
        } else if (newScrollPercent < minScrollPercent) {
          adjustedScroll = minScrollPercent + (newScrollPercent - minScrollPercent) * 0.3;
        }
        
        jobContainer.css('transform', `translateX(${adjustedScroll}%)`);
      } else {
        // PC版の処理
        const newScrollLeft = startScrollLeft + walk;
        const maxScrollLeft = 0;
        const minScrollLeft = -((totalCards * cardWidth) - containerWidth);
        
        let adjustedScroll = newScrollLeft;
        if (newScrollLeft > maxScrollLeft) {
          adjustedScroll = maxScrollLeft + (newScrollLeft - maxScrollLeft) * 0.3;
        } else if (newScrollLeft < minScrollLeft) {
          adjustedScroll = minScrollLeft + (newScrollLeft - minScrollLeft) * 0.3;
        }
        
        jobContainer.css('transform', `translateX(${adjustedScroll}px)`);
      }
    }
  });
  
  // マウスアップ（ドラッグ終了）イベント
  $(document).on('mouseup mouseleave', function(e) {
    if (!isMouseDown) return;
    
    isMouseDown = false;
    
    jobContainer.removeClass('grabbing');
    jobContainer.css('transition', 'transform 0.3s ease-out');
    
    if (isDragging) {
      const walkDistance = e.pageX - startX;
      
      if (isMobile) {
        // モバイルでは30%以上のドラッグで次/前のスライドへ
        const threshold = containerWidth * 0.3;
        
        if (Math.abs(walkDistance) > threshold) {
          if (walkDistance > 0 && currentSlide > 0) {
            currentSlide--;
          } else if (walkDistance < 0 && currentSlide < totalSlides - 1) {
            currentSlide++;
          }
        }
      } else {
        // PC版の処理
        const threshold = cardWidth * 0.2;
        
        if (Math.abs(walkDistance) > threshold) {
          if (walkDistance > 0 && currentSlide > 0) {
            currentSlide--;
          } else if (walkDistance < 0 && currentSlide < totalSlides - 1) {
            currentSlide++;
          }
        }
      }
      
      goToSlide(currentSlide);
      
      setTimeout(function() {
        isDragging = false;
      }, 100);
    } else {
      goToSlide(currentSlide);
    }
    
    startAutoplay();
  });
  
  // タッチイベント対応（モバイル用）- 修正版
  let touchStartX = 0;
  let touchStartScrollLeft = 0;
  
  jobContainer.on('touchstart', function(e) {
    const touch = e.originalEvent.touches[0];
    touchStartX = touch.pageX;
    
    // 現在のtransform値を取得
    const transform = jobContainer.css('transform');
    const matrix = transform.match(/matrix\((.+)\)/);
    if (matrix) {
      touchStartScrollLeft = parseFloat(matrix[1].split(', ')[4]);
    } else {
      touchStartScrollLeft = 0;
    }
    
    jobContainer.addClass('grabbing');
    jobContainer.css('transition', 'none');
    
    stopAutoplay();
  });
  
  jobContainer.on('touchmove', function(e) {
    const touch = e.originalEvent.touches[0];
    const walk = touch.pageX - touchStartX;
    
    if (Math.abs(walk) > 5) {
      e.preventDefault();
      
      if (isMobile) {
        // モバイルでの実際のカード幅ベースでの移動計算
        const actualCardWidth = jobCards.first().outerWidth(true);
        const walkPixels = (walk / containerWidth) * containerWidth;
        const newScrollPixels = touchStartScrollLeft + walkPixels;
        
        // パーセンテージに変換
        const newScrollPercent = (newScrollPixels / containerWidth) * 100;
        
        // 限界設定（実際のカード数ベース）
        const maxScrollPercent = 0;
        const cardWidthPercent = (actualCardWidth / containerWidth) * 100;
        const minScrollPercent = -((totalCards - 1) * cardWidthPercent);
        
        let adjustedScroll = newScrollPercent;
        if (newScrollPercent > maxScrollPercent) {
          adjustedScroll = maxScrollPercent + (newScrollPercent - maxScrollPercent) * 0.3;
        } else if (newScrollPercent < minScrollPercent) {
          adjustedScroll = minScrollPercent + (newScrollPercent - minScrollPercent) * 0.3;
        }
        
        jobContainer.css('transform', `translateX(${adjustedScroll}%)`);
      }
    }
  });
  
  jobContainer.on('touchend touchcancel', function(e) {
    const touch = e.originalEvent.changedTouches[0];
    const walkDistance = touch.pageX - touchStartX;
    
    jobContainer.removeClass('grabbing');
    jobContainer.css('transition', 'transform 0.3s ease-out');
    
    if (isMobile) {
      // モバイルでは25%以上のドラッグで次/前のスライドへ
      const threshold = containerWidth * 0.25;
      
      if (Math.abs(walkDistance) > threshold) {
        if (walkDistance > 0 && currentSlide > 0) {
          currentSlide--;
        } else if (walkDistance < 0 && currentSlide < totalSlides - 1) {
          currentSlide++;
        }
      }
    }
    
    goToSlide(currentSlide);
    startAutoplay();
  });
  
  // インジケーターのクリックイベント
  indicators.on('click', function() {
    const slideIndex = $(this).index();
    goToSlide(slideIndex);
  });
  
  // 自動再生
  let autoplayInterval;
  
  function startAutoplay() {
    stopAutoplay();
    
    autoplayInterval = setInterval(function() {
      if (currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(0);
      }
    }, 5000);
  }
  
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }
  
  // ウィンドウリサイズ時の処理
  let resizeTimer;
  $(window).on('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      // ページをリロードしてレイアウトをリセット
      location.reload();
    }, 500);
  });
  
  // 初期化
  goToSlide(0);
  startAutoplay();
});
/**
 * 求人詳細ページのスライドショー用JavaScript
 * 複数のサムネイル画像をスライドショー表示する機能を実装
 */
jQuery(document).ready(function($) {
    // スライドショー用の変数
    const slideshowContainer = $('.slideshow');
    let currentSlide = 0;
    let slideInterval;
    let slideshowImages = [];
    let isHovering = false;
    
    // 求人詳細ページにPHPで出力された全ての画像を取得
    slideshowImages = $('.slideshow img').toArray();
    
    // 画像が複数ある場合のみスライドショー機能を設定
    if (slideshowImages.length > 1) {
        // 最初の画像以外を非表示にする
        $(slideshowImages).hide();
        $(slideshowImages[0]).show();
        
        // ナビゲーションドットを作成
        createNavigationDots();
        
        // 前後の切り替えボタンを作成
        createNavigationButtons();
        
        // 自動スライドショーを開始
        startSlideshow();
        
        // ホバー時にスライドショーを一時停止
        slideshowContainer.hover(
            function() {
                isHovering = true;
                stopSlideshow();
            },
            function() {
                isHovering = false;
                startSlideshow();
            }
        );
    }
    
    /**
     * スライドショー用のナビゲーションドットを作成
     */
    function createNavigationDots() {
        const dotsContainer = $('<div class="slideshow-dots"></div>');
        
        // 画像の数に基づいてドットを作成
        for (let i = 0; i < slideshowImages.length; i++) {
            const dot = $('<span class="slideshow-dot"></span>');
            
            // 最初のドットをアクティブに
            if (i === 0) {
                dot.addClass('active');
            }
            
            // 各ドットにクリックイベントを追加
            dot.on('click', function() {
                goToSlide(i);
            });
            
            dotsContainer.append(dot);
        }
        
        // スライドショーの中にドットコンテナを追加（重要な変更点）
        slideshowContainer.append(dotsContainer);
    }
    
    /**
     * 前へ・次へのナビゲーションボタンを作成
     */
    function createNavigationButtons() {
        // 前へボタン
        const prevButton = $('<button class="slideshow-nav prev" aria-label="前の画像へ">&lt;</button>');
        prevButton.on('click', function() {
            goToSlide(currentSlide - 1);
        });
        
        // 次へボタン
        const nextButton = $('<button class="slideshow-nav next" aria-label="次の画像へ">&gt;</button>');
        nextButton.on('click', function() {
            goToSlide(currentSlide + 1);
        });
        
        // スライドショーコンテナにボタンを追加
        slideshowContainer.append(prevButton, nextButton);
    }
    
    /**
     * 自動スライドショーを開始
     */
    function startSlideshow() {
        // まだ実行中でなく、ホバー中でもない場合のみ開始
        if (!slideInterval && !isHovering) {
            slideInterval = setInterval(function() {
                goToSlide(currentSlide + 1);
            }, 5000); // 5秒ごとに画像を切り替え
        }
    }
    
    /**
     * スライドショーを停止
     */
    function stopSlideshow() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    /**
     * 特定のスライドに移動
     */
    function goToSlide(slideIndex) {
        // 最後のスライドを超えたら最初に戻る
        if (slideIndex >= slideshowImages.length) {
            slideIndex = 0;
        }
        // 最初のスライドより前に戻ったら最後のスライドに移動
        else if (slideIndex < 0) {
            slideIndex = slideshowImages.length - 1;
        }
        
        // 現在表示されているスライドを非表示に
        $(slideshowImages[currentSlide]).fadeOut(400);
        
        // 新しいスライドを表示
        $(slideshowImages[slideIndex]).fadeIn(400);
        
        // アクティブドットを更新
        $('.slideshow-dot').removeClass('active');
        $('.slideshow-dot').eq(slideIndex).addClass('active');
        
        // 現在のスライドインデックスを更新
        currentSlide = slideIndex;
        
        // 自動スライドショーを再開
        stopSlideshow();
        startSlideshow();
    }
});

/**
 * ハンバーガーメニュー用JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガーメニューの要素を取得
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;
    
    // ハンバーガーメニューがクリックされたときの処理
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function() {
            // メニューの開閉状態を切り替え
            hamburgerMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');
            
            // メニューが開いているときは背景スクロールを無効化
            if (mobileMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });
    }
    
    // オーバーレイがクリックされたときの処理
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function() {
            // メニューを閉じる
            hamburgerMenu.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            body.style.overflow = '';
        });
    }
    
    // リサイズイベントの処理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            // PC表示に切り替わったときにメニューを閉じる
            hamburgerMenu.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            body.style.overflow = '';
        }
    });
    
    // モバイルメニュー内のリンクがクリックされたときの処理
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a, .mobile-user-nav a');
    mobileMenuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            // メニューを閉じる
            hamburgerMenu.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            body.style.overflow = '';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
  // すべてのスライドに吹き出しを追加
  const slides = document.querySelectorAll('.peek-slide');
  
  slides.forEach(slide => {
    // すでに追加されていないか確認
    if (!slide.querySelector('.slide-overlay')) {
      // オーバーレイ要素を作成
      const overlay = document.createElement('div');
      overlay.className = 'slide-overlay';
      
      // 「記事を読む」吹き出しを作成
      const readArticle = document.createElement('div');
      readArticle.className = 'read-article';
      readArticle.textContent = '詳細を見る';
      
      // DOM に追加
      overlay.appendChild(readArticle);
      
      // スライドの最初の子要素として追加（リンクより前に配置して問題を防ぐ）
      if (slide.firstChild) {
        slide.insertBefore(overlay, slide.firstChild);
      } else {
        slide.appendChild(overlay);
      }
    }
  });
});
