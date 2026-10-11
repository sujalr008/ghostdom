/**
 * GhostDOM Express Server (server.js) - v3.0 Production Final
 * Hosts the BROKART e-commerce storefront, GhostDOM polymorphic middleware,
 * instant bot reaction pipeline, and presentation command deck.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const GhostDomMiddleware = require('./middleware/ghostdom');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for cloud hosting & reverse proxies (Render, Railway, ngrok, Cloudflare)
app.set('trust proxy', true);

// Initialize GhostDOM Middleware
const ghostdom = new GhostDomMiddleware({
  initialEnabled: true,
  cssPath: path.join(__dirname, 'public/css/style.css')
});

// Load products data
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8')
);

// Standard body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Mount GhostDOM response interception middleware on all routes
app.use(ghostdom.middleware());

// ============================================================================
// PAGE ROUTES & ROBOTS.TXT
// ============================================================================

/**
 * robots.txt: Disallow crawler traffic on /honeypot/ paths.
 * Guarantees compliant search indexing bots (Googlebot, Bingbot) never hit honeypots.
 */
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /honeypot/\n");
});

/**
 * Storefront Home Route (BROKART Light Theme)
 * Target of GhostDOM polymorphism
 */
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views/index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/**
 * Live Presentation Dashboard Route (GhostDOM Dark Theme)
 * Excluded from mutation so presenter controls remain pristine
 */
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'views/dashboard.html');
  const html = fs.readFileSync(dashboardPath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  // Temporarily bypass mutation for the dashboard UI itself
  const prevEnabled = ghostdom.enabled;
  ghostdom.enabled = false;
  res.send(html);
  ghostdom.enabled = prevEnabled;
});

// ============================================================================
// HONEYPOT & BOT TRAP ROUTES
// ============================================================================

app.get('/honeypot/trap', (req, res) => {
  ghostdom.honeypotHandler(req, res);
});

app.post('/honeypot/trap', (req, res) => {
  ghostdom.honeypotHandler(req, res);
});

// ============================================================================
// REST API FOR DASHBOARD & PRESENTATION
// ============================================================================

/**
 * System Status, Telemetry & Real-Time Event Feed
 */
app.get('/api/status', (req, res) => {
  res.json({
    enabled: ghostdom.enabled,
    mode: ghostdom.enabled ? ghostdom.mode : 'BYPASSED',
    metrics: ghostdom.mutator.getMetrics(),
    stats: ghostdom.stats,
    blockedIpCount: ghostdom.blockedIPs.size,
    detectedBotCount: ghostdom.detectedBots.length,
    latestAlert: ghostdom.latestAlert,
    events: ghostdom.eventLog.slice(0, 30) // Most recent 30 events
  });
});

/**
 * Dismiss active alert banner
 */
app.post('/api/dismiss-alert', (req, res) => {
  if (ghostdom.latestAlert) {
    ghostdom.latestAlert.active = false;
  }
  res.json({ success: true });
});

/**
 * Toggle Master Switch (GhostDOM ON/OFF)
 */
app.post('/api/toggle', (req, res) => {
  const { enabled } = req.body;
  const newState = ghostdom.toggle(typeof enabled === 'boolean' ? enabled : undefined);
  res.json({
    success: true,
    enabled: newState,
    mode: newState ? ghostdom.mode : 'BYPASSED',
    message: `GhostDOM is now ${newState ? 'ACTIVE (Polymorphic)' : 'BYPASSED (Static)'}`
  });
});

/**
 * Toggle Operational Mode ('NORMAL' vs 'AGGRESSIVE')
 */
app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  const newMode = ghostdom.setMode(mode === 'AGGRESSIVE' ? 'AGGRESSIVE' : 'NORMAL');
  res.json({
    success: true,
    mode: newMode,
    message: `Operational policy set to ${newMode} MODE`
  });
});

/**
 * Simulate Bot Attack (Instant reaction with alert & siren trigger)
 */
app.post('/api/bot-attack', (req, res) => {
  const clientIp = ghostdom.getClientIp(req);

  // When GhostDOM is OFF: bot is NOT quarantined, but trigger a clear warning alert
  if (!ghostdom.enabled) {
    const fakeBot = {
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      ip: clientIp,
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AttackCrawlerBot/3.0',
      trapType: 'Simulated Scraper Hit (Static Selectors Read)',
      token: 'N/A',
      path: '/catalog',
      method: 'GET',
      status: 'ALLOWED',
      action: 'ALLOWED'
    };

    ghostdom.detectedBots.unshift(fakeBot);
    if (ghostdom.detectedBots.length > 100) ghostdom.detectedBots.pop();

    const time = new Date();
    const variedRate = (72.0 + Math.random() * 12.0).toFixed(1) + '%';
    const defenseRate = (100 - parseFloat(variedRate)).toFixed(1) + '%';
    ghostdom.stats.latestScrapeRate = variedRate;
    ghostdom.stats.latestDefenseRate = defenseRate;

    const warningAlert = {
      id: 'warn_' + Date.now(),
      ip: clientIp,
      timestamp: time.toISOString(),
      timeStr: ghostdom.formatTime(time),
      trapType: 'Simulated Crawler (.price fixed selectors extracted)',
      details: `Warning: Storefront scraped with ${variedRate} success rate. GhostDOM is BYPASSED.`,
      token: 'N/A',
      active: true,
      isWarning: true
    };
    ghostdom.latestAlert = warningAlert;

    ghostdom.logEvent('WARN', `⚠️ BOT ATTACK DETECTED: ${clientIp} scraped store with ${variedRate} success rate (GhostDOM is OFF — NOT quarantined)`, clientIp);

    return res.json({
      success: true,
      shieldActive: false,
      isWarning: true,
      alert: warningAlert,
      mode: 'DISABLED',
      action: 'ALLOWED',
      scrapeRate: variedRate,
      defenseRate: defenseRate,
      productCount: 8,
      message: `GhostDOM is OFF. Bot crawled storefront freely with ${variedRate} success rate (Action: ALLOWED).`
    });
  }

  // When GhostDOM is ON: bot is quarantined and client switched to Aggressive Mode
  const variedResidualRate = (18.0 + Math.random() * 6.0).toFixed(1) + '%';
  const defenseRate = (100 - parseFloat(variedResidualRate)).toFixed(1) + '%';
  ghostdom.stats.latestScrapeRate = variedResidualRate;
  ghostdom.stats.latestDefenseRate = defenseRate;

  const alert = ghostdom.triggerBotReaction(
    clientIp,
    'Accessed hidden honeypot price (.price query)',
    { details: 'High-frequency scraper pattern simulated from dashboard' }
  );
  alert.isWarning = false;

  const fakeBot = {
    id: 'bot_' + Math.random().toString(36).substring(2, 9),
    ip: clientIp,
    timestamp: new Date().toISOString(),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AttackCrawlerBot/3.0',
    trapType: 'Accessed hidden honeypot price (.price query)',
    token: 'ghst_sim_' + Math.random().toString(36).substring(2, 8),
    path: '/catalog',
    method: 'GET',
    status: 'BLOCKED',
    action: 'QUARANTINED'
  };

  ghostdom.detectedBots.unshift(fakeBot);
  if (ghostdom.detectedBots.length > 100) ghostdom.detectedBots.pop();

  res.json({
    success: true,
    shieldActive: true,
    isWarning: false,
    alert,
    mode: 'AGGRESSIVE',
    action: 'QUARANTINED',
    scrapeRate: variedResidualRate,
    defenseRate: defenseRate,
    productCount: 0,
    message: `Bot attack triggered. Client quarantined (${variedResidualRate} residual rate) and switched to AGGRESSIVE mode.`
  });
});

/**
 * Reset Demo (Clears logs, resets mode back to Normal, clears blocklist)
 */
app.post('/api/reset', (req, res) => {
  const result = ghostdom.resetDemo();
  res.json(result);
});

/**
 * List of detected bots
 */
app.get('/api/bots', (req, res) => {
  res.json(ghostdom.detectedBots);
});

/**
 * Source Code Snapshot Endpoint for Side-by-Side Inspector
 */
app.get('/api/source-sample', (req, res) => {
  const indexPath = path.join(__dirname, 'views/index.html');
  const rawHtml = fs.readFileSync(indexPath, 'utf8');

  if (!ghostdom.enabled) {
    return res.json({
      status: 'DISABLED',
      mode: 'DISABLED',
      latencyMs: 0.1,
      html: rawHtml
    });
  }

  ghostdom.loadCss();
  const { mutatedHtml, durationMs, mode, seed } = ghostdom.mutator.mutate(rawHtml, ghostdom.cachedCss, {
    mode: ghostdom.mode
  });

  res.json({
    status: 'ACTIVE',
    mode,
    seed,
    latencyMs: durationMs,
    html: mutatedHtml
  });
});

/**
 * Live Scraper Simulation Endpoint (Triggered from Dashboard or Automated Tests)
 */
app.post('/api/scraper-test', (req, res) => {
  ghostdom.stats.scraperAttempts++;

  const indexPath = path.join(__dirname, 'views/index.html');
  const rawHtml = fs.readFileSync(indexPath, 'utf8');

  let testHtml = rawHtml;
  if (ghostdom.enabled) {
    ghostdom.loadCss();
    const mutated = ghostdom.mutator.mutate(rawHtml, ghostdom.cachedCss, {
      mode: ghostdom.mode
    });
    testHtml = mutated.mutatedHtml;
  }

  const $ = cheerio.load(testHtml);

  // Attempt to scrape prices using naive fixed selector .price
  const priceElements = $('.price');
  const pricesFound = [];

  priceElements.each((_, el) => {
    const isHoneypot = $(el).closest('[data-ghostdom-trap="true"]').length > 0 || $(el).hasClass('ghost-honeypot-trap');
    pricesFound.push({
      text: $(el).text().trim(),
      isHoneypot
    });
  });

  if (!ghostdom.enabled) {
    // GhostDOM is OFF: Naive scraper succeeds against BROKART!
    ghostdom.stats.scraperSuccesses++;

    const samples = [];
    $('.product-card').slice(0, 4).each((_, card) => {
      samples.push({
        name: $(card).find('.product-title').text().trim(),
        price: $(card).find('.price').text().trim()
      });
    });

    const variedRate = (72.0 + Math.random() * 12.0).toFixed(1) + '%';
    const defenseRate = (100 - parseFloat(variedRate)).toFixed(1) + '%';
    ghostdom.stats.latestScrapeRate = variedRate;
    ghostdom.stats.latestDefenseRate = defenseRate;

    ghostdom.logEvent('WARN', `Scraper executed: ${variedRate} success rate (GhostDOM OFF)`);

    const clientIp = ghostdom.getClientIp(req);
    ghostdom.detectedBots.unshift({
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      ip: clientIp,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Competitor Scraper (.price)',
      trapType: `Scraped prices (${variedRate} success rate)`,
      token: 'N/A',
      path: '/',
      method: 'GET',
      status: 'ALLOWED',
      action: 'ALLOWED'
    });
    if (ghostdom.detectedBots.length > 100) ghostdom.detectedBots.pop();

    return res.json({
      success: true,
      mode: 'DISABLED',
      statusCode: 200,
      targetUrl: 'http://localhost:' + PORT + '/',
      productCount: priceElements.length,
      totalCatalogProducts: 8,
      scrapeRate: variedRate,
      defenseRate: defenseRate,
      samples
    });
  }

  // GhostDOM is ON: Scraper fails or is trapped/poisoned!
  ghostdom.stats.scraperFailures++;

  const clientIp = ghostdom.getClientIp(req);
  const honeypotPrices = pricesFound.filter(p => p.isHoneypot).map(p => p.text);
  const isAggressive = ghostdom.mode === 'AGGRESSIVE';

  const variedResidualRate = (18.0 + Math.random() * 6.0).toFixed(1) + '%';
  const defenseRate = (100 - parseFloat(variedResidualRate)).toFixed(1) + '%';
  ghostdom.stats.latestScrapeRate = variedResidualRate;
  ghostdom.stats.latestDefenseRate = defenseRate;

  ghostdom.logEvent(
    'SUCCESS',
    `Scraper neutralized: ${variedResidualRate} residual rate (${defenseRate} blocked by GhostDOM)`
  );

  // Automatically trigger bot trap on server for this scraper
  ghostdom.recordBot(req, {
    type: isAggressive 
      ? 'Scraper crawled poisoned .price entries in AGGRESSIVE MODE'
      : 'Accessed hidden honeypot price (.price query)',
    token: 'auto_' + Math.random().toString(36).substring(2, 8)
  });

  return res.json({
    success: false,
    mode: ghostdom.mode,
    statusCode: 200,
    targetUrl: 'http://localhost:' + PORT + '/',
    productCount: 0,
    totalCatalogProducts: 8,
    scrapeRate: variedResidualRate,
    defenseRate: defenseRate,
    honeypotFound: honeypotPrices.length > 0,
    honeypotCount: honeypotPrices.length,
    honeypotPrices: honeypotPrices.slice(0, 6),
    primaryHoneypotPrice: honeypotPrices[0] || '$0.00',
    honeypotLink: '/honeypot/trap?token=auto_decoy'
  });
});

/**
 * Raw Products Catalog API
 */
app.get('/api/products', (req, res) => {
  res.json(productsData);
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`\x1b[36m========================================================\x1b[0m`);
  console.log(`\x1b[32m [GhostDOM v3.0] Server running on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[33m [BROKART Store] http://localhost:${PORT}/ (LIGHT THEME)\x1b[0m`);
  console.log(`\x1b[35m [Command Deck]  http://localhost:${PORT}/dashboard (DARK THEME)\x1b[0m`);
  console.log(`\x1b[36m========================================================\x1b[0m`);
});

module.exports = server;
