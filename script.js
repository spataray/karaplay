// v3.4.2 (2026-05-22 21:47 HST): Added YouTube Premium sign-in button in Settings for ad-free playback.
// v3.4.1 (2026-05-10 19:55 HST): Adjusted lyrics scroll range (default 300ms, max 400ms).
// v3.4.0 (2026-05-10 19:43 HST): Added P Phu's Playlists (most queued) and Araya's Playlists (Thai music) with children's song filtering.
// Karaplay - Main Logic (Legacy ES5 for Car Compatibility)

var player;
var playerReady = false;
var shadowPlayer = null;
var shadowPlayerReady = false;
var isManualScrolling = false;
var manualScrollTimeout = null;
var isArayaActive = false;

function getApiKey() {
    return localStorage.getItem('yt_api_key') || window.YT_API_KEY || "";
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// ── Playlists & Stats ──
function trackPlayback(videoId, title, thumb) {
    var stats = JSON.parse(localStorage.getItem('kp_stats') || '{}');
    if (!stats[videoId]) {
        stats[videoId] = { count: 0, title: title, thumb: thumb };
    }
    stats[videoId].count++;
    localStorage.setItem('kp_stats', JSON.stringify(stats));
}

function loadPPhusPlaylist() {
    var activeKey = getApiKey();
    if (!activeKey) { alert("API Key Missing!"); return; }
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "Fetching P Phu's Rock & Alt...";
    
    var queries = [
        "80s Classic Rock Hits",
        "90s Alternative Rock Anthems",
        "80s Rock Greatest Hits",
        "90s Grunge Alternative",
        "80s 90s Rock Music",
        "90s Rock Hits"
    ];
    var q = queries[Math.floor(Math.random() * queries.length)];
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(q) + "&type=video&videoEmbeddable=true&maxResults=50&key=" + activeKey;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var items = [];
                for (var i = 0; i < data.items.length; i++) {
                    if (!isChildrenSong(data.items[i].snippet.title)) {
                        items.push(data.items[i]);
                    }
                }
                shuffleArray(items);
                displaySearchResults(items, "P Phu's Rock & Alt");
            } catch(e) { resultsEl.innerText = "Error loading playlist."; }
        }
    };
    xhr.send();
}

function isChildrenSong(title) {
    if (!title) return false;
    var t = title.toLowerCase();
    var bad = ["kids", "children", "nursery", "baby", "cocomelon", "pinkfong", "super simple", "lullaby", "เพลงเด็ก", "การ์ตูน", "อนุบาล"];
    for (var i = 0; i < bad.length; i++) {
        if (t.indexOf(bad[i]) !== -1) return true;
    }
    return false;
}

function loadArayasPlaylist() {
    var activeKey = getApiKey();
    if (!activeKey) { alert("API Key Missing!"); return; }
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "กำลังดึงข้อมูลเพลงโปรดของอารยา...";
    
    var queries = [
        "Thai Music 2026",
        "เพลงไทยยอดฮิต",
        "Thai Pop Hits 2026",
        "เพลงใหม่ล่าสุด 2026",
        "Thai Indie Songs",
        "เพลงฮิตในติ๊กต๊อก"
    ];
    var q = queries[Math.floor(Math.random() * queries.length)];
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(q) + "&type=video&videoEmbeddable=true&maxResults=50&key=" + activeKey;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var filtered = [];
                for (var i = 0; i < data.items.length; i++) {
                    if (!isChildrenSong(data.items[i].snippet.title)) {
                        filtered.push(data.items[i]);
                    }
                }
                shuffleArray(filtered);
                displaySearchResults(filtered, "เพลงไทยของอารยา 🇹🇭");
            } catch(e) { resultsEl.innerText = "Error loading playlist."; }
        }
    };
    xhr.send();
}

// ── Panel Management ──
function togglePanel(panelId) {
    var body = document.body;
    body.classList.remove('right-align');
    window.isArayaActive = false;
    
    var targetPanel = document.getElementById('panel-' + panelId);
    var targetBtn = document.getElementById('btn-' + panelId + '-toggle');
    var isActive = targetPanel && targetPanel.classList.contains('active');
    
    // Close everything
    var allPanels = document.querySelectorAll('.tool-panel');
    for (var i = 0; i < allPanels.length; i++) allPanels[i].classList.remove('active');
    var allBtns = document.querySelectorAll('.control-btn');
    for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
    body.classList.remove('panel-open', 'lyrics-open');
    stopLyricsScroll();

    if (!isActive && targetPanel) {
        body.classList.add('panel-open');
        if (panelId === 'lyrics') {
            body.classList.add('lyrics-open');
            initLyricsInteraction();
        }
        targetPanel.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        
        // Refresh data based on panel
        if (panelId === 'lyrics') fetchLyrics();
        if (panelId === 'media') updateQueueList();
        if (panelId === 'manual') fetchReadme();
        if (panelId === 'settings') applySettings(); // Ensure key loads when opening
    }
}

function toggleArayasPanel() {
    var body = document.body;
    var isMediaActive = document.getElementById('panel-media').classList.contains('active');
    var isRightAligned = body.classList.contains('right-align');
    
    if (isMediaActive && isRightAligned) {
        togglePanel('media');
        body.classList.remove('right-align');
        window.isArayaActive = false;
        updateQueueList();
    } else {
        body.classList.add('right-align');
        window.isArayaActive = true;
        
        // Open the media panel on the right
        var allPanels = document.querySelectorAll('.tool-panel');
        for (var i = 0; i < allPanels.length; i++) allPanels[i].classList.remove('active');
        var allBtns = document.querySelectorAll('.control-btn');
        for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
        
        document.getElementById('panel-media').classList.add('active');
        document.getElementById('btn-araya-toggle').classList.add('active');
        body.classList.add('panel-open');
        
        loadArayasPlaylist();
    }
}

function initLyricsInteraction() {
    var container = document.getElementById('lyrics-container');
    if (!container) return;
    var setManual = function() {
        isManualScrolling = true;
        clearTimeout(manualScrollTimeout);
        manualScrollTimeout = setTimeout(function() {
            isManualScrolling = false;
        }, 3000); // Resume auto-scroll after 3 seconds of no manual movement
    };
    container.onmousedown = setManual;
    container.ontouchstart = setManual;
    container.onwheel = setManual;
}

function fetchReadme() {
    var contentEl = document.getElementById('readme-content');
    if (!contentEl) return;
    contentEl.innerHTML = "Fetching manual...";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'README.md', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var md = xhr.responseText;
                var html = md.replace(/^# (.*$)/gm, '<h1 style="color:var(--accent-color); font-size:1.8rem;">$1</h1>')
                             .replace(/^## (.*$)/gm, '<h2 style="color:var(--accent-color); font-size:1.4rem; margin-top:20px;">$1</h2>')
                             .replace(/^### (.*$)/gm, '<h3 style="font-size:1.1rem; margin-top:15px;">$1</h3>')
                             .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                             .replace(/\*(.*?)\*/g, '<i>$1</i>')
                             .replace(/^- (.*$)/gm, '<div style="margin-left:10px; margin-bottom:5px;">• $1</div>')
                             .replace(/\n/g, '<br>');
                contentEl.innerHTML = html;
            } else { contentEl.innerText = "Error loading README.md"; }
        }
    };
    xhr.send();
}

function closeAllOverlays() {
    document.body.classList.remove('panel-open');
    var o = document.querySelectorAll('.overlay, .tool-panel, .side-btn');
    for (var i=0; i<o.length; i++) o[i].classList.remove('active');
    stopLyricsScroll();
}

// ── Search & Queue ──
function doSearch() {
    var query = document.getElementById('search-input').value;
    if (!query) return;
    var activeKey = getApiKey();
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

function displaySearchResults(items, titleOverride) {
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = titleOverride ? '<h3 style="color:var(--accent-color); margin-bottom:15px;">' + titleOverride + '</h3>' : "";
    if (!items || items.length === 0) { resultsEl.innerHTML += "No results found."; return; }
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item.id || !item.id.videoId) continue;
        if (!titleOverride && isChildrenSong(item.snippet.title)) continue; // Filter children songs in general search
        
        var div = document.createElement('div');
        div.className = 'search-item';
        div.setAttribute('role', 'button');
        var thumb = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url;
        div.innerHTML = '<img src="' + thumb + '"><div class="search-item-info"><div class="search-item-title">' + item.snippet.title + '</div></div>';
        div.onclick = (function(vid, title, th) { return function() { 
            console.log("Playing video: " + vid);
            trackPlayback(vid, title, th);
            playRadio(vid); 
        }; })(item.id.videoId, item.snippet.title, thumb);
        resultsEl.appendChild(div);
    }
}

function updateQueueList() {
    var list = document.getElementById('queue-list');
    if (!list) return;
    var ids = idsInCurrentQueue();
    list.innerHTML = "";
    if (ids.length === 0) { list.innerText = window.isArayaActive ? "ไม่มีเพลงในคิว" : "Queue empty."; return; }
    var activeKey = getApiKey();
    if (!activeKey) { list.innerText = window.isArayaActive ? "ต้องการคีย์ API" : "Key needed."; return; }
    var currentId = (player && player.getVideoData) ? player.getVideoData().video_id : "";
    var idx = ids.indexOf(currentId);
    var future = ids.slice(idx + 1, idx + 11);
    if (future.length === 0) { list.innerHTML = "<div style='opacity:0.5; padding:10px;'>" + (window.isArayaActive ? "ไม่มีเพลงถัดไป" : "No upcoming songs") + "</div>"; return; }
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
                    var playLabel = window.isArayaActive ? "เล่น" : "PLAY";
                    var delLabel = window.isArayaActive ? "ลบ" : "DEL";
                    div.innerHTML = '<img src="' + item.snippet.thumbnails.default.url + '" style="width:60px;"><div class="search-item-info"><div style="font-size:0.8rem; font-weight:bold;">' + item.snippet.title + '</div>' +
                                    '<div style="display:flex; gap:5px; margin-top:5px;">' +
                                    '<button onclick="trackPlayback(\''+item.id+'\', \''+item.snippet.title.replace(/'/g, "\\'")+'\', \''+item.snippet.thumbnails.default.url+'\'); playRadio(\''+item.id+'\')" class="mini-btn" style="padding:5px;">' + playLabel + '</button>' +
                                    '<button onclick="removeFromQueue(\''+item.id+'\')" class="mini-btn" style="padding:5px;">' + delLabel + '</button></div></div>';
                    list.appendChild(div);
                }
            } catch(e) { /* ignore error */ }
        }
    };
    xhr.send();
}

// ── YouTube Engine ──
var progressInterval = null;
var toastShownThisVideo = false;
var lastTrackId = "";

function startProgressPoller() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(checkPlaybackProgress, 2000);
}

function stopProgressPoller() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function checkPlaybackProgress() {
    if (!player || typeof player.getDuration !== 'function' || typeof player.getCurrentTime !== 'function') return;
    
    var data = player.getVideoData();
    var currentId = data ? data.video_id : "";
    if (currentId !== lastTrackId) {
        lastTrackId = currentId;
        toastShownThisVideo = false;
    }
    
    if (toastShownThisVideo) return;
    
    if (typeof player.getPlayerState === 'function' && player.getPlayerState() !== 1) return;
    
    var dur = player.getDuration();
    var cur = player.getCurrentTime();
    if (dur <= 0) return;
    
    var remaining = dur - cur;
    if (remaining > 0 && remaining <= 60) {
        toastShownThisVideo = true;
        triggerUpNextToast(currentId);
    }
}

function triggerUpNextToast(currentId) {
    var ids = idsInCurrentQueue();
    var idx = ids.indexOf(currentId);
    if (idx === -1 || idx >= ids.length - 1) return;
    
    var nextId = ids[idx + 1];
    var activeKey = getApiKey();
    if (!activeKey) return;
    
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + nextId + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                if (d.items && d.items.length > 0) {
                    var title = d.items[0].snippet.title;
                    var toastEl = document.getElementById('up-next-toast');
                    var toastTitleEl = document.getElementById('toast-title');
                    if (toastEl && toastTitleEl) {
                        toastTitleEl.innerText = title;
                        toastEl.classList.add('active');
                        setTimeout(function() {
                            toastEl.classList.remove('active');
                        }, 8000);
                    }
                }
            } catch(e) { /* ignore error */ }
        }
    };
    xhr.send();
}

function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
    player = new YT.Player('player', {
        height: '100%', width: '100%',
        playerVars: { 'autoplay': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0, 'iv_load_policy': 3, 'disablekb': 1, 'enablejsapi': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
    });
    setTimeout(function() { initSecondaryTasks(); }, 1000);
}

function onPlayerStateChange(event) {
    if (event.data === 0) { 
        stopProgressPoller();
        setTimeout(function() { nextTrack(); }, 500); 
        return; 
    }
    updateTrackInfo();
    if (event.data === 1) {
        var data = player.getVideoData();
        var videoId = data ? data.video_id : "";
        if (videoId) localStorage.setItem('kp_last_vid', videoId);
        if (document.getElementById('panel-lyrics').classList.contains('active')) { setTimeout(function() { fetchLyrics(); }, 2000); }
        startProgressPoller();
    } else {
        stopProgressPoller();
    }
}

function playRadio(videoId, isResume) {
    console.log("playRadio called for: " + videoId + " (ready: " + playerReady + ")");
    if (!playerReady) { 
        console.warn("Player not ready yet, queuing...");
        setTimeout(function() { playRadio(videoId, isResume); }, 1000);
        return; 
    }
    if (!isResume) { ensureShadowPlayer(); resolveAlgorithmicMix(videoId); }
    try {
        player.loadVideoById(videoId);
        if (!isResume) { closeAllOverlays(); }
    } catch(e) {
        console.error("Error loading video:", e);
    }
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
var scrollSpeed = 300;

function fetchLyrics() {
    var panel = document.getElementById('panel-lyrics');
    if (!panel || !panel.classList.contains('active')) return;
    if (!player || typeof player.getVideoData !== 'function') return;
    var data = player.getVideoData();
    if (!data || !data.title) return;
    var contentEl = document.getElementById('lyrics-content');
    contentEl.innerText = window.isArayaActive ? "กำลังค้นหาเนื้อเพลง..." : "Searching...";
    stopLyricsScroll();
    
    var songTitle = cleanTitle(data.title);
    var artist = cleanTitle(data.author || "");
    if (data.title.indexOf(' - ') !== -1) {
        var parts = data.title.split(' - ');
        artist = cleanTitle(parts[0]);
        songTitle = cleanTitle(parts[1]);
    }
    
    // Engine 1: LRCLIB (Primary - Best Hit Rate, Synchronized & Plain)
    fetchFromLrcLib(songTitle, artist, data.video_id);
}

function fetchFromLrcLib(songTitle, artist, videoId) {
    var contentEl = document.getElementById('lyrics-content');
    var query = songTitle + " " + artist;
    var url = "https://lrclib.net/api/search?q=" + encodeURIComponent(query);
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    var match = null;
                    if (Array.isArray(resp)) {
                        for (var i = 0; i < resp.length; i++) {
                            if (resp[i].plainLyrics) {
                                match = resp[i].plainLyrics;
                                break;
                            }
                        }
                    }
                    if (match) {
                        contentEl.innerText = match;
                        startLyricsScroll();
                    } else {
                        // Fallback to Engine 2
                        fetchFromLyricsOvh(songTitle, artist, videoId);
                    }
                } catch(e) {
                    fetchFromLyricsOvh(songTitle, artist, videoId);
                }
            } else {
                fetchFromLyricsOvh(songTitle, artist, videoId);
            }
        }
    };
    xhr.send();
}

function fetchFromLyricsOvh(songTitle, artist, videoId) {
    var contentEl = document.getElementById('lyrics-content');
    var url = "https://api.lyrics.ovh/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(songTitle);
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    if (resp.lyrics) { 
                        contentEl.innerText = resp.lyrics; 
                        startLyricsScroll(); 
                    } else { 
                        fetchFromYouTubeDescription(videoId); 
                    }
                } catch(e) { 
                    fetchFromYouTubeDescription(videoId); 
                }
            } else { 
                fetchFromYouTubeDescription(videoId); 
            }
        }
    };
    xhr.send();
}

function fetchFromYouTubeDescription(videoId) {
    var contentEl = document.getElementById('lyrics-content');
    var activeKey = getApiKey();
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoId + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                var desc = d.items[0].snippet.description;
                var markers = ["เนื้อเพลง", "Lyrics:", "Lyrics", "Verse 1", "[Verse 1]", "คอร์ดเพลง", "LYRICS"];
                for (var i=0; i<markers.length; i++) {
                    var idx = desc.indexOf(markers[i]);
                    if (idx !== -1) { contentEl.innerText = desc.substring(idx).trim(); startLyricsScroll(); return; }
                }
                contentEl.innerText = window.isArayaActive ? "ไม่พบเนื้อเพลง" : "Lyrics not found.";
            } catch(e) { contentEl.innerText = window.isArayaActive ? "ไม่พบเนื้อเพลง" : "Lyrics not found."; }
        }
    };
    xhr.send();
}

function changeScrollSpeed(delta) {
    scrollSpeed += delta;
    if (scrollSpeed < 20) scrollSpeed = 20;
    if (scrollSpeed > 400) scrollSpeed = 400;
    console.log("Scroll speed set to:", scrollSpeed, "ms");
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
            if (!isManualScrolling) {
                container.scrollTop += 2;
                if (container.scrollTop + container.clientHeight >= container.scrollHeight) stopLyricsScroll();
            }
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
    if (ids.length === 0) { 
        if (player && player.nextVideo) player.nextVideo();
        return;
    }
    var curData = (player && player.getVideoData) ? player.getVideoData() : null;
    var cur = curData ? curData.video_id : "";
    var idx = ids.indexOf(cur);
    console.log("NextTrack - Current:", cur, "Index:", idx, "Queue Size:", ids.length);
    if (idx !== -1 && idx + 1 < ids.length) {
        player.loadVideoById(ids[idx + 1]);
    } else if (idx === -1 && ids.length > 0) {
        player.loadVideoById(ids[0]);
    } else if (player && player.nextVideo) {
        player.nextVideo();
    }
}

function prevTrack() {
    var ids = idsInCurrentQueue();
    if (ids.length === 0) {
        if (player && player.previousVideo) player.previousVideo();
        return;
    }
    var curData = (player && player.getVideoData) ? player.getVideoData() : null;
    var cur = curData ? curData.video_id : "";
    var idx = ids.indexOf(cur);
    console.log("PrevTrack - Current:", cur, "Index:", idx);
    if (idx > 0) {
        player.loadVideoById(ids[idx - 1]);
    } else if (idx === 0) {
        player.seekTo(0); // Restart first track
    } else if (ids.length > 0) {
        player.loadVideoById(ids[0]);
    } else if (player && player.previousVideo) {
        player.previousVideo();
    }
}

function togglePlay() { var s = player.getPlayerState(); if (s === 1) player.pauseVideo(); else player.playVideo(); }

function updateTrackInfo() {
    if (!player || typeof player.getVideoData !== 'function') return;
    var d = player.getVideoData();
    if (!d || !d.title) return;
    document.getElementById('track-title').innerText = cleanTitle(d.title);
    document.getElementById('track-author').innerText = d.author || "Unknown Artist";
    var btn = document.getElementById('sidebar-btn-play');
    if (btn && typeof player.getPlayerState === 'function') {
        btn.innerHTML = (player.getPlayerState() === 1) ? "&#9208;" : "&#9654;";
    }
}

function removeFromQueue(videoId) {
    var ids = idsInCurrentQueue();
    var idx = ids.indexOf(videoId);
    if (idx !== -1) { ids.splice(idx, 1); localStorage.setItem('kp_cached_queue', JSON.stringify(ids)); updateQueueList(); }
}

function clearQueue() { localStorage.removeItem('kp_cached_queue'); updateQueueList(); }
function idsInCurrentQueue() { try { var c = localStorage.getItem('kp_cached_queue'); if (c) return JSON.parse(c); } catch(e) { /* ignore */ } return []; }

function applySettings() {
    var savedKey = getApiKey();
    if (savedKey) {
        window.YT_API_KEY = savedKey;
        var kInput = document.getElementById('settings-api-key');
        if (kInput) kInput.value = savedKey;
    }
    if (!savedKey) document.getElementById('setup-widget').style.display = 'block';
}

function toggleOrientation() {
    alert("Driver Layout is now unified and centered for both driver and passenger access!");
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
            } catch(e) { /* ignore */ }
        }
    };
    xhr.send();
}

function initSecondaryTasks() { syncWeather(); setInterval(syncWeather, 600000); }
function onPlayerReady(event) { playerReady = true; var lastVid = localStorage.getItem('kp_last_vid'); if (lastVid) playRadio(lastVid, true); }

// ── Init ──
applySettings();
updateClock();
initSecondaryTasks();
setInterval(updateClock, 5000);
var sInput = document.getElementById('search-input');
if (sInput) sInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) doSearch(); };

function onPlayerError(e) { console.error("YouTube Player Error:", e.data); }

if (window.YT && window.YT.Player && !player) onYouTubeIframeAPIReady();
