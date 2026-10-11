/**
 * GhostDOM Mutation Engine (mutator.js) - v2.0
 * 
 * Upgraded with Multi-Tier Polymorphic Modes:
 * 1. NORMAL MODE: Class name aliasing, shallow tag hierarchy wrapping, baseline stealth honeypot.
 * 2. AGGRESSIVE MODE: Deep tag hierarchy mutation, hyper-dense honeypot injection (8-10 traps),
 *    and Believable Data Poisoning (feeds fake, believable prices to .price queries to corrupt bot datasets).
 * 
 * ARCHITECTURE NOTE FOR MACHINE LEARNING EXTENSION:
 * Designed with a Strategy Pattern. The heuristic/random engine below can be seamlessly
 * swapped with an adversarial RL agent that tunes decoy entropy and wrapping depth in real time.
 */

const crypto = require('crypto');
const cheerio = require('cheerio');

class GhostDomMutator {
  /**
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.targetClasses = options.targetClasses || [
      'product-card',
      'product-image-wrap',
      'product-image',
      'product-badge',
      'product-info',
      'product-category',
      'product-title',
      'product-desc',
      'product-meta',
      'price-wrap',
      'price',
      'price-original',
      'stock',
      'in-stock',
      'low-stock',
      'out-of-stock',
      'rating-wrap',
      'stars',
      'review-count',
      'btn-add-cart',
      'product-actions'
    ];

    // Global / fallback mode: 'NORMAL' or 'AGGRESSIVE'
    this.mode = options.mode || 'NORMAL';

    // Active honeypot tokens register: token -> { issuedAt, expiresAt, mode }
    this.activeHoneypotTokens = new Map();

    // Pool of believable decoy prices & titles for Data Poisoning in Aggressive Mode
    this.poisonDecoys = [
      { title: "Smart Sound ANC Earbuds (Decoy Bait)", price: "$9.99", stock: "In Stock (99)" },
      { title: "Mechanical Keycap Set (Clearance Bait)", price: "$14.50", stock: "Low Stock (2)" },
      { title: "Titanium Sport Smartwatch (VIP Deal)", price: "$499.00", stock: "In Stock (12)" },
      { title: "Ergonomic Memory Gel Mousepad", price: "$4.99", stock: "In Stock (80)" },
      { title: "UltraSpeed 8K DisplayPort Cable", price: "$1.99", stock: "In Stock (150)" },
      { title: "Pro Studio Boom Microphone Arm", price: "$19.95", stock: "In Stock (22)" },
      { title: "Wireless Fast Charging Pad Duo", price: "$12.99", stock: "Low Stock (4)" },
      { title: "Ghost Trap VIP Exclusive Item", price: "$0.00", stock: "Trapped" }
    ];

    // Telemetry: average mutation metrics
    this.metrics = {
      totalMutations: 0,
      totalDurationMs: 0,
      lastMutationDurationMs: 0
    };
  }

  /**
   * Set operational mode ('NORMAL' | 'AGGRESSIVE')
   */
  setMode(mode) {
    if (mode === 'AGGRESSIVE' || mode === 'NORMAL') {
      this.mode = mode;
    }
    return this.mode;
  }

  /**
   * Issue and track a new ephemeral honeypot token
   * @param {string} mode 
   * @returns {string} Unique token
   */
  generateHoneypotToken(mode = 'NORMAL') {
    const token = 'ghst_' + crypto.randomBytes(8).toString('hex');
    const now = Date.now();
    this.activeHoneypotTokens.set(token, {
      issuedAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes TTL
      mode
    });

    // Cleanup expired tokens periodically
    if (this.activeHoneypotTokens.size > 3000) {
      for (const [t, data] of this.activeHoneypotTokens.entries()) {
        if (data.expiresAt < now) this.activeHoneypotTokens.delete(t);
      }
    }

    return token;
  }

  /**
   * Validates if a honeypot token was legitimately issued by GhostDOM
   * @param {string} token 
   * @returns {boolean}
   */
  verifyHoneypotToken(token) {
    if (!token) return false;
    const entry = this.activeHoneypotTokens.get(token);
    if (!entry) return false;
    return entry.expiresAt > Date.now();
  }

  /**
   * Generates a randomized CSS class identifier complying with CSS syntax.
   * e.g., 'g_7f3b8a', 'c_9a12e', etc.
   * @returns {string}
   */
  generateRandomClassName() {
    const prefixes = ['g_', 'c_', 'v_', 'z_', 'k_'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const hash = crypto.randomBytes(4).toString('hex');
    return `${prefix}${hash}`;
  }

  /**
   * PHASE 1: Build dynamic class mapping for this specific request.
   * @returns {Record<string, string>}
   */
  createClassMap() {
    const map = {};
    for (const originalClass of this.targetClasses) {
      map[originalClass] = this.generateRandomClassName();
    }
    return map;
  }

  /**
   * PHASE 2: Rewrite CSS stylesheet to match randomized class tokens.
   * @param {string} css Raw CSS stylesheet content
   * @param {Record<string, string>} classMap Mapping from original to obfuscated class
   * @returns {string} Obfuscated CSS
   */
  rewriteCSS(css, classMap) {
    let rewritten = css;

    // Sort classes by length descending so longer compound names are replaced first
    const sortedClasses = Object.keys(classMap).sort((a, b) => b.length - a.length);

    for (const originalClass of sortedClasses) {
      const randomizedClass = classMap[originalClass];
      const selectorRegex = new RegExp(`\\.(${originalClass})(?![a-zA-Z0-9_-])`, 'g');
      rewritten = rewritten.replace(selectorRegex, `.${randomizedClass}`);
    }

    // Add helper utility for ghost-wrappers ensuring zero visual layout shift
    rewritten += `\n/* [GhostDOM Polymorphic Resets] */\n.g-wrapper, [data-ghost-wrap] { display: contents !important; }\n`;

    return rewritten;
  }

  /**
   * PHASE 3: Tag Hierarchy Mutation
   * Randomly wrap target elements in harmless <div>/<span> wrappers with display: contents.
   * In AGGRESSIVE mode, wrapper depth increases to 2-4 levels.
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {string} effectiveMode
   */
  mutateHierarchy($, effectiveMode = 'NORMAL') {
    const maxDepth = effectiveMode === 'AGGRESSIVE' ? 4 : 2;
    const candidateSelectors = ['.product-title', '.price', '.stock', '.product-category', '.product-meta'];

    candidateSelectors.forEach(sel => {
      $(sel).each((_, el) => {
        const depth = Math.floor(Math.random() * maxDepth) + 1;
        let current = $(el);

        for (let i = 0; i < depth; i++) {
          const tag = Math.random() > 0.5 ? 'div' : 'span';
          const wrapClass = this.generateRandomClassName();
          const wrapAttr = `data-ghost-wrap="${crypto.randomBytes(2).toString('hex')}"`;
          current.wrap(`<${tag} class="${wrapClass} g-wrapper" ${wrapAttr}></${tag}>`);
        }
      });
    });
  }

  /**
   * PHASE 4: Attribute Shuffling and Decoy Injections
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {string} effectiveMode
   */
  shuffleAndAddDecoyAttributes($, effectiveMode = 'NORMAL') {
    const probability = effectiveMode === 'AGGRESSIVE' ? 0.75 : 0.4;

    $('*').each((_, el) => {
      if (Math.random() < probability && el.type === 'tag' && el.name !== 'html' && el.name !== 'head' && el.name !== 'body' && el.name !== 'script' && el.name !== 'style') {
        const decoyKeys = ['data-item-hash', 'data-v-rendered', 'data-ghost-ref', 'data-ui-key', 'data-poison-sig', 'data-render-id'];
        const randomKey = decoyKeys[Math.floor(Math.random() * decoyKeys.length)];
        const randomVal = crypto.randomBytes(3).toString('hex');
        
        if (!el.attribs) el.attribs = {};
        el.attribs[randomKey] = randomVal;
      }
    });
  }

  /**
   * PHASE 5: Honeypot & Data Poisoning Injection
   * Injects hidden decoy elements that LITERALLY USE THE ORIGINAL UNMUTATED SELECTORS (.price, .product-card).
   * 
   * In NORMAL MODE:
   * - Injects 1-2 stealth honeypots with $0.00 bait
   * 
   * In AGGRESSIVE MODE:
   * - Injects 8-10 decoy honeypot products and poisoned pricing entries!
   * - When scrapers crawl .price, they extract believable but totally fabricated prices ($9.99, $14.50, $499.00),
   *   severely poisoning and corrupting their database.
   * 
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {string} honeypotToken Unique token for this request
   * @param {string} effectiveMode
   * @returns {{ count: number, poisonedPrices: string[] }}
   */
  injectHoneypotTraps($, honeypotToken, effectiveMode = 'NORMAL') {
    const grid = $('.product-grid');
    const trapsToInject = effectiveMode === 'AGGRESSIVE' 
      ? this.poisonDecoys 
      : [{ title: "Decoy VIP Crawler Bait - Automated Bot Trap", price: "$0.00", stock: "Instant Trap" }];

    const injectedPrices = [];

    trapsToInject.forEach((decoy, index) => {
      injectedPrices.push(decoy.price);

      const trapId = `trap_${index}_` + crypto.randomBytes(3).toString('hex');
      const honeypotHtml = `
        <div class="product-card ghost-honeypot-trap" 
             id="${trapId}"
             style="display:none!important;visibility:hidden!important;position:absolute!important;left:-99999px!important;top:-99999px!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;" 
             aria-hidden="true" 
             data-ghostdom-trap="true"
             data-poisoned="true">
          <div class="product-info">
            <span class="product-category">Clearance Decoy</span>
            <h3 class="product-title">${decoy.title}</h3>
            <div class="product-meta">
              <!-- Naive scraper querying '.price' extracts this poisoned/honeypot price -->
              <span class="price">${decoy.price}</span>
              <span class="stock in-stock">${decoy.stock}</span>
            </div>
            <a href="/honeypot/trap?token=${honeypotToken}&source=decoy_anchor&idx=${index}" class="btn-add-cart add-to-cart" tabindex="-1" rel="nofollow">
              Claim Automated Scraper Deal
            </a>
          </div>
        </div>
      `;

      if (grid.length > 0) {
        const children = grid.children();
        const insertIdx = Math.floor(Math.random() * (children.length + 1));
        if (insertIdx === 0) {
          grid.prepend(honeypotHtml);
        } else {
          $(children[insertIdx - 1]).after(honeypotHtml);
        }
      } else {
        $('body').append(honeypotHtml);
      }
    });

    // Also inject a stealth zero-pixel anchor tag for crawlers following every href
    const silentTrap = `
      <a href="/honeypot/trap?token=${honeypotToken}&source=silent_link" 
         style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" 
         tabindex="-1" 
         aria-hidden="true" 
         rel="nofollow"></a>
    `;
    $('body').append(silentTrap);

    return {
      count: trapsToInject.length,
      poisonedPrices: injectedPrices
    };
  }

  /**
   * PHASE 6: Apply Class Obfuscation to HTML Elements
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {Record<string, string>} classMap 
   */
  applyClassObfuscation($, classMap) {
    $('[class]').each((_, el) => {
      // Skip honeypot elements so they retain the unmutated .price & .product-card selectors to lure bots!
      if ($(el).hasClass('ghost-honeypot-trap') || $(el).closest('.ghost-honeypot-trap').length > 0) {
        return;
      }

      const originalAttr = $(el).attr('class');
      if (!originalAttr) return;

      const classes = originalAttr.split(/\s+/).filter(Boolean);
      const mutatedClasses = classes.map(cls => classMap[cls] || cls);

      $(el).attr('class', mutatedClasses.join(' '));
    });
  }

  /**
   * Main Pipeline Execution
   * @param {string} html Raw HTML page content
   * @param {string} css Raw CSS stylesheet content
   * @param {Object} [overrideOptions]
   * @returns {{ mutatedHtml: string, classMap: Record<string, string>, durationMs: number, honeypotToken: string, mode: string, honeypotCount: number, seed: string }}
   */
  mutate(html, css, overrideOptions = {}) {
    const startTime = performance.now();
    const effectiveMode = overrideOptions.mode || this.mode;
    const seed = crypto.randomBytes(3).toString('hex');

    // 1. Generate unique class map & honeypot token
    const classMap = this.createClassMap();
    const honeypotToken = this.generateHoneypotToken(effectiveMode);

    // 2. Load DOM tree using Cheerio
    const $ = cheerio.load(html, {
      decodeEntities: false
    });

    // 3. Mutate tag hierarchy (inject display:contents wrappers)
    this.mutateHierarchy($, effectiveMode);

    // 4. Inject Honeypots & Believable Poisoned Data (BEFORE obfuscation so traps lure .price crawlers)
    const { count, poisonedPrices } = this.injectHoneypotTraps($, honeypotToken, effectiveMode);

    // 5. Add decoy attributes & noise
    this.shuffleAndAddDecoyAttributes($, effectiveMode);

    // 6. Obfuscate HTML class attributes for legitimate human elements
    this.applyClassObfuscation($, classMap);

    // 7. Rewrite CSS to match the obfuscated classes
    const mutatedCss = this.rewriteCSS(css, classMap);

    // 8. Replace external CSS link with atomic inlined <style> tag
    $('link[rel="stylesheet"][data-ghostdom-target="true"]').remove();
    $('head').append(`\n<style id="ghostdom-polymorphic-css" data-seed="${seed}">\n${mutatedCss}\n</style>\n`);

    // 9. Watermark metadata
    $('body').attr('data-ghostdom-active', 'true');
    $('body').attr('data-ghostdom-mode', effectiveMode);
    $('body').attr('data-ghostdom-seed', seed);

    const endTime = performance.now();
    const durationMs = parseFloat((endTime - startTime).toFixed(2));

    // Update telemetry
    this.metrics.totalMutations++;
    this.metrics.totalDurationMs += durationMs;
    this.metrics.lastMutationDurationMs = durationMs;

    return {
      mutatedHtml: $.html(),
      classMap,
      durationMs,
      honeypotToken,
      mode: effectiveMode,
      honeypotCount: count,
      poisonedPrices,
      seed
    };
  }

  /**
   * Get telemetry stats
   */
  getMetrics() {
    const avg = this.metrics.totalMutations > 0 
      ? (this.metrics.totalDurationMs / this.metrics.totalMutations).toFixed(2)
      : '0.00';
    return {
      totalMutations: this.metrics.totalMutations,
      avgDurationMs: parseFloat(avg),
      lastDurationMs: this.metrics.lastMutationDurationMs,
      mode: this.mode
    };
  }
}

module.exports = GhostDomMutator;
