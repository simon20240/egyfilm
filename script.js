document.addEventListener('DOMContentLoaded', function () {

    // --- TMDb API CONFIGURATION ---
    const apiKey = 'c9c1cc68a0854d7ac67036ffd6768a53';
    const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjOWMxY2M2OGEwODU0ZDdhYzY3MDM2ZmZkNjc2OGE1MyIsIm5iZiI6MTc1OTk0MjkzMS4xMDksInN1YiI6IjY4ZTY5OTEzNWRiY2Q3Y2FmNzAxMDM3NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vl54E0QE7skBZdPm7GBPxzEDrWuw9UkMQYDHnNCePnM';
    const apiUrl = 'https://api.themoviedb.org/3';
    const imgBaseUrl = 'https://image.tmdb.org/t/p/';

    // --- GLOBAL STATE & CONSTANTS ---
    const state = {
        currentPage: 'home',
        currentItemId: null,
        currentListPage: 1,
        itemsPerPage: 20,
        currentMediaType: 'movie',
    };

    const pages = {
        home: document.getElementById('home-page'),
        details: document.getElementById('details-page'),
        list: document.getElementById('list-page'),
    };
    
    let genreMap = {};

    // --- API HELPER FUNCTIONS ---
    const fetchFromTMDb = async (endpoint, params = {}) => {
        const urlParams = new URLSearchParams({ ...params, language: 'ar-EG' });
        const url = `${apiUrl}/${endpoint}?${urlParams}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });
            if (!response.ok) {
                console.error(`API Error: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch from TMDb:', error);
            return null;
        }
    };

    const fetchAndStoreGenres = async () => {
        const movieGenres = await fetchFromTMDb('genre/movie/list');
        const tvGenres = await fetchFromTMDb('genre/tv/list');
        const allGenres = [...(movieGenres?.genres || []), ...(tvGenres?.genres || [])];
        genreMap = allGenres.reduce((acc, genre) => {
            acc[genre.id] = genre.name;
            return acc;
        }, {});
    };
    
    const getGenreNames = (ids) => ids.map(id => genreMap[id] || 'غير معروف').join(', ');

    // --- RENDER FUNCTIONS ---
    const createMovieCard = (item) => {
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').substring(0, 4);
        const posterPath = item.poster_path ? `${imgBaseUrl}w500${item.poster_path}` : 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

        return `
            <div class="group relative rounded-lg overflow-hidden shadow-lg bg-gray-800 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer" data-id="${item.id}" data-media-type="${mediaType}">
                <img src="${posterPath}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div class="play-icon-hover w-16 h-16 bg-red-600/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path></svg>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-3 card-overlay text-right">
                    <h3 class="text-white font-bold truncate">${title}</h3>
                    <div class="flex justify-between items-center text-xs text-gray-300 mt-1">
                        <span>${year}</span>
                        <div class="flex items-center space-x-1 space-x-reverse">
                             <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span>${item.vote_average.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                ${item.media_type === 'tv' || item.first_air_date ? '<div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">مسلسل</div>' : ''}
            </div>
        `;
    };

    const renderHomePage = async () => {
        const [trending, popularMovies, popularTv, topRatedMovies] = await Promise.all([
            fetchFromTMDb('trending/all/week'),
            fetchFromTMDb('movie/popular'),
            fetchFromTMDb('tv/popular'),
            fetchFromTMDb('movie/top_rated'),
        ]);

        const featured = (trending?.results || []).slice(0, 5);

        const sliderContainer = document.getElementById('slider-container');
        const sliderDots = document.getElementById('slider-dots');
        sliderContainer.innerHTML = featured.map((item, index) => {
            const backdropPath = item.backdrop_path ? `${imgBaseUrl}w1280${item.backdrop_path}` : 'https://placehold.co/1920x1080/1a202c/ffffff?text=No+Image';
            const title = item.title || item.name;
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="slider-item absolute inset-0 ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${backdropPath}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
                    <div class="absolute bottom-0 right-0 p-8 md:p-12 text-white max-w-2xl text-right">
                        <h2 class="text-3xl md:text-5xl font-bold">${title}</h2>
                        <p class="mt-4 hidden md:block text-gray-300">${item.overview.substring(0, 150)}...</p>
                        <button class="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center space-x-2 space-x-reverse view-details-btn" data-id="${item.id}" data-media-type="${mediaType}">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path></svg>
                            <span>شاهد الآن</span>
                        </button>
                    </div>
                </div>
            `}).join('');
        sliderDots.innerHTML = featured.map((_, index) => `<button class="slider-dot w-3 h-3 rounded-full ${index === 0 ? 'bg-red-600' : 'bg-gray-500'}" data-index="${index}"></button>`).join('');

        const contentSections = document.getElementById('content-sections');
        const sections = [
            { title: 'أحدث الأفلام 🎬', items: popularMovies?.results || [] },
            { title: 'أحدث المسلسلات 📺', items: popularTv?.results || [] },
            { title: 'الأعلى تقييماً 🎖️', items: topRatedMovies?.results || [] },
            { title: 'الأكثر مشاهدة 🔥', items: (trending?.results || []).slice(5) },
        ];
        contentSections.innerHTML = sections.map(section => `
            <section class="mb-10">
                <h2 class="text-2xl font-bold text-white mb-4">${section.title}</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    ${section.items.map(createMovieCard).join('')}
                </div>
            </section>
        `).join('');
        setupSlider();
    };

    const renderDetailsPage = async (itemId, mediaType) => {
        const item = await fetchFromTMDb(`${mediaType}/${itemId}`, { append_to_response: 'videos,credits,external_ids' });
        if (!item) {
            pages.details.innerHTML = `<div class="text-center py-20 text-white">العنصر غير موجود.</div>`;
            return;
        }

        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').substring(0, 4);
        const backdropPath = item.backdrop_path ? `${imgBaseUrl}w1280${item.backdrop_path}` : 'https://placehold.co/1920x1080/1a202c/ffffff?text=No+Image';
        const posterPath = item.poster_path ? `${imgBaseUrl}w500${item.poster_path}` : 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const trailer = item.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const cast = item.credits?.cast?.slice(0, 5).map(c => c.name).join(', ');
        const isSeries = mediaType === 'tv';

        const watchId = item.external_ids?.imdb_id || item.id;
        const watchUrl = isSeries ? `https://vidsrc.to/embed/tv/${watchId}` : `https://vidsrc.to/embed/movie/${watchId}`;

        const watchSectionHTML = `
             <div id="watch-section" class="mt-8 bg-gray-900 rounded-lg overflow-hidden" style="display: none;">
                <div class="aspect-w-16 aspect-h-9">
                    <iframe id="video-player" src="" frameborder="0" allowfullscreen class="w-full h-full"></iframe>
                </div>
             </div>`;

        let contentHTML = '';
        if (isSeries) {
            contentHTML = `
                <div id="seasons-container" class="mt-8">
                    <!-- Seasons and episodes will be rendered here -->
                </div>
            `;
        }

        pages.details.innerHTML = `
            <div class="relative h-[40vh] md:h-[60vh] -mt-16">
                <img src="${backdropPath}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-12">
                <div class="flex flex-col md:flex-row gap-8">
                    <div class="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
                        <img src="${posterPath}" alt="${title}" class="rounded-lg shadow-lg">
                    </div>
                    <div class="flex-grow text-center md:text-right text-white">
                        <h1 class="text-4xl font-extrabold">${title} (${year})</h1>
                        <div class="flex items-center justify-center md:justify-start gap-4 mt-2 text-gray-300">
                            <span class="font-semibold">${getGenreNames(item.genres.map(g => g.id))}</span>
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                ${item.vote_average.toFixed(1)}
                            </span>
                        </div>
                        <p class="mt-4 text-gray-400 max-w-3xl mx-auto md:mx-0">${item.overview}</p>
                        <div class="mt-4">
                            <h3 class="font-semibold">طاقم العمل:</h3>
                            <p class="text-gray-400">${cast || 'غير متوفر'}</p>
                        </div>
                        <div class="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                            ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                مشاهدة الإعلان
                            </a>` : ''}
                            <button id="watch-online-btn" data-url="${watchUrl}" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path></svg>
                                مشاهدة أونلاين
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="server-tabs" class="mt-8 border-b border-gray-700" style="display: none;">
                    <div class="flex space-x-4 space-x-reverse">
                         <button class="server-tab-btn py-2 px-4 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-500 transition-colors active text-white border-red-500" data-url="${watchUrl}">سيرفر 1</button>
                         <button class="server-tab-btn py-2 px-4 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-500 transition-colors" data-url="https://multiembed.mov/?video_id=${item.external_ids?.imdb_id}">سيرفر 2</button>
                    </div>
                </div>
                
                ${watchSectionHTML}
                ${contentHTML}
            `;
        
        if (isSeries) {
            renderSeasons(item);
        }
    };

    const renderSeasons = (series) => {
        const container = document.getElementById('seasons-container');
        if (!container) return;

        let seasonsHTML = '<div class="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-2">';
        series.seasons.forEach((s, index) => {
            if (s.season_number === 0) return;
            seasonsHTML += `<button class="season-btn px-4 py-2 rounded-lg transition-colors ${index === 1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}" data-season-number="${s.season_number}">موسم ${s.season_number}</button>`;
        });
        seasonsHTML += '</div><div id="episodes-grid" class="text-white"></div>';
        container.innerHTML = seasonsHTML;

        const renderEpisodesForSeason = async (seasonNum) => {
            const episodesGrid = document.getElementById('episodes-grid');
            episodesGrid.innerHTML = '<p>جاري تحميل الحلقات...</p>';
            const seasonDetails = await fetchFromTMDb(`tv/${series.id}/season/${seasonNum}`);
            if (!seasonDetails || !seasonDetails.episodes) {
                episodesGrid.innerHTML = '<p>لم يتم العثور على حلقات.</p>';
                return;
            }

            episodesGrid.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    ${seasonDetails.episodes.map(ep => {
                        const epThumbnail = ep.still_path ? `${imgBaseUrl}w300${ep.still_path}` : 'https://placehold.co/400x225/111827/ffffff?text=No+Image';
                        const watchUrl = `https://vidsrc.to/embed/tv/${series.id}/${ep.season_number}/${ep.episode_number}`;
                        return `
                        <div class="episode-card group bg-gray-800 rounded-lg overflow-hidden cursor-pointer" data-url="${watchUrl}">
                            <div class="relative">
                                <img src="${epThumbnail}" alt="${ep.name}" class="w-full h-auto object-cover">
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                     <div class="play-icon-hover w-10 h-10 bg-red-600/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div class="p-3 text-right">
                                <h4 class="text-white font-semibold truncate">ح${ep.episode_number}: ${ep.name}</h4>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;
        }
        
        const firstSeason = series.seasons.find(s => s.season_number > 0);
        if(firstSeason) {
             renderEpisodesForSeason(firstSeason.season_number);
        }

        container.addEventListener('click', e => {
             const seasonBtn = e.target.closest('.season-btn');
             if(seasonBtn) {
                document.querySelectorAll('.season-btn').forEach(btn => btn.classList.remove('bg-red-600', 'text-white') & btn.classList.add('bg-gray-800', 'text-gray-300'));
                seasonBtn.classList.add('bg-red-600', 'text-white');
                seasonBtn.classList.remove('bg-gray-800', 'text-gray-300');
                renderEpisodesForSeason(seasonBtn.dataset.seasonNumber);
             }
             const episodeCard = e.target.closest('.episode-card');
             if(episodeCard) {
                document.getElementById('watch-section').style.display = 'block';
                document.getElementById('video-player').src = episodeCard.dataset.url;
                window.scrollTo({ top: document.getElementById('watch-section').offsetTop - 80, behavior: 'smooth' });
             }
        });
    };

    const renderListPage = async (title, fetchFn) => {
        document.getElementById('list-page-title').textContent = title;
        const grid = document.getElementById('list-page-grid');
        grid.innerHTML = '<p class="col-span-full text-center text-white">جاري التحميل...</p>';
        
        const data = await fetchFn();
        const items = data?.results || [];

        grid.innerHTML = items.length > 0 ? items.map(createMovieCard).join('') : `<p class="col-span-full text-center text-white">لا توجد نتائج.</p>`;
    };

    const fetchFromLocalServers = async () => {
        try {
            const response = await fetch(`servers.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error('Failed to load servers.json. Make sure the file exists and the bot has run.');
                return { movies: [], series: [], anime: [] };
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching or parsing servers.json:', error);
            return { movies: [], series: [], anime: [] };
        }
    };

    const createLocalItemCard = (item, category) => {
        const title = item.title;
        const posterPath = item.image || 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const itemData = encodeURIComponent(JSON.stringify(item));

        return `
            <div class="group relative rounded-lg overflow-hidden shadow-lg bg-gray-800 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer" data-local-item='${itemData}' data-category='${category}'>
                <img src="${posterPath}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div class="play-icon-hover w-16 h-16 bg-red-600/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path></svg>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-3 card-overlay text-right">
                    <h3 class="text-white font-bold truncate">${title}</h3>
                </div>
                <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">أنمي</div>
            </div>
        `;
    };

    const renderSimpleDetailsPage = (item) => {
        const title = item.title;
        const posterPath = item.image || 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const embedUrl = item.embed_url;

        if (!embedUrl) {
            pages.details.innerHTML = `<div class="text-center py-20 text-white">رابط المشاهدة غير متوفر.</div>`;
            return;
        }

        pages.details.innerHTML = `
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
                <h1 class="text-3xl md:text-4xl font-extrabold mb-6">${title}</h1>
                <div class="flex flex-col md:flex-row gap-8">
                    <div class="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
                        <img src="${posterPath}" alt="${title}" class="rounded-lg shadow-lg">
                    </div>
                    <div class="flex-grow">
                        <h2 class="text-2xl font-bold mb-4">شاهد الآن</h2>
                        <div class="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden">
                            <iframe src="${embedUrl}" frameborder="0" allowfullscreen class="w-full h-full"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderLocalCategory = async (category, title) => {
        document.getElementById('list-page-title').textContent = title;
        const grid = document.getElementById('list-page-grid');
        grid.innerHTML = '<p class="col-span-full text-center text-white">جاري التحميل...</p>';

        const localData = await fetchFromLocalServers();
        const items = localData[category] || [];

        grid.innerHTML = items.length > 0 ? items.map(item => createLocalItemCard(item, category)).join('') : `<p class="col-span-full text-center text-white">لا توجد نتائج. تأكد من تشغيل البوت لإضافة محتوى.</p>`;
    };

    // --- NAVIGATION & PAGE MANAGEMENT ---
    const navigateTo = (pageName, data = {}) => {
        window.scrollTo(0, 0);
        
        Object.values(pages).forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        let targetPage = pages.home;
        if (pageName.startsWith('list-') || pageName === 'anime' || pageName === 'countries') {
            targetPage = pages.list;
        } else if (pageName.startsWith('details')) {
            targetPage = pages.details;
        } else if (pages[pageName]) {
            targetPage = pages[pageName];
        }

        if(targetPage) {
            targetPage.classList.add('active');
        }

        document.querySelectorAll(`.nav-link[data-page="${data.nav_id || pageName}"]`).forEach(l => l.classList.add('active'));

        state.currentPage = pageName;

        switch(pageName) {
            case 'home':
                renderHomePage();
                break;
            case 'details':
                state.currentItemId = data.id;
                state.currentMediaType = data.mediaType;
                renderDetailsPage(data.id, data.mediaType);
                break;
            case 'details-local':
                renderSimpleDetailsPage(data.item);
                break;
            case 'list-movies':
                renderListPage('كل الأفلام', () => fetchFromTMDb('discover/movie', { sort_by: 'popularity.desc' }));
                break;
            case 'list-series':
                renderListPage('كل المسلسلات', () => fetchFromTMDb('discover/tv', { sort_by: 'popularity.desc' }));
                break;
            case 'anime':
            case 'list-anime':
                renderLocalCategory('anime', 'كل الأنمي');
                break;
            case 'list-anime-genre':
                renderLocalCategory('anime', `أنمي: ${data.genreName}`);
                break;
            case 'list-movies-country':
                renderListPage(`أفلام ${data.countryName}`, () => fetchFromTMDb('discover/movie', { with_origin_country: data.country, sort_by: 'popularity.desc' }));
                break;
            case 'list-series-country':
                renderListPage(`مسلسلات ${data.countryName}`, () => fetchFromTMDb('discover/tv', { with_origin_country: data.country, sort_by: 'popularity.desc' }));
                break;
            case 'list-country':
                renderListPage(`أفلام ومسلسلات ${data.countryName}`, async () => {
                    const [movies, series] = await Promise.all([
                        fetchFromTMDb('discover/movie', { with_origin_country: data.country, sort_by: 'popularity.desc' }),
                        fetchFromTMDb('discover/tv', { with_origin_country: data.country, sort_by: 'popularity.desc' })
                    ]);
                    const combined = [...(movies?.results || []), ...(series?.results || [])];
                    return { results: combined.sort((a, b) => b.popularity - a.popularity) };
                });
                break;
            case 'list-categories':
                 document.getElementById('list-page-title').textContent = 'الفئات';
                 document.getElementById('list-page-grid').innerHTML = Object.entries(genreMap).map(([id, name]) => `
                    <div class="category-card h-32 rounded-lg bg-gray-800 hover:bg-red-700 flex items-center justify-center text-xl font-bold text-white cursor-pointer transition-colors" data-genre-id="${id}" data-genre-name="${name}">
                        ${name}
                    </div>
                 `).join('');
                break;
            case 'list-genre':
                renderListPage(`فئة: ${data.genreName}`, () => fetchFromTMDb('discover/movie', { with_genres: data.genreId }));
                break;
            case 'list-search':
                renderListPage(`نتائج البحث عن "${data.query}"`, () => fetchFromTMDb('search/multi', { query: data.query }));
                break;
        }
    };

    // --- EVENT HANDLERS & INITIALIZATION ---
    let currentSlide = 0;
    let sliderInterval;
    const setupSlider = () => {
        const slides = document.querySelectorAll('.slider-item');
        const dots = document.querySelectorAll('.slider-dot');
        if (slides.length === 0) return;

        const showSlide = (index) => {
            if (!slides[index] || !dots[index]) return;
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                dots[i].classList.remove('bg-red-600');
                dots[i].classList.add('bg-gray-500');
            });
            slides[index].classList.add('active');
            dots[index].classList.add('bg-red-600');
            dots[index].classList.remove('bg-gray-500');
            currentSlide = index;
        };

        const nextSlide = () => {
            showSlide((currentSlide + 1) % slides.length);
        };

        if (sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 5000);

        document.getElementById('slider-dots').addEventListener('click', (e) => {
            if(e.target.matches('.slider-dot')){
                clearInterval(sliderInterval);
                showSlide(parseInt(e.target.dataset.index));
                sliderInterval = setInterval(nextSlide, 5000);
            }
        });
    }
    
    document.body.addEventListener('click', (e) => {
        const localCard = e.target.closest('[data-local-item]');
        if (localCard) {
            const itemData = JSON.parse(decodeURIComponent(localCard.dataset.localItem));
            navigateTo('details-local', { item: itemData, nav_id: 'anime' });
            return;
        }

        const card = e.target.closest('.group[data-id], .view-details-btn[data-id]');
        if (card) {
            navigateTo('details', { id: card.dataset.id, mediaType: card.dataset.mediaType });
            return;
        }

        const navLink = e.target.closest('.nav-link[data-page]');
        if (navLink) {
            e.preventDefault();
            const page = navLink.dataset.page;
            const country = navLink.dataset.country;
            const countryName = navLink.dataset.countryName;
            const genreName = navLink.dataset.genreName;

            const pageToGo = {
                'home': 'home',
                'movies': 'list-movies',
                'series': 'list-series',
            }[page] || page;

            navigateTo(pageToGo, { nav_id: page, country, countryName, genreName });
            document.getElementById('mobile-menu').classList.add('hidden');
            return;
        }
        
        const categoryCard = e.target.closest('.category-card[data-genre-id]');
        if (categoryCard) {
            navigateTo('list-genre', { genreId: categoryCard.dataset.genreId, genreName: categoryCard.dataset.genreName });
            return;
        }

        const watchOnlineBtn = e.target.closest('#watch-online-btn');
        if (watchOnlineBtn) {
            document.getElementById('watch-section').style.display = 'block';
            document.getElementById('server-tabs').style.display = 'flex';
            document.getElementById('video-player').src = watchOnlineBtn.dataset.url;
            window.scrollTo({ top: document.getElementById('watch-section').offsetTop - 80, behavior: 'smooth' });
        }

        const serverTab = e.target.closest('.server-tab-btn');
        if (serverTab) {
            document.querySelectorAll('.server-tab-btn').forEach(btn => btn.classList.remove('active', 'text-white', 'border-red-500'));
            serverTab.classList.add('active', 'text-white', 'border-red-500');
            document.getElementById('video-player').src = serverTab.dataset.url;
        }
    });
    
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            navigateTo('list-search', { query: e.target.value.trim() });
            e.target.blur();
        }
    });

    // --- INITIAL LOAD ---
    const initialize = async () => {
        await fetchAndStoreGenres();
        navigateTo('home');
    };

    initialize();
});