document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    if (navLinks) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
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

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.skill-card, .project-card, .stat-item, .highlight-card, .gallery-item, .tool-card, .contact-card').forEach(el => {
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
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
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
                index++;
                setTimeout(typeWriter, 50);
            }
        }
        
        setTimeout(typeWriter, 500);
    }
});

let calcValue = '0';

function appendCalc(value) {
    const display = document.getElementById('calcDisplay');
    if (calcValue === '0' && value !== '.') {
        calcValue = value;
    } else {
        calcValue += value;
    }
    display.value = calcValue;
}

function clearCalc() {
    calcValue = '0';
    document.getElementById('calcDisplay').value = '0';
}

function calculateResult() {
    try {
        calcValue = eval(calcValue).toString();
        document.getElementById('calcDisplay').value = calcValue;
    } catch (e) {
        document.getElementById('calcDisplay').value = 'Error';
        calcValue = '0';
    }
}

function convertColor() {
    const hexInput = document.getElementById('hexInput');
    const rgbInput = document.getElementById('rgbInput');
    const preview = document.getElementById('colorPreview');
    
    const hex = hexInput.value.trim();
    
    if (hex.startsWith('#')) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        rgbInput.value = `${r}, ${g}, ${b}`;
        preview.style.background = hex;
    }
}

function encodeURL() {
    const input = document.getElementById('urlInput').value;
    document.getElementById('urlOutput').value = encodeURIComponent(input);
}

function decodeURL() {
    const input = document.getElementById('urlInput').value;
    document.getElementById('urlOutput').value = decodeURIComponent(input);
}

function convertTimestamp() {
    const timestamp = document.getElementById('timestampInput').value;
    const result = document.getElementById('timestampResult');
    
    if (timestamp) {
        const date = new Date(timestamp * 1000);
        result.textContent = date.toLocaleString('zh-CN');
    }
}

function generatePassword() {
    const length = document.getElementById('passwordLength').value;
    const includeUpper = document.getElementById('includeUpper').checked;
    const includeLower = document.getElementById('includeLower').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;
    
    let chars = '';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (chars === '') {
        document.getElementById('generatedPassword').value = '请至少选择一种字符类型';
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    document.getElementById('generatedPassword').value = password;
}

let audioPlayer = null;
let audioContext = null;
let analyser = null;
let isPlaying = false;
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;
let playlist = [];

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

    if (!playBtn) return;

    audioPlayer = new Audio();
    audioPlayer.volume = 0.7;

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
        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    addMusicBtn.addEventListener('click', function() {
        audioFileInput.click();
    });

    audioFileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
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
        if (playlist.length === files.length) {
            loadSong(0);
        }
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', function() {
        document.getElementById('totalTime').textContent = formatTime(audioPlayer.duration);
    });

    document.querySelectorAll('.playlist-item:not(.add-music)').forEach((item, index) => {
        item.addEventListener('click', function() {
            loadSong(index);
            playSong();
        });
    });

    initWaveformBars();
}

function initWaveformBars() {
    const bars = document.querySelectorAll('.waveform-bars span');
    bars.forEach((bar, index) => {
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
    if (!audioPlayer.src && playlist.length === 0) return;
    
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
    audioPlayer.pause();
    isPlaying = false;
    document.getElementById('playIcon').className = 'fas fa-play';
    document.getElementById('albumArt').classList.remove('playing');
    document.getElementById('waveformBars').classList.remove('playing');
}

function loadSong(index) {
    if (playlist.length === 0) return;
    
    currentSongIndex = index;
    const song = playlist[index];
    
    audioPlayer.src = song.url;
    document.getElementById('songTitle').textContent = song.title;
    document.getElementById('songArtist').textContent = song.artist;
    
    document.querySelectorAll('.playlist-item:not(.add-music)').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function playNext() {
    if (playlist.length === 0) return;
    
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    loadSong(currentSongIndex);
    playSong();
}

function playPrev() {
    if (playlist.length === 0) return;
    
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }
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
    if (isRepeat) {
        audioPlayer.currentTime = 0;
        playSong();
    } else {
        playNext();
    }
}

function updateProgress() {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateVolumeIcon(value) {
    const icon = document.getElementById('volumeIcon');
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
    const addBtn = playlistEl.querySelector('.add-music');
    
    playlist.forEach((song, index) => {
        const existingItem = playlistEl.querySelector(`[data-index="${index}"]`);
        if (!existingItem) {
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
        }
    });
}

function animateWaveform() {
    if (!isPlaying) return;
    
    const bars = document.querySelectorAll('.waveform-bars span');
    bars.forEach(bar => {
        const height = Math.random() * 50 + 10;
        bar.style.height = height + 'px';
    });
    
    requestAnimationFrame(() => {
        setTimeout(animateWaveform, 100);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initMusicPlayer();
});
