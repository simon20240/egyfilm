import { TMDB } from 'tmdb-ts';
import logger from '../../utils/logger.js';

// Initialize TMDB with key from env or fallback
const tmdb = new TMDB(process.env.TMDB_API_KEY || 'c9c1cc68a0854d7ac67036ffd6768a53');

export async function searchMovie(query) {
    try {
        const results = await tmdb.search.movies({ query });
        return results.results;
    } catch (error) {
        logger.error(`TMDB Search Error: ${JSON.stringify(error)}`);
        return [];
    }
}

export async function getMovieDetails(id) {
    try {
        const details = await tmdb.movies.details(id);
        return details;
    } catch (error) {
        logger.error(`TMDB Details Error: ${error.message}`);
        return null;
    }
}

export async function getSeriesDetails(id) {
    try {
        const details = await tmdb.tvShows.details(id);
        return details;
    } catch (error) {
        logger.error(`TMDB Series Details Error: ${error.message}`);
        return null;
    }
}
