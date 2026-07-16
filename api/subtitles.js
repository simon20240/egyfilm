const subtitleScraper = require('../src/scrapers/subtitles/subtitleScraper');
const logger = require('../src/utils/logger');

module.exports = async (req, res) => {
    const { imdbId } = req.query;

    if (!imdbId) {
        return res.status(400).send('WEBVTT\n\nNOTE IMDb ID is required.');
    }

    try {
        const subtitle = await subtitleScraper.fetchArabicSubtitle(imdbId);

        if (!subtitle) {
            return res.status(404).send('WEBVTT\n\nNOTE No Arabic subtitle found.');
        }

        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
        
        res.send(subtitle.content);

    } catch (error) {
        logger.error(`API Error /subtitles: ${error.message}`);
        res.status(500).send('WEBVTT\n\nNOTE Internal Server Error');
    }
};
