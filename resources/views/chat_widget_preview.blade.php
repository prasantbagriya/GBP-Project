<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>{{ $widget->title }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #1e293b;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }
        .header {
            background: {{ $widget->brand_color }};
            color: #ffffff;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-shrink: 0;
        }
        .header-info { display: flex; align-items: center; gap: 12px; }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
            position: relative;
        }
        .online-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid #ffffff;
            position: absolute;
            bottom: 0;
            right: 0;
        }
        .title-box h3 { font-size: 15px; font-weight: 600; line-height: 1.2; }
        .title-box p { font-size: 11px; opacity: 0.88; margin-top: 2px; }

        .chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f8fafc;
        }
        .msg-row { display: flex; flex-direction: column; max-width: 82%; animation: fadeIn 0.2s ease-out; }
        .msg-row.visitor { align-self: flex-end; align-items: flex-end; }
        .msg-row.bot, .msg-row.agent { align-self: flex-start; align-items: flex-start; }
        .msg-row.system { align-self: center; align-items: center; max-width: 90%; }

        .sender-tag { font-size: 10px; color: #64748b; margin-bottom: 3px; margin-left: 4px; }
        .msg-bubble {
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 13.5px;
            line-height: 1.45;
            word-break: break-word;
            position: relative;
        }
        .msg-row.visitor .msg-bubble {
            background: {{ $widget->brand_color }};
            color: #ffffff;
            border-bottom-right-radius: 4px;
        }
        .msg-row.bot .msg-bubble {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .msg-row.agent .msg-bubble {
            background: #ffffff;
            color: #0f172a;
            border-left: 3px solid {{ $widget->brand_color }};
            border: 1px solid #e2e8f0;
            border-left-width: 3.5px;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .msg-row.system .msg-bubble {
            background: #e2e8f0;
            color: #475569;
            font-size: 11.5px;
            padding: 6px 12px;
            border-radius: 20px;
            text-align: center;
        }

        /* Buttons container */
        .btn-choices {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }
        .choice-btn {
            background: #ffffff;
            border: 1.5px solid {{ $widget->brand_color }};
            color: {{ $widget->brand_color }};
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 12.5px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
        }
        .choice-btn:hover {
            background: {{ $widget->brand_color }};
            color: #ffffff;
        }

        /* CSAT Stars */
        .csat-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            width: 100%;
            margin-top: 6px;
        }
        .stars-row { display: flex; justify-content: center; gap: 8px; margin: 8px 0; font-size: 22px; cursor: pointer; }
        .star-item { color: #cbd5e1; transition: color 0.15s; }
        .star-item.active { color: #f59e0b; }

        .footer {
            padding: 12px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }
        .input-box {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 24px;
            font-size: 13.5px;
            outline: none;
            transition: border-color 0.15s;
        }
        .input-box:focus { border-color: {{ $widget->brand_color }}; }
        .send-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: {{ $widget->brand_color }};
            color: #ffffff;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.1s;
        }
        .send-btn:hover { transform: scale(1.05); }

        .typing-indicator {
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            margin-left: 6px;
            display: none;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-info">
            <div class="avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <circle cx="12" cy="5" r="2"></circle>
                    <path d="M12 7v4"></path>
                    <line x1="8" y1="16" x2="8.01" y2="16"></line>
                    <line x1="16" y1="16" x2="16.01" y2="16"></line>
                </svg>
                <div class="online-dot"></div>
            </div>
            <div class="title-box">
                <h3 id="widget-title">{{ $widget->title }}</h3>
                <p id="widget-status">{{ $widget->subtitle }}</p>
            </div>
        </div>
    </div>

    <div class="chat-body" id="chat-stream">
        <!-- Messages loaded dynamically -->
    </div>

    <div class="typing-indicator" id="typing-ind">Agent is typing...</div>

    <div class="footer">
        <input type="text" id="chat-input" class="input-box" placeholder="Write a message..." autocomplete="off">
        <button id="send-btn" class="send-btn" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        </button>
    </div>

    <script>
        (function() {
            var widgetId = '{{ $widget->uuid }}';
            var pageUrl = '{{ $pageUrl }}' || window.location.href;
            var visitorToken = localStorage.getItem('gbp_chat_visitor_token') || '';
            var conversationUuid = null;
            var lastMessageId = 0;
            var chatStream = document.getElementById('chat-stream');
            var chatInput = document.getElementById('chat-input');
            var sendBtn = document.getElementById('send-btn');
            var typingInd = document.getElementById('typing-ind');

            // Web Audio API Synthesizer Chime for instant sound notifications (no 404s)
            function playChime() {
                try {
                    var ctx = new (window.AudioContext || window.webkitAudioContext)();
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
                    gain.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } catch(e) {}
            }

            // Append message bubble
            function appendMessage(msg, isInitial) {
                var row = document.createElement('div');
                row.className = 'msg-row ' + (msg.sender_type || 'bot');

                if (msg.sender_type !== 'visitor' && msg.sender_type !== 'system') {
                    var tag = document.createElement('div');
                    tag.className = 'sender-tag';
                    tag.innerText = msg.sender_name || 'Support';
                    row.appendChild(tag);
                }

                var bubble = document.createElement('div');
                bubble.className = 'msg-bubble';
                bubble.innerText = msg.content || '';
                row.appendChild(bubble);

                // Check for quick replies buttons metadata
                if (msg.metadata && msg.metadata.buttons && msg.metadata.buttons.length > 0) {
                    var btnBox = document.createElement('div');
                    btnBox.className = 'btn-choices';
                    msg.metadata.buttons.forEach(function(b) {
                        var btn = document.createElement('button');
                        btn.className = 'choice-btn';
                        btn.innerText = b.text;
                        btn.onclick = function() {
                            sendPayload(b.text, b.id || b.targetNodeId);
                            btnBox.style.pointerEvents = 'none';
                            btnBox.style.opacity = '0.6';
                        };
                        btnBox.appendChild(btn);
                    });
                    row.appendChild(btnBox);
                }

                // Check for CSAT star survey
                if (msg.metadata && msg.metadata.show_csat) {
                    var csatBox = document.createElement('div');
                    csatBox.className = 'csat-box';
                    var starSvg = '<svg class="star-svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                    csatBox.innerHTML = '<strong>Rate your support experience:</strong><div class="stars-row" id="stars-row">' +
                        '<span class="star-item" data-v="1">' + starSvg + '</span>' +
                        '<span class="star-item" data-v="2">' + starSvg + '</span>' +
                        '<span class="star-item" data-v="3">' + starSvg + '</span>' +
                        '<span class="star-item" data-v="4">' + starSvg + '</span>' +
                        '<span class="star-item" data-v="5">' + starSvg + '</span>' +
                        '</div>';
                    row.appendChild(csatBox);

                    setTimeout(function() {
                        var stars = csatBox.querySelectorAll('.star-item');
                        stars.forEach(function(s) {
                            s.onclick = function() {
                                var val = parseInt(s.getAttribute('data-v'), 10);
                                stars.forEach(function(st, idx) {
                                    st.classList.toggle('active', idx < val);
                                });
                                submitRating(val);
                            };
                        });
                    }, 50);
                }

                chatStream.appendChild(row);
                chatStream.scrollTop = chatStream.scrollHeight;

                if (!isInitial && msg.sender_type !== 'visitor') {
                    playChime();
                }

                if (msg.id && msg.id > lastMessageId) {
                    lastMessageId = msg.id;
                }
            }

            // Init session
            fetch('/api/chat/public/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    widget_id: widgetId,
                    visitor_token: visitorToken,
                    page_url: pageUrl
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    visitorToken = data.visitor_token;
                    localStorage.setItem('gbp_chat_visitor_token', visitorToken);
                    conversationUuid = data.conversation_uuid;

                    if (data.assigned_agent) {
                        document.getElementById('widget-status').innerText = 'Connected with ' + data.assigned_agent.name;
                    }

                    if (data.messages && data.messages.length > 0) {
                        data.messages.forEach(function(m) {
                            appendMessage(m, true);
                        });
                    }

                    startPolling();
                }
            })
            .catch(function(err) {
                console.error('Failed to init chat session', err);
            });

            // Send message or choice
            function sendPayload(text, buttonPayload) {
                if (!conversationUuid) return;

                // Optimistically show visitor bubble
                appendMessage({ sender_type: 'visitor', content: text }, false);

                fetch('/api/chat/public/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        conversation_uuid: conversationUuid,
                        content: text,
                        button_payload: buttonPayload,
                        visitor_token: visitorToken
                    })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.success && data.messages) {
                        data.messages.forEach(function(m) {
                            if (m.id > lastMessageId && m.sender_type !== 'visitor') {
                                appendMessage(m, false);
                            }
                        });
                    }
                });
            }

            function submitRating(rating) {
                if (!conversationUuid) return;
                fetch('/api/chat/public/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversation_uuid: conversationUuid,
                        rating: rating
                    })
                });
            }

            // Polling sync
            function startPolling() {
                setInterval(function() {
                    if (!conversationUuid) return;
                    fetch('/api/chat/public/sync?conversation_uuid=' + encodeURIComponent(conversationUuid) + '&after_id=' + lastMessageId)
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                        if (data.success && data.messages) {
                            data.messages.forEach(function(m) {
                                appendMessage(m, false);
                            });
                        }
                        if (data.assigned_agent) {
                            document.getElementById('widget-status').innerText = 'Connected with ' + data.assigned_agent.name;
                        }
                    })
                    .catch(function() {});
                }, 3000);
            }

            // Enter key to send
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var val = chatInput.value.trim();
                    if (val) {
                        sendPayload(val, null);
                        chatInput.value = '';
                    }
                }
            });

            sendBtn.addEventListener('click', function() {
                var val = chatInput.value.trim();
                if (val) {
                    sendPayload(val, null);
                    chatInput.value = '';
                }
            });
        })();
    </script>
</body>
</html>
