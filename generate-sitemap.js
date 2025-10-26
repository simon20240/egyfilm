import axios from 'axios';
import fs from 'fs/promises';

// --- CONFIGURATION ---
// IMPORTANT: Replace with your actual TMDB Access Token if needed, or use the API key.
const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjOWMxY2M2OGEwODU0ZDdhYzY3MDM2ZmZkNjc2OGE1MyIsIm5iZiI6MTc1OTk0MjkzMS4xMDksInN1YiI6IjY4ZTY5OTEzNWRiY2Q3Y2FmNzAxMDM3NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vl54E0QE7skBZdPm7GBPxzEDrWuw9UkMQYDHnNCePnM';
const siteUrl = 'https://egyfilm-three.vercel.app'; // Your website's base URL
const apiUrl = 'https://api.themoviedb.org/3';
const totalPagesToFetch = 50; // Fetches 20 items per page, so 50*20 = 1000 items per category

const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json;charset=utf-8'
    }
});

/**
 * Fetches multiple pages of data from a TMDb endpoint.
 * @param {string} endpoint - The TMDb API endpoint (e.g., 'movie/popular').
 * @returns {Array} - A flat array of results.
 */
async function fetchAllPages(endpoint) {
    let results = [];
    console.log(`Fetching ${totalPagesToFetch} pages for ${endpoint}...`);
    for (let page = 1; page <= totalPagesToFetch; page++) {
        try {
            const response = await axiosInstance.get(endpoint, { params: { page } });
            if (response.data && response.data.results) {
                results = results.concat(response.data.results);
            }
        } catch (error) {
            console.error(`Error fetching page ${page} from ${endpoint}: ${error.message}`);
            // Stop if one page fails
            break;
        }
    }
    console.log(`...found ${results.length} items.`);
    return results;
}

/**
 * Generates the sitemap.xml file.
 */
async function generateSitemap() {
    console.log('Starting sitemap generation...');
    const urls = new Set();

    // 1. Add static and main list pages
    urls.add({ loc: `${siteUrl}` });
    urls.add({ loc: `${siteUrl}/#/list-movies` });
    urls.add({ loc: `${siteUrl}/#/list-series` });
    urls.add({ loc: `${siteUrl}/#/list-anime` });

    // 2. Add movie and series detail pages
    const [movies, series, trending] = await Promise.all([
        fetchAllPages('movie/popular'),
        fetchAllPages('tv/popular'),
        fetchAllPages('trending/all/week')
    ]);

    movies.forEach(item => urls.add({ loc: `${siteUrl}/#/details?id=${item.id}&mediaType=movie` }));
    series.forEach(item => urls.add({ loc: `${siteUrl}/#/details?id=${item.id}&mediaType=tv` }));
    trending.forEach(item => {
        if (item.media_type === 'movie' || item.media_type === 'tv') {
             urls.add({ loc: `${siteUrl}/#/details?id=${item.id}&mediaType=${item.media_type}` });
        }
    });

    // 3. Construct the XML
    const today = new Date().toISOString().split('T')[0];
    const sitemapXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${[...urls].map(url => `
                <url>
                    <loc>${url.loc.replace(/&/g, '&amp;')}</loc>
                    <lastmod>${today}</lastmod>
                    <priority>0.8</priority>
                </url>
            `).join('')}
        </urlset>
    `.trim();

    // 4. Write the file
    try {
        await fs.writeFile('public/sitemap.xml', sitemapXml);
        console.log('✅ Sitemap generated successfully at public/sitemap.xml');
    } catch (error) {
        console.error(`❌ Error writing sitemap file: ${error.message}`);
    }
}

generateSitemap();