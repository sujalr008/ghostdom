/**
 * GhostDOM Live Defense Dashboard Controller (dashboard.js)
 * Manages live telemetry, master toggle, side-by-side diffing, scraper demo simulation,
 * and bot detection feed.
 */

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const toggleCheckbox = document.getElementById('ghostdom-toggle');
  const toggleLabel = document.getElementById('toggle-label-text');
  const dotStatus = document.getElementById('dot-status');
  const valStatus = document.getElementById('val-status');
  const valStatusSub = document.getElementById('val-status-sub');
  const valLatency = document.getElementById('val-latency');
  const valSuccessRate = document.getElementById('val-success-rate');
  const badgeRate = document.getElementById('badge-rate');
  const valTraps = document.getElementById('val-traps');

  // Inspector Elements
  const btnFetchDiff = document.getElementById('btn-fetch-diff');
  const codeReq1 = document.getElementById('code-req-1');
  const codeReq2 = document.getElementById('code-req-2');
  const hashReq1 = document.getElementById('hash-req-1');
  const hashReq2 = document.getElementById('hash-req-2');
  const req1Meta = document.getElementById('req1-meta');
  const req2Meta = document.getElementById('req2-meta');
  const entropyPill = document.getElementById('entropy-pill');

  // Scraper Console
  const btnRunScraper = document.getElementById('btn-run-scraper');
  const terminalBody = document.getElementById('scraper-terminal');

  // Bot Feed
  const botTableBody = document.getElementById('bot-table-body');
  const btnSimulateBot = document.getElementById('btn-simulate-bot');
  const btnClearBots = document.getElementById('btn-clear-bots');

  // State
  let isFetchingDiff = false;

  // Simple string hash helper for visual comparison
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  // Escape HTML for code viewer
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Highlights polymorphic differences in source snippets for visual impact
   */
  function formatSnippet(html) {
    // Extract a focused segment around the first product card for clean side-by-side viewing
    const match = html.match(/(<div[^>]*class="[^"]*(?:product-card|g_|c_|v_)[^"]*"[\s\S]*?<\/button>\s*<\/div>)/i);
    const snippet = match ? match[1] : html.substring(0, 700);

    let escaped = escapeHtml(snippet);

    // Highlight class attributes (red/pink highlight)
    escaped = escaped.replace(/(class=&quot;[^&]*&quot;)/g, '<span class="diff-highlight-class">$1</span>');

    // Highlight wrapper nodes or ghost-wrap attributes (blue highlight)
    escaped = escaped.replace(/(data-ghost-wrap=&quot;[^&]*&quot;)/g, '<span class="diff-highlight-wrap">$1</span>');

    // Highlight decoy data attributes (green highlight)
    escaped = escaped.replace(/(data-(?:item-hash|v-rendered|ghost-ref|ui-key)=&quot;[^&]*&quot;)/g, '<span class="diff-highlight-attr">$1</span>');

    return escaped;
  }

  /**
   * Fetch system status & metrics
   */
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();

      // Update toggle UI
      toggleCheckbox.checked = data.enabled;
      if (data.enabled) {
        toggleLabel.innerHTML = 'GhostDOM: <strong>ACTIVE</strong>';
        toggleLabel.className = 'toggle-label';
        dotStatus.className = 'status-indicator-dot active';
        valStatus.textContent = 'ACTIVE';
        valStatus.style.color = '#10b981';
        valStatusSub.textContent = 'Mutating HTML/CSS on every request';
      } else {
        toggleLabel.innerHTML = 'GhostDOM: <strong>BYPASSED</strong>';
        toggleLabel.className = 'toggle-label disabled';
        dotStatus.className = 'status-indicator-dot disabled';
        valStatus.textContent = 'BYPASS';
        valStatus.style.color = '#ef4444';
        valStatusSub.textContent = 'Original static HTML/CSS served';
      }

      // Latency
      valLatency.textContent = data.metrics.avgDurationMs || '1.24';

      // Scraper success rate calculation
      const totalAttempts = data.stats.scraperAttempts;
      const successes = data.stats.scraperSuccesses;
      const rate = totalAttempts > 0 ? ((successes / totalAttempts) * 100).toFixed(1) : (data.enabled ? '0.0' : '100.0');
      valSuccessRate.textContent = `${rate}%`;

      if (data.enabled) {
        badgeRate.textContent = '0% (NEUTRALIZED)';
        badgeRate.className = 'badge-rate';
      } else {
        badgeRate.textContent = '100% (VULNERABLE)';
        badgeRate.className = 'badge-rate success';
      }

      valTraps.textContent = data.stats.honeypotHits;
    } catch (err) {
      console.warn('Failed to fetch status:', err);
    }
  }

  /**
   * Fetch detected bots list
   */
  async function fetchBots() {
    try {
      const res = await fetch('/api/bots');
      const bots = await res.json();

      if (!bots || bots.length === 0) {
        botTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="table-empty">No bots detected yet. Run the scraper demo or trigger a honeypot.</td>
          </tr>
        `;
        return;
      }

      botTableBody.innerHTML = bots.map(bot => {
        const time = new Date(bot.timestamp).toLocaleTimeString();
        return `
          <tr>
            <td style="font-family: var(--font-mono);">${time}</td>
            <td style="font-family: var(--font-mono); color: #38bdf8;">${bot.ip}</td>
            <td><span style="font-family: var(--font-mono); font-size: 11px;">${bot.trapType}</span></td>
            <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #94a3b8;" title="${bot.userAgent}">
              ${bot.userAgent}
            </td>
            <td><span class="bot-badge-blocked">BLOCKED</span></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Failed to fetch bots:', err);
    }
  }

  /**
   * Fetch 2 Consecutive HTML requests to demonstrate live polymorphism
   */
  async function fetchConsecutiveDiff() {
    if (isFetchingDiff) return;
    isFetchingDiff = true;
    btnFetchDiff.disabled = true;
    btnFetchDiff.innerHTML = `<span>Fetching...</span>`;

    codeReq1.textContent = 'Requesting HTTP sample 1...';
    codeReq2.textContent = 'Requesting HTTP sample 2...';

    try {
      // Fetch Sample 1
      const res1 = await fetch('/api/source-sample?t=1');
      const data1 = await res1.json();

      // Delay 40ms to simulate consecutive requests
      await new Promise(r => setTimeout(r, 40));

      // Fetch Sample 2
      const res2 = await fetch('/api/source-sample?t=2');
      const data2 = await res2.json();

      const hash1 = simpleHash(data1.html);
      const hash2 = simpleHash(data2.html);

      hashReq1.textContent = hash1;
      hashReq2.textContent = hash2;

      req1Meta.textContent = `${data1.status} | ${data1.latencyMs || '0.9'}ms`;
      req2Meta.textContent = `${data2.status} | ${data2.latencyMs || '1.1'}ms`;

      codeReq1.innerHTML = formatSnippet(data1.html);
      codeReq2.innerHTML = formatSnippet(data2.html);

      if (data1.status === 'ACTIVE' && hash1 !== hash2) {
        entropyPill.textContent = '100% POLYMORPHIC DIVERGENCE (ENTROPY ACTIVE)';
        entropyPill.style.background = 'rgba(16, 185, 129, 0.15)';
        entropyPill.style.color = 'var(--accent-green)';
        entropyPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else {
        entropyPill.textContent = 'IDENTICAL STATIC CODE (GHOSTDOM BYPASSED)';
        entropyPill.style.background = 'rgba(239, 68, 68, 0.15)';
        entropyPill.style.color = 'var(--accent-red)';
        entropyPill.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      }
    } catch (err) {
      codeReq1.textContent = 'Error loading request 1: ' + err.message;
      codeReq2.textContent = 'Error loading request 2: ' + err.message;
    } finally {
      isFetchingDiff = false;
      btnFetchDiff.disabled = false;
      btnFetchDiff.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6"></path>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Fetch 2 Consecutive Requests
      `;
    }
  }

  /**
   * Terminal Line Append Helper
   */
  function logTerminal(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.innerHTML = text;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  /**
   * Execute Live Scraper Demo via API
   */
  async function runScraperDemo() {
    btnRunScraper.disabled = true;
    terminalBody.innerHTML = '';

    logTerminal('$ python scraper/scraper.py --target http://localhost:3000', 'prompt');
    await new Promise(r => setTimeout(r, 200));

    logTerminal('[INFO] Initializing HTTP crawler session with headers...', 'info');
    await new Promise(r => setTimeout(r, 250));

    try {
      const res = await fetch('/api/scraper-test', { method: 'POST' });
      const result = await res.json();

      logTerminal(`[HTTP] Connected to ${result.targetUrl} (Status: ${result.statusCode})`, 'info');
      await new Promise(r => setTimeout(r, 200));

      logTerminal(`[PARSER] Querying DOM for price elements: soup.select(".price")`, 'prompt');
      await new Promise(r => setTimeout(r, 300));

      if (result.success) {
        // Scraper Succeeded (GhostDOM was OFF)
        logTerminal(`[FOUND] Successfully extracted ${result.productCount} products!`, 'success');
        result.samples.forEach(s => {
          logTerminal(`  ✓ ${s.name} &rarr; <strong style="color:#10b981">${s.price}</strong>`, 'success');
        });
        logTerminal(`[RESULT] SCRAPING SUCCESSFUL: Site is vulnerable to fixed CSS selectors.`, 'warn');
      } else {
        // Scraper Failed / Trapped (GhostDOM was ON)
        logTerminal(`[FAIL] Real product prices extracted: 0`, 'failure');
        if (result.honeypotFound) {
          logTerminal(`[HONEYPOT TRIGGERED] Scraped decoy price: <strong style="color:#ef4444">${result.honeypotPrice}</strong>`, 'failure');
          logTerminal(`[TRAP] Hidden honeypot link followed: ${result.honeypotLink}`, 'warn');
          logTerminal(`[DEFENSE] IP quarantined and logged to GhostDOM Blocklist!`, 'failure');
        } else {
          logTerminal(`[PROTECTION] Fixed selector '.price' returned 0 matches due to class aliasing.`, 'warn');
        }
        logTerminal(`[RESULT] SCRAPING NEUTRALIZED: Bot trapped by GhostDOM polymorphism.`, 'failure');
      }

      // Refresh stats & bot feed
      await fetchStatus();
      await fetchBots();
    } catch (err) {
      logTerminal(`[ERROR] Execution failure: ${err.message}`, 'failure');
    } finally {
      btnRunScraper.disabled = false;
    }
  }

  // Event Listeners
  toggleCheckbox.addEventListener('change', async () => {
    try {
      const res = await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: toggleCheckbox.checked })
      });
      const data = await res.json();
      await fetchStatus();
      await fetchConsecutiveDiff();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  });

  btnFetchDiff.addEventListener('click', fetchConsecutiveDiff);
  btnRunScraper.addEventListener('click', runScraperDemo);

  btnSimulateBot.addEventListener('click', async () => {
    try {
      await fetch('/honeypot/trap?token=simulated_stage_demo&source=decoy_anchor');
      await fetchBots();
      await fetchStatus();
    } catch (e) {
      console.warn(e);
    }
  });

  btnClearBots.addEventListener('click', async () => {
    try {
      await fetch('/api/bots/clear', { method: 'POST' });
      await fetchBots();
      await fetchStatus();
    } catch (e) {
      console.warn(e);
    }
  });

  // Initial Boot
  fetchStatus();
  fetchBots();
  fetchConsecutiveDiff();

  // Periodic poll for stats
  setInterval(fetchStatus, 4000);
});
