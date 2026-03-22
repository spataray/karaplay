// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var currentVideoId = "";

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

    // Auto-resume from last session
    try {
        var lastVid = localStorage.getItem('kp_last_vid');
        if (lastVid) {
            console.log("Resuming last session:", lastVid);
            playRadio(lastVid, true); // true = don't auto-start if you want it quiet, or keep as is
        }
    } catch(e) {}
}

var skipList = [];
try {
    var savedSkip = localStorage.getItem('kp_skip_list');
    if (savedSkip) skipList = JSON.parse(savedSkip);
} catch(e) {}

function onPlayerStateChange(event) {
    if (event.data === 1) { // YT.PlayerState.PLAYING
        var data = player.getVideoData();
        var videoId = data ? data.video_id : "";

        // Save current track to resume later
        if (videoId) {
            try {
                localStorage.setItem('kp_last_vid', videoId);
            } catch(e) {}
        }

        // Auto-skip if in skipList
        if (videoId && skipList.indexOf(videoId) !== -1) {
            console.log("Auto-skipping canceled track:", videoId);
            nextTrack();
            return;
        }
// ... rest of function stays same
        updateTrackInfo();
        showUpNextToast();
        
        // Fun Fact Overlay
        if (data && data.title) {
            showFunFact(data.title, data.author);
        }
        
        // Refresh queue if overlay is open
        var queueOverlay = document.getElementById('overlay-queue');
        if (queueOverlay && queueOverlay.classList.contains('active')) {
            updateQueueList();
        }
    }
}

var lastFactVideoId = "";

function showFunFact(rawTitle, artist) {
    if (!player || !player.getVideoData) return;
    var videoId = player.getVideoData().video_id;
    if (videoId === lastFactVideoId) return; // Don't show twice for same video
    lastFactVideoId = videoId;

    var clean = cleanTitle(rawTitle);
    var query = clean + " " + artist + " song";
    
    // Wikipedia Search API
    var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=" + 
              encodeURIComponent(query) + "&gsrlimit=1&prop=extracts&exintro&explaintext&exchars=300";

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var pages = data.query.pages;
                var pageId = Object.keys(pages)[0];
                var extract = pages[pageId].extract;

                if (extract && extract.length > 50) {
                    displayFact(extract);
                } else {
                    // Fallback to Artist search
                    fetchArtistFact(artist);
                }
            } catch(e) {
                fetchArtistFact(artist);
            }
        }
    };
    xhr.send();
}

function fetchArtistFact(artist) {
    var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=" + 
              encodeURIComponent(artist) + "&gsrlimit=1&prop=extracts&exintro&explaintext&exchars=300";

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var pages = data.query.pages;
                var pageId = Object.keys(pages)[0];
                var extract = pages[pageId].extract;
                if (extract) displayFact(extract);
            } catch(e) {}
        }
    };
    xhr.send();
}

function displayFact(text) {
    var overlay = document.getElementById('fun-fact-overlay');
    var textEl = document.getElementById('fact-text');
    if (!overlay || !textEl) return;

    textEl.innerText = text;
    overlay.classList.add('active');

    // Hide after 12 seconds
    setTimeout(function() {
        overlay.classList.remove('active');
    }, 12000);
}

function cleanTitle(title) {
    if (!title) return "";
    var junk = [
        /\(Official.*?\)/gi,
        /\[Official.*?\]/gi,
        /\(Lyric.*?\)/gi,
        /\[Lyric.*?\]/gi,
        /\(Video.*?\)/gi,
        /\[Video.*?\]/gi,
        /\(Audio.*?\)/gi,
        /\[Audio.*?\]/gi,
        /- Topic$/gi,
        /HQ$/g,
        /HD$/g,
        /4K$/g,
        /|.*$/g, // Remove everything after a pipe
        /feat\..*$/gi,
        /ft\..*$/gi
    ];
    
    var clean = title;
    for (var i = 0; i < junk.length; i++) {
        clean = clean.replace(junk[i], "");
    }
    return clean.trim();
}

function showUpNextToast() {
    if (!player || !player.getPlaylist) return;
    
    var playlist = player.getPlaylist();
    var currentIndex = player.getPlaylistIndex();
    
    if (!playlist || currentIndex === -1 || currentIndex >= playlist.length - 1) return;
    
    var nextVideoId = playlist[currentIndex + 1];
    var activeKey = (typeof YT_API_KEY !== 'undefined') ? YT_API_KEY : window.YT_API_KEY;
    
    if (!activeKey) return;

    var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + nextVideoId + '&key=' + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data.items && data.items.length > 0) {
                    var title = data.items[0].snippet.title;
                    var toast = document.getElementById('up-next-toast');
                    var toastTitle = document.getElementById('toast-title');
                    var toastHistory = document.getElementById('toast-history');
                    
                    if (toast && toastTitle) {
                        toastTitle.innerText = title;
                        if (toastHistory) toastHistory.innerText = "Coming up next...";
                        toast.classList.add('active');
                        setTimeout(function() {
                            toast.classList.remove('active');
                        }, 5000);
                    }
                }
            } catch(e) {}
        }
    };
    xhr.send();
}

function onPlayerError(event) {
    console.warn("Player Error:", event.data);
    if (player && player.nextVideo) player.nextVideo();
}

// ── Radio Mode Logic ──
function playRadio(videoId) {
    if (!playerReady || !videoId) return;
    
    // Clean videoId
    videoId = String(videoId).trim();
    currentVideoId = videoId;
    
    console.log("Playing Radio for:", videoId);

    // Using loadPlaylist with RD prefix starts a radio/mix
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

function toggleApiKeyVisibility() {
    var input = document.getElementById('settings-api-key');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

function updateKeyLength() {
    var input = document.getElementById('settings-api-key');
    var indicator = document.getElementById('key-length-indicator');
    if (input && indicator) {
        indicator.innerText = "Length: " + input.value.trim().length;
    }
}

function testApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    var resultEl = document.getElementById('test-result');
    if (!key) {
        alert("Enter a key to test.");
        return;
    }
    
    if (resultEl) {
        resultEl.innerHTML = '<span style="color:yellow;">Testing...</span>';
    }

    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=' + key;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (resultEl) resultEl.innerHTML = '<span style="color:lime;">✅ Key is working!</span>';
            } else {
                var msg = "❌ Failed (Status " + xhr.status + ")";
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.error && data.error.message) msg = "❌ " + data.error.message;
                } catch(e) {}
                if (resultEl) resultEl.innerHTML = '<span style="color:red; font-size:0.9rem;">' + msg + '</span>';
            }
        }
    };
    xhr.send();
}

function saveApiKey() {
    var key = document.getElementById('settings-api-key').value.trim();
    if (!key) {
        alert("Please enter a valid API Key.");
        return;
    }
    try {
        localStorage.setItem('yt_api_key', key);
        alert("API Key saved! Karaplay will now reload.");
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
            alert("API Key received! Saving and reloading...");
            // Redirect to clean URL
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

function getQueryParam(name) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === name) {
            return pair[1] !== undefined ? decodeURIComponent(pair[1]) : "";
        }
    }
    return null;
}

// ── Search Logic ──
function doSearch() {
    var input = document.getElementById('search-input');
    if (!input) return;
    var query = input.value.trim();
    if (!query) return;

    // Dismiss keyboard on touch devices
    input.blur();

    var resultsEl = document.getElementById('search-results');
    if (resultsEl) resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5; font-size:2rem;">Searching...</div>';

    var activeKey = (typeof YT_API_KEY !== 'undefined') ? YT_API_KEY : window.YT_API_KEY;

    if (!activeKey) {
        alert("API Key is missing. Tap 'How to Sync' in Settings for instructions.");
        if (resultsEl) resultsEl.innerHTML = '<div style="color:red; text-align:center;">API Key missing. Check Settings.</div>';
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
                            (function(item) {
                                var id = item.id.videoId;
                                if (!id) return;

                                var div = document.createElement('div');
                                div.className = 'search-item';
                                div.onclick = function() { playRadio(id); };

                                div.innerHTML = 
                                    '<img src="' + item.snippet.thumbnails.medium.url + '">' +
                                    '<div class="search-item-info">' +
                                        '<div class="search-item-title">' + escHtml(item.snippet.title) + '</div>' +
                                        '<div class="search-item-author">' + escHtml(item.snippet.channelTitle) + '</div>' +
                                    '</div>';
                                
                                resultsEl.appendChild(div);
                            })(data.items[i]);
                        }
                    } catch(e) {
                        resultsEl.innerHTML = '<div style="color:red; text-align:center;">Parse error.</div>';
                    }
                } else {
                    var errorMsg = "Search failed: Status " + xhr.status;
                    try {
                        var errorData = JSON.parse(xhr.responseText);
                        if (errorData.error && errorData.error.message) {
                            errorMsg = "Google Error: " + errorData.error.message;
                        }
                    } catch(e) {}
                    resultsEl.innerHTML = '<div style="color:red; text-align:center; font-size:1.2rem; padding:20px;">' + errorMsg + '</div>';
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

    if (id === 'overlay-queue') {
        updateQueueList();
    }

    if (id === 'overlay-sync') {
        var baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        var exampleUrl = baseUrl + "?key=YOUR_KEY";
        var displayEl = document.getElementById('sync-example-url');
        if (displayEl) displayEl.innerText = exampleUrl;
    }
}

// ── Queue Management ──
function updateQueueList() {
    if (!player || !player.getPlaylist) return;
    
    var playlist = player.getPlaylist();
    var currentIndex = player.getPlaylistIndex();
    var resultsEl = document.getElementById('queue-list');
    
    if (!playlist || playlist.length === 0) {
        if (resultsEl) resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.3; font-size:1.5rem;">Queue is empty. Search for a song to start radio.</div>';
        return;
    }

    if (resultsEl) resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5; font-size:2rem;">Loading Queue...</div>';

    var startIdx = Math.max(0, currentIndex);
    var endIdx = Math.min(playlist.length, startIdx + 15);
    var idsToFetch = playlist.slice(startIdx, endIdx);

    var activeKey = (typeof YT_API_KEY !== 'undefined') ? YT_API_KEY : window.YT_API_KEY;
    if (!activeKey) {
        if (resultsEl) resultsEl.innerHTML = '<div style="color:red; text-align:center;">API Key missing. Check Settings.</div>';
        return;
    }

    var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + 
              idsToFetch.join(',') + '&key=' + activeKey;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var videoDetails = {};
                for (var i = 0; i < data.items.length; i++) {
                    videoDetails[data.items[i].id] = data.items[i].snippet;
                }

                    if (resultsEl) {
                        resultsEl.innerHTML = '';
                        for (var j = 0; j < idsToFetch.length; j++) {
                            (function(vid, actualIndex) {
                                var snippet = videoDetails[vid];
                                if (!snippet) return;

                                var isCurrent = actualIndex === currentIndex;
                                var isCanceled = skipList.indexOf(vid) !== -1;
                                
                                var div = document.createElement('div');
                                div.className = 'search-item' + (isCurrent ? ' playing' : '') + (isCanceled ? ' canceled' : '');
                                div.onclick = function() { playQueueItem(actualIndex); };

                                var thumb = snippet.thumbnails.default ? snippet.thumbnails.default.url : '';
                                var html = 
                                    '<img src="' + thumb + '">' +
                                    '<div class="search-item-info">' +
                                        '<div class="search-item-title">' + (isCurrent ? '▶ ' : '') + escHtml(snippet.title) + '</div>' +
                                        '<div class="search-item-author">' + escHtml(snippet.channelTitle) + '</div>' +
                                    '</div>';
                                
                                if (isCurrent) {
                                    html += '<div style="color:var(--accent-color); font-weight:bold; margin-left: 20px;">NOW PLAYING</div>';
                                } else if (!isCanceled) {
                                    html += '<div class="cancel-btn">✕</div>';
                                } else {
                                    html += '<div style="color:red; font-weight:bold; margin-left: 20px;">CANCELED</div>';
                                }
                                
                                div.innerHTML = html;
                                
                                // Specific cancel logic
                                var cb = div.querySelector('.cancel-btn');
                                if (cb) {
                                    cb.onclick = function(e) {
                                        e.stopPropagation(); // Don't trigger 'Play Now'
                                        cancelTrack(vid);
                                    };
                                }

                                resultsEl.appendChild(div);
                            })(idsToFetch[j], startIdx + j);
                        }
                    }
            } catch(e) {}
        }
    };
    xhr.send();
}

function clearQueue() {
    if (confirm("Clear your current radio session and queue?")) {
        skipList = [];
        try {
            localStorage.removeItem('kp_last_vid');
            localStorage.removeItem('kp_skip_list');
        } catch(e) {}
        
        if (player && player.stopVideo) player.stopVideo();
        
        var titleEl = document.getElementById('track-title');
        var authorEl = document.getElementById('track-author');
        if (titleEl) titleEl.innerText = "Ready to Play";
        if (authorEl) authorEl.innerText = "Search for a song to start radio";
        
        updateQueueList();
        closeAllOverlays();
    }
}

function saveSkipList() {
    try {
        localStorage.setItem('kp_skip_list', JSON.stringify(skipList));
    } catch(e) {}
}

function cancelTrack(videoId) {
    if (videoId && skipList.indexOf(videoId) === -1) {
        skipList.push(videoId);
        saveSkipList();
        updateQueueList();
    }
}

function playQueueItem(index) {
    if (player && player.playVideoAt) {
        player.playVideoAt(index);
        closeAllOverlays();
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
