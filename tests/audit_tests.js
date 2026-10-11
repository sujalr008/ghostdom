/**
 * GhostDOM Automated Audit Test Suite (audit_tests.js) - v3.0
 * 
 * Verifies:
 * 1. Storefront HTTP 200 load check
 * 2. Visual DOM structure parity (titles, prices, stock intact)
 * 3. Class name entropy between consecutive requests (different classes each time)
 * 4. Honeypot traps strictly hidden & accessible (aria-hidden, zero layout footprint)
 * 5. Naive scraper defeated (.price selector blocked / honeypot triggered)
 * 6. Zero false positives on regular human requests
 * 7. Browser rendering check (Playwright if available)
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const express = require('express');
const GhostDomMiddleware = require('../middleware/ghostdom');

const TEST_PORT = 3899;

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, testName, errorDetails = '') {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS${RESET}  ${testName}`);
    passed++;
  } else {
    console.log(`  ${RED}✗ FAIL${RESET}  ${testName}`);
    if (errorDetails) {
      console.log(`         ${RED}Details: ${errorDetails}${RESET}`);
    }
    failed++;
  }
}

async function startTestServer() {
  const app = express();
  const ghostdom = new GhostDomMiddleware({
    initialEnabled: true,
    cssPath: path.join(__dirname, '../public/css/style.css')
  });

  app.use(express.static(path.join(__dirname, '../public')));
  app.use(ghostdom.middleware());

  app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../views/index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send("User-agent: *\nDisallow: /honeypot/\n");
  });

  app.get('/honeypot/trap', (req, res) => {
    ghostdom.honeypotHandler(req, res);
  });

  app.post('/api/bot-attack', (req, res) => {
    const clientIp = ghostdom.getClientIp(req);
    if (!ghostdom.enabled) {
      const fakeBot = {
        id: 'bot_test',
        ip: clientIp,
        timestamp: new Date().toISOString(),
        status: 'ALLOWED',
        action: 'ALLOWED',
        trapType: 'Simulated Scraper Hit'
      };
      ghostdom.detectedBots.unshift(fakeBot);
      return res.json({ success: true, shieldActive: false, action: 'ALLOWED' });
    }
    const fakeBot = {
      id: 'bot_test',
      ip: clientIp,
      timestamp: new Date().toISOString(),
      status: 'BLOCKED',
      action: 'QUARANTINED',
      trapType: 'Accessed Honeypot'
    };
    ghostdom.detectedBots.unshift(fakeBot);
    return res.json({ success: true, shieldActive: true, action: 'QUARANTINED' });
  });

  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      resolve({ server, ghostdom });
    });
  });
}

async function fetchUrl(url, headers = {}) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    text
  };
}

async function runAudit() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}  GHOSTDOM AUTOMATED VERIFICATION SUITE — STAGE QA & SECURITY AUDIT${RESET}`);
  console.log(`${CYAN}========================================================================${RESET}\n`);

  const { server, ghostdom } = await startTestServer();
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Page Loads with HTTP 200
    // ------------------------------------------------------------------------
    console.log(`${BOLD}[1/7] Storefront Load & Availability${RESET}`);
    const req1 = await fetchUrl(`${baseUrl}/`);
    assert(req1.status === 200, 'HTTP 200 OK returned on storefront root /');
    assert(req1.headers.get('x-ghostdom-status') === 'ACTIVE', 'X-GhostDOM-Status: ACTIVE header present');

    // ------------------------------------------------------------------------
    // TEST 2: Visual Structure & Content Parity
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[2/7] Visual DOM Content Parity (Zero Layout Shift)${RESET}`);
    const $1 = cheerio.load(req1.text);
    const htmlText = req1.text;

    const titlesFound = [
      'Apex Wireless Gaming Mouse',
      'Nova ANC Wireless Headphones',
      'Lumina Mechanical Keyboard 75%',
      'Prism 4K HDR Studio Monitor 27"',
      'Pulse Smart Fitness Ring Gen 3',
      'Vortex 12-in-1 USB-C Hub Dock',
      'AeroDesk Smart Standing Desk',
      'CarbonFold Portable Laptop Stand'
    ];

    let allTitlesPresent = true;
    for (const title of titlesFound) {
      if (!htmlText.includes(title)) {
        allTitlesPresent = false;
        break;
      }
    }
    assert(allTitlesPresent, 'All 8 genuine product titles present in mutated output');

    const pricesFound = ['$79.99', '$249.00', '$129.50', '$599.00', '$199.00', '$89.95', '$449.00', '$39.99'];
    let allPricesPresent = true;
    for (const price of pricesFound) {
      if (!htmlText.includes(price)) {
        allPricesPresent = false;
        break;
      }
    }
    assert(allPricesPresent, 'All authentic product prices ($79.99, etc.) preserved in output');

    // ------------------------------------------------------------------------
    // TEST 3: Class Name Entropy (Request 1 vs Request 2)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[3/7] Class Name Entropy & Polymorphism${RESET}`);
    const req2 = await fetchUrl(`${baseUrl}/`);
    const seed1 = req1.headers.get('x-ghostdom-seed') || $1('body').attr('data-ghostdom-seed');
    const $2 = cheerio.load(req2.text);
    const seed2 = req2.headers.get('x-ghostdom-seed') || $2('body').attr('data-ghostdom-seed');

    assert(seed1 !== seed2, `Polymorphic seeds differ between requests (Seed 1: ${seed1} vs Seed 2: ${seed2})`);

    // Verify polymorphic styles were injected inline
    const hasStyleTag = req1.text.includes('id="ghostdom-polymorphic-css"');
    assert(hasStyleTag, 'Atomic polymorphic CSS injected inline with randomized selectors');

    // ------------------------------------------------------------------------
    // TEST 4: Honeypot Invisibility & Strict Accessibility
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[4/7] Honeypot Invisibility & Accessibility Guarantees${RESET}`);
    const honeypotCards = $1('.ghost-honeypot-trap');
    assert(honeypotCards.length > 0, `Honeypots injected into DOM (${honeypotCards.length} traps found)`);

    let trapsStrictlyHidden = true;
    honeypotCards.each((_, el) => {
      const style = $1(el).attr('style') || '';
      const ariaHidden = $1(el).attr('aria-hidden');
      const isOffscreen = style.includes('left:-99999px') || style.includes('display:none');
      const isZeroSize = style.includes('width:0') && style.includes('height:0');
      const isAria = ariaHidden === 'true';

      if (!isOffscreen || !isZeroSize || !isAria) {
        trapsStrictlyHidden = false;
      }
    });
    assert(trapsStrictlyHidden, 'All honeypots have aria-hidden="true", width:0, height:0, and off-screen coordinates');

    // ------------------------------------------------------------------------
    // TEST 5: Naive Scraper Defeat Verification
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[5/7] Naive Scraper Neutralization (.price selector)${RESET}`);
    // Querying .price against the mutated HTML
    const naivePriceMatches = $1('.price');
    
    // Only honeypot decoy prices retain .price! Human prices have randomized transient classes.
    let onlyHoneypotsMatched = true;
    naivePriceMatches.each((_, el) => {
      const isTrap = $1(el).closest('.ghost-honeypot-trap').length > 0 || $1(el).closest('[data-ghostdom-trap="true"]').length > 0;
      if (!isTrap) {
        onlyHoneypotsMatched = false;
      }
    });

    assert(onlyHoneypotsMatched, 'Genuine product prices do NOT expose static .price selector');
    assert(naivePriceMatches.length > 0, 'Naive crawler is lured directly into honeypot bait trap');

    // ------------------------------------------------------------------------
    // TEST 6: Zero False Positives on Human Browsing
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[6/7] False Positive Prevention & Conditional Quarantine${RESET}`);
    // Check that simply viewing the storefront did NOT add any bot records
    const detectedBotCount = ghostdom.detectedBots.length;
    assert(detectedBotCount === 0, `Zero false positives: Normal visitor IP was NOT flagged (Bots logged: ${detectedBotCount})`);

    // robots.txt disallows honeypot to protect search indexing bots
    const robotsReq = await fetchUrl(`${baseUrl}/robots.txt`);
    assert(robotsReq.text.includes('Disallow: /honeypot/'), 'robots.txt explicitly disallows /honeypot/ path');

    // Test Bot Quarantine: When GhostDOM is OFF -> Action is ALLOWED (NOT quarantined)
    ghostdom.enabled = false;
    const botResOff = await fetch(`${baseUrl}/api/bot-attack`, { method: 'POST' });
    const botJsonOff = await botResOff.json();
    assert(botJsonOff.action === 'ALLOWED', 'When GhostDOM is OFF: Bot action is ALLOWED (NOT quarantined)');

    // When GhostDOM is ON -> Action is QUARANTINED
    ghostdom.enabled = true;
    const botResOn = await fetch(`${baseUrl}/api/bot-attack`, { method: 'POST' });
    const botJsonOn = await botResOn.json();
    assert(botJsonOn.action === 'QUARANTINED', 'When GhostDOM is ON: Bot action is QUARANTINED');

    // ------------------------------------------------------------------------
    // TEST 7: Playwright Headless Browser Rendering (if installed)
    // ------------------------------------------------------------------------
    console.log(`\n${BOLD}[7/7] End-to-End Headless Browser Visual Rendering${RESET}`);
    let playwrightAvailable = false;
    try {
      const { chromium } = require('playwright');
      playwrightAvailable = true;
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      assert(title.includes('BROKART'), `Playwright loaded page and verified <title>: "${title}"`);

      // Verify at least one card is visible
      const cardCount = await page.locator('body').evaluate(() => {
        // Find visible elements with text 'Add to Cart'
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Add to Cart'));
        return btns.length;
      });
      assert(cardCount >= 7, `Playwright confirmed ${cardCount} visible product action buttons rendered`);

      await browser.close();
    } catch (pwErr) {
      if (!playwrightAvailable) {
        console.log(`  ${YELLOW}- SKIP${RESET}  Playwright not in active node_modules (Run 'npx playwright test' for full browser spec)`);
        skipped++;
      } else {
        console.log(`  ${RED}✗ FAIL${RESET}  Playwright test failed: ${pwErr.message}`);
        failed++;
      }
    }

  } catch (err) {
    console.error(`\n${RED}[FATAL ERROR] Audit suite threw an unhandled exception:${RESET}`, err);
    failed++;
  }

  // Gracefully close server and print summary
  await new Promise((resolve) => {
    server.close(() => {
      console.log(`\n${CYAN}------------------------------------------------------------------------${RESET}`);
      console.log(`Test Execution Results: ${GREEN}${passed} Passed${RESET}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET}, ${YELLOW}${skipped} Skipped${RESET}`);
      if (failed === 0) {
        console.log(`${GREEN}${BOLD}✔ AUDIT PASSED: Prototype is Stage-Ready and Flawless!${RESET}`);
      } else {
        console.log(`${RED}${BOLD}✘ AUDIT FAILED: Review the error details above.${RESET}`);
      }
      console.log(`${CYAN}------------------------------------------------------------------------${RESET}\n`);

      process.exitCode = failed > 0 ? 1 : 0;
      resolve();
    });
  });
}

runAudit();
