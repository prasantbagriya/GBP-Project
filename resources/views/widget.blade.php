<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $profile['title'] ?? 'Google Customer Reviews' }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: {{ $theme === 'dark' ? '#0f172a' : ($theme === 'glass' ? 'rgba(255,255,255,0.85)' : '#ffffff') }};
      --card-bg: {{ $theme === 'dark' ? '#1e293b' : '#ffffff' }};
      --text-main: {{ $theme === 'dark' ? '#f8fafc' : '#1e293b' }};
      --text-muted: {{ $theme === 'dark' ? '#94a3b8' : '#64748b' }};
      --border: {{ $theme === 'dark' ? '#334155' : '#e2e8f0' }};
      --star-color: #f59e0b;
      --google-blue: #1a73e8;
      --accent: {{ $accent ?? '#2563eb' }};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 10px 14px;
      line-height: 1.45;
      overflow-x: hidden;
    }
    .widget-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    /* Header Card */
    .widget-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .google-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .profile-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 2px;
      line-height: 1.2;
    }
    .profile-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 5px;
      line-height: 1.3;
    }
    .rating-summary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .widget-header {
        padding: 12px 14px;
        gap: 12px;
      }
      .header-left {
        width: 100%;
      }
      .write-btn {
        width: 100%;
        justify-content: center;
      }
      .rating-summary {
        gap: 6px;
      }
    }
    .score-badge {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
    }
    .stars {
      display: inline-flex;
      gap: 2px;
      color: var(--star-color);
    }
    .star-icon {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .verified-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #d1fae5;
    }
    .write-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--google-blue);
      color: #ffffff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      transition: background 0.15s ease;
      white-space: nowrap;
    }
    .write-btn:hover {
      background: #1557b0;
    }

    /* Grid Layout */
    .reviews-grid-wrapper {
      max-height: 380px;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px;
      scrollbar-width: thin;
    }
    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
      padding-bottom: 8px;
    }

    /* Carousel Layout */
    .carousel-wrapper {
      position: relative;
      overflow: hidden;
      padding: 4px 0;
    }
    .reviews-carousel {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      -ms-overflow-style: none;
      scroll-behavior: smooth;
      padding-bottom: 8px;
    }
    .reviews-carousel::-webkit-scrollbar { display: none; }
    .carousel-card {
      flex: 0 0 calc(33.333% - 11px);
      min-width: 280px;
      scroll-snap-align: start;
    }
    @media (max-width: 900px) {
      .carousel-card { flex: 0 0 calc(50% - 8px); }
    }
    @media (max-width: 600px) {
      .carousel-card { flex: 0 0 100%; min-width: 0; width: 100%; max-width: 100%; }
    }
    .carousel-nav {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }
    .carousel-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .carousel-btn:hover {
      background: var(--border);
    }

    /* Review Card */
    .review-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .review-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.06);
    }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }
    .author-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    .review-date {
      font-size: 11px;
      color: var(--text-muted);
    }
    .card-stars {
      display: flex;
      align-items: center;
      gap: 2px;
      color: var(--star-color);
    }
    .comment-text {
      font-size: 12.5px;
      color: var(--text-main);
      line-height: 1.45;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .owner-reply-box {
      margin-top: auto;
      background: {{ $theme === 'dark' ? '#0f172a' : '#f8fafc' }};
      border-left: 3px solid var(--google-blue);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
    }
    .owner-reply-header {
      font-weight: 700;
      color: var(--google-blue);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .owner-reply-comment {
      color: var(--text-muted);
      font-style: italic;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Badge Layout */
    .badge-card {
      max-width: 400px;
      margin: 0 auto;
      text-align: center;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
  </style>
</head>
<body>
  <div class="widget-container">
    @if(empty($hideHeader))
    <div class="widget-header">
      <div class="header-left">
        <div class="google-icon">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>
        <div>
          <div class="profile-title">{{ request('title', 'Google Reviews') }}</div>
          <div class="profile-subtitle">{{ request('subtitle', 'Feedback from our students and Parents') }}</div>
          <div class="rating-summary">
            <span class="score-badge">{{ number_format($profile['averageRating'] ?? 5.0, 1) }}</span>
            <div class="stars">
              @for($i = 1; $i <= 5; $i++)
                <svg class="star-icon" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              @endfor
            </div>
            <span>Based on {{ $profile['totalReviews'] ?? count($reviews) }} reviews</span>
            @if(!empty($profile['title']))
              <span class="verified-chip">✓ {{ $profile['title'] }}</span>
            @else
              <span class="verified-chip">✓ Google Verified</span>
            @endif
          </div>
        </div>
      </div>
      @if(!empty($profile['reviewLink']))
      <a href="{{ $profile['reviewLink'] }}" target="_blank" rel="noopener noreferrer" class="write-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Write a Review
      </a>
      @endif
    </div>
    @endif

    @if($layout === 'badge')
      <div class="badge-card">
        <div style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">
          {{ request('title', 'Google Reviews') }}
        </div>
        <div style="font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 10px;">
          {{ request('subtitle', 'Feedback from our students and Parents') }}
        </div>
        <div style="font-size: 38px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
          {{ number_format($profile['averageRating'] ?? 5.0, 1) }}
        </div>
        <div class="stars" style="justify-content: center; margin-bottom: 8px;">
          @for($i = 1; $i <= 5; $i++)
            <svg class="star-icon" style="width:22px; height:22px;" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          @endfor
        </div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px;">
          {{ $profile['totalReviews'] ?? count($reviews) }} Customer Reviews on Google
        </div>
        <span class="verified-chip" style="font-size: 12px; padding: 4px 12px;">✓ 100% Authentic Ratings</span>
      </div>

    @elseif($layout === 'carousel')
      <div class="carousel-wrapper">
        <div class="reviews-carousel" id="reviewCarousel">
          @forelse($reviews as $rev)
            <div class="review-card carousel-card">
              <div class="card-top">
                <div class="user-info">
                  @if(!empty($rev['profilePhotoUrl']))
                    <img src="{{ $rev['profilePhotoUrl'] }}" alt="{{ $rev['reviewerName'] }}" class="avatar">
                  @else
                    <div class="avatar">{{ mb_substr($rev['reviewerName'] ?? 'U', 0, 1) }}</div>
                  @endif
                  <div>
                    <div class="author-name">{{ $rev['reviewerName'] ?? 'Google User' }}</div>
                    <div class="review-date">{{ $rev['timeAgo'] ?? 'Recently' }}</div>
                  </div>
                </div>
                <div class="card-stars">
                  @for($i = 1; $i <= ($rev['starRating'] ?? 5); $i++)
                    <svg class="star-icon" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  @endfor
                </div>
              </div>
              <p class="comment-text">{{ $rev['comment'] ?: 'Rated 5 out of 5 stars on Google.' }}</p>
              @if(!empty($rev['ownerReply']))
                <div class="owner-reply-box">
                  <div class="owner-reply-header">
                    <span>Response from business</span>
                  </div>
                  <div class="owner-reply-comment">"{{ $rev['ownerReply'] }}"</div>
                </div>
              @endif
            </div>
          @empty
            <div style="padding: 30px; text-align: center; color: var(--text-muted); width: 100%;">
              No Google reviews found matching criteria.
            </div>
          @endforelse
        </div>
        <div class="carousel-nav">
          <button class="carousel-btn" onclick="scrollCarousel(-300)" aria-label="Previous">❮</button>
          <button class="carousel-btn" onclick="scrollCarousel(300)" aria-label="Next">❯</button>
        </div>
      </div>

    @else
      <div class="reviews-grid-wrapper">
        <div class="reviews-grid">
          @forelse($reviews as $rev)
            <div class="review-card">
              <div class="card-top">
                <div class="user-info">
                  @if(!empty($rev['profilePhotoUrl']))
                    <img src="{{ $rev['profilePhotoUrl'] }}" alt="{{ $rev['reviewerName'] }}" class="avatar">
                  @else
                    <div class="avatar">{{ mb_substr($rev['reviewerName'] ?? 'U', 0, 1) }}</div>
                  @endif
                  <div>
                    <div class="author-name">{{ $rev['reviewerName'] ?? 'Google User' }}</div>
                    <div class="review-date">{{ $rev['timeAgo'] ?? 'Recently' }}</div>
                  </div>
                </div>
                <div class="card-stars">
                  @for($i = 1; $i <= ($rev['starRating'] ?? 5); $i++)
                    <svg class="star-icon" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  @endfor
                </div>
              </div>
              <p class="comment-text">{{ $rev['comment'] ?: 'Rated 5 out of 5 stars on Google.' }}</p>
              @if(!empty($rev['ownerReply']))
                <div class="owner-reply-box">
                  <div class="owner-reply-header">
                    <span>Response from business</span>
                  </div>
                  <div class="owner-reply-comment">"{{ $rev['ownerReply'] }}"</div>
                </div>
              @endif
            </div>
          @empty
            <div style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1/-1;">
              No Google reviews found matching criteria.
            </div>
          @endforelse
        </div>
      </div>
    @endif
  </div>

  <script>
    function scrollCarousel(offset) {
      const el = document.getElementById('reviewCarousel');
      if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
    }

    let lastSentHeight = 0;
    function sendHeight() {
      try {
        const container = document.querySelector('.widget-container');
        let h = container ? Math.ceil(container.getBoundingClientRect().height + 20) : document.body.offsetHeight;
        @if($layout === 'badge')
          h = Math.min(260, Math.max(180, h));
        @elseif($layout === 'carousel')
          h = Math.min(420, Math.max(260, h));
        @else
          h = Math.min(520, Math.max(280, h));
        @endif

        if (Math.abs(h - lastSentHeight) > 6) {
          lastSentHeight = h;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'gbp-widget-resize', height: h }, '*');
          }
        }
      } catch (e) {}
    }

    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);
    setTimeout(sendHeight, 500);

    // Auto rotate every 5s if in carousel mode
    @if($layout === 'carousel')
    let carouselEl = document.getElementById('reviewCarousel');
    let isPaused = false;
    if (carouselEl) {
      carouselEl.addEventListener('mouseenter', () => { isPaused = true; });
      carouselEl.addEventListener('mouseleave', () => { isPaused = false; });
      carouselEl.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
      carouselEl.addEventListener('touchend', () => { setTimeout(() => { isPaused = false; }, 2000); });
    }

    let autoScrollInterval = setInterval(() => {
      if (isPaused) return;
      const el = document.getElementById('reviewCarousel');
      if (el) {
        const firstCard = el.querySelector('.carousel-card');
        const scrollStep = firstCard ? (firstCard.offsetWidth + 16) : 320;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: scrollStep, behavior: 'smooth' });
        }
      }
    }, 4000);
    @endif
  </script>
</body>
</html>
