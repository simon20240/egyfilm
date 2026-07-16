const scraper = require('../../src/scrapers/index');
const logger = require('../../src/utils/logger');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { movieName } = req.body;

    if (!movieName) {
        return res.status(400).json({ error: 'Missing movieName in body' });
    }

    // Run asynchronously
    scraper.scrapeMovie(movieName)
        .then(() => logger.info(`Manual scrape finished for ${movieName}`))
        .catch(err => logger.error(`Manual scrape failed for ${movieName}: ${err.message}`));

    res.json({ message: `Scraper started for ${movieName}` });
};
