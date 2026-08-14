import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE LOG ERROR:', msg.text());
      console.log('Location:', msg.location().url, msg.location().lineNumber);
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' }).catch(e => console.log(e));
  await browser.close();
})();
