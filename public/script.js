document.addEventListener('DOMContentLoaded', () => {
    // ---- NAVIGASI BAWAH NATIVE FEEL ----
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

    // ---- FUNGSI RENDER KARTU PRESISI ----
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

    // ---- FETCH API KATEGORI ----
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
    fetchCategory('anime', 'row-animation');

    // ---- PENCARIAN & CLEAR BUTTON ----
    const mainSearchInput = document.getElementById('main-search');
    const clearBtn = document.getElementById('clear-search');
    const searchContainer = document.getElementById('search-movies');
    let searchTimeout;
    
    mainSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        
        clearTimeout(searchTimeout);
        if (query.length === 0) {
            searchContainer.innerHTML = '<div class="empty-state">Mulai jelajahi pustaka kami.</div>';
            return;
        }

        searchContainer.innerHTML = '<div class="loader">Mencari...</div>';
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${query}`);
                const json = await res.json();
                if(json.success && json.data.length > 0) {
                    searchContainer.innerHTML = json.data.map(movie => createMovieCard(movie)).join('');
                } else {
                    searchContainer.innerHTML = '<div class="empty-state">Data tidak ditemukan.</div>';
                }
            } catch (err) {
                searchContainer.innerHTML = '<div class="loader">Terjadi kesalahan koneksi.</div>';
            }
        }, 800);
    });

    clearBtn.addEventListener('click', () => {
        mainSearchInput.value = '';
        clearBtn.style.display = 'none';
        searchContainer.innerHTML = '<div class="empty-state">Mulai jelajahi pustaka kami.</div>';
        mainSearchInput.focus();
    });

    // ---- LOGIKA MODAL DETAIL (FIX BLUR IMAGE TETAP ADA) ----
    window.openDetail = async function(url, title, image) {
        const modal = document.getElementById('detail-modal');
        
        // Fix Resolusi Gambar
        let highResImage = image;
        if(image.includes('-')) {
            highResImage = image.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '');
        }

        document.getElementById('detail-title').textContent = title;
        document.getElementById('detail-img').src = highResImage;
        document.getElementById('detail-synopsis').innerHTML = 'Memuat informasi...';
        document.getElementById('detail-badges').innerHTML = '';
        document.getElementById('detail-downloads').innerHTML = '';
        modal.style.display = 'block';

        try {
            const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
            const json = await res.json();
            if(json.success) {
                const data = json.data;
                document.getElementById('detail-synopsis').textContent = data.synopsis || '-';
                
                let badgesHtml = '';
                if(data.release) badgesHtml += `<span>${data.release}</span>`;
                if(data.duration) badgesHtml += `<span>${data.duration}</span>`;
                if(data.rating) badgesHtml += `<span>★ ${data.rating}</span>`;
                document.getElementById('detail-badges').innerHTML = badgesHtml;

                // UI Download Grid yang Rapi
                const dls = data.downloads.map(dl => `
                    <div class="dl-card">
                        <div class="dl-top">
                            <i class="fas fa-video"></i> ${dl.quality}
                        </div>
                        <div class="dl-bottom">
                            ${dl.links.map(link => `
                                <a href="${link.url}" target="_blank" class="dl-btn">
                                    <i class="fas fa-arrow-down"></i> ${link.provider}
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
