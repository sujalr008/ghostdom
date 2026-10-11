/**
 * GhostDOM Express Server (server.js)
 * High-performance Node.js backend hosting the e-commerce storefront,
 * GhostDOM polymorphic middleware, honeypot traps, and presentation dashboard.
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
// Note: style.css is publicly served for GhostDOM OFF mode;
// when GhostDOM is ON, it is inlined & mutated directly in the HTML response.
app.use(express.static(path.join(__dirname, 'public')));

// Mount GhostDOM response interception middleware on all routes
app.use(ghostdom.middleware());

// ============================================================================
// PAGE ROUTES
// ============================================================================

/**
 * Storefront Home Route (Target of GhostDOM polymorphism)
 */
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views/index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/**
 * Live Presentation Dashboard Route
 * (Excluded from mutation so presenter controls remain pristine)
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

/**
 * Honeypot Trap Endpoint
 * Hidden links and forms point here. Any visitor hitting this URL is recorded as a bot.
 */
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
 * System Status & Metrics
 */
app.get('/api/status', (req, res) => {
  res.json({
    enabled: ghostdom.enabled,
    metrics: ghostdom.mutator.getMetrics(),
    stats: ghostdom.stats,
    blockedIpCount: ghostdom.blockedIPs.size,
    detectedBotCount: ghostdom.detectedBots.length
  });
});

/**
 * Toggle GhostDOM Master Switch
 */
app.post('/api/toggle', (req, res) => {
  const { enabled } = req.body;
  const newState = ghostdom.toggle(typeof enabled === 'boolean' ? enabled : undefined);
  res.json({
    success: true,
    enabled: newState,
    message: `GhostDOM is now ${newState ? 'ACTIVE (Polymorphic)' : 'BYPASSED (Static)'}`
  });
});

/**
 * List of detected bots
 */
app.get('/api/bots', (req, res) => {
  res.json(ghostdom.detectedBots);
});

/**
 * Clear bot records & blocklist (Presentation Reset)
 */
app.post('/api/bots/clear', (req, res) => {
  ghostdom.clearBots();
  res.json({ success: true, message: 'Bot database and blocklist cleared.' });
});

/**
 * Source Code Snapshot Endpoint
 * Returns a live sample of the storefront HTML for the side-by-side inspector
 */
app.get('/api/source-sample', (req, res) => {
  const indexPath = path.join(__dirname, 'views/index.html');
  const rawHtml = fs.readFileSync(indexPath, 'utf8');

  if (!ghostdom.enabled) {
    return res.json({
      status: 'DISABLED',
      latencyMs: 0.1,
      html: rawHtml
    });
  }

  // Generate a live polymorphic mutation
  ghostdom.loadCss();
  const { mutatedHtml, durationMs } = ghostdom.mutator.mutate(rawHtml, ghostdom.cachedCss);

  res.json({
    status: 'ACTIVE',
    latencyMs: durationMs,
    html: mutatedHtml
  });
});

/**
 * Live Scraper Simulation Endpoint (Triggered from Dashboard)
 * Simulates a crawler targeting the standard .price selector
 */
app.post('/api/scraper-test', (req, res) => {
  ghostdom.stats.scraperAttempts++;

  const indexPath = path.join(__dirname, 'views/index.html');
  const rawHtml = fs.readFileSync(indexPath, 'utf8');

  let testHtml = rawHtml;
  if (ghostdom.enabled) {
    ghostdom.loadCss();
    const mutated = ghostdom.mutator.mutate(rawHtml, ghostdom.cachedCss);
    testHtml = mutated.mutatedHtml;
  }

  const $ = cheerio.load(testHtml);

  // Attempt to scrape prices using naive fixed selector .price
  const priceElements = $('.price');
  const pricesFound = [];

  priceElements.each((_, el) => {
    // Check if element is inside the honeypot
    const isHoneypot = $(el).closest('[data-ghostdom-trap="true"]').length > 0 || $(el).hasClass('ghost-honeypot-trap');
    pricesFound.push({
      text: $(el).text().trim(),
      isHoneypot
    });
  });

  if (!ghostdom.enabled) {
    // GhostDOM is OFF: Naive scraper succeeds!
    ghostdom.stats.scraperSuccesses++;

    const samples = [];
    $('.product-card').slice(0, 4).each((_, card) => {
      samples.push({
        name: $(card).find('.product-title').text().trim(),
        price: $(card).find('.price').text().trim()
      });
    });

    return res.json({
      success: true,
      statusCode: 200,
      targetUrl: 'http://localhost:' + PORT + '/',
      productCount: priceElements.length,
      samples
    });
  }

  // GhostDOM is ON: Real items have randomized classes!
  ghostdom.stats.scraperFailures++;

  // Check honeypot interaction
  const honeypotPrice = pricesFound.find(p => p.isHoneypot)?.text || null;
  const honeypotLink = $('a[href*="/honeypot/trap"]').attr('href') || '/honeypot/trap?token=auto_decoy';

  // Automatically trigger bot trap on server for this scraper
  ghostdom.recordBot(req, {
    type: 'Automated Selector Scraper (.price query)',
    token: honeypotLink.split('token=')[1]?.split('&')[0] || 'auto'
  });

  return res.json({
    success: false,
    statusCode: 200,
    targetUrl: 'http://localhost:' + PORT + '/',
    productCount: 0,
    honeypotFound: Boolean(honeypotPrice),
    honeypotPrice: honeypotPrice || '$0.00',
    honeypotLink
  });
});

/**
 * Raw Products Catalog API
 */
app.get('/api/products', (req, res) => {
  res.json(productsData);
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\x1b[36m========================================================\x1b[0m`);
  console.log(`\x1b[32m [GhostDOM] Server running on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[35m [Storefront]  http://localhost:${PORT}/\x1b[0m`);
  console.log(`\x1b[33m [Dashboard]   http://localhost:${PORT}/dashboard\x1b[0m`);
  console.log(`\x1b[36m========================================================\x1b[0m`);
});

module.exports = app;
