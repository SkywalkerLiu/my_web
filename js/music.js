document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        playBtn: document.getElementById('playBtn'),
        playIcon: document.getElementById('playIcon'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        repeatBtn: document.getElementById('repeatBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeIcon: document.getElementById('volumeIcon'),
        progressBar: document.getElementById('progressBar'),
        progressFill: document.getElementById('progressFill'),
        currentTime: document.getElementById('currentTime'),
        totalTime: document.getElementById('totalTime'),
        songTitle: document.getElementById('songTitle'),
        songArtist: document.getElementById('songArtist'),
        albumArt: document.getElementById('albumArt'),
        waveformBars: document.getElementById('waveformBars'),
        playlist: document.getElementById('playlist'),
        addMusicBtn: document.getElementById('addMusicBtn'),
        audioFileInput: document.getElementById('audioFileInput')
    };

    if (
        !elements.playBtn ||
        !elements.playIcon ||
        !elements.prevBtn ||
        !elements.nextBtn ||
        !elements.shuffleBtn ||
        !elements.repeatBtn ||
        !elements.volumeSlider ||
        !elements.volumeIcon ||
        !elements.progressBar ||
        !elements.progressFill ||
        !elements.currentTime ||
        !elements.totalTime ||
        !elements.songTitle ||
        !elements.songArtist ||
        !elements.albumArt ||
        !elements.waveformBars ||
        !elements.playlist ||
        !elements.addMusicBtn ||
        !elements.audioFileInput
    ) {
        return;
    }

    const state = {
        audio: new Audio(),
        playlist: [],
        currentSongIndex: 0,
        isShuffle: false,
        isRepeat: false,
        localSourceUrl: null,
        waveformTimer: null
    };

    state.audio.volume = Number(elements.volumeSlider.value) / 100;

    hydrateInitialPlaylist();
    renderPlaylist();
    initWaveformBars();
    updateVolumeIcon(elements.volumeSlider.value);

    elements.playBtn.addEventListener('click', togglePlay);
    elements.prevBtn.addEventListener('click', playPrev);
    elements.nextBtn.addEventListener('click', playNext);
    elements.shuffleBtn.addEventListener('click', () => {
        state.isShuffle = !state.isShuffle;
        elements.shuffleBtn.classList.toggle('active', state.isShuffle);
    });
    elements.repeatBtn.addEventListener('click', () => {
        state.isRepeat = !state.isRepeat;
        elements.repeatBtn.classList.toggle('active', state.isRepeat);
    });

    elements.volumeSlider.addEventListener('input', () => {
        state.audio.volume = Number(elements.volumeSlider.value) / 100;
        updateVolumeIcon(elements.volumeSlider.value);
    });

    elements.progressBar.addEventListener('click', event => {
        if (!state.audio.duration) {
            return;
        }

        const rect = elements.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        state.audio.currentTime = percent * state.audio.duration;
    });

    elements.addMusicBtn.addEventListener('click', () => {
        elements.audioFileInput.click();
    });

    elements.audioFileInput.addEventListener('change', event => {
        Array.from(event.target.files || []).forEach(file => {
            state.playlist.push({
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: '本地音乐',
                duration: '--:--',
                file
            });
        });

        elements.audioFileInput.value = '';
        renderPlaylist();
    });

    state.audio.addEventListener('play', () => {
        syncPlaybackState(true);
    });

    state.audio.addEventListener('pause', () => {
        syncPlaybackState(false);
    });

    state.audio.addEventListener('timeupdate', updateProgress);
    state.audio.addEventListener('ended', handleSongEnd);
    state.audio.addEventListener('loadedmetadata', () => {
        elements.totalTime.textContent = formatTime(state.audio.duration);

        const currentSong = state.playlist[state.currentSongIndex];
        if (currentSong && currentSong.duration === '--:--' && Number.isFinite(state.audio.duration)) {
            currentSong.duration = formatTime(state.audio.duration);
            renderPlaylist();
            syncPlaylistState();
        }
    });

    state.audio.addEventListener('error', error => {
        console.error('Audio error:', error);
    });

    window.addEventListener('beforeunload', () => {
        stopWaveformAnimation();
        cleanupLocalSource();
    });

    function hydrateInitialPlaylist() {
        elements.playlist.querySelectorAll('.playlist-item:not(.add-music)').forEach(item => {
            const title = item.querySelector('.playlist-item-title');
            const artist = item.querySelector('.playlist-item-artist');
            const duration = item.querySelector('.playlist-item-duration');

            if (!item.dataset.url || !title || !artist || !duration) {
                return;
            }

            state.playlist.push({
                title: title.textContent,
                artist: artist.textContent,
                duration: duration.textContent,
                url: item.dataset.url
            });
        });
    }

    function renderPlaylist() {
        elements.playlist.querySelectorAll('.playlist-item:not(.add-music)').forEach(item => {
            item.remove();
        });

        state.playlist.forEach((song, index) => {
            elements.playlist.insertBefore(createPlaylistItem(song, index), elements.addMusicBtn);
        });
    }

    function createPlaylistItem(song, index) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.dataset.index = String(index);
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `播放 ${song.title}`);

        const info = document.createElement('div');
        info.className = 'playlist-item-info';

        const title = document.createElement('span');
        title.className = 'playlist-item-title';
        title.textContent = song.title;

        const artist = document.createElement('span');
        artist.className = 'playlist-item-artist';
        artist.textContent = song.artist;

        const duration = document.createElement('span');
        duration.className = 'playlist-item-duration';
        duration.textContent = song.duration;

        info.append(title, artist);
        item.append(info, duration);

        const activate = () => {
            loadSong(index);
            playSong();
        };

        item.addEventListener('click', activate);
        item.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            activate();
        });

        return item;
    }

    function togglePlay() {
        if (state.audio.paused) {
            playSong();
        } else {
            state.audio.pause();
        }
    }

    function playSong() {
        if (!state.audio.src) {
            if (!state.playlist.length) {
                return;
            }

            loadSong(state.currentSongIndex);
        }

        const playPromise = state.audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(error => {
                console.error('Playback failed:', error);
                syncPlaybackState(false);
            });
        }
    }

    function loadSong(index) {
        const song = state.playlist[index];
        if (!song) {
            return;
        }

        cleanupLocalSource();
        state.currentSongIndex = index;

        if (song.file instanceof File) {
            state.localSourceUrl = URL.createObjectURL(song.file);
            state.audio.src = state.localSourceUrl;
        } else {
            state.audio.src = song.url;
        }

        elements.songTitle.textContent = song.title;
        elements.songArtist.textContent = song.artist;
        elements.currentTime.textContent = '0:00';
        elements.totalTime.textContent = song.duration;
        elements.progressFill.style.width = '0%';
        syncPlaylistState();
    }

    function cleanupLocalSource() {
        if (!state.localSourceUrl) {
            return;
        }

        URL.revokeObjectURL(state.localSourceUrl);
        state.localSourceUrl = null;
    }

    function playNext() {
        if (!state.playlist.length) {
            return;
        }

        let nextIndex = state.currentSongIndex;
        if (state.isShuffle && state.playlist.length > 1) {
            while (nextIndex === state.currentSongIndex) {
                nextIndex = Math.floor(Math.random() * state.playlist.length);
            }
        } else {
            nextIndex = (state.currentSongIndex + 1) % state.playlist.length;
        }

        loadSong(nextIndex);
        playSong();
    }

    function playPrev() {
        if (!state.playlist.length) {
            return;
        }

        let previousIndex = (state.currentSongIndex - 1 + state.playlist.length) % state.playlist.length;
        if (state.isShuffle && state.playlist.length > 1) {
            while (previousIndex === state.currentSongIndex) {
                previousIndex = Math.floor(Math.random() * state.playlist.length);
            }
        }

        loadSong(previousIndex);
        playSong();
    }

    function handleSongEnd() {
        if (state.isRepeat) {
            state.audio.currentTime = 0;
            playSong();
            return;
        }

        playNext();
    }

    function updateProgress() {
        if (!state.audio.duration) {
            return;
        }

        elements.progressFill.style.width = `${(state.audio.currentTime / state.audio.duration) * 100}%`;
        elements.currentTime.textContent = formatTime(state.audio.currentTime);
    }

    function syncPlaybackState(isPlaying) {
        elements.playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        elements.albumArt.classList.toggle('playing', isPlaying);
        elements.waveformBars.classList.toggle('playing', isPlaying);

        if (isPlaying) {
            startWaveformAnimation();
        } else {
            stopWaveformAnimation();
        }
    }

    function syncPlaylistState() {
        elements.playlist.querySelectorAll('.playlist-item:not(.add-music)').forEach(item => {
            item.classList.toggle('active', Number(item.dataset.index) === state.currentSongIndex);
        });
    }

    function initWaveformBars() {
        elements.waveformBars.querySelectorAll('span').forEach(bar => {
            bar.style.height = '10px';
        });
    }

    function startWaveformAnimation() {
        stopWaveformAnimation();
        state.waveformTimer = window.setInterval(() => {
            elements.waveformBars.querySelectorAll('span').forEach(bar => {
                bar.style.height = `${Math.random() * 50 + 10}px`;
            });
        }, 120);
    }

    function stopWaveformAnimation() {
        if (state.waveformTimer) {
            window.clearInterval(state.waveformTimer);
            state.waveformTimer = null;
        }

        elements.waveformBars.querySelectorAll('span').forEach(bar => {
            bar.style.height = '10px';
        });
    }

    function updateVolumeIcon(value) {
        if (Number(value) === 0) {
            elements.volumeIcon.className = 'fas fa-volume-mute';
        } else if (Number(value) < 50) {
            elements.volumeIcon.className = 'fas fa-volume-down';
        } else {
            elements.volumeIcon.className = 'fas fa-volume-up';
        }
    }

    function formatTime(seconds) {
        if (Number.isNaN(seconds) || !Number.isFinite(seconds)) {
            return '0:00';
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
});
