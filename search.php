<?php
/**
 * 求人検索結果表示テンプレート
 * 
 * このファイルは、検索フォームからの通常の検索結果を表示します。
 * 
 */
get_header();

// 検索クエリを取得
$search_query = get_search_query();

// カスタム投稿タイプのみを対象にした検索
$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
$search_args = array(
    'post_type' => 'job',
    'posts_per_page' => 10,
    'paged' => $paged,
    's' => $search_query,
);

// 検索クエリを実行
$search_query_obj = new WP_Query($search_args);
?>

<script>
// DOM読み込み後にサイドバーを強制的に非表示
document.addEventListener('DOMContentLoaded', function() {
    // サイドバーを非表示
    var sidebarElements = document.querySelectorAll('#sidebar, .sidebar, #secondary, .widget-area');
    sidebarElements.forEach(function(element) {
        element.style.display = 'none';
    });
    
    // メインコンテンツを100%幅に
    var mainElements = document.querySelectorAll('#main, .main, #primary, .content-area, .container');
    mainElements.forEach(function(element) {
        element.style.width = '100%';
        element.style.maxWidth = '100%';
        element.style.float = 'none';
    });
});
</script>

<div class="breadcrumb-container">
<?php display_breadcrumb(); ?>
</div>

<div class="job-listing-wrapper">
    <div class="job-listing-container">
        <div class="job-search-header">
            <h1 class="page-title">
                <?php if (!empty($search_query)): ?>
                    「<?php echo esc_html($search_query); ?>」の検索結果
                <?php else: ?>
                    求人検索結果
                <?php endif; ?>
            </h1>
            
            <div class="job-count">
                <p>検索結果: <span class="count-number"><?php echo esc_html($search_query_obj->found_posts); ?></span>件</p>
            </div>
            
            <!-- 現在の検索条件タグを表示 -->
            <?php if (!empty($search_query)): ?>
            <div class="current-filters">
                <h4>現在の検索条件：</h4>
                <div class="filter-tags">
                    <div class="filter-tag">
                        <span class="filter-label">キーワード:</span> 
                        <?php echo esc_html($search_query); ?>
                        <a href="<?php echo esc_url(home_url('/jobs/')); ?>" class="remove-filter">&times;</a>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- 検索フォームを表示 -->
            <?php get_template_part('search-form'); ?>
        </div>
        
        <div class="job-list">
            <?php if ($search_query_obj->have_posts()): ?>
                <?php while ($search_query_obj->have_posts()): $search_query_obj->the_post(); 
                    // カスタムフィールドデータの取得
                    $facility_name = get_post_meta(get_the_ID(), 'facility_name', true);
                    $facility_company = get_post_meta(get_the_ID(), 'facility_company', true);
                    $job_content_title = get_post_meta(get_the_ID(), 'job_content_title', true);
                    $salary_range = get_post_meta(get_the_ID(), 'salary_range', true);
                    $facility_address = get_post_meta(get_the_ID(), 'facility_address', true);
                    
                    // タクソノミーの取得
                    $facility_types = get_the_terms(get_the_ID(), 'facility_type');
                    $job_features = get_the_terms(get_the_ID(), 'job_feature');
                    $job_types = get_the_terms(get_the_ID(), 'job_type');
                    $job_positions = get_the_terms(get_the_ID(), 'job_position');
                    
                    // 施設形態のチェック
                    $has_jidou = false;    // 児童発達支援フラグ
                    $has_houkago = false;  // 放課後等デイサービスフラグ

                    if ($facility_types && !is_wp_error($facility_types)) {
                        foreach ($facility_types as $type) {
                            // 組み合わせタイプのチェック
                            if ($type->slug === 'jidou-houkago') {
                                // 児童発達支援・放課後等デイの場合は両方表示
                                $has_jidou = true;
                                $has_houkago = true;
                            } 
                            // 児童発達支援のみのチェック
                            else if ($type->slug === 'jidou') {
                                $has_jidou = true;
                            } 
                            // 放課後等デイサービスのみのチェック
                            else if ($type->slug === 'houkago') {
                                $has_houkago = true;
                            }
                            
                            // 従来の拡張スラッグもサポート（必要に応じて）
                            else if (in_array($type->slug, ['jidou-hattatsu', 'jidou-hattatsu-shien', 'child-development-support'])) {
                                $has_jidou = true;
                            }
                            else if (in_array($type->slug, ['houkago-day', 'houkago-dayservice', 'after-school-day-service'])) {
                                $has_houkago = true;
                            }
                        }
                    }
                    
                    // 雇用形態に基づくカラークラスを設定
                    $employment_color_class = 'other'; // デフォルトはその他
                    if ($job_types && !is_wp_error($job_types)) {
                        // スラッグによる判定
                        $job_type_slug = $job_types[0]->slug;
                        $job_type_name = $job_types[0]->name;
                        
                        // スラッグベースでの判定
                        switch($job_type_slug) {
                            case 'full-time':
                            case 'seishain': // 正社員
                                $employment_color_class = 'full-time';
                                break;
                            case 'part-time':
                            case 'part':
                            case 'arubaito': // パート・アルバイト
                                $employment_color_class = 'part-time';
                                break;
                            default:
                                // スラッグで判定できない場合は名前で判定
                                if ($job_type_name === '正社員') {
                                    $employment_color_class = 'full-time';
                                } else if ($job_type_name === 'パート・アルバイト' || 
                                        strpos($job_type_name, 'パート') !== false || 
                                        strpos($job_type_name, 'アルバイト') !== false) {
                                    $employment_color_class = 'part-time';
                                } else {
                                    $employment_color_class = 'other';
                                }
                                break;
                        }
                    }
                ?>
                
                <div class="job-card">
                    <!-- 上部コンテンツ：左右に分割 -->
                    <div class="job-content">
                        <!-- 左側：サムネイル画像、施設形態アイコン、特徴タグ -->
                        <div class="left-content">
                            <!-- サムネイル画像 -->
                            <div class="job-image">
                                <?php if (has_post_thumbnail()): ?>
                                    <?php the_post_thumbnail('medium'); ?>
                                <?php else: ?>
                                    <img src="https://via.placeholder.com/300x200" alt="<?php echo esc_attr($facility_name); ?>">
                                <?php endif; ?>
                            </div>
                            
                            <!-- 施設形態を画像アイコン -->
                            <div class="facility-icons">
                                <?php if ($has_houkago): ?>
                                <!-- 放デイアイコン -->
                                <div class="facility-icon">
                                    <img src="<?php echo get_stylesheet_directory_uri(); ?>/img/day.webp" alt="放デイ">
                                </div>
                                <?php endif; ?>
                                
                                <?php if ($has_jidou): ?>
                                <!-- 児発支援アイコン -->
                                <div class="facility-icon red-icon">
                                    <img src="<?php echo get_stylesheet_directory_uri(); ?>/img/support.webp" alt="児発支援">
                                </div>
                                <?php endif; ?>
                            </div>
                            
                            <!-- 特徴タクソノミータグ - 10つまで表示 -->
                            <?php if ($job_features && !is_wp_error($job_features)): ?>
                            <div class="tags-container">
                                <?php 
                                $features_count = 0;
                                foreach ($job_features as $feature):
                                    if ($features_count < 10):
                                        // プレミアム特徴の判定（例：高収入求人など）
                                        $premium_class = (in_array($feature->slug, ['high-salary', 'bonus-available'])) ? 'premium' : '';
                                ?>
                                    <span class="tag <?php echo $premium_class; ?>"><?php echo esc_html($feature->name); ?></span>
                                <?php
                                        $features_count++;
                                    endif;
                                endforeach; 
                                ?>
                            </div>
                            <?php endif; ?>
                        </div>
                        
                        <!-- 右側：運営会社名、施設名、本文詳細 -->
                        <div class="right-content">
                            <!-- 会社名と雇用形態を横に並べる -->
                            <div class="company-section">
                                <span class="company-name"><?php echo esc_html($facility_company); ?></span>
                                <?php if ($job_types && !is_wp_error($job_types)): ?>
                                <div class="employment-type <?php echo $employment_color_class; ?>">
                                    <?php echo esc_html($job_types[0]->name); ?>
                                </div>
                                <?php endif; ?>
                            </div>
                            
                            <!-- 施設名を会社名の下に配置 -->
                            <h1 class="job-title"><?php echo esc_html($facility_name); ?></h1>
                            
                            <h2 class="job-subtitle"><?php echo esc_html($job_content_title); ?></h2>
                            
                            <p class="job-description">
                                <?php echo wp_trim_words(get_the_content(), 100, '...'); ?>
                            </p>
                            
                            <!-- 本文の下に区切り線を追加 -->
                            <div class="divider"></div>
                            
                            <!-- 職種、給料、住所情報 -->
                            <div class="job-info">
                                <?php 
$position_display_text = get_job_position_display_text(get_the_ID());
if (!empty($position_display_text)): 
?>
<div class="info-item">
    <span class="info-icon"><i class="fa-solid fa-user"></i></span>
    <span><?php echo esc_html($position_display_text); ?></span>
</div>
<?php endif; ?>
                                
                                <div class="info-item">
                                    <span class="info-icon"><i class="fa-solid fa-money-bill-wave"></i></span>
                                    <span>
                                        <?php 
                                            $salary_range = get_post_meta(get_the_ID(), 'salary_range', true);
                                            $salary_type = get_post_meta(get_the_ID(), 'salary_type', true);
                                            
                                            // 賃金形態の表示（月給/時給）
                                            if ($salary_type === 'MONTH') {
                                                echo '月給 ';
                                            } elseif ($salary_type === 'HOUR') {
                                                echo '時給 ';
                                            }
                                            
                                            echo esc_html($salary_range);
                                            
                                            // 円表示がなければ追加
                                            if (mb_strpos($salary_range, '円') === false) {
                                                echo '円';
                                            }
                                        ?>
                                    </span>
                                </div>
                                
                                <div class="info-item">
                                    <span class="info-icon"><i class="fa-solid fa-location-dot"></i></span>
                                    <span>
                                        <?php 
                                            $facility_address = get_post_meta(get_the_ID(), 'facility_address', true);
                                            
                                            // 郵便番号部分を削除する（〒123-4567などのパターンを検出）
                                            $address_without_postal = preg_replace('/〒?\s*\d{3}-\d{4}\s*/u', '', $facility_address);
                                            
                                            // 郵便番号を除いた住所を表示
                                            echo esc_html($address_without_postal);
                                        ?>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 区切り線 -->
                    <div class="divider"></div>
                    
                    <!-- ボタンエリア -->
                    <div class="buttons-container">
                        <?php if (is_user_logged_in()): 
                            // お気に入り状態の確認
                            $user_id = get_current_user_id();
                            $favorites = get_user_meta($user_id, 'user_favorites', true);
                            $is_favorite = is_array($favorites) && in_array(get_the_ID(), $favorites);
                        ?>
                            <button class="keep-button <?php echo $is_favorite ? 'kept' : ''; ?>" data-job-id="<?php echo get_the_ID(); ?>">
                                <span class="star"></span>
                                <?php echo $is_favorite ? 'お気に入り済み' : 'お気に入り'; ?>
                            </button>
                        <?php else: ?>
                            <a href="<?php echo home_url('/register/'); ?>" class="keep-button">
                                <span class="star"></span>お気に入り
                            </a>
                        <?php endif; ?>
                        
                        <a href="<?php the_permalink(); ?>" class="detail-view-button">詳細をみる</a>
                    </div>
                </div>
                <?php endwhile; ?>
                
                <!-- ページネーション -->
                <div class="pagination">
                    <?php
                    // 検索クエリを維持するためのページネーションパラメータを設定
                    $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
                    $search_term = get_search_query();
                    
                    // 適切な検索結果URLを構築
                    $base_url = add_query_arg( array(
                        's' => urlencode($search_term),
                        'post_type' => 'job'
                    ), home_url('/') );
                    
                    // ページネーションリンクを生成
                    echo paginate_links(array(
                        'base' => $base_url . '&paged=%#%',
                        'format' => '',
                        'current' => $paged,
                        'total' => $search_query_obj->max_num_pages,
                        'prev_text' => '&laquo; 前へ',
                        'next_text' => '次へ &raquo;',
                        'add_args' => false
                    ));
                    ?>
                </div>
                
                <?php wp_reset_postdata(); ?>
                
            <?php else: ?>
                <div class="no-jobs-found">
                    <?php if (!empty($search_query)): ?>
                        <p>「<?php echo esc_html($search_query); ?>」に一致する求人が見つかりませんでした。検索条件を変更して再度お試しください。</p>
                    <?php else: ?>
                        <p>条件に一致する求人が見つかりませんでした。検索条件を変更して再度お試しください。</p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- キープボタン用JavaScriptコード -->
<script>
jQuery(document).ready(function($) {
    // キープボタン機能
    $('.keep-button').on('click', function() {
        // リンクでない場合のみ処理（ログイン済みユーザー用）
        if (!$(this).attr('href')) {
            var jobId = $(this).data('job-id');
            var $button = $(this);
            
            // AJAXでキープ状態を切り替え
            $.ajax({
                url: '<?php echo admin_url('admin-ajax.php'); ?>',
                type: 'POST',
                data: {
                    action: 'toggle_job_favorite',
                    job_id: jobId,
                    nonce: '<?php echo wp_create_nonce('job_favorite_nonce'); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        if (response.data.status === 'added') {
                            $button.addClass('kept');
                            $button.html('<span class="star"></span> お気に入り済み');
                        } else {
                            $button.removeClass('kept');
                            $button.html('<span class="star"></span> お気に入り');
                        }
                    }
                }
            });
        }
    });
});
</script>

<?php get_footer(); ?>