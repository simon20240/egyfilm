import * as scraper from './src/scrapers/index.js';

async function test() {
    console.log('--- Testing Scraper ---');
    
    // Test with a known movie
    const movieName = 'Inception';
    console.log(`Scraping "${movieName}"...`);
    
    try {
        const result = await scraper.scrapeMovie(movieName);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
