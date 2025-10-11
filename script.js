document.addEventListener('DOMContentLoaded', function () {

    // --- TMDb API CONFIGURATION ---
    const apiKey = 'c9c1cc68a0854d7ac67036ffd6768a53';
    const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjOWMxY2M2OGEwODU0ZDdhYzY3MDM2ZmZkNjc2OGE1MyIsIm5iZiI6MTc1OTk0MjkzMS4xMDksInN1YiI6IjY4ZTY5OTEzNWRiY2Q3Y2FmNzAxMDM3NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vl54E0QE7skBZdPm7GBPxzEDrWuw9UkMQYDHnNCePnM';
    const apiUrl = 'https://api.themoviedb.org/3';
    const imgBaseUrl = 'https://image.tmdb.org/t/p/';

    // --- LANGUAGE & TRANSLATION ---
    let translations = {};
    let currentLang = 'ar'; // Default language

    const fetchTranslations = async () => {
        try {
            const response = await fetch('languages.json');
            if (!response.ok) {
                console.error('Failed to load languages.json');
                return;
            }
            translations = await response.json();
        } catch (error) {
            console.error('Error fetching translations:', error);
        }
    };

    // --- GLOBAL STATE & CONSTANTS ---
    const state = {
        currentPage: 'home',
        currentItemId: null,
        currentListPage: 1,
        itemsPerPage: 20,
        currentMediaType: 'movie',
        currentFetchFn: null,
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
                            <span data-lang-key="watch_now">شاهد الآن</span>
                        </button>
                    </div>
                </div>
            `}).join('');
        sliderDots.innerHTML = featured.map((_, index) => `<button class="slider-dot w-3 h-3 rounded-full ${index === 0 ? 'bg-red-600' : 'bg-gray-500'}" data-index="${index}"></button>`).join('');

        const contentSections = document.getElementById('content-sections');
        const sections = [
            { titleKey: 'latest_movies', title: 'أحدث الأفلام 🎬', items: popularMovies?.results || [] },
            { titleKey: 'latest_series', title: 'أحدث المسلسلات 📺', items: popularTv?.results || [] },
            { titleKey: 'top_rated', title: 'الأعلى تقييماً 🎖️', items: topRatedMovies?.results || [] },
            { titleKey: 'most_watched', title: 'الأكثر مشاهدة 🔥', items: (trending?.results || []).slice(5) },
        ];
        contentSections.innerHTML = sections.map(section => `
            <section class="mb-10">
                <h2 class="text-2xl font-bold text-white mb-4" data-lang-key="${section.titleKey}">${section.title}</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    ${section.items.map(createMovieCard).join('')}
                </div>
            </section>
        `).join('');
        setupSlider();
        updateUIText(currentLang);
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
        // The Doodstream URL will come from your JSON file for uploaded content
        const watchUrl = item.doodstream_embed_url || (isSeries ? `https://vidsrc.to/embed/tv/${watchId}` : `https://vidsrc.to/embed/movie/${watchId}`);

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
                         <button class="server-tab-btn py-2 px-4 text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-500 transition-colors" data-url="https://multiembed.mov/?video_id=${watchId}">سيرفر 2</button>
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

    const renderListPage = async (title, fetchFn, page = 1) => {
        document.getElementById('list-page-title').textContent = title;
        const grid = document.getElementById('list-page-grid');
        const pagination = document.getElementById('list-page-pagination');

        let currentFetchFn = fetchFn;
        if (page > 1 && state.currentFetchFn) {
            currentFetchFn = state.currentFetchFn;
        } else {
            state.currentFetchFn = fetchFn;
        }

        if (page === 1) {
            grid.innerHTML = '<p class="col-span-full text-center text-white">جاري التحميل...</p>';
        }

        const data = await currentFetchFn(page);
        const items = data?.results || [];

        if (page === 1) {
            grid.innerHTML = items.length > 0 ? items.map(createMovieCard).join('') : `<p class="col-span-full text-center text-white">لا توجد نتائج.</p>`;
        } else {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            grid.innerHTML += items.map(createMovieCard).join('');
        }

        state.currentListPage = page;

        if (data && data.total_pages > page) {
            pagination.innerHTML = `<button id="load-more-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">تحميل المزيد</button>`;
        } else {
            pagination.innerHTML = '';
        }
    };

    // --- JIKAN API & ANIME FUNCTIONS ---

    const fetchFromJikan = async (endpoint, params = {}) => {
        const urlParams = new URLSearchParams(params);
        const url = `https://api.jikan.moe/v4/${endpoint}?${urlParams}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Jikan API Error: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch from Jikan API:', error);
            return null;
        }
    };

    const createAnimeCard = (item) => {
        const title = item.title;
        const posterPath = item.images?.jpg?.large_image_url || 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const score = item.score ? item.score.toFixed(1) : 'N/A';
        const type = item.type || 'Anime';

        return `
            <div class="group relative rounded-lg overflow-hidden shadow-lg bg-gray-800 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer" data-anime-id="${item.mal_id}">
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
                        <span>${type}</span>
                        <div class="flex items-center space-x-1 space-x-reverse">
                             <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span>${score}</span>
                        </div>
                    </div>
                </div>
                <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">أنمي</div>
            </div>
        `;
    };

    const renderAnimePage = async (title, endpoint, params = {}) => {
        document.getElementById('list-page-title').textContent = title;
        const grid = document.getElementById('list-page-grid');
        grid.innerHTML = '<p class="col-span-full text-center text-white">جاري تحميل الأنمي...</p>';

        const jikanData = await fetchFromJikan(endpoint, params);
        const items = jikanData?.data || [];

        console.log('Anime items from Jikan API:', items); // Debugging line

        if (items.length > 0) {
            grid.innerHTML = items.map(createAnimeCard).join('');
        } else {
            grid.innerHTML = `<p class="col-span-full text-center text-white">لا توجد نتائج. ربما حدث خطأ أثناء تحميل البيانات من Jikan API.</p>`;
        }
    };

    const renderAnimeDetailsPage = async (animeId) => {
        const item = await fetchFromJikan(`anime/${animeId}`);
        if (!item || !item.data) {
            pages.details.innerHTML = `<div class="text-center py-20 text-white">تفاصيل الأنمي غير متوفرة.</div>`;
            return;
        }

        const anime = item.data;
        const title = anime.title;
        const year = anime.year || '';
        const backdropPath = anime.images?.jpg?.large_image_url || 'https://placehold.co/1920x1080/1a202c/ffffff?text=No+Image';
        const posterPath = anime.images?.jpg?.large_image_url || 'https://placehold.co/500x750/1a202c/ffffff?text=No+Image';
        const trailer = anime.trailer?.youtube_id;
        const synopsis = anime.synopsis || 'لا يوجد ملخص متوفر.';
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';
        const episodes = anime.episodes || '?';

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
                            <span class="font-semibold">${anime.type} - ${episodes} حلقات</span>
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                ${score}
                            </span>
                        </div>
                        <p class="mt-4 text-gray-400 max-w-3xl mx-auto md:mx-0">${synopsis}</p>
                        <div class="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                            ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer}" target="_blank" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                مشاهدة الإعلان
                            </a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // --- NAVIGATION & PAGE MANAGEMENT ---
    const navigateTo = async (pageName, data = {}) => {
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
                await renderHomePage();
                break;
            case 'details':
                state.currentItemId = data.id;
                state.currentMediaType = data.mediaType;
                await renderDetailsPage(data.id, data.mediaType);
                break;
            case 'details-anime':
                await renderAnimeDetailsPage(data.animeId);
                break;
            case 'list-movies':
                await renderListPage('كل الأفلام', (page) => fetchFromTMDb('discover/movie', { sort_by: 'popularity.desc', page: page }));
                break;
            case 'list-series':
                await renderListPage('كل المسلسلات', (page) => fetchFromTMDb('discover/tv', { sort_by: 'popularity.desc', page: page }));
                break;
            case 'anime':
            case 'list-anime':
                await renderAnimePage('أنمي', 'top/anime', { type: 'ona', page: 1, limit: 100 });
                break;
            case 'list-movies-country':
                await renderListPage(`أفلام ${data.countryName}`, (page) => fetchFromTMDb('discover/movie', { with_origin_country: data.country, sort_by: 'popularity.desc', page: page }));
                break;
            case 'list-series-country':
                await renderListPage(`مسلسلات ${data.countryName}`, (page) => fetchFromTMDb('discover/tv', { with_origin_country: data.country, sort_by: 'popularity.desc', page: page }));
                break;
            case 'list-country':
                await renderListPage(`أفلام ومسلسلات ${data.countryName}`, async (page) => {
                    const [movies, series] = await Promise.all([
                        fetchFromTMDb('discover/movie', { with_origin_country: data.country, sort_by: 'popularity.desc', page: page }),
                        fetchFromTMDb('discover/tv', { with_origin_country: data.country, sort_by: 'popularity.desc', page: page })
                    ]);
                    const combined = [...(movies?.results || []), ...(series?.results || [])];
                    const total_pages = movies.total_pages > series.total_pages ? movies.total_pages : series.total_pages;
                    return { results: combined.sort((a, b) => b.popularity - a.popularity), total_pages: total_pages };
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
                await renderListPage(`فئة: ${data.genreName}`, (page) => fetchFromTMDb('discover/movie', { with_genres: data.genreId, page: page }));
                break;
            case 'list-search':
                await renderListPage(`نتائج البحث عن "${data.query}"`, (page) => fetchFromTMDb('search/multi', { query: data.query, page: page }));
                break;
        }
    };

    let player; // Keep a reference to the player instance
    // --- EVENT HANDLERS & INITIALIZATION ---
    const updateUIText = (lang) => {
        currentLang = lang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        const trans = translations[lang];
        if (!trans) return;

        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (trans[key]) {
                if (el.tagName === 'INPUT') {
                    el.placeholder = trans[key];
                } else {
                    el.textContent = trans[key];
                }
            }
        });

        document.getElementById('current-lang-text').textContent = lang === 'ar' ? 'العربية' : 'English';
    };

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
        const closeAllDropdowns = (except) => {
            document.querySelectorAll('[data-dropdown-menu]').forEach(menu => {
                if (menu !== except) {
                    menu.classList.add('hidden');
                }
            });
        }

        const dropdown = e.target.closest('[data-dropdown]');
        if (dropdown) {
            const dropdownMenu = dropdown.querySelector('[data-dropdown-menu]');
            if (dropdownMenu) {
                const isHidden = dropdownMenu.classList.contains('hidden');
                closeAllDropdowns(dropdownMenu);
                dropdownMenu.classList.toggle('hidden');
            }
        } else {
            closeAllDropdowns();
        }

        const langSwitcher = e.target.closest('.lang-switcher');
        if (langSwitcher) {
            e.preventDefault();
            const lang = langSwitcher.dataset.lang;
            updateUIText(lang);
            return;
        }

        const animeCard = e.target.closest('[data-anime-id]');
        if (animeCard) {
            navigateTo('details-anime', { animeId: animeCard.dataset.animeId });
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
            // Set the src of the iframe to the embed URL
            document.getElementById('video-player').src = watchOnlineBtn.dataset.url;
            window.scrollTo({ top: document.getElementById('watch-section').offsetTop - 80, behavior: 'smooth' });
        }

        const serverTab = e.target.closest('.server-tab-btn');
        if (serverTab) {
            document.querySelectorAll('.server-tab-btn').forEach(btn => btn.classList.remove('active', 'text-white', 'border-red-500'));
            serverTab.classList.add('active', 'text-white', 'border-red-500');
            // Update the iframe src when a server tab is clicked
            const videoPlayer = document.getElementById('video-player');
            if (videoPlayer.tagName === 'IFRAME') {
                videoPlayer.src = serverTab.dataset.url;
            }
        }

        const loadMoreBtn = e.target.closest('#load-more-btn');
        if (loadMoreBtn) {
            const nextPage = state.currentListPage + 1;
            renderListPage(document.getElementById('list-page-title').textContent, null, nextPage);
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
        await fetchTranslations();
        updateUIText(currentLang);
        await fetchAndStoreGenres();
        navigateTo('home');
    };

    // --- ADMIN DASHBOARD LOGIC ---
    const adminDashboard = document.getElementById('admin-dashboard');
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const closeAdminBtn = document.getElementById('close-admin-btn');
    const submitUploadBtn = document.getElementById('submit-upload-btn');
    const scrapeCategoryForm = document.getElementById('scrape-category-form');
    const submitScrapeBtn = document.getElementById('submit-scrape-btn');

    const showAdminDashboard = () => {
        if (window.location.hash === '#admin') {
            adminDashboard.classList.remove('hidden');
        }
    };

    const hideAdminDashboard = () => {
        adminDashboard.classList.add('hidden');
        window.location.hash = '';
    };

    closeAdminBtn.addEventListener('click', hideAdminDashboard);

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        const data = Object.fromEntries(formData.entries());

        submitUploadBtn.disabled = true;
        submitUploadBtn.textContent = 'جاري الرفع، يرجى الانتظار...';
        uploadStatus.textContent = 'بدء عملية الرفع. قد يستغرق هذا عدة دقائق...';

        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                uploadStatus.textContent = `تم الرفع بنجاح! ${result.message}`;
                uploadForm.reset();
            } else {
                uploadStatus.textContent = `فشل الرفع: ${result.message}`;
            }
        } catch (error) {
            uploadStatus.textContent = `حدث خطأ في الشبكة: ${error.message}`;
        } finally {
            submitUploadBtn.disabled = false;
            submitUploadBtn.textContent = 'بدء الرفع';
        }
    });

    scrapeCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(scrapeCategoryForm);
        const data = Object.fromEntries(formData.entries());

        submitScrapeBtn.disabled = true;
        submitScrapeBtn.textContent = 'جاري بدء المسح...';
        uploadStatus.textContent = 'تم إرسال طلب مسح الفئة. تابع تقدم العملية من خلال الكونسول الخاص بالسيرفر.';

        try {
            const response = await fetch('http://localhost:3000/scrape-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // The backend will run in the background, so we just give a success message here.
                uploadStatus.textContent = `تم بدء المسح بنجاح! ${result.message}`;
            } else {
                uploadStatus.textContent = `فشل بدء المسح: ${result.message}`;
            }
        } catch (error) {
            uploadStatus.textContent = `حدث خطأ في الشبكة: ${error.message}`;
        } finally {
            submitScrapeBtn.disabled = false;
            submitScrapeBtn.textContent = 'بدء المسح والرفع';
        }
    });

    // Check for admin hash on load and on hash change
    window.addEventListener('hashchange', showAdminDashboard);
    showAdminDashboard();

    initialize();
});