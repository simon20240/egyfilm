import fs from 'fs';
import { getSuperEmbedServers } from './superembed_fetcher.js';
import { TMDB } from 'tmdb-ts';

const tmdb = new TMDB(process.env.TMDB_API_KEY || 'c9c1cc68a0854d7ac67036ffd6768a53');

async function findId(title) {
    try {
        const results = await tmdb.search.movies({ query: title });
        const movie = results.results[0];
        if (movie) {
            const movieDetails = await tmdb.movies.details(movie.id);
            return { tmdb_id: movie.id, imdb_id: movieDetails.imdb_id };
        }
        return { tmdb_id: null, imdb_id: null };
    } catch (error) {
        console.error(`Error finding ID for title "${title}":`, error);
        return { tmdb_id: null, imdb_id: null };
    }
}

async function updateMovieServers() {
    try {
        const content = JSON.parse(fs.readFileSync('content.json', 'utf-8'));
        const movies = content.movies_to_process;
        const moviesWithServers = [];

        for (const movie of movies) {
            let { tmdb_id, imdb_id } = await findId(movie.title);

            // Dummy data for testing frontend
            if (!tmdb_id && !imdb_id) {
                tmdb_id = '12345';
                imdb_id = 'tt1234567';
            }

            const superEmbedServers = await getSuperEmbedServers(tmdb_id, imdb_id);

            const movieWithServers = {
                ...movie,
                servers: [
                    superEmbedServers
                ]
            };
            moviesWithServers.push(movieWithServers);
        }

        fs.writeFileSync('movies_with_servers.json', JSON.stringify(moviesWithServers, null, 2));
        console.log('Successfully updated movie servers.');
    } catch (error) {
        console.error('An error occurred while updating movie servers:', error);
    }
}

updateMovieServers();
