const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const baseUrl = 'http://m3.mappler.net/dechr/class/list_data_web_fn.php?page=1&blogid=nyrestroom&is_blog_user_group_allow_yn=N&th_no_sort_class=sort_desc&th_name_sort_class=sort&page_per_record=100';
const url = (n) => `http://m3.mappler.net/dechr/class/list_data_web_fn.php?page=1&blogid=nyrestroom&is_blog_user_group_allow_yn=N&th_no_sort_class=sort_desc&th_name_sort_class=sort&page_per_record=${n}`;

(async () => {
  try {
    const data = [];

    // get number of entries
    const { data: baseResData } = await axios.get(baseUrl);
    const { document: baseDocument } = new JSDOM(baseResData).window;
    const numEntries = baseDocument.querySelector('#data-table > tbody > tr:nth-child(1) > td:nth-child(1)').textContent;

    // get full table of data
    const { data: resData } = await axios.get(url(numEntries));
    const { document } = new JSDOM(resData).window;

    // parse data from rows
    const rows = document.querySelectorAll('tr');
    rows.forEach((r, ind) => {
      if (ind !== 0) { // first row is table headers
        const tds = r.children;
        const entry = {
          index: tds.item(0).textContent,
          name: tds.item(2).textContent,
          category: tds.item(3).textContent,
          address: tds.item(4).textContent,
          hours: tds.item(5).textContent,
          handicap: tds.item(6).textContent,
          editor: tds.item(7).textContent,
        };

        data.push(entry);
      }
    });

    const jsonOutput = JSON.stringify(data);
    fs.writeFile(
      path.join(__dirname, '../data/mappler-data.json'),
      jsonOutput,
      { flag: 'w' },
      (err) => {
        if (err) throw err;
        else logger.info('file written successfully');
      },
    );
  } catch (e) {
    logger.error(e);
  }
})();
