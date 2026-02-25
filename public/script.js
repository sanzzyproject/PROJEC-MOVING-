document.addEventListener('DOMContentLoaded', () => {
    // ---- NAVIGASI BAWAH ----
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            if(targetId === 'search-view') {
                document.getElementById('main-search').focus();
            }
        });
    });

    // ---- PWA INSTALL LOGIC (OTOMATIS DOWNLOAD APK) ----
    let deferredPrompt;
    const installBtn = document.getElementById('install-pwa-btn');

    // Mencegah prompt bawaan muncul, menyimpannya untuk tombol kita
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    // Saat tombol dipencet
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt(); // Munculkan popup install Android
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Aplikasi berhasil diinstal');
            }
            deferredPrompt = null;
        } else {
            alert('Aplikasi sudah terinstal, atau buka lewat Google Chrome untuk menginstal PWA.');
        }
    });

    // ---- FUNGSI RENDER KARTU RAME ----
    function createMovieCard(movie) {
        return `
            <div class="movie-card" onclick="openDetail('${movie.url}', '${movie.title.replace(/'/g, "\\'")}', '${movie.image}')">
                <div class="quality-badge">${movie.quality || 'HD'}</div>
                <img src="${movie.image}" alt="Poster" loading="lazy">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.year}</p>
                </div>
            </div>
        `;
    }

    // ---- FETCH API (KEMBALI LENGKAP SEMUA KATEGORI) ----
    async function fetchCategory(query, containerId) {
        const container = document.getElementById(containerId);
        try {
            const res = await fetch(`/api/search?q=${query}`);
            const json = await res.json();
            if(json.success && json.data.length > 0) {
                container.innerHTML = json.data.map(movie => createMovieCard(movie)).join('');
            } else {
                container.innerHTML = '<p class="loader">Tidak ada data.</p>';
            }
        } catch (err) {
            container.innerHTML = '<p class="loader">Koneksi Error.</p>';
        }
    }

    fetchCategory('terbaru', 'row-popular');
    fetchCategory('action', 'row-action');
    fetchCategory('romance', 'row-romance');
    fetchCategory('comedy', 'row-comedy');
    fetchCategory('horror', 'row-horror');
    fetchCategory('sci-fi', 'row-scifi');
    fetchCategory('anime', 'row-animation');

    // ---- PENCARIAN & EMPTY STATE DI TENGAH ----
    const mainSearchInput = document.getElementById('main-search');
    const clearBtn = document.getElementById('clear-search');
    const searchContainer = document.getElementById('search-movies');
    
    // UI Default untuk ditaruh di tengah layar
    const emptyStateUI = `
        <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-film"></i></div>
            <h3>Mulai Pencarian</h3>
            <p>Ketik judul film, series, atau anime yang ingin kamu tonton hari ini.</p>
        </div>
    `;
    const notFoundUI = `
        <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-search-minus"></i></div>
            <h3>Film Tidak Ditemukan</h3>
            <p>Coba gunakan kata kunci lain atau periksa ejaan judul.</p>
        </div>
    `;

    let searchTimeout;
    mainSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        
        clearTimeout(searchTimeout);
        if (query.length === 0) {
            searchContainer.innerHTML = emptyStateUI;
            searchContainer.classList.remove('movie-grid');
            return;
        }

        searchContainer.innerHTML = '<div class="loader">Mencari data...</div>';
        searchContainer.classList.remove('movie-grid');

        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${query}`);
                const json = await res.json();
                if(json.success && json.data.length > 0) {
                    searchContainer.classList.add('movie-grid'); // Tambah grid jika ada hasil
                    searchContainer.innerHTML = json.data.map(movie => createMovieCard(movie)).join('');
                } else {
                    searchContainer.innerHTML = notFoundUI;
                }
            } catch (err) {
                searchContainer.innerHTML = '<div class="loader">Terjadi kesalahan koneksi.</div>';
            }
        }, 800);
    });

    clearBtn.addEventListener('click', () => {
        mainSearchInput.value = '';
        clearBtn.style.display = 'none';
        searchContainer.classList.remove('movie-grid');
        searchContainer.innerHTML = emptyStateUI;
        mainSearchInput.focus();
    });

    // ---- LOGIKA MODAL DETAIL ----
    window.openDetail = async function(url, title, image) {
        const modal = document.getElementById('detail-modal');
        
        let highResImage = image;
        if(image.includes('-')) {
            highResImage = image.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '');
        }

        document.getElementById('detail-title').textContent = title;
        document.getElementById('detail-img').src = highResImage;
        document.getElementById('detail-synopsis').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat informasi...';
        document.getElementById('detail-badges').innerHTML = '';
        document.getElementById('detail-downloads').innerHTML = '';
        modal.style.display = 'block';

        try {
            const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
            const json = await res.json();
            if(json.success) {
                const data = json.data;
                document.getElementById('detail-synopsis').textContent = data.synopsis || 'Sinopsis tidak tersedia.';
                
                let badgesHtml = '';
                if(data.release) badgesHtml += `<span>${data.release}</span>`;
                if(data.duration) badgesHtml += `<span>${data.duration}</span>`;
                if(data.rating) badgesHtml += `<span><i class="fas fa-star" style="color:#fbbf24"></i> ${data.rating}</span>`;
                document.getElementById('detail-badges').innerHTML = badgesHtml;

                const dls = data.downloads.map(dl => `
                    <div class="dl-card">
                        <div class="dl-top">
                            <i class="fas fa-video"></i> ${dl.quality}
                        </div>
                        <div class="dl-bottom">
                            ${dl.links.map(link => `
                                <a href="${link.url}" target="_blank" class="dl-btn">
                                    <i class="fas fa-download"></i> ${link.provider}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
                document.getElementById('detail-downloads').innerHTML = dls || '<p class="loader">Tautan belum tersedia.</p>';
            }
        } catch(e) {
            document.getElementById('detail-synopsis').textContent = 'Gagal memuat detail data.';
        }
    };

    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('detail-modal').style.display = 'none';
    });
});
