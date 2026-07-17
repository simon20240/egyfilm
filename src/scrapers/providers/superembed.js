import fetch from 'node-fetch';
import logger from '../../utils/logger.js';

class SuperEmbedProvider {
    constructor() {
        this.baseUrl = 'https://multiembed.mov';
    }

    async checkVip(videoId, isTmdb) {
        let url = `${this.baseUrl}/directstream.php?video_id=${videoId}&check=1`;
        if (isTmdb) url += '&tmdb=1';
        
        try {
            const response = await fetch(url);
            const text = await response.text();
            return text.trim() === '1';
        } catch (error) {
            logger.error(`SuperEmbed VIP check error: ${error.message}`);
            return false;
        }
    }

    generateUrl(videoId, isTmdb, isVip, isSeries = false, season = null, episode = null) {
        let base = isVip ? `${this.baseUrl}/directstream.php` : `${this.baseUrl}/`;
        let url = `${base}?video_id=${videoId}`;
        
        if (isTmdb) url += '&tmdb=1';
        if (isSeries && season && episode) {
            url += `&s=${season}&e=${episode}`;
        }
        
        return url;
    }

    async getServers(tmdbId, imdbId, isSeries = false, season = null, episode = null) {
        const servers = [];

        // Check VIP for IMDb ID
        if (imdbId) {
            const isVip = await this.checkVip(imdbId, false);
            if (isVip) {
                servers.push({
                    name: "SuperEmbed VIP",
                    url: this.generateUrl(imdbId, false, true, isSeries, season, episode),
                    isVip: true,
                    source: 'imdb'
                });
            }
            servers.push({
                name: "SuperEmbed IMDb",
                url: this.generateUrl(imdbId, false, false, isSeries, season, episode),
                isVip: false,
                source: 'imdb'
            });
        }

        // Check VIP for TMDB ID
        if (tmdbId) {
            const isVip = await this.checkVip(tmdbId, true);
            if (isVip) {
                servers.push({
                    name: "SuperEmbed VIP (TMDB)",
                    url: this.generateUrl(tmdbId, true, true, isSeries, season, episode),
                    isVip: true,
                    source: 'tmdb'
                });
            }
            servers.push({
                name: "SuperEmbed TMDB",
                url: this.generateUrl(tmdbId, true, false, isSeries, season, episode),
                isVip: false,
                source: 'tmdb'
            });
        }

        return servers;
    }
}

export default new SuperEmbedProvider();
