const puppeteer = require('puppeteer');
const { saveToFile } = require('./save')
const config = require('./config.json');
const scrapeData = async () => {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto(config.loginUrl);

    // Fill in username and password
    await page.type('#id_username', config.username);
    await page.type('#id_password', config.password);

    // Click login button and wait for navigation
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation()
    ]);

    // Loop through pages

    // Fetch the page
    const url = config.resultsUrl;
    await page.goto(url, {
        waitUntil: "domcontentloaded"
    });

    // Scrape the page
    const stocks = await page.evaluate(() => {
        const stocksData = [];
        const mainElement = document.querySelector('main');

        const stockList = Array.from(mainElement.querySelectorAll('div.flex-row'));

        stockList.forEach((stockNode, index) => {
            const stock = {};
            const stockNameNode = stockNode.querySelector('a');
            const stockName = stockNameNode.querySelector('span').innerText.trim();
            stock.stockName = stockName;

            // Extract price, market cap, and PE ratio
            const subElements = Array.from(stockNode.querySelectorAll('div.font-size-14 span.sub'));

            subElements.forEach(subElement => {
                const label = subElement.childNodes[0].textContent.trim();
                const valueNode = subElement.querySelector('.strong');

                if (label.includes('Price')) {
                    const priceText = valueNode.textContent.trim().replace('₹', '').replace(/,/g, '');
                    stock.price = parseFloat(priceText);
                } else if (label.includes('M.Cap')) {
                    const marketCapText = valueNode.textContent.trim().replace('₹', '').replace('Cr', '').replace(/,/g, '');
                    stock.marketCap = parseFloat(marketCapText);
                } else if (label.includes('PE')) {
                    stock.pe = parseFloat(valueNode.textContent.trim());
                }
            });

            stock.index = index;  // Add index for matching later
            stocksData.push(stock);
        });

        // Getting Table info
        const resultList = Array.from(mainElement.querySelectorAll('div.bg-base'));

        resultList.forEach((resultNode, mainIndex) => {
            const headers = Array.from(resultNode.querySelectorAll('.data-table thead th'))
                .map(header => header.innerText.trim());

            // Get the table rows
            const rows = Array.from(resultNode.querySelectorAll('.data-table tbody tr')).map(row => {
                const cells = Array.from(row.querySelectorAll('td')).map((cell, cellIndex) => {
                    // Handle EPS row differently
                    if (row.dataset.eps !== undefined && cellIndex > 0) {
                        return cell.innerText.replace('₹', '').replace('⇡', '').replace('⇣', '-').trim();
                    } else {
                        const span = cell.querySelector('span');
                        if (span) {
                            return span.innerText.replace('₹', '').replace('⇡', '').replace('⇣', '-').trim();
                        }
                        return cell.innerText.replace('₹', '').replace('⇡', '').replace('⇣', '-').trim();
                    }
                });
                return cells;
            });

            // Format the data as an array of objects
            const data = rows.map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });

            // Map the results to the corresponding stock using index
            if (stocksData[mainIndex]) {
                stocksData[mainIndex].results = data;
            }
        });

        return stocksData;
    });


    // Close the browser
    await browser.close();
    let filteredData = stocks.filter(stock => {
        if (stock.marketCap > 1500)
            return stock;
    });
    saveToFile(filteredData);
}



module.exports = { scrapeData }