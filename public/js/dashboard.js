/**
 * GhostDOM Security Command Deck Client (dashboard.js) - v3.0 Production Final
 * Handles Web Audio API alerts, instant bot reaction animations, live event logging,
 * Aggressive Mode transitions, offline HTML5 Canvas telemetry, automated Demo Mode story,
 * and keyboard shortcut navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Banner & Audio
  const alertBanner = document.getElementById('bot-alert-banner');
  const alertIp = document.getElementById('alert-ip');
  const alertTime = document.getElementById('alert-time');
  const alertVector = document.getElementById('alert-vector');
  const btnDismissAlert = document.getElementById('btn-dismiss-alert');

  // Controls & Badges
  const deckModeBadge = document.getElementById('deck-mode-badge');
  const deckModeDot = document.getElementById('deck-mode-dot');
  const masterShieldToggle = document.getElementById('master-shield-toggle');
  const masterToggleLabel = document.getElementById('master-toggle-label');

  // Top Action Buttons
  const btnSimulateBot = document.getElementById('btn-simulate-bot');
  const btnResetDemo = document.getElementById('btn-reset-demo');

  // Stats
  const statRequestsMutated = document.getElementById('stat-requests-mutated');
  const statBotsDetected = document.getElementById('stat-bots-detected');
  const statSuccessRate = document.getElementById('stat-success-rate');
  const statRateBadge = document.getElementById('stat-rate-badge');
  const statLatency = document.getElementById('stat-latency');
  const telemetryCanvas = document.getElementById('telemetry-chart');

  // Human vs Bot Comparison
  const humanStoreIframe = document.getElementById('human-store-iframe');
  const botCodeView = document.getElementById('bot-code-view');
  const botSampleSeed = document.getElementById('bot-sample-seed');
  const botSampleMode = document.getElementById('bot-sample-mode');
  const botSampleEntropy = document.getElementById('bot-sample-entropy');
  const botModePill = document.getElementById('bot-mode-pill');
  const btnRefreshBotView = document.getElementById('btn-refresh-bot-view');

  // Terminal & Scraper
  const securityEventTerminal = document.getElementById('security-event-terminal');
  const scraperOutputTerminal = document.getElementById('scraper-output-terminal');
  const btnRunScraper = document.getElementById('btn-run-scraper');
  const botTableBody = document.getElementById('bot-table-body');

  // Audio Context Tracker
  let lastAlertId = null;
  let audioContext = null;

  // Real-Time Canvas Sparkline Latency History
  const latencyHistory = [1.1, 1.25, 0.95, 1.4, 1.15, 1.3, 1.2, 1.05, 1.28, 1.18];

  /**
   * Universal HTML entity escaper to guarantee zero XSS vulnerabilities
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Unlock Web Audio API on first user interaction
   */
  function ensureAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) {
        audioContext = new AudioCtx();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (e) {
      // Audio not yet unlocked
    }
  }

  document.addEventListener('click', ensureAudioContext, { once: true });
  document.addEventListener('keydown', ensureAudioContext, { once: true });

  /**
   * Synthesize Security Siren Alert using Web Audio API (Zero external audio files)
   */
  function playAlertSound() {
    try {
      ensureAudioContext();
      if (!audioContext) return;

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sawtooth';
      // Pitch drop alert siren
      osc.frequency.setValueAtTime(880, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioContext.currentTime + 0.35);

      gain.gain.setValueAtTime(0.22, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + 0.35);
    } catch (err) {
      console.warn('[Audio] Web Audio alert not permitted yet:', err);
    }
  }

  /**
   * Animate number counters smoothly
   */
  function animateValue(elem, start, end, duration = 400) {
    if (!elem) return;
    if (start === end) {
      elem.textContent = end;
      return;
    }
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range)) || 20;

    const timer = setInterval(() => {
      current += increment;
      elem.textContent = current;
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  /**
   * Render Offline HTML5 Canvas Real-Time Sparkline Chart
   */
  function drawTelemetryChart() {
    if (!telemetryCanvas) return;
    const ctx = telemetryCanvas.getContext('2d');
    if (!ctx) return;

    const width = telemetryCanvas.width;
    const height = telemetryCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = '#131a2c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (latencyHistory.length < 2) return;

    const min = 0.5;
    const max = 2.5;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const stepX = width / (latencyHistory.length - 1);
    latencyHistory.forEach((val, i) => {
      const normalizedY = height - ((val - min) / (max - min)) * height;
      const clampedY = Math.max(4, Math.min(height - 4, normalizedY));
      if (i === 0) {
        ctx.moveTo(0, clampedY);
      } else {
        ctx.lineTo(i * stepX, clampedY);
      }
    });
    ctx.stroke();

    // Pulse dot at latest point
    const lastIdx = latencyHistory.length - 1;
    const lastVal = latencyHistory[lastIdx];
    const lastY = Math.max(4, Math.min(height - 4, height - ((lastVal - min) / (max - min)) * height));
    const lastX = lastIdx * stepX;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Highlights polymorphic differences and honeypots in Bot HTML snippet
   */
  function highlightBotHtml(html) {
    // Locate the first product card or honeypot chunk
    const match = html.match(/(<div[^>]*class="[^"]*(?:product-card|g_|c_|v_|k_)[^"]*"[\s\S]*?<\/button>\s*<\/div>)/i);
    let snippet = match ? match[1] : html.substring(0, 850);

    // If in aggressive mode, also include a honeypot trap snippet if present
    if (html.includes('ghost-honeypot-trap')) {
      const hpMatch = html.match(/(<div[^>]*class="[^"]*ghost-honeypot-trap[^"]*"[\s\S]*?<\/a>\s*<\/div>\s*<\/div>)/i);
      if (hpMatch) {
        snippet = hpMatch[1] + "\n\n<!-- [AUTHENTIC PRODUCT MUTATION] -->\n" + snippet;
      }
    }

    let escaped = escapeHtml(snippet);

    // Highlight Honeypots in Gold / Amber
    escaped = escaped.replace(/(class=&quot;[^&]*ghost-honeypot-trap[^&]*&quot;)/g, '<span class="hl-honeypot">$1</span>');
    escaped = escaped.replace(/(data-ghostdom-trap=&quot;true&quot;)/g, '<span class="hl-honeypot">$1</span>');
    escaped = escaped.replace(/(&lt;span class=&quot;price&quot;&gt;\$(?:0\.00|9\.99|14\.50|499\.00|4\.99|1\.99|19\.95|12\.99)&lt;\/span&gt;)/g, '<span class="hl-honeypot">$1</span>');

    // Highlight randomized class names in Red/Pink
    escaped = escaped.replace(/(class=&quot;[^&]*(?:g_|c_|v_|k_)[a-f0-9]{6,8}[^&]*&quot;)/g, '<span class="hl-class">$1</span>');

    // Highlight wrapper nodes in Blue
    escaped = escaped.replace(/(data-ghost-wrap=&quot;[^&]*&quot;)/g, '<span class="hl-wrap">$1</span>');

    // Highlight decoy attributes in Green
    escaped = escaped.replace(/(data-(?:item-hash|v-rendered|ghost-ref|ui-key|render-id)=&quot;[^&]*&quot;)/g, '<span class="hl-attr">$1</span>');

    return escaped;
  }

  /**
   * Update Dashboard State from Server Telemetry
   */
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();

      // 1. Master Shield Toggle
      masterShieldToggle.checked = data.enabled;
      if (data.enabled) {
        masterToggleLabel.innerHTML = 'GhostDOM: <strong>ACTIVE</strong>';
      } else {
        masterToggleLabel.innerHTML = 'GhostDOM: <strong style="color: #ef4444;">BYPASSED</strong>';
      }

      // 2. Mode Badge & Dot (Turn from Aggressive back to Bypass Mode when deactivated)
      if (!data.enabled) {
        deckModeBadge.className = 'mode-badge bypassed';
        deckModeBadge.textContent = 'BYPASS MODE';
        deckModeDot.className = 'mode-indicator-dot bypassed';
        botModePill.textContent = 'STATIC PAYLOAD (BYPASSED)';
        botModePill.className = 'comp-pill human';
      } else {
        const isAggressive = data.mode === 'AGGRESSIVE';
        if (isAggressive) {
          deckModeBadge.className = 'mode-badge aggressive';
          deckModeBadge.textContent = 'AGGRESSIVE MODE';
          deckModeDot.className = 'mode-indicator-dot aggressive';
          botModePill.textContent = 'AGGRESSIVE PAYLOAD (DATA POISONING)';
          botModePill.className = 'comp-pill bot';
        } else {
          deckModeBadge.className = 'mode-badge normal';
          deckModeBadge.textContent = 'NORMAL MODE';
          deckModeDot.className = 'mode-indicator-dot';
          botModePill.textContent = 'POLYMORPHIC PAYLOAD';
          botModePill.className = 'comp-pill bot';
        }
      }

      // 3. Stats & Animated Counters
      const prevMutated = parseInt(statRequestsMutated.textContent, 10) || 0;
      const newMutated = data.stats.mutatedRequests || 0;
      if (newMutated !== prevMutated) {
        animateValue(statRequestsMutated, prevMutated, newMutated);
      }

      const prevBots = parseInt(statBotsDetected.textContent, 10) || 0;
      const newBots = data.stats.honeypotHits || 0;
      if (newBots !== prevBots) {
        animateValue(statBotsDetected, prevBots, newBots);
      }

      const currentLat = parseFloat(data.metrics.avgDurationMs || '1.18');
      statLatency.textContent = currentLat.toFixed(2);

      // Push to telemetry chart history
      latencyHistory.push(currentLat);
      if (latencyHistory.length > 20) latencyHistory.shift();
      drawTelemetryChart();

      // Scraper Success Rate
      const totalAttempts = data.stats.scraperAttempts;
      const successes = data.stats.scraperSuccesses;
      const rate = totalAttempts > 0 
        ? ((successes / totalAttempts) * 100).toFixed(1)
        : (data.enabled ? '0.0' : '100.0');

      statSuccessRate.textContent = `${rate}%`;
      if (data.enabled) {
        statRateBadge.textContent = isAggressive ? '0% (POISONED)' : '0% (BLOCKED)';
        statRateBadge.className = 'comp-pill bot';
      } else {
        statRateBadge.textContent = '100% (VULNERABLE)';
        statRateBadge.className = 'comp-pill human';
      }

      // 4. Alert Banner Reactive Reaction
      if (data.latestAlert && data.latestAlert.active) {
        alertBanner.classList.add('active');
        alertIp.textContent = data.latestAlert.ip;
        alertTime.textContent = data.latestAlert.timeStr;
        alertVector.textContent = data.latestAlert.trapType;

        // Play sound once per unique alert ID
        if (data.latestAlert.id !== lastAlertId) {
          lastAlertId = data.latestAlert.id;
          playAlertSound();
        }
      } else {
        alertBanner.classList.remove('active');
      }

      // 5. Update Terminal Event Stream
      if (data.events && data.events.length > 0) {
        securityEventTerminal.innerHTML = data.events.map(ev => {
          let levelClass = 'info';
          if (ev.level === 'ALERT') levelClass = 'alert';
          if (ev.level === 'WARN') levelClass = 'warn';
          if (ev.level === 'POISON') levelClass = 'poison';
          if (ev.level === 'SUCCESS') levelClass = 'success';
          return `<div class="log-entry ${levelClass}">[${escapeHtml(ev.timeStr)}] ${escapeHtml(ev.message)}</div>`;
        }).join('');
      }

    } catch (err) {
      console.warn('Status fetch error:', err);
    }
  }

  /**
   * Fetch Bot Table
   */
  async function fetchBots() {
    try {
      const res = await fetch('/api/bots');
      const bots = await res.json();

      if (!bots || bots.length === 0) {
        botTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 18px;">
              No bots trapped yet. Press 'B' to simulate or 'S' to run scraper.
            </td>
          </tr>
        `;
        return;
      }

      botTableBody.innerHTML = bots.slice(0, 10).map(bot => {
        const time = new Date(bot.timestamp).toLocaleTimeString();
        const isQuarantined = bot.action === 'QUARANTINED' || bot.status === 'BLOCKED';
        const badgeHtml = isQuarantined
          ? '<span class="badge-blocked">QUARANTINED</span>'
          : '<span class="badge-allowed">ALLOWED</span>';

        return `
          <tr>
            <td style="font-family: var(--font-mono);">${escapeHtml(time)}</td>
            <td style="font-family: var(--font-mono); color: #38bdf8;">${escapeHtml(bot.ip)}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(bot.trapType)}">
              ${escapeHtml(bot.trapType)}
            </td>
            <td>${badgeHtml}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Fetch Fresh Sample for Bot View (Right Panel)
   */
  async function fetchBotSample() {
    try {
      const res = await fetch('/api/source-sample');
      const data = await res.json();

      botSampleSeed.textContent = data.seed ? `0x${escapeHtml(data.seed)}` : 'STATIC';
      botSampleMode.textContent = data.mode || (data.status === 'ACTIVE' ? 'NORMAL' : 'BYPASSED');
      botSampleMode.style.color = data.mode === 'AGGRESSIVE' ? '#ef4444' : '#10b981';

      if (data.status === 'ACTIVE') {
        botSampleEntropy.textContent = data.mode === 'AGGRESSIVE' ? 'HYPER-ENTROPY (POISONING)' : '100% ENTROPY';
        botSampleEntropy.style.color = data.mode === 'AGGRESSIVE' ? '#f59e0b' : '#10b981';
      } else {
        botSampleEntropy.textContent = '0% (STATIC CODE)';
        botSampleEntropy.style.color = '#ef4444';
      }

      botCodeView.innerHTML = highlightBotHtml(data.html);
    } catch (e) {
      botCodeView.textContent = 'Error fetching bot sample: ' + e.message;
    }
  }

  /**
   * Helper to append lines to Scraper terminal
   */
  function logScraperTerminal(text, className = 'info') {
    const div = document.createElement('div');
    div.className = `log-entry ${className}`;
    div.innerHTML = text;
    scraperOutputTerminal.appendChild(div);
    scraperOutputTerminal.scrollTop = scraperOutputTerminal.scrollHeight;
  }

  /**
   * Run Live Scraper Test
   */
  async function runScraperTest() {
    btnRunScraper.disabled = true;
    scraperOutputTerminal.innerHTML = '';

    logScraperTerminal('$ python scraper/scraper.py --target http://localhost:3000', 'info');
    await new Promise(r => setTimeout(r, 120));
    logScraperTerminal('[HTTP] Connecting to BROKART catalog at http://localhost:3000/...', 'info');
    await new Promise(r => setTimeout(r, 180));

    try {
      const res = await fetch('/api/scraper-test', { method: 'POST' });
      const result = await res.json();

      logScraperTerminal(`[PARSER] Querying DOM with selector: .price`, 'warn');
      await new Promise(r => setTimeout(r, 200));

      if (result.success) {
        // Scraper Succeeded (GhostDOM was OFF)
        logScraperTerminal(`[SUCCESS] Extracted ${result.productCount} legitimate products:`, 'success');
        result.samples.forEach(s => {
          logScraperTerminal(`  ✓ ${escapeHtml(s.name)} &rarr; <strong style="color: #10b981;">${escapeHtml(s.price)}</strong>`, 'success');
        });
        logScraperTerminal(`[ALERT] BROKART is VULNERABLE: Competitor bot extracted all pricing in 18ms!`, 'warn');
      } else {
        // Scraper Failed / Trapped (GhostDOM was ON)
        logScraperTerminal(`[NEUTRALIZED] Legitimate products extracted: 0`, 'alert');

        if (result.mode === 'AGGRESSIVE') {
          logScraperTerminal(`[DATA POISONED] Scraper fell for ${result.honeypotCount} decoy traps!`, 'poison');
          if (result.honeypotPrices) {
            logScraperTerminal(`[POISON INGESTED] False prices harvested: ${escapeHtml(result.honeypotPrices.join(', '))}`, 'poison');
          }
          logScraperTerminal(`[DEFENSE] Competitor crawler dataset permanently contaminated.`, 'alert');
        } else {
          logScraperTerminal(`[TRAPPED] Extracted decoy price: <strong style="color:#ef4444;">${escapeHtml(result.primaryHoneypotPrice)}</strong>`, 'alert');
          logScraperTerminal(`[HONEYPOT] Hidden link followed & IP quarantined.`, 'alert');
        }

        playAlertSound();
      }

      await fetchStatus();
      await fetchBots();
      await fetchBotSample();
    } catch (err) {
      logScraperTerminal(`[ERROR] Execution failure: ${escapeHtml(err.message)}`, 'alert');
    } finally {
      btnRunScraper.disabled = false;
    }
  }

  // Event Listeners
  btnSimulateBot.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/bot-attack', { method: 'POST' });
      const data = await res.json();
      if (data.shieldActive) {
        playAlertSound();
      }
      await fetchStatus();
      await fetchBots();
      await fetchBotSample();
      if (humanStoreIframe) humanStoreIframe.src = '/';
    } catch (e) {
      console.warn(e);
    }
  });

  btnResetDemo.addEventListener('click', async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      scraperOutputTerminal.innerHTML = `
        <div class="log-entry info">$ python scraper/scraper.py</div>
        <div class="log-entry info">[Ready] Demo reset to initial state. Press 'B' to simulate bot attack.</div>
      `;
      await fetchStatus();
      await fetchBots();
      await fetchBotSample();
      if (humanStoreIframe) humanStoreIframe.src = '/';
    } catch (e) {
      console.warn(e);
    }
  });

  btnDismissAlert.addEventListener('click', async () => {
    try {
      await fetch('/api/dismiss-alert', { method: 'POST' });
      alertBanner.classList.remove('active');
    } catch (e) {
      alertBanner.classList.remove('active');
    }
  });

  masterShieldToggle.addEventListener('change', async () => {
    try {
      await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: masterShieldToggle.checked })
      });
      await fetchStatus();
      await fetchBotSample();
      if (humanStoreIframe) humanStoreIframe.src = '/';
    } catch (e) {
      console.warn(e);
    }
  });

  btnRefreshBotView.addEventListener('click', fetchBotSample);
  btnRunScraper.addEventListener('click', runScraperTest);

  // Global Keyboard Shortcuts Listener
  document.addEventListener('keydown', (e) => {
    // Skip if user is typing in an input
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const key = e.key.toUpperCase();

    if (key === 'B') {
      e.preventDefault();
      btnSimulateBot.click();
    } else if (key === 'R') {
      e.preventDefault();
      btnResetDemo.click();
    } else if (key === 'S') {
      e.preventDefault();
      btnRunScraper.click();
    } else if (key === 'T') {
      e.preventDefault();
      masterShieldToggle.checked = !masterShieldToggle.checked;
      masterShieldToggle.dispatchEvent(new Event('change'));
    }
  });

  // Initial Boot
  fetchStatus();
  fetchBots();
  fetchBotSample();
  drawTelemetryChart();

  // Fast polling for instant reaction
  setInterval(fetchStatus, 1800);
});
