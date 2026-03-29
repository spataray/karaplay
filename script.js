// v3.0.5 (2026-03-28 22:15 HST): Added Manual button and Markdown viewer.
// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var shadowPlayer = null;
var shadowPlayerReady = false;
var currentVideoId = "";

// ── Panel Management ──
function togglePanel(panelId) {
    var body = document.body;
    var targetPanel = document.getElementById('panel-' + panelId);
    var targetBtn = document.getElementById('btn-' + panelId + '-toggle');
    var isActive = targetPanel && targetPanel.classList.contains('active');
    var allPanels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < allPanels.length; i++) allPanels[i].classList.remove('active');
    var allBtns = document.querySelectorAll('.side-btn');
    for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
    body.classList.remove('panel-open');
    stopLyricsScroll();
    if (!isActive && targetPanel) {
        body.classList.add('panel-open');
        targetPanel.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        if (panelId === 'lyrics') fetchLyrics();
        if (panelId === 'media') updateQueueList();
    }
}

function openReadme() {
    var overlay = document.getElementById('overlay-readme');
    var contentEl = document.getElementById('readme-content');
    overlay.classList.add('active');
    contentEl.innerText = "Fetching manual...";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'README.md', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // Convert simple markdown to basic HTML
                var md = xhr.responseText;
                var html = md.replace(/^# (.*$)/gm, '<h1 style="color:var(--accent-color);">$1</h1>')
                             .replace(/^## (.*$)/gm, '<h2 style="color:var(--accent-color);">$1</h2>')
                             .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                             .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                             .replace(/\*(.*?)\*/g, '<i>$1</i>')
                             .replace(/^- (.*$)/gm, '• $1<br>')
                             .replace(/\n/g, '<br>');
                contentEl.innerHTML = html;
            } else { contentEl.innerText = "Error loading README.md"; }
        }
    };
    xhr.send();
}

function closeAllOverlays() {
    var body = document.body;
    body.classList.remove('panel-open');
    var panels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
    var overlays = document.querySelectorAll('.overlay');
    for (var j = 0; j < overlays.length; j++) overlays[j].classList.remove('active');
    var btns = document.querySelectorAll('.side-btn');
    for (var k = 0; k < btns.length; k++) btns[k].classList.remove('active');
    stopLyricsScroll();
}

function openOverlay(id) { document.getElementById(id).classList.add('active'); }

// ── Search & Queue ──
function doSearch() {
    var query = document.getElementById('search-input').value;
    if (!query) return;
    var activeKey = localStorage.getItem('yt_api_key');
    if (!activeKey) { alert("API Key Missing!"); return; }
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "Searching...";
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(query) + "&type=video&videoEmbeddable=true&maxResults=10&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                displaySearchResults(data.items);
            } catch(e) { resultsEl.innerText = "Error."; }
        }
    };
    xhr.send();
}

function displaySearchResults(items) {
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = '<img src="' + item.snippet.thumbnails.medium.url + '"><div class="search-item-info"><div class="search-item-title">' + item.snippet.title + '</div></div>';
        div.onclick = (function(vid) { return function() { playRadio(vid); }; })(item.id.videoId);
        resultsEl.appendChild(div);
    }
}

function updateQueueList() {
    var list = document.getElementById('queue-list');
    if (!list) return;
    var ids = idsInCurrentQueue();
    list.innerHTML = "";
    if (ids.length === 0) { list.innerText = "Queue empty."; return; }
    var activeKey = localStorage.getItem('yt_api_key');
    if (!activeKey) { list.innerText = "Key needed."; return; }
    var currentId = (player && player.getVideoData) ? player.getVideoData().video_id : "";
    var idx = ids.indexOf(currentId);
    var future = ids.slice(idx + 1, idx + 11);
    if (future.length === 0) { list.innerHTML = "<div style='opacity:0.5; padding:10px;'>No upcoming songs</div>"; return; }
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + future.join(',') + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                for (var i = 0; i < d.items.length; i++) {
                    var item = d.items[i];
                    var div = document.createElement('div');
                    div.className = 'search-item';
                    div.style.padding = "10px";
                    div.innerHTML = '<img src="' + item.snippet.thumbnails.default.url + '" style="width:60px;"><div class="search-item-info"><div style="font-size:0.9rem; font-weight:bold;">' + item.snippet.title + '</div>' +
                                    '<div style="display:flex; gap:10px; margin-top:5px;">' +
                                    '<button onclick="playRadio(\''+item.id+'\')" class="mini-btn">PLAY</button>' +
                                    '<button onclick="removeFromQueue(\''+item.id+'\')" class="mini-btn">DEL</button></div></div>';
                    list.appendChild(div);
                }
            } catch(e) {}
        }
    };
    xhr.send();
}

// ── YouTube Engine ──
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%', width: '100%',
        playerVars: { 'autoplay': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0, 'iv_load_policy': 3, 'disablekb': 1, 'enablejsapi': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
    });
    setTimeout(function() { initSecondaryTasks(); }, 3000);
}

function onPlayerStateChange(event) {
    if (event.data === 0) { setTimeout(function() { nextTrack(); }, 500); return; }
    if (event.data === 1) {
        var data = player.getVideoData();
        var videoId = data ? data.video_id : "";
        if (videoId) localStorage.setItem('kp_last_vid', videoId);
        updateTrackInfo();
        if (document.getElementById('panel-lyrics').classList.contains('active')) {
            setTimeout(function() { fetchLyrics(); }, 2000);
        }
    }
}

function playRadio(videoId, isResume) {
    if (!playerReady) return;
    if (!isResume) { ensureShadowPlayer(); resolveAlgorithmicMix(videoId); }
    player.loadVideoById(videoId);
    if (!isResume) closeAllOverlays();
}

function resolveAlgorithmicMix(videoId) {
    if (!shadowPlayer || !shadowPlayerReady) { setTimeout(function() { resolveAlgorithmicMix(videoId); }, 2000); return; }
    shadowPlayer.cuePlaylist({ 'list': 'RD' + videoId, 'listType': 'playlist', 'index': 0 });
    var poll = setInterval(function() {
        if (shadowPlayer.getPlaylist) {
            var pl = shadowPlayer.getPlaylist();
            if (pl && pl.length > 1) {
                localStorage.setItem('kp_cached_queue', JSON.stringify(pl));
                clearInterval(poll);
                if (document.getElementById('panel-media').classList.contains('active')) updateQueueList();
            }
        }
    }, 1000);
    setTimeout(function() { clearInterval(poll); }, 20000);
}

function ensureShadowPlayer() {
    if (shadowPlayer) return;
    shadowPlayer = new YT.Player('shadow-player', {
        height: '1px', width: '1px',
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'enablejsapi': 1 },
        events: { 'onReady': function() { shadowPlayerReady = true; } }
    });
}

// ── Lyrics ──
var lyricsScrollInterval = null;
var scrollSpeed = 150;

function fetchLyrics() {
    var panel = document.getElementById('panel-lyrics');
    if (!panel || !panel.classList.contains('active')) return;
    var data = player.getVideoData();
    var contentEl = document.getElementById('lyrics-content');
    contentEl.innerText = "Searching...";
    stopLyricsScroll();
    var songTitle = cleanTitle(data.title);
    var artist = cleanTitle(data.author);
    if (data.title.indexOf(' - ') !== -1) {
        var parts = data.title.split(' - ');
        artist = cleanTitle(parts[0]);
        songTitle = cleanTitle(parts[1]);
    }
    var url = "https://api.lyrics.ovh/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(songTitle);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    if (resp.lyrics) { contentEl.innerText = resp.lyrics; startLyricsScroll(); }
                    else { fetchFromYouTubeDescription(data.video_id); }
                } catch(e) { fetchFromYouTubeDescription(data.video_id); }
            } else { fetchFromYouTubeDescription(data.video_id); }
        }
    };
    xhr.send();
}

function fetchFromYouTubeDescription(videoId) {
    var contentEl = document.getElementById('lyrics-content');
    var activeKey = localStorage.getItem('yt_api_key');
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoId + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                var desc = d.items[0].snippet.description;
                var markers = ["เนื้อเพลง", "Lyrics:", "Verse 1"];
                for (var i=0; i<markers.length; i++) {
                    var idx = desc.indexOf(markers[i]);
                    if (idx !== -1) { contentEl.innerText = desc.substring(idx).trim(); startLyricsScroll(); return; }
                }
                contentEl.innerText = "Lyrics not found.";
            } catch(e) { contentEl.innerText = "Lyrics not found."; }
        }
    };
    xhr.send();
}

function changeScrollSpeed(delta) {
    scrollSpeed += delta;
    if (scrollSpeed < 20) scrollSpeed = 20;
    if (scrollSpeed > 500) scrollSpeed = 500;
    document.getElementById('speed-indicator').innerText = scrollSpeed + "ms";
    startLyricsScroll(true);
}

function stopLyricsScroll() { if (lyricsScrollInterval) { clearInterval(lyricsScrollInterval); lyricsScrollInterval = null; } }
function startLyricsScroll(noDelay) {
    stopLyricsScroll();
    var container = document.getElementById('lyrics-container');
    if (!container) return;
    if (!noDelay) container.scrollTop = 0;
    setTimeout(function() {
        if (!document.getElementById('panel-lyrics').classList.contains('active')) return;
        lyricsScrollInterval = setInterval(function() {
            container.scrollTop += 1;
            if (container.scrollTop + container.clientHeight >= container.scrollHeight) stopLyricsScroll();
        }, scrollSpeed);
    }, noDelay ? 0 : 5000);
}

// ── Helpers ──
function cleanTitle(title) {
    if (!title) return "";
    var junk = [/\(Official.*?\)/gi, /\[Official.*?\]/gi, /\(Lyric.*?\)/gi, /\[Lyric.*?\]/gi, /feat\..*$/gi, /ft\..*$/gi];
    for (var i = 0; i < junk.length; i++) title = title.replace(junk[i], "");
    return title.trim();
}

function nextTrack() {
    var ids = idsInCurrentQueue();
    var cur = (player && player.getVideoData) ? player.getVideoData().video_id : "";
    var idx = ids.indexOf(cur);
    if (idx !== -1 && idx + 1 < ids.length) player.loadVideoById(ids[idx + 1]);
    else if (player && player.nextVideo) player.nextVideo();
}

function prevTrack() {
    var ids = idsInCurrentQueue();
    var cur = (player && player.getVideoData) ? player.getVideoData().video_id : "";
    var idx = ids.indexOf(cur);
    if (idx > 0) player.loadVideoById(ids[idx - 1]);
    else if (player && player.previousVideo) player.previousVideo();
}

function togglePlay() { var s = player.getPlayerState(); if (s === 1) player.pauseVideo(); else player.playVideo(); }

function updateTrackInfo() {
    if (!player || !player.getVideoData) return;
    var d = player.getVideoData();
    document.getElementById('track-title').innerText = cleanTitle(d.title);
    document.getElementById('track-author').innerText = d.author;
    var btn = document.getElementById('sidebar-btn-play');
    if (btn) btn.innerHTML = (player.getPlayerState() === 1) ? "&#9208;" : "&#9654;";
}

function removeFromQueue(videoId) {
    var ids = idsInCurrentQueue();
    var idx = ids.indexOf(videoId);
    if (idx !== -1) { ids.splice(idx, 1); localStorage.setItem('kp_cached_queue', JSON.stringify(ids)); updateQueueList(); }
}

function clearQueue() { localStorage.removeItem('kp_cached_queue'); updateQueueList(); }
function idsInCurrentQueue() { try { var c = localStorage.getItem('kp_cached_queue'); if (c) return JSON.parse(c); } catch(e) {} return []; }

function applySettings() {
    var savedKey = localStorage.getItem('yt_api_key');
    if (savedKey) window.YT_API_KEY = savedKey;
    var orientation = localStorage.getItem('driverOrientation') || 'left';
    if (orientation === 'right') document.getElementById('ui-layer').classList.add('driver-right');
    if (!savedKey) document.getElementById('setup-widget').style.display = 'block';
}

function toggleOrientation() {
    var cur = localStorage.getItem('driverOrientation') || 'left';
    var next = (cur === 'left') ? 'right' : 'left';
    localStorage.setItem('driverOrientation', next);
    window.location.reload();
}

function toggleApiKeyVisibility() {
    var input = document.getElementById('settings-api-key');
    input.type = (input.type === 'password') ? 'text' : 'password';
}

function saveApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    if (key) { localStorage.setItem('yt_api_key', key); window.location.reload(); }
}

function testApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    var resultEl = document.getElementById('test-result');
    resultEl.innerText = "Testing...";
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=" + key;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) { resultEl.innerText = (xhr.status === 200) ? "Key Valid! ✅" : "Invalid Key ❌"; }
    };
    xhr.send();
}

function saveSetupKey() {
    var key = document.getElementById('setup-key-input').value.trim();
    if (key.length > 20) { localStorage.setItem('yt_api_key', key); window.location.reload(); }
}

function updateClock() {
    var now = new Date();
    var h = now.getHours(); var m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; m = m < 10 ? '0' + m : m;
    document.getElementById('clock').innerText = h + ":" + m + " " + ampm;
}

function syncWeather() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=21.3069&longitude=-157.8583&current_weather=true&temperature_unit=fahrenheit';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                var w = d.current_weather;
                if (w) document.getElementById('weather').innerText = Math.round(w.temperature) + "°F " + (w.weathercode === 0 ? '☀️' : '🌤️');
            } catch(e) {}
        }
    };
    xhr.send();
}

function initSecondaryTasks() { syncWeather(); setInterval(syncWeather, 600000); }
function onPlayerReady(event) { playerReady = true; var lastVid = localStorage.getItem('kp_last_vid'); if (lastVid) playRadio(lastVid, true); }

// ── Init ──
applySettings();
updateClock();
setInterval(updateClock, 5000);
var sInput = document.getElementById('search-input');
if (sInput) sInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) doSearch(); };
if (window.YT && window.YT.Player && !player) onYouTubeIframeAPIReady();
