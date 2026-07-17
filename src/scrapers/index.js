import logger from '../utils/logger.js';
import * as tmdb from './providers/tmdb.js';
import superembed from './providers/superembed.js';
import * as vidsrc from './providers/vidsrc.js';
import * as twoembed from './providers/twoembed.js';
import * as streamDetector from './utils/streamDetector.js';
import * as serverRanker from './ranking/serverRanker.js';
import * as subtitleScraper from './subtitles/subtitleScraper.js';

export async function scrapeMovie(movieName) {
    logger.info(`Starting scrape for movie: ${movieName}`);
    
    // 1. Get Metadata
    const searchResults = await tmdb.searchMovie(movieName);
    if (!searchResults || searchResults.length === 0) {
        logger.warn(`No metadata found for: ${movieName}`);
        return null;
    }
    const movie = searchResults[0];
    logger.info(`Found movie: ${movie.title} (ID: ${movie.id})`);

    // 2. Get Servers
    // Note: We need IMDb ID for SuperEmbed, which requires a details call
    const details = await tmdb.getMovieDetails(movie.id);
    const imdbId = details ? details.imdb_id : null;

    // Run providers in parallel
    const providerPromises = [
        superembed.getServers(movie.id, imdbId),
        vidsrc.getServers(movie.id, imdbId),
        twoembed.getServers(movie.id, imdbId)
    ];

    const results = await Promise.allSettled(providerPromises);
    
    let allServers = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allServers = allServers.concat(result.value);
        } else {
            logger.error(`Provider ${index} failed: ${result.reason}`);
        }
    });

    // Deduplicate servers based on URL
    const uniqueServers = [];
    const seenUrls = new Set();
    
    for (const server of allServers) {
        if (!seenUrls.has(server.url)) {
            seenUrls.add(server.url);
            uniqueServers.push(server);
        }
    }

    logger.info(`Found ${uniqueServers.length} potential servers (after deduplication).`);

    // 3. Check Health & Detect Streams
    const checkedServers = [];
    for (const server of uniqueServers) {
        const health = await streamDetector.checkStreamHealth(server.url);
        checkedServers.push({ ...server, ...health });
    }

    // 4. Fetch Subtitles (if needed)
    let subtitle = null;
    if (imdbId) {
        subtitle = await subtitleScraper.fetchArabicSubtitle(imdbId);
    }
    
    // Attach subtitle info to servers (or return separately)
    const serversWithSubs = checkedServers.map(s => ({
        ...s,
        hasSubtitles: !!subtitle
    }));

    // 5. Rank Servers
    const rankedServers = serverRanker.rankServers(serversWithSubs);
    
    const result = {
        movie: {
            title: movie.title,
            id: movie.id,
            imdb_id: imdbId,
            overview: movie.overview,
            poster_path: movie.poster_path,
            release_date: movie.release_date
        },
        servers: rankedServers,
        subtitle: subtitle ? { lang: subtitle.lang, type: subtitle.type } : null
    };

    logger.info(`Scrape complete for ${movieName}. Best server: ${rankedServers.length > 0 ? rankedServers[0].url : 'None'}`);
    return result;
}
