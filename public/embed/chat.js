/**
 * GBP Live Support Chatbot Embed Script
 * Embed on any HTML / CMS page with:
 * <script src="https://app.coachingsinsikar.com/embed/chat.js" data-widget-id="..." async defer></script>
 */
(function() {
    if (window.__GBP_CHAT_INITIALIZED__) return;
    window.__GBP_CHAT_INITIALIZED__ = true;

    var scriptTag = document.currentScript || (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    var widgetId = (scriptTag && scriptTag.getAttribute('data-widget-id')) || '';
    
    // Resolve host origin from script src
    var scriptSrc = scriptTag ? scriptTag.src : window.location.href;
    var parser = document.createElement('a');
    parser.href = scriptSrc;
    var host = parser.protocol + '//' + parser.host;

    // Create container
    var container = document.createElement('div');
    container.id = 'gbp-live-chat-container';
    container.style.cssText = 'position:fixed; z-index:9999999; bottom:20px; right:20px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    document.body.appendChild(container);

    // Floating launcher button
    var launcher = document.createElement('button');
    launcher.id = 'gbp-chat-launcher';
    launcher.setAttribute('aria-label', 'Open Live Support Chat');
    launcher.style.cssText = 'width:60px; height:60px; border-radius:50%; background:#4f46e5; color:#ffffff; border:none; box-shadow:0 8px 24px rgba(0,0,0,0.18); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); outline:none;';
    launcher.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    container.appendChild(launcher);

    // Iframe chat box
    var iframe = document.createElement('iframe');
    iframe.id = 'gbp-chat-iframe';
    iframe.src = host + '/chat/preview?widget_id=' + encodeURIComponent(widgetId) + '&page_url=' + encodeURIComponent(window.location.href);
    iframe.style.cssText = 'position:fixed; bottom:92px; right:20px; width:380px; height:600px; max-height:calc(100vh - 110px); max-width:calc(100vw - 30px); border:none; border-radius:18px; box-shadow:0 12px 40px rgba(0,0,0,0.22); display:none; opacity:0; transform:translateY(20px) scale(0.95); transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1); z-index:9999999;';
    document.body.appendChild(iframe);

    var isOpen = false;
    launcher.addEventListener('click', function() {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            setTimeout(function() {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0) scale(1)';
            }, 10);
            launcher.style.transform = 'rotate(90deg)';
            launcher.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(function() { iframe.style.display = 'none'; }, 250);
            launcher.style.transform = 'rotate(0deg)';
            launcher.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        }
    });
})();
