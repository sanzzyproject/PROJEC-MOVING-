document.addEventListener('DOMContentLoaded', () => {
    // Navigasi Bawah
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const headerTitle = document.getElementById('header-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            headerTitle.textContent = item.getAttribute('data-title');
        });
    });

    // Fetch API Functions
    async function fetchMovies(query, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loader">Loading...</div>';
        try {
            const res = await fetch(`/api/search?q=${query}`);
            const json = await res.json();
            if(json.success && json.data.length > 0) {
                container.innerHTML = json.data.map(movie => `
                    <div class="movie-card" onclick="openDetail('${movie.url}', '${movie.title}', '${movie.image}')">
                        <div class="quality-badge">${movie.quality || 'HD'}</div>
                        <img src="${movie.image}" alt="${movie.title}" loading="lazy">
                        <div class="movie-info">
                            <h3>${movie.title}</h3>
                            <p>${movie.year}</p>
                        </div>
                    </div>
                `).join('') + (containerId === 'home-movies' ? '<div class="credit">Developed by SANN404 FORUM</div>' : '');
            } else {
                container.innerHTML = '<div class="loader">Film tidak ditemukan.</div>';
            }
        } catch (err) {
            container.innerHTML = '<div class="loader">Terjadi kesalahan koneksi.</div>';
        }
    }

    // Load Home Rekomendasi
    fetchMovies('action', 'home-movies'); // Kata kunci default untuk halaman depan

    // Fitur Pencarian
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    searchBtn.addEventListener('click', () => {
        if(searchInput.value.trim() !== '') {
            fetchMovies(searchInput.value, 'search-movies');
        }
    });
    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') searchBtn.click();
    });

    // Logika Modal Detail
    window.openDetail = async function(url, title, image) {
        const modal = document.getElementById('detail-modal');
        document.getElementById('detail-title').textContent = title;
        document.getElementById('detail-img').src = image;
        document.getElementById('detail-synopsis').innerHTML = 'Sedang memuat data...';
        document.getElementById('detail-badges').innerHTML = '';
        document.getElementById('detail-downloads').innerHTML = '';
        modal.style.display = 'block';

        try {
            const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
            const json = await res.json();
            if(json.success) {
                const data = json.data;
                document.getElementById('detail-synopsis').textContent = data.synopsis || 'Tidak ada sinopsis.';
                
                // Set Badges
                let badgesHtml = '';
                if(data.release) badgesHtml += `<span>${data.release}</span>`;
                if(data.duration) badgesHtml += `<span><i class="fas fa-clock"></i> ${data.duration}</span>`;
                if(data.rating) badgesHtml += `<span><i class="fas fa-star"></i> ${data.rating}</span>`;
                document.getElementById('detail-badges').innerHTML = badgesHtml;

                // Set Downloads
                const dls = data.downloads.map(dl => `
                    <div class="dl-quality">
                        <h4>${dl.quality}</h4>
                        <div class="dl-links">
                            ${dl.links.map(link => `<a href="${link.url}" target="_blank">${link.provider}</a>`).join('')}
                        </div>
                    </div>
                `).join('');
                document.getElementById('detail-downloads').innerHTML = dls || '<p style="color:var(--text-muted)">Link download tidak tersedia.</p>';
            }
        } catch(e) {
            document.getElementById('detail-synopsis').textContent = 'Gagal memuat detail.';
        }
    };

    // Close Modal
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('detail-modal').style.display = 'none';
    });
});
