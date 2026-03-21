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
}

function onPlayerStateChange(event) {
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
        updateTrackInfo();
    }
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
        // Radio mode should handle next automatically if loaded as playlist
    }
}

function onPlayerError(event) {
    console.warn("Player Error:", event.data);
    // Skip to next if possible
    player.nextVideo();
}

// ── Radio Mode Logic ──
function playRadio(videoId) {
    if (!playerReady) return;
    currentVideoId = videoId;
    
    // Loading with 'RD' + videoId triggers the YouTube Mix algorithm
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
    document.getElementById('track-title').innerText = data.title || "Unknown Title";
    document.getElementById('track-author').innerText = data.author || "Unknown Artist";
}

// ── Media Controls ──
function togglePlay() {
    var state = player.getPlayerState();
    if (state === 1) {
        player.pauseVideo();
        document.getElementById('btn-play').innerHTML = "&#9654;";
    } else {
        player.playVideo();
        document.getElementById('btn-play').innerHTML = "&#9208;";
    }
}

function nextTrack() {
    player.nextVideo();
}

function prevTrack() {
    player.previousVideo();
}

// ── Search Logic ──
function doSearch() {
    var query = document.getElementById('search-input').value.trim();
    if (!query) return;

    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5; font-size:2rem;">Searching...</div>';

    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + 
              encodeURIComponent(query) + '&type=video&videoEmbeddable=true&maxResults=10&key=' + YT_API_KEY;

    fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
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
        })
        .catch(function(err) {
            resultsEl.innerHTML = '<div style="color:red; text-align:center; font-size:1.5rem;">Search failed</div>';
        });
}

// ── UI Helpers ──
function openOverlay(id) {
    document.getElementById(id).classList.add('active');
    if (id === 'overlay-search') {
        setTimeout(function() { document.getElementById('search-input').focus(); }, 200);
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
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 = 12
    m = m < 10 ? '0' + m : m;
    document.getElementById('clock').innerText = h + ":" + m + " " + ampm;
}

function syncWeather() {
    // Honolulu coordinates
    fetch('https://api.open-meteo.com/v1/forecast?latitude=21.3069&longitude=-157.8583&current_weather=true&temperature_unit=fahrenheit')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var w = data.current_weather;
            if (w) {
                document.getElementById('weather').innerText = Math.round(w.temperature) + "°F " + getWeatherEmoji(w.weathercode);
            }
        });
}

function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    return '🌦️';
}

// ── Init ──
updateClock();
setInterval(updateClock, 1000);
syncWeather();
setInterval(syncWeather, 600000);

// Handle Enter key in search
document.getElementById('search-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
});
