const puppeteer = require('puppeteer');
const fs = require('fs');
const logger = require('./logger');

const url = 'http://m3.mappler.net/dechr/web/index_list.php?blogid=nyrestroom&is_iframe_type_page=N&with_tabs=Y#loaded';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('select#page_per_record');
    await page.select('select#page_per_record', '100');
    await page.waitForResponse((res) => res.status() === 200, { timeout: 10000 });
    // const rows = await page.$$eval('tr');

    const data = await page.$$eval('tr', (rows) => {
      const out = [];

      rows.forEach((r, ind) => {
        if (ind !== 0) { // first row is table headers
          const tds = r.children;
          const entry = {
            index: tds.item(0).innerText,
            name: tds.item(2).innerText,
            category: tds.item(3).innerText,
            address: tds.item(4).innerText,
            hours: tds.item(5).innerText,
            handicap: tds.item(6).innerText,
            editor: tds.item(7).innerText,
          };

          out.push(entry);
        }
      });

      return out;
    });
    logger.info(data);

    await browser.close();
  } catch (e) {
    logger.error(e);
  }
})();
