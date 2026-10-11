/**
 * GhostDOM Express Middleware (ghostdom.js) - v2.0
 * 
 * Intercepts outbound HTML responses, enforces Normal vs Aggressive polymorphism,
 * streams security terminal event logs, and reacts instantly to bot triggers.
 */

const fs = require('fs');
const path = require('path');
const GhostDomMutator = require('./mutator');

class GhostDomMiddleware {
  constructor(options = {}) {
    this.cssPath = options.cssPath || path.join(__dirname, '../public/css/style.css');
    this.mutator = new GhostDomMutator({ mode: 'NORMAL' });

    // System state
    this.enabled = options.initialEnabled ?? true;
    this.mode = 'NORMAL'; // 'NORMAL' | 'AGGRESSIVE'

    // Bot detection records
    this.detectedBots = [];
    this.blockedIPs = new Set();
    this.clientModes = new Map(); // ip -> 'NORMAL' | 'AGGRESSIVE'

    // Real-time security terminal event log
    this.eventLog = [];

    // Instant Reaction Alert state (for dashboard flashing banner & siren)
    this.latestAlert = null;

    // Performance & Demo Analytics
    this.stats = {
      totalRequests: 0,
      mutatedRequests: 0,
      bypassedRequests: 0,
      scraperAttempts: 0,
      scraperSuccesses: 0,
      scraperFailures: 0,
      honeypotHits: 0
    };

    // Cache stylesheet in memory with hot reload capability
    this.cachedCss = '';
    this.loadCss();

    // Initial boot event
    this.logEvent('INFO', 'GhostDOM Defense Core initialized in NORMAL MODE', '127.0.0.1');
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

  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }

  formatTime(date = new Date()) {
    return date.toTimeString().split(' ')[0];
  }

  /**
   * Append an event to the security terminal event stream
   */
  logEvent(level, message, ip = '127.0.0.1') {
    const now = new Date();
    const entry = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      timestamp: now.toISOString(),
      timeStr: this.formatTime(now),
      level, // 'INFO', 'WARN', 'ALERT', 'SUCCESS', 'POISON'
      message,
      ip
    };

    this.eventLog.unshift(entry);
    if (this.eventLog.length > 120) {
      this.eventLog.pop();
    }

    return entry;
  }

  /**
   * Set Operational Mode
   * @param {'NORMAL' | 'AGGRESSIVE'} mode 
   */
  setMode(mode) {
    this.mode = mode === 'AGGRESSIVE' ? 'AGGRESSIVE' : 'NORMAL';
    this.mutator.setMode(this.mode);
    this.logEvent(
      this.mode === 'AGGRESSIVE' ? 'ALERT' : 'INFO',
      `Operational policy transitioned: ${this.mode === 'AGGRESSIVE' ? 'NORMAL Mode → AGGRESSIVE Mode' : 'AGGRESSIVE Mode → NORMAL Mode'}`
    );
    return this.mode;
  }

  /**
   * Toggle GhostDOM Master Switch
   */
  toggle(forceState) {
    if (typeof forceState === 'boolean') {
      this.enabled = forceState;
    } else {
      this.enabled = !this.enabled;
    }
    this.logEvent(
      this.enabled ? 'INFO' : 'WARN',
      `Master Shield toggled: ${this.enabled ? 'ACTIVE (Polymorphic)' : 'BYPASSED (Vulnerable)'}`
    );
    return this.enabled;
  }

  /**
   * Trigger instant reaction alert & switch client to aggressive mode
   */
  triggerBotReaction(ip, trapType, details = {}) {
    const time = new Date();
    const alertData = {
      id: 'alert_' + Date.now(),
      ip,
      timestamp: time.toISOString(),
      timeStr: this.formatTime(time),
      trapType: trapType || 'Accessed hidden honeypot price',
      details: details.details || 'Decoy crawler bait touched',
      token: details.token || 'N/A',
      active: true
    };

    this.latestAlert = alertData;
    this.blockedIPs.add(ip);
    this.clientModes.set(ip, 'AGGRESSIVE');

    // Switch global state to Aggressive mode as well so presentation shows instant elevation
    this.setMode('AGGRESSIVE');

    this.stats.honeypotHits++;

    // Security Terminal Log Lines
    this.logEvent('ALERT', `☠ HONEYPOT TRIGGERED - bot flagged: ${ip} (${alertData.trapType})`, ip);
    this.logEvent('ALERT', `Switching client ${ip} to AGGRESSIVE MODE`, ip);
    this.logEvent('POISON', `Deploying 8 decoy pricing honeypots & poisoned data feed`, ip);

    return alertData;
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
      trapType: trapDetails.type || 'Accessed hidden honeypot price (.price query)',
      token: trapDetails.token || 'N/A',
      path: req.originalUrl || req.url,
      method: req.method,
      status: 'BLOCKED'
    };

    this.detectedBots.unshift(botRecord);
    if (this.detectedBots.length > 100) {
      this.detectedBots.pop();
    }

    // Trigger instant reaction banner & mode switch
    this.triggerBotReaction(ip, botRecord.trapType, {
      token: botRecord.token,
      details: `Trapped on endpoint: ${botRecord.path}`
    });

    return botRecord;
  }

  /**
   * Express middleware function to intercept HTML responses
   */
  middleware() {
    return (req, res, next) => {
      this.stats.totalRequests++;
      const clientIp = this.getClientIp(req);

      // Intercept res.send to mutate HTML when enabled
      const originalSend = res.send.bind(res);

      res.send = (body) => {
        const contentType = res.getHeader('Content-Type') || '';
        const isHtml = typeof body === 'string' && (contentType.includes('text/html') || body.trim().startsWith('<!DOCTYPE html') || body.trim().startsWith('<html'));

        if (!isHtml) {
          return originalSend(body);
        }

        // If GhostDOM is OFF: bypass mutation
        if (!this.enabled) {
          this.stats.bypassedRequests++;
          res.setHeader('X-GhostDOM-Status', 'DISABLED');
          this.logEvent('WARN', `Request from ${clientIp} served STATIC (GhostDOM Bypassed)`, clientIp);
          return originalSend(body);
        }

        // If GhostDOM is ON: apply polymorphic mutation pipeline
        try {
          this.stats.mutatedRequests++;
          this.loadCss();

          // Check if this specific client or global is in Aggressive mode
          const effectiveMode = this.clientModes.get(clientIp) || this.mode;

          const { mutatedHtml, durationMs, seed, honeypotCount } = this.mutator.mutate(body, this.cachedCss, {
            mode: effectiveMode
          });

          res.setHeader('X-GhostDOM-Status', 'ACTIVE');
          res.setHeader('X-GhostDOM-Mode', effectiveMode);
          res.setHeader('X-GhostDOM-Latency-Ms', durationMs.toString());
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

          this.logEvent(
            effectiveMode === 'AGGRESSIVE' ? 'POISON' : 'INFO',
            `Request from ${clientIp} - mutated (seed: ${seed}, mode: ${effectiveMode}, traps: ${honeypotCount})`,
            clientIp
          );

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
    const source = req.query.source || 'decoy_anchor';
    const clientIp = this.getClientIp(req);

    const botRecord = this.recordBot(req, {
      type: source === 'decoy_anchor' ? 'Accessed hidden honeypot link' : 'Triggered stealth trap token',
      token: token || 'unverified'
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        error: 'BOT_DETECTED',
        message: 'GhostDOM Honeypot Triggered. Your IP has been quarantined and client switched to Aggressive Mode.',
        ip: clientIp,
        mode: 'AGGRESSIVE',
        timestamp: botRecord.timestamp
      });
    }

    // Render an informative decoy security notice
    res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>GhostDOM — Bot Neutralized</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080b12; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #0f1422; border: 2px solid #ef4444; border-radius: 12px; padding: 32px; max-width: 540px; box-shadow: 0 0 35px rgba(239, 68, 68, 0.35); text-align: center; }
          h2 { color: #ef4444; margin-top: 0; font-size: 24px; letter-spacing: -0.5px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge { background: #1a2236; padding: 6px 12px; border-radius: 6px; font-family: monospace; color: #f87171; border: 1px solid #374151; display: inline-block; margin: 4px; }
          .actions { margin-top: 24px; display: flex; gap: 12px; justify-content: center; }
          a { color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>☠ BOT DETECTED (GhostDOM) ☠</h2>
          <p>This crawler triggered an invisible polymorphic honeypot element intended exclusively for automated scrapers.</p>
          <div>
            <span class="badge">IP: ${clientIp}</span>
            <span class="badge">STATUS: QUARANTINED</span>
            <span class="badge">MODE: AGGRESSIVE</span>
          </div>
          <p style="margin-top: 16px;">This client is now fed poisoned decoy pricing data on all catalog pages.</p>
          <div class="actions">
            <a href="/dashboard">← View GhostDOM Defense Deck</a>
            <a href="/">Return to Storefront</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  /**
   * Reset Demo (Clears logs, resets mode back to Normal, clears blocklist)
   */
  resetDemo() {
    this.detectedBots = [];
    this.blockedIPs.clear();
    this.clientModes.clear();
    this.mode = 'NORMAL';
    this.mutator.setMode('NORMAL');
    this.latestAlert = null;

    this.stats.honeypotHits = 0;
    this.stats.scraperAttempts = 0;
    this.stats.scraperSuccesses = 0;
    this.stats.scraperFailures = 0;

    this.eventLog = [];
    this.logEvent('INFO', 'DEMO RESET: Logs cleared. Defense Deck restored to NORMAL MODE', '127.0.0.1');

    return {
      success: true,
      mode: 'NORMAL',
      message: 'Demo state successfully reset to default.'
    };
  }
}

module.exports = GhostDomMiddleware;
