// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var currentVideoId = "";
var syncDatabase;

// Public Firebase config for Remote Sync (Safe to be public)
var SYNC_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAJ6XE866VF-8VKn7iMtVQjMZTS_LPB9l4",
    authDomain: "ta-station-remote.firebaseapp.com",
    databaseURL: "https://ta-station-remote-default-rtdb.firebaseio.com",
    projectId: "ta-station-remote",
    storageBucket: "ta-station-remote.firebasestorage.app",
    messagingSenderId: "805160829750",
    appId: "1:805160829750:web:9a2a9e1cbf639562aba997"
};

// ── YouTube API Setup ──
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0,
            'iv_load_policy': 3,
            'disablekb': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    playerReady = true;
    console.log("Karaplay Ready");
}

function onPlayerStateChange(event) {
    if (event.data === 1) { // YT.PlayerState.PLAYING
        updateTrackInfo();
    }
}

function onPlayerError(event) {
    console.warn("Player Error:", event.data);
    if (player && player.nextVideo) player.nextVideo();
}

// ── Radio Mode Logic ──
function playRadio(videoId) {
    if (!playerReady) return;
    currentVideoId = videoId;
    
    player.loadPlaylist({
        list: 'RD' + videoId,
        listType: 'playlist',
        index: 0,
        startSeconds: 0,
        suggestedQuality: 'default'
    });
    
    closeAllOverlays();
}

// ── Track Info ──
function updateTrackInfo() {
    if (!player || !player.getVideoData) return;
    var data = player.getVideoData();
    var titleEl = document.getElementById('track-title');
    var authorEl = document.getElementById('track-author');
    if (titleEl) titleEl.innerText = data.title || "Unknown Title";
    if (authorEl) authorEl.innerText = data.author || "Unknown Artist";
}

// ── Media Controls ──
function togglePlay() {
    if (!player || !player.getPlayerState) return;
    var state = player.getPlayerState();
    var playBtn = document.getElementById('sidebar-btn-play');
    if (state === 1) { // Playing
        player.pauseVideo();
        if (playBtn) playBtn.innerHTML = "&#9654;";
    } else {
        player.playVideo();
        if (playBtn) playBtn.innerHTML = "&#9208;";
    }
}

function nextTrack() {
    if (player && player.nextVideo) player.nextVideo();
}

function prevTrack() {
    if (player && player.previousVideo) player.previousVideo();
}

// ── Settings & Orientation ──
function toggleOrientation() {
    var uiLayer = document.getElementById('ui-layer');
    var btn = document.getElementById('btn-orientation');
    if (!uiLayer || !btn) return;
    
    var isRight = uiLayer.classList.toggle('driver-right');
    var val = isRight ? 'right' : 'left';
    btn.innerText = isRight ? "RIGHT (RHD)" : "LEFT (LHD)";
    
    try {
        localStorage.setItem('driverOrientation', val);
    } catch(e) {}
}

function saveApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    if (!key) {
        alert("Please enter a valid API Key.");
        return;
    }
    try {
        localStorage.setItem('yt_api_key', key);
        alert("API Key saved! Page will reload.");
        location.reload();
    } catch(e) {
        alert("Error saving: " + e.message);
    }
}

function applySettings() {
    // 1. URL Parameter Sync (Priority)
    var urlKey = getQueryParam('key');
    if (urlKey && urlKey.length > 10) {
        try {
            localStorage.setItem('yt_api_key', urlKey);
            alert("API Key detected in URL and saved!");
            var cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.location.href = cleanUrl;
            return;
        } catch(e) {}
    }

    // 2. Driver Orientation
    var orientation = 'left';
    try {
        orientation = localStorage.getItem('driverOrientation') || 'left';
    } catch(e) {}

    if (orientation === 'right') {
        var uiLayer = document.getElementById('ui-layer');
        var btn = document.getElementById('btn-orientation');
        if (uiLayer) uiLayer.classList.add('driver-right');
        if (btn) btn.innerText = "RIGHT (RHD)";
    }

    // 3. Load API Key
    try {
        var savedKey = localStorage.getItem('yt_api_key');
        if (savedKey) {
            window.YT_API_KEY = savedKey;
            var keyInput = document.getElementById('settings-api-key');
            if (keyInput) keyInput.value = savedKey;
        }
    } catch(e) {}
}

// ── Remote Sync Logic ──
function initSync() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK not loaded.");
        return false;
    }
    // Use hardcoded config for sync service
    if (firebase.apps.length === 0) {
        firebase.initializeApp(SYNC_FIREBASE_CONFIG);
    }
    syncDatabase = firebase.database();
    return true;
}

function startSyncReceiver() {
    if (!initSync()) {
        alert("Remote Sync failed to initialize. Check internet connection.");
        return;
    }

    var code = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('sync-code-display').innerText = code;
    document.getElementById('sync-receiver-ui').style.display = 'block';
    
    var baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    document.getElementById('sync-url-display').innerText = baseUrl + "?sync";

    var syncRef = syncDatabase.ref('sync/' + code);
    syncRef.on('value', function(snapshot) {
        var data = snapshot.val();
        if (data && data.key) {
            localStorage.setItem('yt_api_key', data.key);
            syncRef.remove(); // Cleanup
            alert("Key received from phone! Karaplay will now reload.");
            location.reload();
        }
    });
}

function sendSyncKey() {
    if (!initSync()) {
        alert("Sync service unavailable.");
        return;
    }

    var code = document.getElementById('sync-input-code').value.trim();
    var key = document.getElementById('sync-input-key').value.trim();

    if (code.length !== 4 || !key) {
        alert("Please enter a 4-digit code and the API key.");
        return;
    }

    syncDatabase.ref('sync/' + code).set({
        key: key,
        timestamp: Date.now()
    }, function(error) {
        if (error) {
            alert("Error sending key: " + error.message);
        } else {
            alert("Key sent successfully! Check your car screen.");
        }
    });
}

function checkSyncMode() {
    var isSender = getQueryParam('sync') !== null;
    if (isSender) {
        openOverlay('overlay-sync');
        document.getElementById('sync-sender-ui').style.display = 'block';
        document.getElementById('sync-receiver-ui').style.display = 'none';
        var ui = document.getElementById('ui-layer');
        if (ui) ui.style.display = 'none';
    }
}

function getQueryParam(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) return null;
    return decodeURIComponent(results[1]) || 0;
}

// ── Search Logic ──
function doSearch() {
    var input = document.getElementById('search-input');
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;

    var resultsEl = document.getElementById('search-results');
    if (resultsEl) resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5; font-size:2rem;">Searching...</div>';

    var activeKey = (typeof YT_API_KEY !== 'undefined') ? YT_API_KEY : window.YT_API_KEY;

    if (!activeKey) {
        alert("YouTube API Key is missing. Add it in Settings or use Remote Sync.");
        if (resultsEl) resultsEl.innerHTML = '<div style="color:red; text-align:center;">API Key missing.</div>';
        return;
    }

    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + 
              encodeURIComponent(query) + '&type=video&videoEmbeddable=true&maxResults=10&key=' + activeKey;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    
    var searchTimer = setTimeout(function() {
        if (xhr.readyState < 4) {
            xhr.abort();
            if (resultsEl) resultsEl.innerHTML = '<div style="color:red; text-align:center;">Search timed out.</div>';
        }
    }, 15000);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            clearTimeout(searchTimer);
            if (resultsEl) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        resultsEl.innerHTML = '';
                        if (!data.items || data.items.length === 0) {
                            resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5; font-size:1.5rem;">No results found</div>';
                            return;
                        }

                        for (var i = 0; i < data.items.length; i++) {
                            var item = data.items[i];
                            var id = item.id.videoId;
                            var title = item.snippet.title;
                            var author = item.snippet.channelTitle;
                            var thumb = item.snippet.thumbnails.medium.url;

                            var div = document.createElement('div');
                            div.className = 'search-item';
                            div.setAttribute('onclick', 'playRadio("' + id + '")');
                            div.innerHTML = 
                                '<img src="' + thumb + '">' +
                                '<div class="search-item-info">' +
                                    '<div class="search-item-title">' + escHtml(title) + '</div>' +
                                    '<div class="search-item-author">' + escHtml(author) + '</div>' +
                                '</div>';
                            resultsEl.appendChild(div);
                        }
                    } catch(e) {
                        resultsEl.innerHTML = '<div style="color:red; text-align:center;">Parse error.</div>';
                    }
                } else {
                    resultsEl.innerHTML = '<div style="color:red; text-align:center;">Error: ' + xhr.status + '</div>';
                }
            }
        }
    };
    xhr.send();
}

// ── UI Helpers ──
function openOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
    
    if (id === 'overlay-search') {
        setTimeout(function() { 
            var si = document.getElementById('search-input');
            if (si) si.focus(); 
        }, 200);
    }

    if (id === 'overlay-sync') {
        if (getQueryParam('sync') === null) {
            startSyncReceiver();
        }
    }
}

function closeAllOverlays() {
    var overlays = document.querySelectorAll('.overlay');
    for (var i = 0; i < overlays.length; i++) {
        overlays[i].classList.remove('active');
    }
}

function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// ── Dashboard Updates ──
function updateClock() {
    var clockEl = document.getElementById('clock');
    if (!clockEl) return;
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 = 12
    m = m < 10 ? '0' + m : m;
    clockEl.innerText = h + ":" + m + " " + ampm;
}

function syncWeather() {
    var weatherEl = document.getElementById('weather');
    if (!weatherEl) return;
    
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=21.3069&longitude=-157.8583&current_weather=true&temperature_unit=fahrenheit';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var w = data.current_weather;
                if (w) {
                    weatherEl.innerText = Math.round(w.temperature) + "°F " + getWeatherEmoji(w.weathercode);
                }
            } catch(e) {}
        }
    };
    xhr.send();
}

function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    return '🌦️';
}

// ── Init ──
applySettings();
checkSyncMode();
updateClock();
setInterval(updateClock, 1000);
syncWeather();
setInterval(syncWeather, 600000);

// Handle Enter key in search
var searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.onkeydown = function(e) {
        var code = e.keyCode || e.which;
        if (code === 13) doSearch(); // 13 is Enter
    };
}
