document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    if (navLinks) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                if (hamburger) {
                    hamburger.classList.remove('active');
                }
            });
        });
    }

    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    const observer = new IntersectionObserver(
        function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    document
        .querySelectorAll('.skill-card, .stat-item, .highlight-card, .gallery-item, .tool-card, .contact-card')
        .forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('感谢您的留言！我会尽快回复您。');
            this.reset();
        });
    }

    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            this.parentElement.classList.toggle('active');
        });
    });

    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(button => button.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            galleryItems.forEach(item => {
                item.style.display = filter === 'all' || item.dataset.category === filter ? 'block' : 'none';
            });
        });
    });

    const textToCount = document.getElementById('textToCount');
    if (textToCount) {
        textToCount.addEventListener('input', function() {
            const text = this.value;
            document.getElementById('charCount').textContent = text.length;
            document.getElementById('wordCount').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
            document.getElementById('lineCount').textContent = text ? text.split('\n').length : 0;
        });
    }

    const currentTimestamp = document.getElementById('currentTimestamp');
    if (currentTimestamp) {
        currentTimestamp.value = Math.floor(Date.now() / 1000);
        setInterval(() => {
            currentTimestamp.value = Math.floor(Date.now() / 1000);
        }, 1000);
    }

    const passwordLength = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
    if (passwordLength && lengthValue) {
        passwordLength.addEventListener('input', function() {
            lengthValue.textContent = this.value;
        });
    }

    const typingText = document.querySelector('.subtitle');
    if (typingText && typingText.dataset.typed !== 'false') {
        const text = typingText.textContent;
        typingText.textContent = '';
        let index = 0;

        function typeWriter() {
            if (index < text.length) {
                typingText.textContent += text.charAt(index);
                index += 1;
                setTimeout(typeWriter, 50);
            }
        }

        setTimeout(typeWriter, 500);
    }

    initMusicPlayer();
    convertColor();
});

let calcValue = '0';
let audioPlayer = null;
let isPlaying = false;
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;
let playlist = [];

function appendCalc(value) {
    const display = document.getElementById('calcDisplay');
    if (!display) {
        return;
    }

    if (calcValue === '0' && value !== '.') {
        calcValue = value;
    } else {
        calcValue += value;
    }
    display.value = calcValue;
}

function clearCalc() {
    calcValue = '0';
    const display = document.getElementById('calcDisplay');
    if (display) {
        display.value = '0';
    }
}

function calculateResult() {
    const display = document.getElementById('calcDisplay');
    if (!display) {
        return;
    }

    try {
        calcValue = eval(calcValue).toString();
        display.value = calcValue;
    } catch (e) {
        display.value = 'Error';
        calcValue = '0';
    }
}

function convertColor() {
    const hexInput = document.getElementById('hexInput');
    const rgbInput = document.getElementById('rgbInput');
    const preview = document.getElementById('colorPreview');
    if (!hexInput || !rgbInput || !preview) {
        return;
    }

    const hex = hexInput.value.trim();
    const matched = /^#?([a-f\d]{6})$/i.exec(hex);
    if (!matched) {
        rgbInput.value = '请输入 6 位 HEX 颜色值';
        return;
    }

    const normalized = `#${matched[1]}`;
    const r = parseInt(matched[1].slice(0, 2), 16);
    const g = parseInt(matched[1].slice(2, 4), 16);
    const b = parseInt(matched[1].slice(4, 6), 16);

    hexInput.value = normalized;
    rgbInput.value = `${r}, ${g}, ${b}`;
    preview.style.background = normalized;
}

function encodeURL() {
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');
    if (!input || !output) {
        return;
    }

    output.value = encodeURIComponent(input.value);
}

function decodeURL() {
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');
    if (!input || !output) {
        return;
    }

    try {
        output.value = decodeURIComponent(input.value);
    } catch (e) {
        output.value = 'URL 格式无效，无法解码';
    }
}

function convertTimestamp() {
    const timestampInput = document.getElementById('timestampInput');
    const result = document.getElementById('timestampResult');
    if (!timestampInput || !result) {
        return;
    }

    const timestamp = Number(timestampInput.value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
        result.textContent = '请输入有效的 Unix 时间戳';
        return;
    }

    result.textContent = new Date(timestamp * 1000).toLocaleString('zh-CN');
}

function generatePassword() {
    const passwordField = document.getElementById('generatedPassword');
    const lengthInput = document.getElementById('passwordLength');
    const includeUpper = document.getElementById('includeUpper');
    const includeLower = document.getElementById('includeLower');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    if (!passwordField || !lengthInput || !includeUpper || !includeLower || !includeNumbers || !includeSymbols) {
        return;
    }

    const length = Number(lengthInput.value);
    let chars = '';

    if (includeUpper.checked) {
        chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (includeLower.checked) {
        chars += 'abcdefghijklmnopqrstuvwxyz';
    }
    if (includeNumbers.checked) {
        chars += '0123456789';
    }
    if (includeSymbols.checked) {
        chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (!chars) {
        passwordField.value = '请至少选择一种字符类型';
        return;
    }

    let password = '';
    for (let i = 0; i < length; i += 1) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    passwordField.value = password;
}

function initMusicPlayer() {
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const addMusicBtn = document.getElementById('addMusicBtn');
    const audioFileInput = document.getElementById('audioFileInput');

    if (
        !playBtn ||
        !prevBtn ||
        !nextBtn ||
        !shuffleBtn ||
        !repeatBtn ||
        !volumeSlider ||
        !progressBar ||
        !addMusicBtn ||
        !audioFileInput
    ) {
        return;
    }

    audioPlayer = new Audio();
    audioPlayer.volume = 0.7;
    playlist = [];

    document.querySelectorAll('.playlist-item:not(.add-music)').forEach((item, index) => {
        const title = item.querySelector('.playlist-item-title');
        const artist = item.querySelector('.playlist-item-artist');
        const duration = item.querySelector('.playlist-item-duration');

        if (item.dataset.url && title && artist && duration) {
            playlist.push({
                title: title.textContent,
                artist: artist.textContent,
                url: item.dataset.url,
                duration: duration.textContent
            });
        }

        item.addEventListener('click', function() {
            loadSong(index);
            playSong();
        });
    });

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
        updateVolumeIcon(this.value);
    });

    progressBar.addEventListener('click', function(e) {
        if (!audioPlayer.duration) {
            return;
        }

        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    addMusicBtn.addEventListener('click', function() {
        audioFileInput.click();
    });

    audioFileInput.addEventListener('change', function(e) {
        Array.from(e.target.files).forEach(file => {
            const url = URL.createObjectURL(file);
            const name = file.name.replace(/\.[^/.]+$/, '');
            playlist.push({
                title: name,
                artist: '本地音乐',
                url: url,
                duration: '--:--'
            });
        });
        updatePlaylistUI();
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', function() {
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            totalTime.textContent = formatTime(audioPlayer.duration);
        }
    });
    audioPlayer.addEventListener('error', function(e) {
        console.error('Audio error:', e);
    });

    initWaveformBars();
}

function initWaveformBars() {
    document.querySelectorAll('.waveform-bars span').forEach((bar, index) => {
        bar.style.height = '10px';
        bar.style.animationDelay = `${index * 0.05}s`;
    });
}

function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    if (!audioPlayer || (!audioPlayer.src && playlist.length === 0)) {
        return;
    }

    if (!audioPlayer.src && playlist.length > 0) {
        loadSong(0);
    }

    audioPlayer.play();
    isPlaying = true;
    document.getElementById('playIcon').className = 'fas fa-pause';
    document.getElementById('albumArt').classList.add('playing');
    document.getElementById('waveformBars').classList.add('playing');
    animateWaveform();
}

function pauseSong() {
    if (!audioPlayer) {
        return;
    }

    audioPlayer.pause();
    isPlaying = false;
    document.getElementById('playIcon').className = 'fas fa-play';
    document.getElementById('albumArt').classList.remove('playing');
    document.getElementById('waveformBars').classList.remove('playing');
}

function loadSong(index) {
    if (!audioPlayer || playlist.length === 0 || !playlist[index]) {
        return;
    }

    currentSongIndex = index;
    const song = playlist[index];
    audioPlayer.src = song.url;
    document.getElementById('songTitle').textContent = song.title;
    document.getElementById('songArtist').textContent = song.artist;

    document.querySelectorAll('.playlist-item:not(.add-music)').forEach((item, itemIndex) => {
        item.classList.toggle('active', itemIndex === index);
    });
}

function playNext() {
    if (playlist.length === 0) {
        return;
    }

    currentSongIndex = isShuffle
        ? Math.floor(Math.random() * playlist.length)
        : (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

function playPrev() {
    if (playlist.length === 0) {
        return;
    }

    currentSongIndex = isShuffle
        ? Math.floor(Math.random() * playlist.length)
        : (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('repeatBtn').classList.toggle('active', isRepeat);
}

function handleSongEnd() {
    if (isRepeat && audioPlayer) {
        audioPlayer.currentTime = 0;
        playSong();
    } else {
        playNext();
    }
}

function updateProgress() {
    if (!audioPlayer || !audioPlayer.duration) {
        return;
    }

    document.getElementById('progressFill').style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
    document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
}

function formatTime(seconds) {
    if (isNaN(seconds)) {
        return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateVolumeIcon(value) {
    const icon = document.getElementById('volumeIcon');
    if (!icon) {
        return;
    }

    if (value == 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (value < 50) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

function updatePlaylistUI() {
    const playlistEl = document.getElementById('playlist');
    if (!playlistEl) {
        return;
    }

    const addBtn = playlistEl.querySelector('.add-music');
    playlist.forEach((song, index) => {
        const existingItem = playlistEl.querySelector(`[data-index="${index}"]`);
        if (existingItem) {
            return;
        }

        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.dataset.index = index;
        item.innerHTML = `
            <div class="playlist-item-info">
                <span class="playlist-item-title">${song.title}</span>
                <span class="playlist-item-artist">${song.artist}</span>
            </div>
            <span class="playlist-item-duration">${song.duration}</span>
        `;
        item.addEventListener('click', function() {
            loadSong(index);
            playSong();
        });
        playlistEl.insertBefore(item, addBtn);
    });
}

function animateWaveform() {
    if (!isPlaying) {
        return;
    }

    document.querySelectorAll('.waveform-bars span').forEach(bar => {
        bar.style.height = `${Math.random() * 50 + 10}px`;
    });

    requestAnimationFrame(() => {
        setTimeout(animateWaveform, 100);
    });
}
