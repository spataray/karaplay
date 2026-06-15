// v3.10.0 (2026-06-14 23:28 HST): Sense selected Karaoke songs and play similar Karaoke songs in algorithmic Queue/mix.
// v3.9.0 (2026-06-14 11:35 HST): Created dedicated slide-out Karaoke overlay triggered by the Sing button.
// v3.8.0 (2026-06-14 11:22 HST): Added global Karaoke Mode toggle & current track karaoke search logic.
// v3.7.3 (2026-06-14 10:57 HST): Updated Araya's playlist with parsed Thai song collection.
// v3.7.2 (2026-06-13 18:14 HST): Updated P Phu's playlist with parsed genre-sorted song collection.
// v3.7.1 (2026-06-11 21:27 HST): Keep fullscreen button transparent/see-through even when active.
// v3.5.6 (2026-05-28 21:07 HST): Added touch/mouse draggable currently playing song banner with persistence.
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
var rightQueueLimit = 20;
var isRightQueueOpen = false;
var isRightKaraokeOpen = false;
var isKaraokeQueueMode = false;

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

var P_PHU_SONGS = [
    "10 Years - Wasteland",
    "10 Years - Beautiful",
    "10 Years - Shoot It Out",
    "3 Doors Down - Kryptonite",
    "3 Doors Down - Here Without You",
    "3 Doors Down - When I'm Gone",
    "Alter Bridge - Metalingus",
    "Alter Bridge - Blackbird",
    "Alter Bridge - Watch Over You",
    "Audioslave - Like a Stone",
    "Audioslave - Show Me How to Live",
    "Audioslave - Cochise",
    "Audioslave - I Am the Highway",
    "Breaking Benjamin - The Diary of Jane",
    "Breaking Benjamin - Breath",
    "Breaking Benjamin - So Cold",
    "Chevelle - The Red",
    "Chevelle - Send the Pain Below",
    "Chevelle - Vitamin R (Leading Us Along)",
    "Cold - Stupid Girl",
    "Cold - Suffocate",
    "Cold - Just Got Wicked",
    "Creed - Higher",
    "Creed - With Arms Wide Open",
    "Creed - My Sacrifice",
    "Crossfade - Cold",
    "Crossfade - Colors",
    "Crossfade - So Far Away",
    "Default - Wasting My Time",
    "Default - Deny",
    "Default - Live a Lie",
    "Deftones - My Own Summer (Shove It)",
    "Deftones - Change (In the House of Flies)",
    "Deftones - Be Quiet and Drive (Far Away)",
    "Disturbed - Down with the Sickness",
    "Disturbed - The Sound of Silence",
    "Disturbed - Stricken",
    "Drowning Pool - Bodies",
    "Drowning Pool - Tear Away",
    "Drowning Pool - Sinner",
    "Finger Eleven - Paralyzer",
    "Finger Eleven - One Thing",
    "Finger Eleven - Good Times",
    "Foo Fighters - Everlong",
    "Foo Fighters - The Pretender",
    "Foo Fighters - Best of You",
    "Foo Fighters - Learn to Fly",
    "Fuel - Hemorrhage (In My Hands)",
    "Fuel - Shimmer",
    "Fuel - Falls on Me",
    "Godsmack - I Stand Alone",
    "Godsmack - Voodoo",
    "Godsmack - Awake",
    "Hinder - Lips of an Angel",
    "Hinder - Better Than Me",
    "Hinder - Get Stoned",
    "Incubus - Drive",
    "Incubus - Pardon Me",
    "Incubus - Wish You Were Here",
    "Korn - Freak on a Leash",
    "Korn - Falling Away from Me",
    "Korn - Blind",
    "Nickelback - How You Remind Me",
    "Nickelback - Photograph",
    "Nickelback - Rockstar",
    "Papa Roach - Last Resort",
    "Papa Roach - Scars",
    "Papa Roach - Getting Away With Murder",
    "Puddle of Mudd - Blurry",
    "Puddle of Mudd - She Hates Me",
    "Puddle of Mudd - Control",
    "Saliva - Click Click Boom",
    "Saliva - Always",
    "Saliva - Your Disease",
    "Seether - Fake It",
    "Seether - Remedy",
    "Seether - Broken",
    "Sevendust - Bitch",
    "Sevendust - Denial",
    "Sevendust - Black",
    "Shinedown - Second Chance",
    "Shinedown - Sound of Madness",
    "Shinedown - Simple Man",
    "Staind - It's Been Awhile",
    "Staind - Outside",
    "Staind - So Far Away",
    "Stone Sour - Through Glass",
    "Stone Sour - Bother",
    "Stone Sour - Absolute Zero",
    "Theory of a Deadman - Bad Girlfriend",
    "Theory of a Deadman - Hate My Life",
    "Theory of a Deadman - Rx (Medicate)",
    "AC/DC - Back In Black",
    "AC/DC - Highway to Hell",
    "AC/DC - Thunderstruck",
    "AC/DC - You Shook Me All Night Long",
    "Aerosmith - Dream On",
    "Aerosmith - Sweet Emotion",
    "Aerosmith - Walk This Way",
    "Aerosmith - Crazy",
    "Bon Jovi - Livin' on a Prayer",
    "Bon Jovi - Wanted Dead or Alive",
    "Bon Jovi - You Give Love a Bad Name",
    "Boston - More Than a Feeling",
    "Boston - Peace of Mind",
    "Boston - Foreplay/Long Time",
    "Cheap Trick - I Want You to Want Me",
    "Cheap Trick - Surrender",
    "Cheap Trick - The Flame",
    "Cinderella - Nobody's Fool",
    "Cinderella - Don't Know What You Got (Till It's Gone)",
    "Cinderella - Gypsy Road",
    "Def Leppard - Pour Some Sugar on Me",
    "Def Leppard - Photograph",
    "Def Leppard - Hysteria",
    "Dokken - Dream Warriors",
    "Dokken - In My Dreams",
    "Dokken - Alone Again",
    "Foreigner - I Want to Know What Love Is",
    "Foreigner - Cold As Ice",
    "Foreigner - Juke Box Hero",
    "Guns N' Roses - Sweet Child O' Mine",
    "Guns N' Roses - Welcome to the Jungle",
    "Guns N' Roses - November Rain",
    "Heart - Barracuda",
    "Heart - Crazy on You",
    "Heart - Magic Man",
    "Journey - Don't Stop Believin'",
    "Journey - Any Way You Want It",
    "Journey - Separate Ways (Worlds Apart)",
    "Kiss - Rock and Roll All Nite",
    "Kiss - Detroit Rock City",
    "Kiss - I Was Made for Lovin' You",
    "Kix - Don't Close Your Eyes",
    "Kix - Blow My Fuse",
    "Kix - Cold Blood",
    "Lita Ford - Kiss Me Deadly",
    "Lita Ford - Close My Eyes Forever",
    "Lita Ford - Shot of Poison",
    "Mötley Crüe - Kickstart My Heart",
    "Mötley Crüe - Girls, Girls, Girls",
    "Mötley Crüe - Dr. Feelgood",
    "Night Ranger - Sister Christian",
    "Night Ranger - Don't Tell Me You Love Me",
    "Night Ranger - When You Close Your Eyes",
    "Poison - Every Rose Has Its Thorn",
    "Poison - Nothin' But a Good Time",
    "Poison - Talk Dirty to Me",
    "Quiet Riot - Cum On Feel the Noize",
    "Quiet Riot - Metal Health (Bang Your Head)",
    "Quiet Riot - Mama Weer All Crazee Now",
    "Ratt - Round and Round",
    "Ratt - Lay It Down",
    "Ratt - Way Cool Jr.",
    "REO Speedwagon - Keep On Loving You",
    "REO Speedwagon - Can't Fight This Feeling",
    "REO Speedwagon - Take It on the Run",
    "Scorpions - Rock You Like a Hurricane",
    "Scorpions - Wind of Change",
    "Scorpions - Still Loving You",
    "Skid Row - 18 and Life",
    "Skid Row - I Remember You",
    "Skid Row - Youth Gone Wild",
    "Styx - Renegade",
    "Styx - Come Sail Away",
    "Styx - Mr. Roboto",
    "Survivor - Eye of the Tiger",
    "Survivor - Burning Heart",
    "Survivor - The Search Is Over",
    "Tesla - Love Song",
    "Tesla - Signs",
    "Tesla - What You Give",
    "Twisted Sister - We're Not Gonna Take It",
    "Twisted Sister - I Wanna Rock",
    "Twisted Sister - The Price",
    "Van Halen - Jump",
    "Van Halen - Panama",
    "Van Halen - Runnin' with the Devil",
    "Warrant - Cherry Pie",
    "Warrant - Heaven",
    "Warrant - Uncle Tom's Cabin",
    "Whitesnake - Here I Go Again",
    "Whitesnake - Is This Love",
    "Whitesnake - Still of the Night",
    "Alice in Chains - Man in the Box",
    "Alice in Chains - Rooster",
    "Alice in Chains - Would?",
    "Bad Religion - American Jesus",
    "Bad Religion - Infected",
    "Bad Religion - 21st Century (Digital Boy)",
    "Blind Melon - No Rain",
    "Blind Melon - Change",
    "Blind Melon - Galaxie",
    "Blink-182 - All the Small Things",
    "Blink-182 - What's My Age Again?",
    "Blink-182 - I Miss You",
    "Blur - Song 2",
    "Blur - Girls & Boys",
    "Blur - Parklife",
    "Bush - Glycerine",
    "Bush - Machinehead",
    "Bush - Comedown",
    "Candlebox - Far Behind",
    "Candlebox - You",
    "Candlebox - Cover Me",
    "Collective Soul - Shine",
    "Collective Soul - The World I Know",
    "Collective Soul - December",
    "Everclear - Santa Monica",
    "Everclear - Father of Mine",
    "Everclear - I Will Buy You a New Life",
    "Green Day - Basket Case",
    "Green Day - American Idiot",
    "Green Day - Boulevard of Broken Dreams",
    "Hole - Celebrity Skin",
    "Hole - Violet",
    "Hole - Doll Parts",
    "Jane's Addiction - Jane Says",
    "Jane's Addiction - Been Caught Stealing",
    "Jane's Addiction - Mountain Song",
    "Live - Lightning Crashes",
    "Live - I Alone",
    "Live - Selling the Drama",
    "Nirvana - Smells Like Teen Spirit",
    "Nirvana - Come As You Are",
    "Nirvana - Heart-Shaped Box",
    "NOFX - Linoleum",
    "NOFX - Don't Call Me White",
    "NOFX - Bob",
    "Oasis - Wonderwall",
    "Oasis - Don't Look Back in Anger",
    "Oasis - Champagne Supernova",
    "Pearl Jam - Alive",
    "Pearl Jam - Even Flow",
    "Pearl Jam - Black",
    "Pennywise - Bro Hymn",
    "Pennywise - Fuck Authority",
    "Pennywise - Alien",
    "Radiohead - Creep",
    "Radiohead - Karma Police",
    "Radiohead - No Surprises",
    "Rancid - Ruby Soho",
    "Rancid - Time Bomb",
    "Rancid - Fall Back Down",
    "Red Hot Chili Peppers - Under the Bridge",
    "Red Hot Chili Peppers - Californication",
    "Red Hot Chili Peppers - Can't Stop",
    "Silverchair - Tomorrow",
    "Silverchair - Freak",
    "Silverchair - Anthem for the Year 2000",
    "Smashing Pumpkins - 1979",
    "Smashing Pumpkins - Bullet with Butterfly Wings",
    "Smashing Pumpkins - Tonight, Tonight",
    "Social Distortion - Story of My Life",
    "Social Distortion - Ball and Chain",
    "Social Distortion - Reach for the Sky",
    "Soundgarden - Black Hole Sun",
    "Soundgarden - Spoonman",
    "Soundgarden - Fell on Black Days",
    "Stone Temple Pilots - Interstate Love Song",
    "Stone Temple Pilots - Plush",
    "Stone Temple Pilots - Vasoline",
    "Sum 41 - Fat Lip",
    "Sum 41 - In Too Deep",
    "Sum 41 - Still Waiting",
    "The Cranberries - Zombie",
    "The Cranberries - Linger",
    "The Cranberries - Dreams",
    "The Offspring - Self Esteem",
    "The Offspring - Come Out and Play",
    "The Offspring - The Kids Aren't Alright",
    "Weezer - Buddy Holly",
    "Weezer - Say It Ain't So",
    "Weezer - Island in the Sun",
    "Hootie & the Blowfish - Only Wanna Be with You",
    "Hootie & the Blowfish - Let Her Cry",
    "Hootie & the Blowfish - Hold My Hand",
    "Counting Crows - Mr. Jones",
    "Counting Crows - A Long December",
    "Counting Crows - Accidentally in Love",
    "Train - Drops of Jupiter (Tell Me)",
    "Train - Meet Virginia",
    "Train - Hey, Soul Sister",
    "The Black Crowes - Hard to Handle",
    "The Black Crowes - She Talks to Angels",
    "The Black Crowes - Remedy",
    "Pink Floyd - Comfortably Numb",
    "Pink Floyd - Wish You Were Here",
    "Pink Floyd - Another Brick in the Wall, Pt. 2",
    "Ozzy Osbourne - Crazy Train",
    "Ozzy Osbourne - Mr. Crowley",
    "Ozzy Osbourne - No More Tears",
    "Metallica - Enter Sandman",
    "Metallica - Nothing Else Matters",
    "Metallica - Master of Puppets",
    "Evanescence - Bring Me to Life",
    "Evanescence - My Immortal",
    "Evanescence - Going Under",
    "Buckcherry - Crazy Bitch",
    "Buckcherry - Lit Up",
    "Buckcherry - Sorry",
    "Boyce Avenue - Fast Car (Cover)",
    "Boyce Avenue - Iris (Cover)",
    "Boyce Avenue - We Can't Stop (Cover)",
    "Early Bruno Mars - Locked Out of Heaven",
    "Early Bruno Mars - Runaway Baby",
    "Early Bruno Mars - Grenade"
];

function cleanSongForQuery(song) {
    if (!song) return "";
    var parts = song.split('-');
    if (parts.length < 2) {
        return song.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    var artist = parts[0].trim();
    var title = parts.slice(1).join('-').trim();
    
    // Check if title has parentheses
    var match = title.match(/\(([^)]+)\)/);
    if (match) {
        var parenthesized = match[1].trim();
        if (/[\u0E00-\u0E7F]/.test(parenthesized)) {
            title = parenthesized;
        } else {
            var mainPart = title.replace(/\([^)]+\)/g, '').trim();
            if (/[\u0E00-\u0E7F]/.test(mainPart)) {
                title = mainPart;
            } else {
                title = mainPart;
            }
        }
    }
    
    var cleanArtist = artist.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').trim();
    var cleanTitle = title.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').trim();
    return (cleanArtist + " " + cleanTitle).replace(/\s+/g, ' ').trim();
}

function loadPPhusPlaylist() {
    var activeKey = getApiKey();
    if (!activeKey) { alert("API Key Missing!"); return; }
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "Fetching P Phu's Rock & Alt...";
    
    // Select 8 random songs from P Phu's list
    var selected = [];
    var temp = P_PHU_SONGS.slice();
    var selectCount = Math.min(8, temp.length);
    for (var k = 0; k < selectCount; k++) {
        var idx = Math.floor(Math.random() * temp.length);
        selected.push('"' + cleanSongForQuery(temp.splice(idx, 1)[0]) + '"');
    }
    var q = selected.join(" OR ");
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(q) + "&type=video&videoEmbeddable=true&maxResults=50&key=" + activeKey;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var items = [];
                for (var i = 0; i < data.items.length; i++) {
                    var title = data.items[i].snippet.title;
                    if (!isChildrenSong(title) && !isCompilationVideo(title)) {
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

function isCompilationVideo(title) {
    if (!title) return false;
    var t = title.toLowerCase();
    var bad = ["playlist", "full album", "compilation", "mix", "greatest hits", "best of", "1 hour", "2 hour", "3 hour", "1hr", "2hr", "3hr", "nonstop", "non-stop", "ยาวๆ", "รวมเพลง", "longplay", "long play", "medley", "concert", "เมดเล่ย์", "คอนเสิร์ต"];
    for (var i = 0; i < bad.length; i++) {
        if (t.indexOf(bad[i]) !== -1) return true;
    }
    return false;
}

var ARAYA_SONGS = [
    "Smile Buffalo - Dee Kern Pai (ดีเกินไป)",
    "Carabao - Chao Tak (เจ้าตาก)",
    "Singto Numchok - Arai Kor Yom",
    "Amp Saowaluck - Chan Leo (ฉันเลว)",
    "Asanee Chotikul - Kor Koey Sanya (Solo Acoustic)",
    "Hammer - Bin Lha (บินหลา)",
    "Ble Patumrach - Yot Nam Ta (หยาดน้ำตา)",
    "Takkatan Chollada - Mai Chai Fan Tham Than (ไม่ใช่แฟนทำแทนไม่ได้)",
    "Pongsit Kamphee - Thang Klub Ban (ทางกลับบ้าน)",
    "Indochine - Sa-bai-dee Luang Prabang (สะบายดีหลวงพระบาง)",
    "Santi Duangsawang - Joob Mai Hwan (จูบไม่หวาน)",
    "Retrospect - Phit Thi Wai Jai",
    "Tai Orathai - Kin Khao Khon Diao Reu Yang (กินข้าวคนเดียวหรือยัง)",
    "Slot Machine - Waniphok",
    "Palmy - Bow Rak See Dam",
    "New Jiew - Chan Leo",
    "Zeal - Song Rak (สองรัก)",
    "Bodyslam - Oak Hak (อกหัก)",
    "No One Else - Khor Pen Tua Luak",
    "Klear - Ngom Ngai",
    "I-Nam - Rak Khon Mee Jao Khong (รักคนมีเจ้าของ)",
    "Yodrak Salakjai - Sam Sib Young Jaew (30 ยังแจ๋ว)",
    "Am Seatwo - Mah Noey (หมาน้อย)",
    "Jaran Manopetch - Sao Motorbike (สาวมอเตอร์ไซค์)",
    "Micro - Ao Pai Loei (เอาไปเลย)",
    "Monkan Kankoon - Kham Wa Hak Kan Man Hia Thim Sai (คำว่าฮักกันมันเหี่ยถิ่มไส)",
    "Am Seatwo - Som Sarn",
    "Big Ass - Foon (ฝุ่น)",
    "Maleehuana - Head Tang (เหตุทาง)",
    "Jannine Weigel",
    "Lamyai Haithongkham - Phu Sao Kha Loh (ผู้สาวขาเลาะ)",
    "Bodyslam - Khwam Chuea (ความเชื่อ)",
    "Pumpuang Duangjan - Takat Phook Bo (ตั๊กแตนผูกโบว์)",
    "Asanee-Wasan - Yin Yom (ยินยอม)",
    "Phai Phongsathon - Sanya Hak Tee Kam Chanod (สัญญาฮักที่คำชะโนด)",
    "Bird Thongchai - Sabai Sabai (สบาย สบาย)",
    "Mask Black Crow (Ae Jirakorn) - Bua Loi *(The Mask Singer Thailand)",
    "Singular - Kae Nan",
    "Dok-Aor Toongthong - Mia Kao (เมียเก่า)",
    "Kong Huayrai - Khu Khong (คู่คอง)",
    "Labanoon - Chueak Wiset (เชือกวิเศษ)",
    "Pongsit Kamphee - Kae Nan (แค่นั้น)",
    "Blackhead - Yu Pai Cham Pai (อยู่ไปช้ำไป)",
    "Clash - Pao Ying Chub (เป่ายิ้งฉุบ)",
    "Snack Atcharee - Kor Jai Ter Laek Ber Too",
    "Carabao - Thaharn Odoton (ท.ทหารอดทน)",
    "Bodyslam - Saeng Sud Tai (แสงสุดท้าย)",
    "Carabao - Bua Loi (บัวลอย)",
    "Tattoo Colour - Kha Mu (ขาหมู)",
    "Got Jakraphan - Request Love (ขอเป็นพระเอกในหัวใจเธอ)",
    "Pumpuang Duangjan - Nak Rong Ban Nok (นักร้องบ้านนอก)",
    "Clash - Kor Chuay Dtua Aeng (กอด)",
    "Caravan - Ying Rak Mueang Thai (ยิ่งรักเมืองไทย)",
    "Loso - Raan Lao Rim Tang (ร้านเหล้าริมทาง)",
    "Loso - Jai Sang Ma (ใจสั่งมา)",
    "Am Seatwo - Raan Lao Rim Tang",
    "Mask Sumo (Lydia Sarunrat) - Ji Ja *(The Mask Singer Thailand)",
    "Am Seatwo - Cheuk Wiset (เชือกวิเศษ)",
    "Am Seatwo - Rok Soem Tang (โรคซึมเศร้า)",
    "Pongsit Kamphee - Rueng Rao (เรื่องราว)",
    "Sipueak Kondankwian - Khon Check Nang (คนเช็ดน้ำตา)",
    "Mask Black Crow (Ae Jirakorn) - Yin Yom *(The Mask Singer Thailand)",
    "Phongthep Kradonchamnan - Jao Sao Phee Suea (เจ้าสาวผีเสื้อ)",
    "Jintara Poonlarp - Rak Tae Mee Khae Mae (รักแท้มีแค่แม่)",
    "Tai Orathai - Thon Dai Thook Thee Tee Jao Rak (ทนได้ทุกทีที่เจ้ารัก)",
    "Klear - Len Khong Soong",
    "Micro - Rak Pon Pon (รักปอนปอน)",
    "Phongthep Kradonchamnan - Noom Baan Nok (หนุ่มบ้านนอก)",
    "Zeal - Mod Gaew (หมดแก้ว)",
    "Labanoon - Yarm (ยาม)",
    "Silly Fools - Nai Fan (ในฝัน)",
    "Carabao - Waniphok (วณิพก)",
    "Phongthep Kradonchamnan - Tang Kae (ตังเก)",
    "Pongsit Kamphee - Duen Phen",
    "Carabao - Raon Raen (รอนแรม)",
    "Klear - Ruedoo Ron",
    "Fly - Bai Mai (ใบไม้)",
    "Monkan Kankoon - Ah-ai Jae Jao (งานแต่งคนจน)",
    "Tai Orathai - Kid Heung Siang Pin (คิดฮอดเสียงพิณ)",
    "Pongsit Kamphee - Suea Tua Thee 11 (เสือตัวที่ 11)",
    "Khai Mook - Sai Wa Si Bo Thim Kan",
    "Mike Phiromphon - Plao Jai Khon Rak (ละครชีวิต)",
    "Klear - Rak Mai Tongkarn Wela (รักไม่ต้องการเวลา)",
    "Takkatan Chollada - Riak Ter Wa Fan Dai Mai (เรียกเธอว่าแฟนได้ไหม)",
    "Smile Buffalo - Fah Young Fa (ฟ้ายังฟ้าอยู่)",
    "Tai Orathai - Siang Khaen Jak Man-hat-tan (เสียงแคนจากแมนฮัตตัน)",
    "Mike Phiromphon - Pao Din Jin Khao (ผ้าขาวบนบ่าซ้าย)",
    "Labanoon - Pae Thang (แพ้ทาง)",
    "Kyutae Oppa - Leum Pai Mai Rak Kan",
    "Siriporn Ampaipong - Parinya Jai (ปริญญาใจ)",
    "Phongthep Kradonchamnan - Lom Ramphuey (ลมรำเพย)",
    "Sipueak Kondankwian - Thang Sai Kao (ทางสายเก่า)",
    "Punch Worakarn - Jai Sang Ma",
    "Got Jakraphan - Ked Ma Phoeng (เกลียดห้องเบอร์ห้า)",
    "Nuvo - Leum Pai Mai Rak Kan (ลืมไปไม่รักกัน)",
    "Lamyai Haithongkham - Jai Si Pay (ใจสิเพ)",
    "Hope - Kam Sanya Tee Wang Plao (คำสัญญาที่ว่างเปล่า)",
    "Amp Saowaluck - Khwam Song Jam (ความทรงจำ)",
    "Clash - Thai Rak Thai (ไทยรักไทย)",
    "Pongsit Kamphee - Talod Wela (ตลอดเวลา)",
    "Suraphol Sombatcharoen - Sip Hok Pee Haeng ความหลัง (16 ปีแห่งความหลัง)",
    "Aed Carabao - Duen Phen (เดือนเพ็ญ)",
    "Caravan - Dao Jampa (ดวงจำปา)",
    "Silly Fools - Nam Lai (น้ำลาย)",
    "Aekachai - Som Sarn *(The Voice Thailand Blind Audition)",
    "Asanee-Wasan - Kor Koey Sanya (ก็เคยสัญญา)",
    "Da Endorphine - Kreung Neung Khong Cheewit",
    "Carabao - Somtam (ส้มตำ)",
    "Aed Carabao - Thalae Jai (ทะเลใจ)",
    "Pongsit Kamphee - Wan Thong (วันทอง)",
    "Maleehuana - Tha Wang (ท่าวัง)",
    "Sweet Mullet - Ji Ja",
    "Carabao - Luang Ta (หลวงตา)",
    "Sayan Sanya - Kai Na Mon (ไก่นามน)",
    "Carabao - Yai Sam-ang (ยายสำอาง)",
    "Phai Phongsathon - Thab Thim Krob (ทบ.2 ลูกอีสาน)",
    "Toon Bodyslam - Yin Yom",
    "Potato - Rak Pon Pon",
    "Jintara Poonlarp - Tao Ngoi (เต่างอย)",
    "Loso - Arai Kor Yom (อะไรก็ยอม)",
    "Caravan - Khuen Rang (คืนรัง)",
    "Phai Phongsathon - Kon Bahn Diow Gun (คนบ้านเดียวกัน)",
    "Big Ass - Phrom Likhit (พรหมลิขิต)",
    "Tai Orathai - Dok Ya Nai Pa Poon (ดอกหญ้าในป่าปูน)",
    "Jaran Manopetch - Uyy Kham (อุ๊ยคำ)",
    "Bird Thongchai - Koo Kad (คู่กัด)",
    "Silly Fools - Ji Ja (จิ๊จ๊ะ)",
    "Tree Chainarong & Kowtip Thidahdin - Koo Kad",
    "Hope - Nok See Lueang (นกสีเหลือง)",
    "Monkan Kankoon - Rim Fang Nong Han (ริมฝั่งหนองหาน)",
    "Tom Isara (Room 39) - Khor Pen Tua Luak *(Live Acoustic)",
    "Phongthep Kradonchamnan - Fon Chang Nang (ฝนจางนางหาย)",
    "So Cool - Khon Jiam Tua (คนเจียมตัว)",
    "Paowalee Pournpmpan - Nak Rong Ban Nok",
    "Suraphol Sombatcharoen - Sip Hok Pee Haeng Khwam Wang (16 ปีแห่งความหลัง)",
    "Amp Saowaluck - Kreung Neung Khong Cheewit (ครึ่งหนึ่งของชีวิต)",
    "Asanee-Wasan - Krung King (กรุงเทพมหานคร)",
    "Takkatan Chollada - Jook San (จุกศัลย์)",
    "Clash - Kho Chet Nam Ta (ขอเช็ดน้ำตา)",
    "Bowkylion - Song Rak",
    "Loso - Pan Thip (พันธุ์ทิพย์)",
    "Mike Phiromphon - เหนื่อยไหมคนดี (Nuey Mai Khon Dee)",
    "Monkan Kankoon - Vun Kit Hot (สัญญาน้ำตาแม่)",
    "Mike Phiromphon - Nuey Mai Khon Dee (เหนื่อยไหมคนดี)",
    "Scrubb - Khao Kan Dee (เข้ากันดี)",
    "Am Seatwo - Kho Chet Nam Ta *(Live Acoustic Session)",
    "Got Jakraphan - Som Wang Nao Nao (สมหวังนะครับ)",
    "Kong Huayrai - Sai Wa Si Bo Thim Kan (ไสว่าสิบ่ถิ่มกัน)",
    "Loso - Mae (แม่)",
    "Got Jakraphan - Rak Khoon Ying Gwa Krai (รักคุณยิ่งกว่าใคร)",
    "Keng Thachaya - Saeng Sud Tai *(The Voice Thailand)",
    "Bodyslam - Ngom Ngai (งมงาย)",
    "Maleehuana - Phromlikhit (พรหมลิขิต)",
    "Tai Orathai - Parinya Jai",
    "Siriporn Ampaipong - Bow Rak See Dam (โบว์รักสีดำ)",
    "Silly Fools - Khee Heung (ขี้หึง)",
    "Paradox - Ruedoo Ron (ฤดูร้อน)",
    "Palmy - Talod Wela",
    "Caravan - Phong Phai (พงไพร)",
    "Singto Numchok - Thalae Jai",
    "Asanee-Wasan - Dai Yang Sia Yang (ได้อย่างเสียอย่าง)",
    "Zu Zu - Khon Lha Fhun (คนล่าฝัน)",
    "Silly Fools - Peang Rak (เพียงรัก)",
    "Loso - Mai Taew (ไม่ตายหรอกเธอ)",
    "Am Seatwo - Chueak Wiset",
    "Kala - 4 Natee (4 นาที)",
    "Mask Oyster (Ohm Cocktail) - Mod Gaew *(The Mask Singer Thailand - one of the most viewed performances in the show's history)",
    "Pongsit Kamphee - Noom Noy (หนุ่มน้อย)",
    "Pongsit Kamphee - Jom Jone Khon Yak (จอมโจรคนยาก)",
    "Pongsit Kamphee - Khuen Rang",
    "I-Nam - Khon Rak Kon Raek (คนรักคนแรก)",
    "Caravan - Dok Mai Hai Khoon (ดอกไม้ให้คุณ)",
    "Takkatan Chollada - Fan Keb San (แฟนเก็บ)",
    "Ploy - Nak Rong Ban Nok *(The Voice Kids Thailand)",
    "Caravan - Jamphie (จำปี)",
    "Am Seatwo - Khon Mee Snae (คนมีเสน่ห์)",
    "Am Seatwo - Thoi Kham (ถ้อยคำ)",
    "Maleehuana - Krai Hin Binn (ใกล้หินบิน)",
    "Maleehuana - Mha Lah Nuea (หมาล่าเนื้อ)",
    "Singto Numchok - Rak Diaw",
    "Zu Zu - Mayasari (มยุรา)",
    "Phongthep Kradonchamnan - Khon Kub Chang (คนกับช้าง)",
    "Asanee-Wasan - Hua Jai Sakaew (หัวใจสะออน)",
    "Silly Fools - Wat Jai (วัดใจ)",
    "Moonhunters - Ao Pai Loei",
    "Bodyslam - Ruea Lek Kuan Ok Fang (เรือเล็กควรออกจากฝั่ง)",
    "Maleehuana - Lom Phray (ลมเพ-ลมพัด)",
    "Carabao - Made In Thailand (เมดอินไทยแลนด์)",
    "Sornkhiri Sriprachuap - Nam Ta Ruang Lang Phra (น้ำตาค้างหลังพระ)",
    "Pongsit Kamphee - Haeng Khwam Wang (ความหวัง)",
    "Wanyai - Jai Sang Ma *(Live Acoustic)",
    "Pumpuang Duangjan - Kai Na Mon (แก้วรอพี่)",
    "Som Marie - Yarm",
    "Carabao - Mae Sai (แม่สาย)",
    "Pongsit Kamphee - Phai Sanyat (ภัยผู้เย้ายวน)",
    "Zara - Khon Sola",
    "Big Ass - Len Khong Soong (เล่นของสูง)",
    "Kala - Khor Pen Tua Luak (ขอเป็นตัวเลือก)",
    "Maleehuana - Ruea Rak Kradat (เรือรักกระดาษ)",
    "Mask Turtle (Panadda) - Tao Ngoi *(The Mask Singer Thailand)",
    "Phai Phongsathon - Yak Mee Ter Pen Fan (อยากมีเธอเป็นแฟน)",
    "Carabao - Khon Sola (คนล่าฝัน)",
    "Tai Orathai - Mue Thue Mike Jai Riak Rong (มือถือไมค์ใจร้องไห้)",
    "So Cool - Liang Song (เลี้ยงส่ง)",
    "Amp Saowaluck - Rak Yai Kam Dee Bng (รักใหญ่กว่าโลก)",
    "Ble Patumrach - Ai Mee Het Pon (อ้ายมีเหตุผล)",
    "Loso - Rao Lae Nai (เราและนาย)",
    "Yodrak Salakjai - Mon Rak Luk Thung (มนต์รักลูกทุ่ง)",
    "Tattoo Colour - Fa (ฟ้า)",
    "Carabao - Nang Ngam Too Krajok (นางงามตู้กระจก)",
    "Sorn Sinchai - Phua Kao (ผัวเก่า)",
    "Caravan - Khon Kap Khwai (คนกับควาย)",
    "Clash - Rok Pra Jam Tua (โรคประจำตัว)",
    "Silly Fools - Phit Thi Wai Jai (ผิดที่ไว้ใจ)",
    "Pongsit Kamphee - Rak Diaw (รักเดียว)",
    "Pongsri Woranuch - Mueang Phot (ด่วนขอนแก่น)",
    "Banyen Rakgan - Ngiew Tong Ton (งิ้วต่องต้อน)",
    "Jaran Manopetch - Mae Ping (แม่ปิง)",
    "Sorn Sinchai - Nam Ta Yoi Pok (น้ำตาย้อยโป๊ก)",
    "Wonderframe - Foon",
    "Mike Phiromphon - Kam Khao San (กำลังใจในแววตา)",
    "Paradox - Mee Tae Ter (มีแต่เธอ)",
    "Bodyslam - Khrai Khue Rao (ใครคือเรา)",
    "Big Ass - Khon Mai Ao Nai (คนไม่เอาถ่าน)",
    "Sunaree Ratchasima - Nam Ta Saimit (น้ำตาสายมิตร)",
    "Puthita (พุทิตา) - Rak Diaw *(Acoustic Session)",
    "Max Jenmana - Ngom Ngai *(The Voice Thailand)",
    "Carabao - Phra Naresuan (พระนเรศวร)",
    "Asanee-Wasan - Khon Sud Tai (คนสุดท้าย)",
    "Takkatan Chollada - Dok Neen Nai Pa Ya (ดอกนีออนโปรยค่ำ)",
    "Loso - Juk Yan See Daeng (จักรยานสีแดง)",
    "Micro - Som Lon (ส้มหล่น)",
    "Hammer - Na Na (นาแล้ง)",
    "Fly - Bin (บิน)",
    "Tai Orathai - Sunya Na Mon (สัญญาหน้ามน)",
    "Carabao - Ganja (กัญชา)",
    "Bird Thongchai - Ngiab Ngiab Khon Diao (เงียบๆ คนเดียว)",
    "Bodyslam - Made In Thailand",
    "Pongsit Kamphee - Kid Teung (คิดถึง)",
    "Takkatan Chollada - Khon Ngao Tee Kao Jai Ter (คนเหงาที่เข้าใจเธอ)",
    "Got Jakraphan - Charoen Charoen (เจริญ เจริญ)",
    "Pongsit Kamphee - Fah Soong Phandee Tam (ฟ้าสูงแผ่นดินต่ำ)",
    "Pornsak Songsaeng - Toey Sao Jan (เต้ยสาวจันทร์)",
    "Pumpuang Duangjan - Kra Sae Map (กระแซะเข้ามาซิ)",
    "Yinglee Srijumpol - Ying Lan La (หญิงลั้ลลา)",
    "Room 39 - Khao Kan Mai Dai (เข้ากันไม่ได้)",
    "Pornsak Songsaeng - Sao Jan Kang Koab (สาวจันทร์กั้งโกบ)",
    "The Voice Thailand Contestants - Saeng Sud Tai",
    "Boy Peacemaker - Kuan Gwan Dai Mai (การเปลี่ยนแปลง)",
    "Tai Orathai - Khon In Trend (คนอินเทรนด์)",
    "Phai Phongsathon - Mah Noey Rim Thang (หมาน้อยริมทาง)",
    "Pongsit Kamphee - Nak Sue Mue Plao (นักสู้มือเปล่า)",
    "Loso - Som Sarn (ซมซาน)",
    "Scrubb - Thuk Yang (ทุกอย่าง)",
    "Pumpuang Duangjan - Hang Noy Thoy Nid (ห่างหน่อยถอยนิด)",
    "Amp Saowaluck - Pib Nam Ta (บีบน้ำตา)",
    "Yinglee Srijumpol - Kor Jai Ter Laek Ber Too (ขอใจเธอแลกเบอร์โทร)",
    "Asanee-Wasan - Rak Ter Samer (รักเธอเสมอ)",
    "Tai Orathai - Nak Rong Ban Nok",
    "Carabao - Amnaat (อำนาจ)",
    "Keng Thachaya - Ji Ja *(The Voice Thailand)",
    "Pumpuang Duangjan - Somtam (ส้มตำ)",
    "Blackhead - Het Pon (เหตุผล)",
    "Mike Phiromphon - Ya Jai Khon Jon (ยาใจคนจน)",
    "Tai Orathai - Nang Ngam Too Krajok",
    "Carabao - Rak Toramani (รักทรหด)",
    "Lipta - Khee Heung",
    "Nuvo - Sud Sud Pai Loey (สุดๆ ไปเลย)",
    "Zu Zu - Bo Sang Kang Jong (บ่อสร้างกางจ้อง)",
    "Aof Pongsak - Ngiab Ngiab Khon Diao",
    "Carabao - Thanon Sai Nee (ถนนสายนี้)",
    "Potato - Rak Ter Samer",
    "Potato - Thalae Jai"
];

function loadArayasPlaylist() {
    var activeKey = getApiKey();
    if (!activeKey) { alert("API Key Missing!"); return; }
    var resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = "กำลังดึงข้อมูลเพลงโปรดของอารยา...";
    
    // Select 8 random songs from Araya's list
    var selected = [];
    var temp = ARAYA_SONGS.slice();
    var selectCount = Math.min(8, temp.length);
    for (var k = 0; k < selectCount; k++) {
        var idx = Math.floor(Math.random() * temp.length);
        selected.push('"' + cleanSongForQuery(temp.splice(idx, 1)[0]) + '"');
    }
    var q = selected.join(" OR ");
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(q) + "&type=video&videoEmbeddable=true&maxResults=50&key=" + activeKey;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var filtered = [];
                for (var i = 0; i < data.items.length; i++) {
                    var title = data.items[i].snippet.title;
                    if (!isChildrenSong(title) && !isCompilationVideo(title)) {
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

function togglePPhusPanel() {
    var body = document.body;
    var isMediaActive = document.getElementById('panel-media').classList.contains('active');
    var isRightAligned = body.classList.contains('right-align');
    
    if (isMediaActive && !isRightAligned) {
        togglePanel('media');
        window.isArayaActive = false;
        updateQueueList();
    } else {
        body.classList.remove('right-align');
        window.isArayaActive = false;
        
        // Open the media panel on the left
        var allPanels = document.querySelectorAll('.tool-panel');
        for (var i = 0; i < allPanels.length; i++) allPanels[i].classList.remove('active');
        var allBtns = document.querySelectorAll('.control-btn');
        for (var j = 0; j < allBtns.length; j++) allBtns[j].classList.remove('active');
        
        document.getElementById('panel-media').classList.add('active');
        document.getElementById('btn-pphu-toggle').classList.add('active');
        body.classList.add('panel-open');
        
        loadPPhusPlaylist();
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
            playRadio(vid, false, title); 
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
                                    '<button onclick="trackPlayback(\''+item.id+'\', \''+item.snippet.title.replace(/'/g, "\\'")+'\', \''+item.snippet.thumbnails.default.url+'\'); playRadio(\''+item.id+'\', false, \''+item.snippet.title.replace(/'/g, "\\'")+'\')" class="mini-btn" style="padding:5px;">' + playLabel + '</button>' +
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

function playNotificationChime() {
    try {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        var ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        // Note 1: E5 (659.25 Hz)
        var osc1 = ctx.createOscillator();
        var gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);
        
        // Note 2: A5 (880.00 Hz) at delay of 0.12 seconds
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.52);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.52);
    } catch (e) {
        console.warn("Audio Context failed to play chime: ", e);
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
                        
                        // Select a creative drift animation effect at random
                        var effects = ['toast-heartbeat', 'toast-wiggle', 'toast-feather', 'toast-bounce'];
                        var chosenEffect = effects[Math.floor(Math.random() * effects.length)];
                        
                        // Reset classes first to prevent piling up
                        toastEl.classList.remove('toast-heartbeat', 'toast-wiggle', 'toast-feather', 'toast-bounce');
                        toastEl.classList.add(chosenEffect);
                        
                        // Trigger flashy visual particles (stars, music notes)
                        spawnToastParticles(toastEl, chosenEffect);
                        
                        toastEl.classList.add('active');
                        setTimeout(function() {
                            toastEl.classList.remove('active');
                            toastEl.classList.remove('toast-heartbeat', 'toast-wiggle', 'toast-feather', 'toast-bounce');
                            
                            // Cleanup particles to avoid DOM bloat
                            var oldParticles = toastEl.querySelectorAll('.toast-particle');
                            var k;
                            for (k = 0; k < oldParticles.length; k++) {
                                toastEl.removeChild(oldParticles[k]);
                            }
                            var oldBurst = toastEl.querySelectorAll('.toast-burst-particle');
                            for (k = 0; k < oldBurst.length; k++) {
                                toastEl.removeChild(oldBurst[k]);
                            }
                        }, 12000);
                    }
                }
            } catch(e) { /* ignore error */ }
        }
    };
    xhr.send();
}

function spawnToastParticles(toastEl, effect) {
    // Play the Web Audio API notification chime
    playNotificationChime();

    // Clear any previous stray particles first
    var oldParticles = toastEl.querySelectorAll('.toast-particle');
    var k;
    for (k = 0; k < oldParticles.length; k++) {
        toastEl.removeChild(oldParticles[k]);
    }
    var oldBurst = toastEl.querySelectorAll('.toast-burst-particle');
    for (k = 0; k < oldBurst.length; k++) {
        toastEl.removeChild(oldBurst[k]);
    }

    // Determine themed symbol set
    var symbols;
    if (effect === 'toast-heartbeat') {
        symbols = ['❤️', '💖', '💝', '💕', '💗', '💓'];
    } else if (effect === 'toast-feather') {
        symbols = ['🪶', '✨', '🪶', '🕊️', '✨'];
    } else if (effect === 'toast-bounce') {
        symbols = ['✨', '✦', '★', '💥', '✨', '✦'];
    } else { // toast-wiggle
        symbols = ['🎵', '🎶', '♩', '♪', '✨', '✦'];
    }

    // 1. Ambient rising/drifting particles (12 to 17 particles)
    var particleCount = 12 + Math.floor(Math.random() * 6);
    var i;
    for (i = 0; i < particleCount; i++) {
        var p = document.createElement('span');
        p.className = 'toast-particle';
        p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        var startX = -10 + Math.random() * 120;
        var startY = -10 + Math.random() * 120;
        var driftX = -60 + Math.random() * 120;
        var driftY = -150 - Math.random() * 100;
        var delay = Math.random() * 1.5;
        var duration = 1.8 + Math.random() * 2.2;
        var size = 0.8 + Math.random() * 1.2;
        
        p.style.position = 'absolute';
        p.style.left = startX + '%';
        p.style.top = startY + '%';
        p.style.fontSize = size + 'rem';
        p.style.opacity = '0';
        p.style.pointerEvents = 'none';
        p.style.zIndex = '210';
        p.style.animation = 'float-particle ' + duration + 's ease-out ' + delay + 's infinite';
        
        p.style.setProperty('--drift-x', driftX + 'px');
        p.style.setProperty('--drift-y', driftY + 'px');
        
        toastEl.appendChild(p);
    }

    // 2. Explosion Burst Particles radiating from center (12 to 15 particles)
    var burstCount = 12 + Math.floor(Math.random() * 4);
    for (i = 0; i < burstCount; i++) {
        var bp = document.createElement('span');
        bp.className = 'toast-burst-particle';
        bp.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Start exactly at center of toast
        bp.style.left = '50%';
        bp.style.top = '50%';
        bp.style.position = 'absolute';
        bp.style.pointerEvents = 'none';
        bp.style.zIndex = '215';
        
        // Randomize direction angle and distance
        var angle = Math.random() * Math.PI * 2;
        var distance = 50 + Math.random() * 120; // radial distance (px)
        var burstX = Math.cos(angle) * distance;
        var burstY = Math.sin(angle) * distance;
        
        var burstDuration = 0.8 + Math.random() * 0.6; // 0.8 to 1.4 seconds
        var burstSize = 1.0 + Math.random() * 1.2; // rem
        
        bp.style.fontSize = burstSize + 'rem';
        bp.style.opacity = '0';
        bp.style.animation = 'burst-particle ' + burstDuration + 's cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
        
        bp.style.setProperty('--burst-x', burstX + 'px');
        bp.style.setProperty('--burst-y', burstY + 'px');
        
        toastEl.appendChild(bp);
    }
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
        
        if (data && data.title) {
            window.isKaraokeQueueMode = isKaraokeTitle(data.title);
        }
        
        if (document.getElementById('panel-lyrics').classList.contains('active')) { setTimeout(function() { fetchLyrics(); }, 2000); }
        startProgressPoller();
        
        // Reset limit and update right-side queue list
        window.rightQueueLimit = 20;
        
        if (window.isKaraokeQueueMode) {
            var pl = idsInCurrentQueue();
            var idx = pl.indexOf(videoId);
            if (idx !== -1) {
                ensureUpcomingKaraoke(pl, idx + 1, 5);
            }
        }
        
        if (window.isRightQueueOpen) {
            updateRightQueueList();
        }
    } else {
        stopProgressPoller();
    }
}

function playRadio(videoId, isResume, title) {
    console.log("playRadio called for: " + videoId + " (ready: " + playerReady + ")");
    if (!playerReady) { 
        console.warn("Player not ready yet, queuing...");
        setTimeout(function() { playRadio(videoId, isResume, title); }, 1000);
        return; 
    }
    if (title) {
        window.isKaraokeQueueMode = isKaraokeTitle(title);
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
                if (window.isKaraokeQueueMode) {
                    ensureUpcomingKaraoke(pl, 1, 5);
                } else {
                    if (document.getElementById('panel-media').classList.contains('active')) updateQueueList();
                    if (window.isRightQueueOpen) updateRightQueueList();
                }
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

    // Trigger Media Session API sync (Steering Wheel controls and system UI)
    updateMediaSession(cleanTitle(d.title), d.author || "Unknown Artist");
}

function updateMediaSession(title, artist) {
    if ('mediaSession' in navigator) {
        try {
            // Attempt to resolve video metadata and custom cover art
            var currentVid = "";
            if (player && typeof player.getVideoData === 'function') {
                var d = player.getVideoData();
                if (d) currentVid = d.video_id;
            }
            var thumbUrl = currentVid ? "https://img.youtube.com/vi/" + currentVid + "/hqdefault.jpg" : "";

            // Register system-level Media Metadata (shows album art, title, and artist on dashboard/Bluetooth UI)
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: "Karaplay",
                artwork: thumbUrl ? [
                    { src: thumbUrl, sizes: '480x360', type: 'image/jpeg' }
                ] : []
            });

            // Set system status state
            if (player && typeof player.getPlayerState === 'function') {
                var s = player.getPlayerState();
                navigator.mediaSession.playbackState = (s === 1) ? 'playing' : 'paused';
            }

            // Bind hardware steering wheel keys (prev/next/play/pause) to Karaplay functions
            navigator.mediaSession.setActionHandler('play', function() {
                if (player && player.playVideo) {
                    player.playVideo();
                    navigator.mediaSession.playbackState = 'playing';
                }
            });
            navigator.mediaSession.setActionHandler('pause', function() {
                if (player && player.pauseVideo) {
                    player.pauseVideo();
                    navigator.mediaSession.playbackState = 'paused';
                }
            });
            navigator.mediaSession.setActionHandler('previoustrack', function() {
                prevTrack();
            });
            navigator.mediaSession.setActionHandler('nexttrack', function() {
                nextTrack();
            });
        } catch(e) {
            console.warn("MediaSession API failed to initialize:", e);
        }
    }
}

function removeFromQueue(videoId) {
    var ids = idsInCurrentQueue();
    var idx = ids.indexOf(videoId);
    if (idx !== -1) { 
        ids.splice(idx, 1); 
        localStorage.setItem('kp_cached_queue', JSON.stringify(ids)); 
        updateQueueList(); 
        if (window.isRightQueueOpen) updateRightQueueList();
    }
}

function clearQueue() { 
    localStorage.removeItem('kp_cached_queue'); 
    updateQueueList(); 
    if (window.isRightQueueOpen) updateRightQueueList();
}

function clearQueueAndRefresh() {
    clearQueue();
    toggleRightQueue(false);
}

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

function initDraggableTrackInfo() {
    var trackInfo = document.getElementById('track-info');
    if (!trackInfo) return;

    var savedTop = localStorage.getItem('track_info_top');
    var savedLeft = localStorage.getItem('track_info_left');
    if (savedTop !== null && savedLeft !== null) {
        trackInfo.style.top = savedTop;
        trackInfo.style.left = savedLeft;
    }

    var isDragging = false;
    var startX = 0;
    var startY = 0;
    var initialTop = 30;
    var initialLeft = 40;

    trackInfo.addEventListener('mousedown', onDragStart);
    try {
        trackInfo.addEventListener('touchstart', onDragStart, { passive: false });
    } catch (e) {
        trackInfo.addEventListener('touchstart', onDragStart, false);
    }

    function onDragStart(e) {
        var clientX, clientY;
        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            if (e.button !== 0) return;
            clientX = e.clientX;
            clientY = e.clientY;
            e.preventDefault();
        }

        isDragging = true;
        startX = clientX;
        startY = clientY;

        var rect = trackInfo.getBoundingClientRect();
        var parent = trackInfo.offsetParent || document.body;
        var parentRect = parent.getBoundingClientRect();
        initialTop = rect.top - parentRect.top;
        initialLeft = rect.left - parentRect.left;

        trackInfo.style.transition = 'none';

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        try {
            document.addEventListener('touchmove', onDragMove, { passive: false });
        } catch (e) {
            document.addEventListener('touchmove', onDragMove, false);
        }
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('touchcancel', onDragEnd);
    }

    function onDragMove(e) {
        if (!isDragging) return;

        var clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        var dx = clientX - startX;
        var dy = clientY - startY;

        var newTop = initialTop + dy;
        var newLeft = initialLeft + dx;

        var parent = trackInfo.offsetParent || document.body;
        var maxTop = parent.clientHeight - trackInfo.offsetHeight;
        var maxLeft = parent.clientWidth - trackInfo.offsetWidth;

        if (newTop < 10) newTop = 10;
        if (newTop > maxTop - 10) newTop = Math.max(10, maxTop - 10);
        if (newLeft < 10) newLeft = 10;
        if (newLeft > maxLeft - 10) newLeft = Math.max(10, maxLeft - 10);

        trackInfo.style.top = newTop + 'px';
        trackInfo.style.left = newLeft + 'px';
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;

        localStorage.setItem('track_info_top', trackInfo.style.top);
        localStorage.setItem('track_info_left', trackInfo.style.left);

        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        document.removeEventListener('touchcancel', onDragEnd);
    }

    window.addEventListener('resize', function() {
        var rect = trackInfo.getBoundingClientRect();
        var parent = trackInfo.offsetParent || document.body;
        var parentRect = parent.getBoundingClientRect();
        var currentTop = rect.top - parentRect.top;
        var currentLeft = rect.left - parentRect.left;

        var maxTop = parent.clientHeight - trackInfo.offsetHeight;
        var maxLeft = parent.clientWidth - trackInfo.offsetWidth;

        var newTop = currentTop;
        var newLeft = currentLeft;
        var adjusted = false;

        if (newTop < 10) { newTop = 10; adjusted = true; }
        if (newTop > maxTop - 10) { newTop = Math.max(10, maxTop - 10); adjusted = true; }
        if (newLeft < 10) { newLeft = 10; adjusted = true; }
        if (newLeft > maxLeft - 10) { newLeft = Math.max(10, maxLeft - 10); adjusted = true; }

        if (adjusted) {
            trackInfo.style.top = newTop + 'px';
            trackInfo.style.left = newLeft + 'px';
            localStorage.setItem('track_info_top', trackInfo.style.top);
            localStorage.setItem('track_info_left', trackInfo.style.left);
        }
    });
}

// ── Init ──
applySettings();
updateClock();
initSecondaryTasks();
initDraggableTrackInfo();
initRightQueueSwipeGestures();
setInterval(updateClock, 5000);
var sInput = document.getElementById('search-input');
if (sInput) sInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) doSearch(); };
var kInput = document.getElementById('right-karaoke-input');
if (kInput) kInput.onkeydown = function(e) { if ((e.keyCode || e.which) === 13) performRightKaraokeSearch(); };

function onPlayerError(e) { console.error("YouTube Player Error:", e.data); }

function toggleRightKaraoke(forceState) {
    var overlay = document.getElementById('right-karaoke-overlay');
    if (!overlay) return;
    
    if (typeof forceState !== 'undefined') {
        window.isRightKaraokeOpen = forceState;
    } else {
        window.isRightKaraokeOpen = !window.isRightKaraokeOpen;
    }
    
    if (window.isRightKaraokeOpen) {
        toggleRightQueue(false);
        overlay.classList.add('active');
        
        var trackTitle = document.getElementById('track-title').innerText;
        var trackAuthor = document.getElementById('track-author').innerText;
        var inputEl = document.getElementById('right-karaoke-input');
        
        if (trackTitle && trackTitle !== "Ready to Play" && trackTitle !== "ไม่มีเพลงในคิว" && trackTitle !== "Queue empty." && trackTitle !== "Select a song to start") {
            var cleanTitle = trackTitle.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
            var cleanAuthor = trackAuthor.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
            var q = cleanAuthor + " " + cleanTitle;
            if (/[\u0E00-\u0E7F]/.test(q)) {
                q += " คาราโอเกะ";
            } else {
                q += " karaoke";
            }
            if (inputEl) {
                inputEl.value = q;
            }
            performRightKaraokeSearch();
        }
    } else {
        overlay.classList.remove('active');
    }
}

function performRightKaraokeSearch() {
    var inputEl = document.getElementById('right-karaoke-input');
    if (!inputEl) return;
    var query = inputEl.value.trim();
    if (!query) return;
    
    var activeKey = getApiKey();
    if (!activeKey) {
        alert("API Key Missing!");
        return;
    }
    
    var listEl = document.getElementById('right-karaoke-list');
    if (!listEl) return;
    
    listEl.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>Searching...</div>";
    
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(query) + "&type=video&videoEmbeddable=true&maxResults=25&key=" + activeKey;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    listEl.innerHTML = "";
                    if (!data.items || data.items.length === 0) {
                        listEl.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>No results found.</div>";
                        return;
                    }
                    for (var i = 0; i < data.items.length; i++) {
                        var item = data.items[i];
                        if (item.id && item.id.videoId) {
                            var div = document.createElement('div');
                            div.className = 'search-item';
                            div.style.pointerEvents = 'auto';
                            
                            var title = item.snippet.title;
                            var channel = item.snippet.channelTitle || "YouTube Content";
                            var thumb = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url;
                            
                            div.innerHTML = '<img src="' + thumb + '">' +
                                            '<div class="search-item-info">' +
                                                '<div class="search-item-title">' + title + '</div>' +
                                                '<div class="search-item-channel">' + channel + '</div>' +
                                            '</div>';
                                            
                            div.onclick = (function(vid, titleVal, thumbVal) {
                                return function() {
                                    trackPlayback(vid, titleVal, thumbVal);
                                    playRadio(vid, false, titleVal);
                                    toggleRightKaraoke(false);
                                };
                            })(item.id.videoId, title, thumb);
                            
                            listEl.appendChild(div);
                        }
                    }
                } catch(e) {
                    listEl.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>Error parsing results.</div>";
                }
            } else {
                listEl.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>Error fetching results from YouTube.</div>";
            }
        }
    };
    xhr.send();
}

function toggleRightQueue(forceState) {
    var overlay = document.getElementById('right-queue-overlay');
    if (!overlay) return;
    
    if (typeof forceState !== 'undefined') {
        window.isRightQueueOpen = forceState;
    } else {
        window.isRightQueueOpen = !window.isRightQueueOpen;
    }
    
    if (window.isRightQueueOpen) {
        toggleRightKaraoke(false);
        overlay.classList.add('active');
        updateRightQueueList();
    } else {
        overlay.classList.remove('active');
    }
}

function loadMoreQueue() {
    window.rightQueueLimit += 20;
    updateRightQueueList();
}

function updateRightQueueList() {
    var list = document.getElementById('right-queue-list');
    if (!list) return;
    var ids = idsInCurrentQueue();
    
    if (ids.length === 0) {
        list.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>" + (window.isArayaActive ? "ไม่มีเพลงในคิว" : "Queue is empty.") + "</div>";
        document.getElementById('btn-load-more-queue').style.display = 'none';
        return;
    }
    
    var activeKey = getApiKey();
    if (!activeKey) {
        list.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>API Key Needed.</div>";
        document.getElementById('btn-load-more-queue').style.display = 'none';
        return;
    }
    
    var currentId = (player && player.getVideoData) ? player.getVideoData().video_id : "";
    var idx = ids.indexOf(currentId);
    
    // Slice next upcoming N items
    var future = ids.slice(idx + 1, idx + 1 + window.rightQueueLimit);
    
    if (future.length === 0) {
        list.innerHTML = "<div style='opacity:0.6; padding:20px; text-align:center;'>" + (window.isArayaActive ? "ไม่มีเพลงถัดไป" : "No upcoming songs.") + "</div>";
        document.getElementById('btn-load-more-queue').style.display = 'none';
        return;
    }
    
    // Query YouTube details for the sliced IDs
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + future.join(',') + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var d = JSON.parse(xhr.responseText);
                list.innerHTML = "";
                for (var i = 0; i < d.items.length; i++) {
                    var item = d.items[i];
                    var div = document.createElement('div');
                    div.className = 'search-item';
                    div.style.pointerEvents = 'auto';
                    
                    var title = item.snippet.title;
                    var channel = item.snippet.channelTitle || "YouTube Content";
                    var thumb = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url;
                    
                    div.innerHTML = '<img src="' + thumb + '">' +
                                    '<div class="search-item-info">' +
                                        '<div class="search-item-title">' + title + '</div>' +
                                        '<div class="search-item-channel">' + channel + '</div>' +
                                    '</div>';
                                    
                    div.onclick = (function(vid, titleVal, thumbVal) {
                        return function() {
                            trackPlayback(vid, titleVal, thumbVal);
                            playRadio(vid, false, titleVal);
                            toggleRightQueue(false); // Close panel on selection
                        };
                    })(item.id, title, thumb);
                    
                    list.appendChild(div);
                }
                
                // Show or hide the Load More button
                var loadMoreBtn = document.getElementById('btn-load-more-queue');
                if (idx + 1 + window.rightQueueLimit >= ids.length) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            } catch(e) {
                list.innerHTML = "<div style='opacity:0.6; padding:20px;'>Error loading queue data.</div>";
            }
        }
    };
    xhr.send();
}

function initRightQueueSwipeGestures() {
    var touchStartX = 0;
    var touchStartY = 0;
    
    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
        var qOverlay = document.getElementById('right-queue-overlay');
        var qHandle = document.getElementById('right-queue-handle');
        var kOverlay = document.getElementById('right-karaoke-overlay');
        var kHandle = document.getElementById('right-karaoke-handle');
        
        if (qOverlay && window.isRightQueueOpen) {
            if (!qOverlay.contains(e.target) && !qHandle.contains(e.target)) {
                toggleRightQueue(false);
            }
        }
        if (kOverlay && window.isRightKaraokeOpen) {
            if (!kOverlay.contains(e.target) && !kHandle.contains(e.target)) {
                toggleRightKaraoke(false);
            }
        }
    });
    
    document.addEventListener('touchstart', function(e) {
        var qOverlay = document.getElementById('right-queue-overlay');
        var qHandle = document.getElementById('right-queue-handle');
        var kOverlay = document.getElementById('right-karaoke-overlay');
        var kHandle = document.getElementById('right-karaoke-handle');
        
        if (qOverlay && window.isRightQueueOpen) {
            if (!qOverlay.contains(e.target) && !qHandle.contains(e.target)) {
                toggleRightQueue(false);
            }
        }
        if (kOverlay && window.isRightKaraokeOpen) {
            if (!kOverlay.contains(e.target) && !kHandle.contains(e.target)) {
                toggleRightKaraoke(false);
            }
        }
    }, { passive: true });
    
    window.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    window.addEventListener('touchend', function(e) {
        var diffX = e.changedTouches[0].screenX - touchStartX;
        var diffY = e.changedTouches[0].screenY - touchStartY;
        
        // Check if swipe is horizontal and meets threshold
        if (Math.abs(diffX) > Math.abs(diffY) * 2) {
            // Swipe left (open right overlay)
            if (diffX < -70) {
                // If touch started near the right edge of screen (e.g. last 15% width) and both are closed
                if (touchStartX > window.innerWidth * 0.8 && !window.isRightQueueOpen && !window.isRightKaraokeOpen) {
                    toggleRightQueue(true);
                }
            }
            // Swipe right (close right overlay)
            if (diffX > 70) {
                if (window.isRightQueueOpen) {
                    toggleRightQueue(false);
                }
                if (window.isRightKaraokeOpen) {
                    toggleRightKaraoke(false);
                }
            }
        }
    }, false);
}

if (window.YT && window.YT.Player && !player) onYouTubeIframeAPIReady();

function toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

function updateFullscreenButton() {
    var btn = document.getElementById('btn-fullscreen-toggle');
    if (!btn) return;
    var isFS = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (isFS) {
        btn.title = 'Exit Fullscreen';
    } else {
        btn.title = 'Fullscreen';
    }
}

function isKaraokeTitle(title) {
    if (!title) return false;
    var t = title.toLowerCase();
    var keywords = ['karaoke', 'instrumental', 'no vocal', 'คาราโอเกะ', 'ตัดเสียงร้อง', 'ดนตรีเปล่า', 'カラオケ', 'オフボーカル', '노래방', '가ราโอเค', '伴奏', '无人声'];
    for (var i = 0; i < keywords.length; i++) {
        if (t.indexOf(keywords[i].toLowerCase()) !== -1) {
            return true;
        }
    }
    return false;
}

function ensureUpcomingKaraoke(pl, startIndex, count) {
    var activeKey = getApiKey();
    if (!activeKey) return;
    
    var idsToCheck = [];
    for (var i = startIndex; i < startIndex + count && i < pl.length; i++) {
        idsToCheck.push({ id: pl[i], index: i });
    }
    if (idsToCheck.length === 0) return;
    
    var mappings = {};
    try {
        var saved = localStorage.getItem('kp_karaoke_mappings');
        if (saved) mappings = JSON.parse(saved);
    } catch(e) { /* ignore */ }
    
    var idsToFetchDetails = [];
    for (var j = 0; j < idsToCheck.length; j++) {
        var item = idsToCheck[j];
        if (mappings[item.id]) {
            pl[item.index] = mappings[item.id];
        } else {
            idsToFetchDetails.push(item);
        }
    }
    
    localStorage.setItem('kp_cached_queue', JSON.stringify(pl));
    
    if (idsToFetchDetails.length === 0) {
        if (document.getElementById('panel-media').classList.contains('active')) updateQueueList();
        if (window.isRightQueueOpen) updateRightQueueList();
        return;
    }
    
    var fetchIds = [];
    for (var k = 0; k < idsToFetchDetails.length; k++) {
        fetchIds.push(idsToFetchDetails[k].id);
    }
    
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + fetchIds.join(',') + "&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (!data.items) return;
                
                var videoDetails = {};
                for (var m = 0; m < data.items.length; m++) {
                    var vid = data.items[m];
                    videoDetails[vid.id] = vid.snippet;
                }
                
                var pendingSearches = [];
                for (var n = 0; n < idsToFetchDetails.length; n++) {
                    var checkItem = idsToFetchDetails[n];
                    var snippet = videoDetails[checkItem.id];
                    if (!snippet) continue;
                    
                    var title = snippet.title;
                    if (isKaraokeTitle(title)) {
                        mappings[checkItem.id] = checkItem.id;
                    } else {
                        pendingSearches.push({
                            originalId: checkItem.id,
                            index: checkItem.index,
                            title: title,
                            artist: snippet.channelTitle || ""
                        });
                    }
                }
                
                localStorage.setItem('kp_karaoke_mappings', JSON.stringify(mappings));
                
                if (pendingSearches.length === 0) {
                    if (document.getElementById('panel-media').classList.contains('active')) updateQueueList();
                    if (window.isRightQueueOpen) updateRightQueueList();
                    return;
                }
                
                searchNextKaraoke(pendingSearches, 0, pl, mappings);
                
            } catch(e) {
                console.error("Error parsing video details:", e);
            }
        }
    };
    xhr.send();
}

function searchNextKaraoke(pendingList, searchIdx, pl, mappings) {
    if (searchIdx >= pendingList.length) {
        localStorage.setItem('kp_cached_queue', JSON.stringify(pl));
        localStorage.setItem('kp_karaoke_mappings', JSON.stringify(mappings));
        if (document.getElementById('panel-media').classList.contains('active')) updateQueueList();
        if (window.isRightQueueOpen) updateRightQueueList();
        return;
    }
    
    var activeKey = getApiKey();
    if (!activeKey) return;
    
    var item = pendingList[searchIdx];
    var cleanTitleStr = cleanTitle(item.title).replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
    var cleanArtistStr = item.artist.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
    cleanArtistStr = cleanArtistStr.replace(/\s*-\s*Topic/i, '').replace(/vevo/i, '').trim();
    
    var query = cleanArtistStr + " " + cleanTitleStr;
    if (/[\u0E00-\u0E7F]/.test(query)) {
        query += " คาราโอเกะ";
    } else {
        query += " karaoke";
    }
    
    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(query) + "&type=video&videoEmbeddable=true&maxResults=1&key=" + activeKey;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.items && data.items.length > 0) {
                        var karaokeId = data.items[0].id.videoId;
                        if (karaokeId) {
                            mappings[item.originalId] = karaokeId;
                            pl[item.index] = karaokeId;
                        }
                    } else {
                        mappings[item.originalId] = item.originalId;
                    }
                } catch(e) {
                    console.error("Error processing search result:", e);
                }
            } else {
                mappings[item.originalId] = item.originalId;
            }
            searchNextKaraoke(pendingList, searchIdx + 1, pl, mappings);
        }
    };
    xhr.send();
}
