const puppeteer = require('puppeteer');
const { saveToFile } = require('./stock')

const scrapeData = async () => {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto('https://www.screener.in/login/');

    // Fill in username and password
    await page.type('#id_username', "venkatarajeshjakka@outlook.com");
    await page.type('#id_password', "Screener@123");

    // Click login button and wait for navigation
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation()
    ]);

    // Loop through pages

    // Fetch the page
    const url = `https://www.screener.in/results/latest/`;
    await page.goto(url, {
        waitUntil: "domcontentloaded"
    });

    //Scrape the page

    const stocks = await page.evaluate(() => {
        const stocksData = [];
        const mainElement = document.querySelector("main");

        const stockList = Array.from(mainElement.querySelectorAll("div.flex-row"));

        //Convert the stockList to an iteratable array

        stockList.forEach(async (stockNode, index) => {
            const stock = {};
            const stockNameNode = stockNode.querySelector("a");
            const stockName = stockNameNode.querySelector("span").innerText;
            stock.stockName = stockName;

            // Extract price, market cap, and PE ratio
            const subElements = Array.from(stockNode.querySelectorAll('div.font-size-14 span.sub'));
            stock.price = parseFloat(subElements[0].querySelector(".strong").innerHTML);
            stock.marketCap = parseFloat(subElements[1].querySelector(".strong").innerHTML.replace(/,/g, ''));
            stock.pe = parseFloat(subElements[2].querySelector(".strong").innerHTML);

            stocksData.push(stock);
        });


        //Getting Table info

        const resultList = Array.from(mainElement.querySelectorAll("div.bg-base"));

        resultList.forEach((stockNode, mainIndex) => {
            const headers = Array.from(stockNode.querySelectorAll('.data-table thead th'))
                .map(header => header.innerText.trim());

            //Get the Table rows

            // Get the table rows
            const rows = Array.from(stockNode.querySelectorAll('.data-table tbody tr')).map(row => {
                const cells = Array.from(row.querySelectorAll('td')).map((cell, cellIndex) => {
                    // Handle EPS row differently
                    if (row.dataset.eps !== undefined && cellIndex > 0) {
                        return cell.innerText.trim();
                    } else {
                        const span = cell.querySelector('span');
                        if (span) {
                            return span.innerText.trim();
                        }
                        return cell.innerText.trim();
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

            // Assuming the index of the resultNode corresponds to the stocksData index
            if (stocksData[mainIndex]) {
                stocksData[mainIndex].results = data;
            }
        })
        return stocksData;
    })


    // Close the browser
    await browser.close();

    saveToFile(stocks);
}



scrapeData();