const fs = require('fs');
const path = require('path');
const axios = require('axios');

const playlistsDir = path.join(__dirname, 'iptv-repo', 'playlists');
const dataDir = path.join(__dirname, 'data');
const outputFilePath = path.join(dataDir, 'movies.json');

const TMDB_API_KEY = 'c9c1cc68a0854d7ac67036ffd6768a53'; // This is from script.js, consider moving to .env
const TMDB_API_URL = 'https://api.themoviedb.org/3';

async function fetchTMDbData(title) {
    try {
        const searchResponse = await axios.get(`${TMDB_API_URL}/search/multi`, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                language: 'ar-EG'
            }
        });

        if (searchResponse.data.results.length > 0) {
            const item = searchResponse.data.results[0];
            return {
                tmdb_id: item.id,
                title: item.title || item.name,
                overview: item.overview,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date,
                vote_average: item.vote_average,
                media_type: item.media_type
            };
        }
    } catch (error) {
        console.error(`Error fetching TMDb data for "${title}":`, error.message);
    }
    return null;
}

function parseM3U(content) {
    const lines = content.split('\n');
    const movies = [];
    let currentMovie = {};

    for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
            const titleMatch = line.match(/tvg-name="([^"]+)"/);
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupTitleMatch = line.match(/group-title="([^"]+)"/);
            const titleAfterComma = line.split(',').pop();

            currentMovie.title = titleMatch ? titleMatch[1].trim() : (titleAfterComma ? titleAfterComma.trim() : 'Untitled');
            currentMovie.logo = logoMatch ? logoMatch[1] : null;
            currentMovie.group = groupTitleMatch ? groupTitleMatch[1] : 'General';

        } else if (line.trim() && !line.startsWith('#')) {
            currentMovie.url = line.trim();
            movies.push(currentMovie);
            currentMovie = {};
        }
    }
    return movies;
}

async function processPlaylists() {
    const allMovies = [];
    try {
        const files = fs.readdirSync(playlistsDir);

        for (const file of files) {
            if (path.extname(file) === '.m3u8') {
                const filePath = path.join(playlistsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const movies = parseM3U(content);

                for (const movie of movies) {
                    console.log(`Processing: ${movie.title}`);
                    const tmdbData = await fetchTMDbData(movie.title);
                    if (tmdbData) {
                        allMovies.push({
                            ...movie,
                            ...tmdbData
                        });
                    } else {
                        allMovies.push(movie); // Add movie even if TMDb data is not found
                    }
                }
            }
        }

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        fs.writeFileSync(outputFilePath, JSON.stringify(allMovies, null, 2));
        console.log(`Successfully saved ${allMovies.length} movies to ${outputFilePath}`);

    } catch (error) {
        console.error("Error processing playlists:", error);
    }
}

processPlaylists();
