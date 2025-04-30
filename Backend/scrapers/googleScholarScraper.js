const puppeteer = require('puppeteer');

const scrapeScholarProfile = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const name = document.querySelector('#gsc_prf_in')?.textContent || '';
    const affiliation = document.querySelector('.gsc_prf_il')?.textContent || '';
    const citationCount = document.querySelectorAll('.gsc_rsb_std')[0]?.textContent || '0';
    const hIndex = document.querySelectorAll('.gsc_rsb_std')[1]?.textContent || '0';
    const i10Index = document.querySelectorAll('.gsc_rsb_std')[2]?.textContent || '0';
    
    const publications = [];
    document.querySelectorAll('.gsc_a_tr').forEach(pub => {
      publications.push({
        title: pub.querySelector('.gsc_a_at')?.textContent || '',
        year: pub.querySelector('.gsc_a_y span')?.textContent || '',
      });
    });

    return { citationCount, hIndex, i10Index, publications };
  });

  await browser.close();
  return data;
};

module.exports = { scrapeScholarProfile };
