const scraper = require('../src/scrapers/index');
const logger = require('../src/utils/logger');

module.exports = async (req, res) => {
    const { movieName } = req.query;

    if (!movieName) {
        return res.status(400).json({ error: 'Missing movieName parameter' });
    }

    try {
        const result = await scraper.scrapeMovie(movieName);
        if (!result) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(result);
    } catch (error) {
        logger.error(`API Error /servers: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
