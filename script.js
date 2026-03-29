// v2.9.0 (2026-03-28 18:00 HST): Triple-Split Layout (Entire UI slides to reveal lyrics).
// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var shadowPlayer = null;
var shadowPlayerReady = false;
var currentVideoId = "";
var isAdPlaying = false;

function saveSetupKey() {
    var key = document.getElementById('setup-key-input').value.trim();
    if (key && key.length > 20) {
        localStorage.setItem('yt_api_key', key);
        window.location.reload();
    } else {
        alert("Please enter a valid YouTube API Key (starts with AIza...).");
    }
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

var skipList = [];
try {
    var savedSkip = localStorage.getItem('kp_skip_list');
    if (savedSkip) skipList = JSON.parse(savedSkip);
} catch(e) {}

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

function cleanTitle(title) {
    if (!title) return "";
    var junk = [/\(Official.*?\)/gi, /\[Official.*?\]/gi, /\(Lyric.*?\)/gi, /\[Lyric.*?\]/gi, /\(Video.*?\)/gi, /\[Video.*?\]/gi, /\(Audio.*?\)/gi, /\[Audio.*?\]/gi, /- Topic$/gi, /HQ$/g, /HD$/g, /4K$/g, /feat\..*$/gi, /ft\..*$/gi];
    var clean = title;
    for (var i = 0; i < junk.length; i++) clean = clean.replace(junk[i], "");
    return clean.trim();
}

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
                    else { contentEl.innerText = "Lyrics not found."; }
                } catch(e) { contentEl.innerText = "Error."; }
            } else { contentEl.innerText = "Lyrics not found."; }
        }
    };
    xhr.send();
}

function showUpNextToast() {
    var ids = idsInCurrentQueue();
    var data = player.getVideoData();
    var currentId = data ? data.video_id : "";
    var idx = ids.indexOf(currentId);
    if (ids.length === 0 || idx === -1 || idx >= ids.length - 1) return;
    var nextVideoId = ids[idx + 1];
    var activeKey = (typeof YT_API_KEY !== 'undefined') ? YT_API_KEY : window.YT_API_KEY;
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
                        document.getElementById('toast-title').innerText = t;
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
        if (ids && ids.length > 0) {
            var data = player.getVideoData();
            var currentId = data ? data.video_id : "";
            var idx = ids.indexOf(currentId);
            var nextIdx = idx + 1;
            if (nextIdx < ids.length) {
                player.loadVideoById(ids[nextIdx]);
                return;
            }
        }
    } catch(e) {}
    if (player && player.nextVideo) player.nextVideo();
}

function prevTrack() {
    try {
        var ids = idsInCurrentQueue();
        if (ids && ids.length > 0) {
            var data = player.getVideoData();
            var currentId = data ? data.video_id : "";
            var idx = ids.indexOf(currentId);
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

function applySettings() {
    var savedKey = localStorage.getItem('yt_api_key');
    if (savedKey) window.YT_API_KEY = savedKey;
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
var searchInput = document.getElementById('search-input');
if (searchInput) searchInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) doSearch(); };
if (window.YT && window.YT.Player && !player) onYouTubeIframeAPIReady();
