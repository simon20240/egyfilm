const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';

/**
 * Appends new video data to the appropriate JSON file.
 * @param {string} mediaType - 'movies' or 'series'.
 * @param {object} videoData - The data to save.
 */
async function saveVideoData(mediaType, videoData) {
    const filePath = path.join(__dirname, '..', '..', 'data', `${mediaType}.json`);
    try {
        let data = { results: [] };
        try {
            const existingData = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(existingData);
            if (!Array.isArray(data.results)) {
                data.results = [];
            }
        } catch (error) {
            console.log(`Creating new data file: ${filePath}`);
        }

        data.results.unshift(videoData);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Successfully saved data to ${filePath}`);
    } catch (error) {
        console.error(`Error saving video data:`, error);
    }
}

/**
 * Fetches movie or series details from TMDb.
 * @param {string} mediaType - 'movies' or 'tv'.
 * @param {string} tmdbId - The ID from TMDb.
 * @returns {Promise<object|null>}
 */
async function fetchFromTMDb(mediaType, tmdbId) {
    if (!TMDB_API_KEY) return null;
    const endpoint = mediaType === 'movies' ? `movie/${tmdbId}` : `tv/${tmdbId}`;
    const url = `${TMDB_API_URL}/${endpoint}?api_key=${TMDB_API_KEY}&language=ar-EG`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch data from TMDb for ID ${tmdbId}:`, error.message);
        return null;
    }
}

/**
 * Scrapes a page to find the title and searches TMDb for it.
 * @param {string} pageUrl The URL of the movie/series page.
 * @returns {Promise<{tmdbId: string, mediaType: string, videoUrl: string}|null>}
 */
async function findMediaDetails(pageUrl) {
    try {
        console.log(`Scraping page: ${pageUrl}`);
        const { data: html } = await axios.get(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(html);

        const title = $('h1.movie_title').text().trim();
        if (!title) {
            console.error('Could not find title on the page.');
            return null;
        }
        console.log(`Found title: "${title}"`);

        const searchUrl = `${TMDB_API_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
        const searchResults = await axios.get(searchUrl);
        const bestMatch = searchResults?.data?.results?.[0];

        if (!bestMatch || !bestMatch.id || !['movie', 'tv'].includes(bestMatch.media_type)) {
            console.error(`No good TMDb match found for "${title}".`);
            return null;
        }

        const tmdbId = bestMatch.id;
        const mediaType = bestMatch.media_type === 'tv' ? 'series' : 'movies';
        console.log(`Found TMDb match: ID=${tmdbId}, Type=${mediaType}`);

        return { tmdbId, mediaType, videoUrl: pageUrl };

    } catch (error) {
        console.error('Error during scraping or TMDb search:', error.message);
        return null;
    }
}

module.exports = { saveVideoData, fetchFromTMDb, findMediaDetails };