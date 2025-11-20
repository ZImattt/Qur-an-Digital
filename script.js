// Global variables
let semuaSurah = [];
let surahSekarang = null;
let audioElement = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', function() {
    tampilkanDaftarSurah();
});

// Fungsi untuk scroll ke bagian daftar surah
function scrollToSurahList() {
    const surahListSection = document.getElementById('konten');
    if (surahListSection) {
        surahListSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

async function tampilkanDaftarSurah() {
    try {
        const response = await fetch('https://quran-api.santrikoding.com/api/surah');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        semuaSurah = data;

        let html = `
            <div class="fade-in">
                <h2 style="color: var(--primary); margin-bottom: 25px; display: flex; align-items: center; gap: 15px; justify-content: center;">
                    <i class="fas fa-list"></i> Daftar Surah
                </h2>
                
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Cari surah berdasarkan nama...">
                    <i class="fas fa-search search-icon"></i>
                </div>
                
                <div class="surah-list" id="surahList">
        `;
        
        data.forEach(surah => {
            html += `
                <div class="surah-item fade-in" onclick="tampilkanAyat(${surah.nomor})">
                    <div class="surah-number">${surah.nomor}</div>
                    <div class="surah-details">
                        <div class="surah-name">${surah.nama_latin}</div>
                        <div class="surah-meta">
                            ${surah.arti} • ${surah.jumlah_ayat} ayat • ${surah.tempat_turun.charAt(0).toUpperCase() + surah.tempat_turun.slice(1)}
                        </div>
                    </div>
                    <div class="surah-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;

        document.getElementById('konten').innerHTML = html;
        
        // Tambahkan event listener untuk pencarian
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const surahItems = document.querySelectorAll('.surah-item');
            
            surahItems.forEach(item => {
                const surahName = item.querySelector('.surah-name').textContent.toLowerCase();
                if (surahName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
    } catch (err) {
        console.error('Error fetching data:', err);
        document.getElementById('konten').innerHTML = `
            <div class="error fade-in">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Gagal mengambil data</h3>
                <p>Silakan periksa koneksi internet Anda dan coba lagi.</p>
                <button class="back-button" onclick="tampilkanDaftarSurah()">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

async function tampilkanAyat(noSurah) {
    try {
        document.getElementById('konten').innerHTML = `
            <div class="loading">
                <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>
                <p>Memuat surah...</p>
            </div>
        `;
        
        const response = await fetch(`https://quran-api.santrikoding.com/api/surah/${noSurah}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const surah = await response.json();
        surahSekarang = surah;

        let html = `
            <div class="fade-in">
                <div class="surah-header">
                    <div class="surah-name-arabic">${surah.nama}</div>
                    <div class="surah-name-latin">${surah.nama_latin}</div>
                    <div class="surah-arti">${surah.arti}</div>
                    
                    <div class="surah-info">
                        <div class="surah-info-item">
                            <i class="fas fa-file-alt"></i> ${surah.jumlah_ayat} Ayat
                        </div>
                        <div class="surah-info-item">
                            <i class="fas fa-map-marker-alt"></i> ${surah.tempat_turun.charAt(0).toUpperCase() + surah.tempat_turun.slice(1)}
                        </div>
                        <div class="surah-info-item">
                            <i class="fas fa-hashtag"></i> Surah ${surah.nomor}
                        </div>
                    </div>
                </div>
        `;
        
        // Tambahkan navigasi surah sebelumnya/selanjutnya
        const prevSurah = noSurah > 1 ? semuaSurah.find(s => s.nomor === noSurah - 1) : null;
        const nextSurah = noSurah < 114 ? semuaSurah.find(s => s.nomor === noSurah + 1) : null;
        
        html += `
            <div class="surah-navigation">
                <button class="nav-button" ${!prevSurah ? 'disabled' : ''} onclick="tampilkanAyat(${prevSurah ? prevSurah.nomor : ''})">
                    <i class="fas fa-chevron-left"></i> ${prevSurah ? prevSurah.nomor + '. ' + prevSurah.nama_latin : 'Tidak Ada'}
                </button>
                <button class="nav-button" ${!nextSurah ? 'disabled' : ''} onclick="tampilkanAyat(${nextSurah ? nextSurah.nomor : ''})">
                    ${nextSurah ? nextSurah.nomor + '. ' + nextSurah.nama_latin : 'Tidak Ada'} <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        // Tambahkan audio player jika tersedia
        if (surah.audio) {
            html += `
                <div class="audio-controls">
                    <div class="audio-header">
                        <i class="fas fa-music"></i>
                        <span>Murottal Surah ${surah.nama_latin}</span>
                    </div>
                    <div class="audio-loading" id="audioLoading" style="display: none;">
                        <div class="loading-spinner-small"><i class="fas fa-spinner fa-spin"></i></div>
                        <span>Harap tunggu sedang memuat suara...</span>
                    </div>
                    <div class="audio-player" id="audioPlayer">
                        <audio id="audioElement" controls>
                            <source src="${surah.audio}" type="audio/mpeg">
                            Browser Anda tidak mendukung pemutar audio.
                        </audio>
                    </div>
                    <div class="audio-buttons">
                        <button class="action-button audio-play-btn" onclick="playAudio()" id="playBtn">
                            <i class="fas fa-play"></i> Putar
                        </button>
                        <button class="action-button audio-pause-btn" onclick="pauseAudio()" id="pauseBtn" style="display: none;">
                            <i class="fas fa-pause"></i> Jeda
                        </button>
                        <button class="action-button audio-stop-btn" onclick="stopAudio()" id="stopBtn">
                            <i class="fas fa-stop"></i> Stop
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Tambahkan basmalah untuk semua surah kecuali At-Taubah
        if (noSurah !== 9) {
            html += `
                <div class="basmalah">
                    <div class="basmalah-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                    <div class="basmalah-latin">Bismillāhir-raḥmānir-raḥīm</div>
                    <div class="basmalah-translation">Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.</div>
                </div>
            `;
        }
        
        // Tambahkan action buttons
        html += `
            <div class="action-buttons">
                <button class="action-button" onclick="scrollToTop()">
                    <i class="fas fa-arrow-up"></i> Ke Atas
                </button>
                <button class="action-button" onclick="scrollToBottom()">
                    <i class="fas fa-arrow-down"></i> Ke Bawah
                </button>
                <button class="action-button" onclick="toggleTranslations()" id="toggleTranslationBtn">
                    <i class="fas fa-language"></i> Sembunyikan Terjemahan
                </button>
            </div>
        `;
        
        if (surah.ayat && Array.isArray(surah.ayat)) {
            surah.ayat.forEach(ayat => {
                html += `
                    <div class="ayat-container fade-in">
                        <div class="ayat-number">${ayat.nomor}</div>
                        <div class="arabic">${ayat.ar}</div>
                        <div class="transliteration">
                            <i class="fas fa-font"></i>
                            ${ayat.tr}
                        </div>
                        <div class="translation">
                            <i class="fas fa-book"></i>
                            ${ayat.idn}
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div class="error">Data ayat tidak tersedia.</div>';
        }
        
        // Tambahkan navigasi lagi di bagian bawah
        html += `
            <div class="surah-navigation">
                <button class="nav-button" ${!prevSurah ? 'disabled' : ''} onclick="tampilkanAyat(${prevSurah ? prevSurah.nomor : ''})">
                    <i class="fas fa-chevron-left"></i> ${prevSurah ? prevSurah.nomor + '. ' + prevSurah.nama_latin : 'Tidak Ada'}
                </button>
                <button class="nav-button" ${!nextSurah ? 'disabled' : ''} onclick="tampilkanAyat(${nextSurah ? nextSurah.nomor : ''})">
                    ${nextSurah ? nextSurah.nomor + '. ' + nextSurah.nama_latin : 'Tidak Ada'} <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <button class="back-button" onclick="tampilkanDaftarSurah()">
                <i class="fas fa-arrow-left"></i> Kembali ke Daftar Surah
            </button>
            </div>
        `;
        
        document.getElementById('konten').innerHTML = html;
        
        // Inisialisasi audio element dengan loading state
        if (surah.audio) {
            initializeAudio();
        }
        
    } catch (err) {
        console.error('Error fetching ayat:', err);
        document.getElementById('konten').innerHTML = `
            <div class="error fade-in">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Gagal mengambil data surah</h3>
                <p>Silakan periksa koneksi internet Anda dan coba lagi.</p>
                <button class="back-button" onclick="tampilkanDaftarSurah()">
                    <i class="fas fa-arrow-left"></i> Kembali ke Daftar Surah
                </button>
            </div>
        `;
    }
}

// Fungsi Audio Control
function initializeAudio() {
    audioElement = document.getElementById('audioElement');
    const audioLoading = document.getElementById('audioLoading');
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (audioElement) {
        isPlaying = false;
        
        audioElement.addEventListener('loadstart', function() {
            audioLoading.style.display = 'flex';
            audioPlayer.style.display = 'none';
        });
        
        audioElement.addEventListener('canplay', function() {
            audioLoading.style.display = 'none';
            audioPlayer.style.display = 'block';
        });
        
        audioElement.addEventListener('error', function() {
            audioLoading.style.display = 'none';
            audioPlayer.style.display = 'block';
            showNotification('Gagal memuat audio', 'error');
        });
        
        audioElement.addEventListener('play', function() {
            isPlaying = true;
            updateAudioButtons();
        });
        
        audioElement.addEventListener('pause', function() {
            isPlaying = false;
            updateAudioButtons();
        });
        
        audioElement.addEventListener('ended', function() {
            isPlaying = false;
            updateAudioButtons();
        });
    }
    
    function updateAudioButtons() {
        if (isPlaying) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
        } else {
            playBtn.style.display = 'flex';
            pauseBtn.style.display = 'none';
        }
    }
}

function playAudio() {
    if (audioElement) {
        const audioLoading = document.getElementById('audioLoading');
        audioLoading.style.display = 'flex';
        
        audioElement.play().then(() => {
            audioLoading.style.display = 'none';
            isPlaying = true;
            updateAudioButtons();
        }).catch(error => {
            console.error('Error playing audio:', error);
            audioLoading.style.display = 'none';
            showNotification('Gagal memutar audio', 'error');
        });
    }
}

function pauseAudio() {
    if (audioElement) {
        audioElement.pause();
        isPlaying = false;
        updateAudioButtons();
    }
}

function stopAudio() {
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        isPlaying = false;
        updateAudioButtons();
    }
}

function updateAudioButtons() {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (playBtn && pauseBtn) {
        if (isPlaying) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
        } else {
            playBtn.style.display = 'flex';
            pauseBtn.style.display = 'none';
        }
    }
}

// Fungsi bantuan tambahan
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function toggleTranslations() {
    const translations = document.querySelectorAll('.translation');
    const button = document.getElementById('toggleTranslationBtn');
    
    translations.forEach(trans => {
        if (trans.style.display === 'none') {
            trans.style.display = 'block';
            button.innerHTML = '<i class="fas fa-language"></i> Sembunyikan Terjemahan';
        } else {
            trans.style.display = 'none';
            button.innerHTML = '<i class="fas fa-language"></i> Tampilkan Terjemahan';
        }
    });
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}