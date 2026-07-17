
/**
 * Base class for all scrapers.
 */
export class BaseScraper {
    constructor(name) {
        this.name = name;
    }

    /**
     * Search for a movie or series.
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        throw new Error('Method "search" must be implemented');
    }

    /**
     * Get stream URL for a specific video ID.
     * @param {string} id 
     * @returns {Promise<string>}
     */
    async getStream(id) {
        throw new Error('Method "getStream" must be implemented');
    }
}
