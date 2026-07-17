import { BaseScraper } from '../BaseScraper.js';

export default class TwoEmbedScraper extends BaseScraper {
    constructor() {
        super('TwoEmbed');
        this.baseUrl = 'https://www.2embed.cc';
    }

    async getServers(tmdbId, imdbId) {
        const servers = [];
        
        // TwoEmbed usually works with TMDB ID
        // Format: https://www.2embed.cc/embed/ID
        
        if (tmdbId) {
            servers.push({
                name: 'TwoEmbed',
                url: `${this.baseUrl}/embed/${tmdbId}`,
                source: 'twoembed',
                quality: 'HD',
                isBackup: true // Marking as backup as requested
            });
        }

        return servers;
    }
}

export const getServers = async (tmdbId, imdbId) => {
    const scraper = new TwoEmbedScraper();
    return scraper.getServers(tmdbId, imdbId);
};
