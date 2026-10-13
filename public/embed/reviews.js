(function() {
  'use strict';

  function initWidgets() {
    var targets = document.querySelectorAll('#google-reviews-widget, .gbp-reviews-widget, [data-gbp-reviews]');
    if (!targets.length) return;

    var scriptTag = document.currentScript || (function() {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    var baseUrl = '';
    if (scriptTag && scriptTag.src) {
      try {
        var urlObj = new URL(scriptTag.src);
        baseUrl = urlObj.origin;
      } catch (e) {
        baseUrl = window.location.origin;
      }
    } else {
      baseUrl = window.location.origin;
    }

    targets.forEach(function(el) {
      if (el.getAttribute('data-gbp-loaded')) return;
      el.setAttribute('data-gbp-loaded', 'true');

      var location = el.getAttribute('data-location') || '';
      var theme = el.getAttribute('data-theme') || 'light';
      var layout = el.getAttribute('data-layout') || 'carousel';
      var minRating = el.getAttribute('data-min-rating') || '1';
      var hideHeader = el.getAttribute('data-hide-header') || 'false';
      var title = el.getAttribute('data-title') || 'Google Reviews';
      var subtitle = el.getAttribute('data-subtitle') || 'Feedback from our students and Parents';
      
      // Fixed height resolution:
      // If data-height attribute is provided (e.g. "360px" or "360"), treat as strict fixed height!
      var explicitHeight = el.getAttribute('data-height');
      var isFixed = el.getAttribute('data-fixed-height') === 'true' || !!explicitHeight;
      
      var defaultHeight = (layout === 'badge') ? '220px' : ((layout === 'carousel') ? '360px' : '460px');
      var height = explicitHeight ? (typeof explicitHeight === 'number' || /^\d+$/.test(explicitHeight) ? explicitHeight + 'px' : explicitHeight) : defaultHeight;

      var iframeUrl = baseUrl + '/widget/preview?' +
        'locationName=' + encodeURIComponent(location) +
        '&theme=' + encodeURIComponent(theme) +
        '&layout=' + encodeURIComponent(layout) +
        '&minRating=' + encodeURIComponent(minRating) +
        '&title=' + encodeURIComponent(title) +
        '&subtitle=' + encodeURIComponent(subtitle) +
        '&hideHeader=' + encodeURIComponent(hideHeader);

      var iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.style.width = '100%';
      iframe.style.maxWidth = '100%';
      iframe.style.height = height;
      iframe.style.minHeight = (layout === 'badge') ? '180px' : '260px';
      iframe.style.maxHeight = isFixed ? height : (layout === 'badge' ? '260px' : '480px');
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('scrolling', 'no');
      iframe.title = 'Google Customer Reviews';

      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.overflow = 'hidden';
      el.innerHTML = '';
      el.appendChild(iframe);

      // Only auto-resize if explicit fixed height is NOT defined:
      if (!isFixed) {
        window.addEventListener('message', function(ev) {
          if (ev.data && ev.data.type === 'gbp-widget-resize' && ev.data.height) {
            try {
              if (iframe.contentWindow === ev.source) {
                var receivedH = parseInt(ev.data.height, 10);
                var maxLimit = (layout === 'badge') ? 260 : ((layout === 'carousel') ? 420 : 520);
                var clampedH = Math.max(180, Math.min(maxLimit, receivedH));
                var currentH = parseInt(iframe.style.height, 10) || 0;
                if (Math.abs(currentH - clampedH) > 8) {
                  iframe.style.height = clampedH + 'px';
                }
              }
            } catch (e) {}
          }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }
})();
