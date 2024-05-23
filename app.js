const { scrapeData } = require('./scrape');

(async () => {
    try {
        await scrapeData();
    } catch (error) {
        console.error('Error during scraping:', error);
    }
})();