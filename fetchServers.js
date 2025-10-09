require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
const MOVIES_TO_SEARCH = ['The Shawshank Redemption', 'The Godfather', 'The Dark Knight', 'Pulp Fiction'];
const OUTPUT_FILE = 'servers.json';
const DOOD_API_KEY = process.env.DOOD_API_KEY;

// Doodstream API endpoint for searching videos
const API_SEARCH_URL = 'https://doodapi.co/api/search/videos';

/**
 * Searches for a movie on Doodstream using their official API.
 * @param {string} movieName - The name of the movie to search for.
 * @returns {Promise<object|null>} - The first search result object, or null if not found.
 */
async function searchDoodstream(movieName) {
    console.log(`Searching Doodstream for "${movieName}"...`);
    
    if (!DOOD_API_KEY || DOOD_API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('  > ERROR: Doodstream API key is missing or a placeholder. Please update your .env file.');
        return null;
    }

    const url = `${API_SEARCH_URL}?key=${DOOD_API_KEY}&search_term=${encodeURIComponent(movieName)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 200 && data.result && data.result.files && data.result.files.length > 0) {
            const firstResult = data.result.files[0];
            console.log(`  > Found: "${firstResult.title}"`);
            return {
                movie_title: movieName,
                found_title: firstResult.title,
                download_url: firstResult.download_url
            };
        } else {
            console.log(`  > No results found for "${movieName}".`);
            return null;
        }
    } catch (error) {
        console.error(`  > An error occurred during the API call for "${movieName}":`, error);
        return null;
    }
}

/**
 * Main function to run the script.
 */
async function main() {
    console.log('--- Starting Doodstream API Movie Fetcher ---');
    const allResults = [];

    for (const movie of MOVIES_TO_SEARCH) {
        const result = await searchDoodstream(movie);
        if (result) {
            allResults.push(result);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
    console.log(`
--- Finished ---`);
    console.log(`Found links for ${allResults.length} movies. Results saved to ${OUTPUT_FILE}`);
}

main();