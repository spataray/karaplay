// v2.9.2 (2026-03-28 18:45 HST): Restored missing search and settings logic.
// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var shadowPlayer = null;
var shadowPlayerReady = false;
var currentVideoId = "";
var isAdPlaying = false;

// ── Settings & Keys ──
function saveSetupKey() {
    var key = document.getElementById('setup-key-input').value.trim();
    if (key && key.length > 20) {
        localStorage.setItem('yt_api_key', key);
        window.location.reload();
    } else { alert("Please enter a valid YouTube API Key."); }
}

function saveApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    if (key) {
        localStorage.setItem('yt_api_key', key);
        window.location.reload();
    }
}

function testApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    var resultEl = document.getElementById('test-result');
    if (!key) { resultEl.innerText = "Enter a key first"; return; }
    
    resultEl.innerText = "Testing...";
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=" + key;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                resultEl.style.color = "var(--accent-color)";
                resultEl.innerText = "Key Valid! ✅";
            } else {
                resultEl.style.color = "#ff5555";
                resultEl.innerText = "Invalid Key ❌ (Error " + xhr.status + ")";
            }
        }
    };
    xhr.send();
}

// ── YouTube API Setup ──
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Loading...");
    player = new YT.Player('player', {
        height: '100%', width: '100%',
        playerVars: { 'autoplay': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0, 'iv_load_policy': 3, 'disablekb': 1, 'enablejsapi': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
    });
    setTimeout(function() { initSecondaryTasks(); }, 3000);
}

function initSecondaryTasks() {
    syncWeather();
    setInterval(syncWeather, 600000);
}

function ensureShadowPlayer() {
    if (shadowPlayer) return;
    shadowPlayer = new YT.Player('shadow-player', {
        height: '1px', width: '1px',
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'enablejsapi': 1 },
        events: {
            'onReady': function() { shadowPlayerReady = true; },
            'onError': function(e) { console.warn("Shadow Error:", e.data); }
        }
    });
}

function onPlayerReady(event) {
    playerReady = true;
    try {
        var lastVid = localStorage.getItem('kp_last_vid');
        if (lastVid) playRadio(lastVid, true);
    } catch(e) {}
}

function onPlayerStateChange(event) {
    if (event.data === 0) { // ENDED
        setTimeout(function() { nextTrack(); }, 500);
        return;
    }
    if (event.data === 1) { // PLAYING
        var data = player.getVideoData();
        var videoId = data ? data.video_id : "";
        if (videoId) {
            localStorage.setItem('kp_last_vid', videoId);
            var pl = idsInCurrentQueue();
            if (pl && pl.length > 0) localStorage.setItem('kp_cached_queue', JSON.stringify(pl));
        }
        updateTrackInfo();
        showUpNextToast();
        if (document.body.classList.contains('lyrics-mode')) {
            setTimeout(function() { fetchLyrics(); }, 2000);
        }
    }
}

function onPlayerError(event) {
    console.warn("Player Error:", event.data);
    nextTrack();
}

// ── Search Logic ──
function doSearch() {
    var query = document.getElementById('search-input').value;
    if (!query) return;
    
    var activeKey = localStorage.getItem('yt_api_key');
    if (!activeKey) { alert("API Key Missing!"); return; }

    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "<div style='text-align:center; padding:40px; font-size:1.5rem;'>Searching YouTube...</div>";

    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(query) + 
              "&type=video&videoEmbeddable=true&maxResults=10&key=" + activeKey;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                displaySearchResults(data.items);
            } catch(e) { resultsEl.innerText = "Error parsing results."; }
        } else if (xhr.readyState === 4) {
            resultsEl.innerText = "Search failed (Error " + xhr.status + ")";
        }
    };
    xhr.send();
}

function displaySearchResults(items) {
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "";
    if (!items || items.length === 0) {
        resultsEl.innerText = "No results found.";
        return;
    }
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var id = item.id.videoId;
        var title = item.snippet.title;
        var author = item.snippet.channelTitle;
        var thumb = item.snippet.thumbnails.medium.url;

        var div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = '<img src="' + thumb + '"><div class="search-item-info"><div class="search-item-title">' + title + '</div><div class="search-item-author">' + author + '</div></div>';
        div.onclick = (function(vid) { return function() { playRadio(vid); }; })(id);
        resultsEl.appendChild(div);
    }
}

function playRadio(videoId, isResume) {
    if (!playerReady) return;
    
    if (!isResume) {
        ensureShadowPlayer();
        resolveAlgorithmicMix(videoId);
    }
    
    player.loadVideoById(videoId);
    if (!isResume) closeAllOverlays();
}

function resolveAlgorithmicMix(videoId) {
    if (!shadowPlayer || !shadowPlayerReady) {
        setTimeout(function() { resolveAlgorithmicMix(videoId); }, 2000);
        return;
    }
    shadowPlayer.cuePlaylist({ 'list': 'RD' + videoId, 'listType': 'playlist', 'index': 0 });
    var pollCount = 0;
    var poll = setInterval(function() {
        pollCount++;
        if (shadowPlayer.getPlaylist) {
            var pl = shadowPlayer.getPlaylist();
            if (pl && pl.length > 1) {
                localStorage.setItem('kp_cached_queue', JSON.stringify(pl));
                clearInterval(poll);
                updateQueueList();
            }
        }
        if (pollCount > 20) clearInterval(poll);
    }, 1000);
}

// ── Lyrics Engine ──
var lyricsScrollInterval = null;
var scrollSpeed = 150;

function changeScrollSpeed(delta) {
    scrollSpeed += delta;
    if (scrollSpeed < 20) scrollSpeed = 20;
    if (scrollSpeed > 500) scrollSpeed = 500;
    var indicator = document.getElementById('speed-indicator');
    if (indicator) indicator.innerText = scrollSpeed + "ms";
    if (document.body.classList.contains('lyrics-mode')) startLyricsScroll(true);
}

function toggleLyrics() {
    var btn = document.getElementById('btn-lyrics-toggle');
    if (document.body.classList.contains('lyrics-mode')) {
        document.body.classList.remove('lyrics-mode');
        if (btn) btn.style.background = "var(--glass-bg)";
        stopLyricsScroll();
    } else {
        document.body.classList.add('lyrics-mode');
        if (btn) btn.style.background = "var(--accent-color)";
        fetchLyrics();
    }
}

function stopLyricsScroll() {
    if (lyricsScrollInterval) { clearInterval(lyricsScrollInterval); lyricsScrollInterval = null; }
}

function startLyricsScroll(noDelay) {
    stopLyricsScroll();
    var container = document.getElementById('lyrics-container');
    if (!container) return;
    if (!noDelay) container.scrollTop = 0;
    var delay = noDelay ? 0 : 5000;
    setTimeout(function() {
        if (!document.body.classList.contains('lyrics-mode')) return;
        lyricsScrollInterval = setInterval(function() {
            container.scrollTop += 1;
            if (container.scrollTop + container.clientHeight >= container.scrollHeight) stopLyricsScroll();
        }, scrollSpeed);
    }, delay);
}

function fetchLyrics() {
    if (!player || !player.getVideoData || !document.body.classList.contains('lyrics-mode')) return;
    var data = player.getVideoData();
    var contentEl = document.getElementById('lyrics-content');
    contentEl.innerText = "Searching...";
    stopLyricsScroll();
    
    var title = cleanTitle(data.title);
    var artist = cleanTitle(data.author);
    if (data.title.indexOf(' - ') !== -1) {
        var parts = data.title.split(' - ');
        artist = cleanTitle(parts[0]);
        title = cleanTitle(parts[1]);
    }

    var url = "https://api.lyrics.ovh/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(title);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var resp = JSON.parse(xhr.responseText);
                if (resp.lyrics) { contentEl.innerText = resp.lyrics; startLyricsScroll(); }
                else { contentEl.innerText = "Lyrics not found."; }
            } catch(e) { contentEl.innerText = "Error."; }
        } else if (xhr.readyState === 4) {
            contentEl.innerText = "Lyrics not found.";
        }
    };
    xhr.send();
}

function cleanTitle(title) {
    if (!title) return "";
    var junk = [/\(Official.*?\)/gi, /\[Official.*?\]/gi, /\(Lyric.*?\)/gi, /\[Lyric.*?\]/gi, /\(Video.*?\)/gi, /\[Video.*?\]/gi, /\(Audio.*?\)/gi, /\[Audio.*?\]/gi, /- Topic$/gi, /HQ$/g, /HD$/g, /4K$/g, /feat\..*$/gi, /ft\..*$/gi];
    for (var i = 0; i < junk.length; i++) title = title.replace(junk[i], "");
    return title.trim();
}

// ── Misc Logic ──
function showUpNextToast() {
    var ids = idsInCurrentQueue();
    var data = player.getVideoData();
    var currentId = data ? data.video_id : "";
    var idx = ids.indexOf(currentId);
    if (ids.length === 0 || idx === -1 || idx >= ids.length - 1) return;
    
    var nextVideoId = ids[idx + 1];
    var activeKey = localStorage.getItem('yt_api_key');
    if (!activeKey) return;

    var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + nextVideoId + '&key=' + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                if (d.items && d.items.length > 0) {
                    var t = d.items[0].snippet.title;
                    var toast = document.getElementById('up-next-toast');
                    if (toast) {
                        document.querySelector('#up-next-toast #toast-title').innerText = t;
                        toast.classList.add('active');
                        setTimeout(function() { toast.classList.remove('active'); }, 8000);
                    }
                }
            } catch(e) {}
        }
    };
    xhr.send();
}

function nextTrack() {
    try {
        var ids = idsInCurrentQueue();
        if (ids.length > 0) {
            var data = player.getVideoData();
            var idx = ids.indexOf(data ? data.video_id : "");
            if (idx + 1 < ids.length) { player.loadVideoById(ids[idx + 1]); return; }
        }
    } catch(e) {}
    if (player && player.nextVideo) player.nextVideo();
}

function prevTrack() {
    try {
        var ids = idsInCurrentQueue();
        if (ids.length > 0) {
            var data = player.getVideoData();
            var idx = ids.indexOf(data ? data.video_id : "");
            if (idx > 0) { player.loadVideoById(ids[idx - 1]); return; }
        }
    } catch(e) {}
    if (player && player.previousVideo) player.previousVideo();
}

function togglePlay() {
    var s = player.getPlayerState();
    if (s === 1) player.pauseVideo(); else player.playVideo();
}

function updateTrackInfo() {
    if (!player || !player.getVideoData) return;
    var d = player.getVideoData();
    document.getElementById('track-title').innerText = cleanTitle(d.title);
    document.getElementById('track-author').innerText = d.author;
    var btn = document.getElementById('sidebar-btn-play');
    if (btn) btn.innerHTML = "&#9208;";
}

function idsInCurrentQueue() {
    try { var c = localStorage.getItem('kp_cached_queue'); if (c) return JSON.parse(c); } catch(e) {}
    return [];
}

function updateQueueList() {
    var list = document.getElementById('queue-list');
    if (!list) return;
    var ids = idsInCurrentQueue();
    list.innerHTML = ids.length === 0 ? "Queue empty." : "Total songs: " + ids.length;
}

function clearQueue() {
    localStorage.removeItem('kp_cached_queue');
    updateQueueList();
}

function applySettings() {
    var savedKey = localStorage.getItem('yt_api_key');
    if (savedKey) {
        window.YT_API_KEY = savedKey;
        var kInput = document.getElementById('settings-api-key');
        if (kInput) kInput.value = savedKey;
    }
    var orientation = localStorage.getItem('driverOrientation') || 'left';
    if (orientation === 'right') document.getElementById('ui-layer').classList.add('driver-right');
    if (!savedKey) document.getElementById('overlay-setup').style.display = 'flex';
}

function openOverlay(id) { document.getElementById(id).classList.add('active'); }
function closeAllOverlays() { var o = document.querySelectorAll('.overlay'); for (var i=0; i<o.length; i++) o[i].classList.remove('active'); }

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

// ── Init ──
applySettings();
updateClock();
setInterval(updateClock, 5000);
var sInput = document.getElementById('search-input');
if (sInput) sInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) doSearch(); };
if (window.YT && window.YT.Player && !player) onYouTubeIframeAPIReady();
