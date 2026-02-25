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
            
            // Auto focus pencarian jika masuk ke tab search
            if(targetId === 'search-view') {
                document.getElementById('main-search').focus();
            }
        });
    });

    // ---- FUNGSI RENDER KARTU FILM ----
    function createMovieCard(movie) {
        return `
            <div class="movie-card" onclick="openDetail('${movie.url}', '${movie.title}', '${movie.image}')">
                <div class="quality-badge">${movie.quality || 'HD'}</div>
                <img src="${movie.image}" alt="${movie.title}" loading="lazy">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.year}</p>
                </div>
            </div>
        `;
    }

    // ---- FETCH API KATEGORI HOME ----
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

    // Load Data Home
    fetchCategory('terbaru', 'row-popular');
    fetchCategory('action', 'row-action');
    fetchCategory('romance', 'row-romance');
    fetchCategory('comedy', 'row-comedy');
    fetchCategory('horror', 'row-horror');
    fetchCategory('sci-fi', 'row-scifi');
    fetchCategory('anime', 'row-animation');

    // ---- FITUR PENCARIAN CLEAN ----
    const mainSearchInput = document.getElementById('main-search');
    let searchTimeout;
    
    mainSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        const container = document.getElementById('search-movies');
        
        if (query.length === 0) {
            container.innerHTML = '<div class="loader">Ketik judul untuk memulai pencarian...</div>';
            return;
        }

        container.innerHTML = '<div class="loader">Mencari...</div>';
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${query}`);
                const json = await res.json();
                if(json.success && json.data.length > 0) {
                    container.innerHTML = json.data.map(movie => createMovieCard(movie)).join('');
                } else {
                    container.innerHTML = '<div class="loader">Data tidak ditemukan.</div>';
                }
            } catch (err) {
                container.innerHTML = '<div class="loader">Terjadi kesalahan koneksi.</div>';
            }
        }, 800);
    });

    // ---- LOGIKA MODAL DETAIL & FIX GAMBAR BLUR ----
    window.openDetail = async function(url, title, image) {
        const modal = document.getElementById('detail-modal');
        
        // TRIK MEMPERBAIKI GAMBAR BLUR:
        // Menghapus ukuran resolusi thumbnail dari URL WordPress (misal: -225x300.jpg jadi .jpg)
        let highResImage = image;
        if(image.includes('-')) {
            highResImage = image.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '');
        }

        // Reset Modal State
        document.getElementById('detail-title').textContent = title;
        document.getElementById('detail-img').src = highResImage; // Menggunakan gambar aslinya (High-Res)
        document.getElementById('detail-synopsis').innerHTML = 'Memuat informasi...';
        document.getElementById('detail-badges').innerHTML = '';
        document.getElementById('detail-downloads').innerHTML = '';
        modal.style.display = 'block';

        // Fetch Detail dari Backend Node.js
        try {
            const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
            const json = await res.json();
            if(json.success) {
                const data = json.data;
                document.getElementById('detail-synopsis').textContent = data.synopsis || 'Sinopsis tidak tersedia untuk judul ini.';
                
                // Badges Info
                let badgesHtml = '';
                if(data.release) badgesHtml += `<span>${data.release}</span>`;
                if(data.duration) badgesHtml += `<span>${data.duration}</span>`;
                if(data.rating) badgesHtml += `<span>★ ${data.rating}</span>`;
                document.getElementById('detail-badges').innerHTML = badgesHtml;

                // Download UI Moderen & Minimalis
                const dls = data.downloads.map(dl => `
                    <div class="dl-group">
                        <div class="dl-header">
                            <i class="fas fa-video"></i>
                            <h4>${dl.quality}</h4>
                        </div>
                        <div class="dl-links">
                            ${dl.links.map(link => `
                                <a href="${link.url}" target="_blank" class="btn-download">
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

    // Close Modal
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('detail-modal').style.display = 'none';
    });
});
