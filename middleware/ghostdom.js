/**
 * GhostDOM Express Middleware (ghostdom.js)
 * 
 * Intercepts outbound HTML responses before transmission and applies polymorphic mutations
 * if GhostDOM is enabled. Also houses the in-memory bot detection store and honeypot
 * ingestion handlers.
 */

const fs = require('fs');
const path = require('path');
const GhostDomMutator = require('./mutator');

class GhostDomMiddleware {
  constructor(options = {}) {
    this.cssPath = options.cssPath || path.join(__dirname, '../public/css/style.css');
    this.mutator = new GhostDomMutator();

    // System state
    this.enabled = options.initialEnabled ?? true;

    // Bot detection records
    this.detectedBots = [];
    this.blockedIPs = new Set();

    // Performance & Demo Analytics
    this.stats = {
      totalRequests: 0,
      mutatedRequests: 0,
      bypassedRequests: 0,
      scraperAttempts: 0,
      scraperSuccesses: 0, // When scraper successfully got real prices (GhostDOM OFF)
      scraperFailures: 0,  // When scraper failed / trapped (GhostDOM ON)
      honeypotHits: 0
    };

    // Cache stylesheet in memory with hot reload capability
    this.cachedCss = '';
    this.loadCss();
  }

  loadCss() {
    try {
      if (fs.existsSync(this.cssPath)) {
        this.cachedCss = fs.readFileSync(this.cssPath, 'utf8');
      }
    } catch (err) {
      console.error('[GhostDOM] Error loading base stylesheet:', err);
    }
  }

  /**
   * Helper to resolve real client IP even behind proxies
   */
  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }

  /**
   * Toggle GhostDOM ON or OFF
   * @param {boolean} [forceState]
   * @returns {boolean} New state
   */
  toggle(forceState) {
    if (typeof forceState === 'boolean') {
      this.enabled = forceState;
    } else {
      this.enabled = !this.enabled;
    }
    return this.enabled;
  }

  /**
   * Record a trapped bot into the in-memory database
   */
  recordBot(req, trapDetails = {}) {
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown Crawler';
    const timestamp = new Date().toISOString();

    const botRecord = {
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      ip,
      timestamp,
      userAgent,
      trapType: trapDetails.type || 'Hidden Decoy Anchor',
      token: trapDetails.token || 'N/A',
      path: req.originalUrl || req.url,
      method: req.method,
      status: 'BLOCKED'
    };

    this.blockedIPs.add(ip);
    this.detectedBots.unshift(botRecord); // Most recent first
    if (this.detectedBots.length > 100) {
      this.detectedBots.pop();
    }

    this.stats.honeypotHits++;
    console.warn(`\x1b[31m[GhostDOM BOT DETECTED]\x1b[0m IP: ${ip} | UA: ${userAgent.substring(0, 40)}... | Trap: ${botRecord.trapType}`);
    return botRecord;
  }

  /**
   * Express middleware function to intercept HTML responses
   */
  middleware() {
    return (req, res, next) => {
      this.stats.totalRequests++;

      // Check if client IP is currently blocked
      const clientIp = this.getClientIp(req);
      if (this.blockedIPs.has(clientIp) && !req.path.startsWith('/api/') && !req.path.startsWith('/dashboard')) {
        // We can either block or serve a deceptive honeypot page.
        // For presentation clarity, we allow browsing dashboard, but storefront displays security warning
        // res.set('X-GhostDOM-Blocked', 'true');
      }

      // Intercept res.send to mutate HTML when enabled
      const originalSend = res.send.bind(res);

      res.send = (body) => {
        // Only mutate string/buffer HTML responses on HTML routes
        const contentType = res.getHeader('Content-Type') || '';
        const isHtml = typeof body === 'string' && (contentType.includes('text/html') || body.trim().startsWith('<!DOCTYPE html') || body.trim().startsWith('<html'));

        if (!isHtml) {
          return originalSend(body);
        }

        // If GhostDOM is OFF: bypass mutation
        if (!this.enabled) {
          this.stats.bypassedRequests++;
          res.setHeader('X-GhostDOM-Status', 'DISABLED');
          return originalSend(body);
        }

        // If GhostDOM is ON: apply polymorphic mutation pipeline
        try {
          this.stats.mutatedRequests++;
          this.loadCss(); // Ensure latest CSS

          const { mutatedHtml, durationMs } = this.mutator.mutate(body, this.cachedCss);

          res.setHeader('X-GhostDOM-Status', 'ACTIVE');
          res.setHeader('X-GhostDOM-Latency-Ms', durationMs.toString());
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

          return originalSend(mutatedHtml);
        } catch (err) {
          console.error('[GhostDOM] Mutation failed, falling back to original output:', err);
          return originalSend(body);
        }
      };

      next();
    };
  }

  /**
   * Express route handler for honeypot traps
   */
  honeypotHandler(req, res) {
    const token = req.query.token || req.body?.token;
    const source = req.query.source || 'decoy_link';

    // Verify token validity
    const isValidToken = this.mutator.verifyHoneypotToken(token);

    const botRecord = this.recordBot(req, {
      type: source === 'decoy_anchor' ? 'Decoy Link (/honeypot/trap)' : 'Stealth Trap Link',
      token: token || 'unverified'
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        error: 'BOT_DETECTED',
        message: 'GhostDOM Honeypot Triggered. Your IP has been logged.',
        ip: botRecord.ip,
        timestamp: botRecord.timestamp
      });
    }

    // Render an informative decoy security notice
    res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>GhostDOM - Bot Activity Detected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #111827; border: 1px solid #ef4444; border-radius: 12px; padding: 32px; max-width: 520px; box-shadow: 0 20px 40px rgba(239,68,68,0.2); }
          h2 { color: #ef4444; margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 22px; }
          p { color: #9ca3af; line-height: 1.6; font-size: 14px; }
          .badge { background: #1f2937; padding: 6px 12px; border-radius: 6px; font-family: monospace; color: #f87171; border: 1px solid #374151; display: inline-block; margin-top: 8px; }
          .actions { margin-top: 24px; display: flex; gap: 12px; }
          a { color: #60a5fa; text-decoration: none; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚠️ Bot Trap Activated (GhostDOM)</h2>
          <p>This IP triggered an invisible polymorphic honeypot element intended exclusively for automated scrapers.</p>
          <div>
            <strong>Flagged IP:</strong> <span class="badge">${botRecord.ip}</span><br>
            <strong>Trap Vector:</strong> <span class="badge">${botRecord.trapType}</span><br>
            <strong>Token Verified:</strong> <span class="badge">${isValidToken ? 'YES (Cryptographic match)' : 'EXPIRED / DECOY'}</span>
          </div>
          <p style="margin-top: 16px;">In an enterprise deployment, this IP is now blocked from price scraping and catalog APIs.</p>
          <div class="actions">
            <a href="/dashboard">← View Live GhostDOM Dashboard</a>
            <a href="/">Return to Storefront</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  /**
   * Reset in-memory bot logs and blocklist (handy for live presentations)
   */
  clearBots() {
    this.detectedBots = [];
    this.blockedIPs.clear();
    this.stats.honeypotHits = 0;
    this.stats.scraperAttempts = 0;
    this.stats.scraperSuccesses = 0;
    this.stats.scraperFailures = 0;
  }
}

module.exports = GhostDomMiddleware;
