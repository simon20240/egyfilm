import { BaseScraper } from '../BaseScraper.js';

export default class VidSrcScraper extends BaseScraper {
    constructor() {
        super('VidSrc');
        this.baseUrl = 'https://vidsrc.me';
    }

    async getServers(tmdbId, imdbId) {
        const servers = [];
        
        // VidSrc usually works with IMDB ID or TMDB ID
        // Format: https://vidsrc.me/embed/movie?tmdb=ID or ?imdb=ID
        
        if (tmdbId) {
            servers.push({
                name: 'VidSrc (TMDB)',
                url: `${this.baseUrl}/embed/movie?tmdb=${tmdbId}`,
                source: 'vidsrc',
                quality: 'HD', // Assumed
                isBackup: false
            });
        }

        if (imdbId) {
            servers.push({
                name: 'VidSrc (IMDB)',
                url: `${this.baseUrl}/embed/movie?imdb=${imdbId}`,
                source: 'vidsrc',
                quality: 'HD',
                isBackup: false
            });
        }

        return servers;
    }
}

export const getServers = async (tmdbId, imdbId) => {
    const scraper = new VidSrcScraper();
    return scraper.getServers(tmdbId, imdbId);
};
