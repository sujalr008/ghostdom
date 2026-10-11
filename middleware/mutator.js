/**
 * GhostDOM Mutation Engine (mutator.js)
 * 
 * Core engine responsible for server-side DOM polymorphism and adversarial anti-scraping:
 * 1. Polymorphic Class Mapping: Generates per-request pseudo-random CSS class aliases.
 * 2. CSS Obfuscation & Inlining: Rewrites CSS rules to match generated aliases atomically.
 * 3. Tag Hierarchy Mutation: Injects non-semantic wrapper nodes (using CSS display: contents)
 *    to shatter fixed XPath/child-combinator selectors without affecting layout geometry.
 * 4. Attribute Permutation & Decoys: Injects dynamic pseudo-framework attributes and shuffles order.
 * 5. Honeypot Insertion: Plants hidden bait elements utilizing original selector names (.price, .product-card)
 *    that trap automated scrapers while remaining completely invisible to human visitors.
 * 
 * ARCHITECTURE NOTE FOR MACHINE LEARNING EXTENSION:
 * This module implements a Strategy Pattern. The heuristic/random engine below can be seamlessly
 * replaced or augmented by an ML-driven Policy Model (e.g., Reinforcement Learning Agent or
 * Generative Adversarial DOM Transformer) that predicts optimal mutation vectors against
 * observed scraper fingerprints while minimizing client-side render cost.
 */

const crypto = require('crypto');
const cheerio = require('cheerio');

class GhostDomMutator {
  /**
   * @param {Object} options Configuration options
   * @param {string[]} options.targetClasses List of CSS classes to obfuscate
   * @param {number} options.wrapperDepth Maximum extra wrapper nesting depth
   * @param {boolean} options.injectHoneypot Whether to insert hidden bot traps
   * @param {boolean} options.addDecoyAttributes Whether to inject fake telemetry data-* attrs
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
      'price',
      'stock',
      'in-stock',
      'low-stock',
      'backorder',
      'rating-wrap',
      'stars',
      'review-count',
      'btn-add-cart',
      'product-actions'
    ];

    this.wrapperDepth = options.wrapperDepth ?? 2;
    this.injectHoneypot = options.injectHoneypot ?? true;
    this.addDecoyAttributes = options.addDecoyAttributes ?? true;

    // Active honeypot tokens register: token -> { issuedAt, expiresAt }
    this.activeHoneypotTokens = new Map();

    // Telemetry: average mutation metrics
    this.metrics = {
      totalMutations: 0,
      totalDurationMs: 0,
      lastMutationDurationMs: 0
    };
  }

  /**
   * Issue and track a new ephemeral honeypot token
   * @returns {string} Unique token
   */
  generateHoneypotToken() {
    const token = 'ghst_' + crypto.randomBytes(8).toString('hex');
    const now = Date.now();
    this.activeHoneypotTokens.set(token, {
      issuedAt: now,
      expiresAt: now + 10 * 60 * 1000 // 10 minutes TTL
    });

    // Cleanup expired tokens periodically
    if (this.activeHoneypotTokens.size > 2000) {
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
    const prefixes = ['g_', 'c_', 'v_', 'z_'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const hash = crypto.randomBytes(4).toString('hex');
    return `${prefix}${hash}`;
  }

  /**
   * PHASE 1: Build dynamic class mapping for this specific request.
   * Every original class maps to a unique random token.
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
   * Preserves all selectors, properties, media queries, and pseudo-classes.
   * @param {string} css Raw CSS stylesheet content
   * @param {Record<string, string>} classMap Mapping from original to obfuscated class
   * @returns {string} Obfuscated CSS
   */
  rewriteCSS(css, classMap) {
    let rewritten = css;

    // Sort classes by length descending so longer compound names are replaced before substrings
    const sortedClasses = Object.keys(classMap).sort((a, b) => b.length - a.length);

    for (const originalClass of sortedClasses) {
      const randomizedClass = classMap[originalClass];
      // Regex matches dot followed by class name with negative lookahead for hyphen/word chars
      // Ensures .price matches, but .price-tag or 0.5s are not corrupted
      const selectorRegex = new RegExp(`\\.(${originalClass})(?![a-zA-Z0-9_-])`, 'g');
      rewritten = rewritten.replace(selectorRegex, `.${randomizedClass}`);
    }

    // Add helper utility for ghost-wrappers ensuring zero visual layout shift
    rewritten += `\n/* [GhostDOM Injected Reset Rules] */\n.g-wrapper, [data-ghost-wrap] { display: contents !important; }\n`;

    return rewritten;
  }

  /**
   * PHASE 3: Tag Hierarchy Mutation
   * Randomly wrap target elements in harmless <div>/<span> wrappers with display: contents.
   * Scraping queries relying on parent-child combinators (e.g. .product-card > .price) break immediately.
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   */
  mutateHierarchy($) {
    const candidateSelectors = ['.product-title', '.price', '.stock', '.product-category', '.product-meta'];

    candidateSelectors.forEach(sel => {
      $(sel).each((_, el) => {
        // Randomly decide whether to wrap and how many layers (1 to wrapperDepth)
        const depth = Math.floor(Math.random() * this.wrapperDepth) + 1;
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
   * Adds dummy data-* attributes to disrupt selector heuristics and reorders attributes.
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   */
  shuffleAndAddDecoyAttributes($) {
    if (!this.addDecoyAttributes) return;

    $('*').each((_, el) => {
      // Apply to ~40% of elements to keep DOM lean while noisy
      if (Math.random() > 0.6 && el.type === 'tag' && el.name !== 'html' && el.name !== 'head' && el.name !== 'body' && el.name !== 'script' && el.name !== 'style') {
        const decoyKeys = ['data-item-hash', 'data-v-rendered', 'data-ghost-ref', 'data-ui-key', 'data-sig'];
        const randomKey = decoyKeys[Math.floor(Math.random() * decoyKeys.length)];
        const randomVal = crypto.randomBytes(3).toString('hex');
        
        if (!el.attribs) el.attribs = {};
        el.attribs[randomKey] = randomVal;
      }
    });
  }

  /**
   * PHASE 5: Honeypot Injection
   * Injects hidden decoy elements that LITERALLY USE THE ORIGINAL UNMUTATED SELECTORS (.price, .product-card).
   * Bots querying for the old fixed selectors will extract the decoy data or trigger the honeypot link.
   * Humans cannot see these nodes as they are placed off-screen and set to display: none.
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {string} honeypotToken Unique token for this request
   */
  injectHoneypotTraps($, honeypotToken) {
    if (!this.injectHoneypot) return;

    // Invisible decoy container
    const honeypotHtml = `
      <div class="product-card ghost-honeypot-trap" 
           style="display:none!important;visibility:hidden!important;position:absolute!important;left:-99999px!important;top:-99999px!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;" 
           aria-hidden="true" 
           data-ghostdom-trap="true">
        <div class="product-info">
          <span class="product-category">Exclusive Crawler Deal</span>
          <h3 class="product-title">Decoy VIP Crawler Bait - Automated Bot Trap</h3>
          <div class="product-meta">
            <!-- Naive scraper querying '.price' will scrape this fake $0.00 price instead of real products -->
            <span class="price">$0.00</span>
            <span class="stock in-stock">Instant Trap</span>
          </div>
          <a href="/honeypot/trap?token=${honeypotToken}&source=decoy_anchor" class="btn btn-primary add-to-cart" tabindex="-1" rel="nofollow">
            Claim Exclusive Scraper Deal
          </a>
        </div>
      </div>
    `;

    // Insert decoy into the product grid if available, otherwise append to body
    const grid = $('.product-grid');
    if (grid.length > 0) {
      // Randomly inject either at the beginning, middle, or end of the grid
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

    // Also plant a subtle zero-pixel invisible anchor tag elsewhere in the page
    const silentTrap = `
      <a href="/honeypot/trap?token=${honeypotToken}&source=silent_link" 
         style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" 
         tabindex="-1" 
         aria-hidden="true" 
         rel="nofollow"></a>
    `;
    $('body').append(silentTrap);
  }

  /**
   * PHASE 6: Apply Class Obfuscation to HTML Elements
   * Replaces target classes on real elements with the generated polymorphic aliases.
   * @param {cheerio.CheerioAPI} $ Cheerio instance
   * @param {Record<string, string>} classMap 
   */
  applyClassObfuscation($, classMap) {
    $('[class]').each((_, el) => {
      // Skip honeypot elements so they continue to lure scrapers using the old selectors!
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
   * Takes raw HTML and raw CSS, applies the entire polymorphism pipeline, and returns
   * the mutated HTML with the rewritten CSS inlined atomically.
   * 
   * @param {string} html Raw HTML page content
   * @param {string} css Raw CSS stylesheet content
   * @returns {{ mutatedHtml: string, classMap: Record<string, string>, durationMs: number, honeypotToken: string }}
   */
  mutate(html, css) {
    const startTime = performance.now();

    // 1. Generate unique class map & honeypot token
    const classMap = this.createClassMap();
    const honeypotToken = this.generateHoneypotToken();

    // 2. Load DOM tree using Cheerio
    const $ = cheerio.load(html, {
      decodeEntities: false
    });

    // 3. Mutate tag hierarchy (inject display:contents wrappers)
    this.mutateHierarchy($);

    // 4. Inject Honeypots (BEFORE obfuscation so traps retain original selector names)
    this.injectHoneypotTraps($, honeypotToken);

    // 5. Add decoy attributes & noise
    this.shuffleAndAddDecoyAttributes($);

    // 6. Obfuscate HTML class attributes for legitimate elements
    this.applyClassObfuscation($, classMap);

    // 7. Rewrite CSS to match the obfuscated classes
    const mutatedCss = this.rewriteCSS(css, classMap);

    // 8. Replace external CSS link with atomic inlined <style> tag
    // This eliminates race conditions: HTML and CSS arrive in a single unified payload
    $('link[rel="stylesheet"][data-ghostdom-target="true"]').remove();
    $('head').append(`\n<style id="ghostdom-polymorphic-css" data-gen="${Date.now()}">\n${mutatedCss}\n</style>\n`);

    // 9. Add metadata watermark for presentation / debug verification
    $('body').attr('data-ghostdom-active', 'true');
    $('body').attr('data-ghostdom-signature', crypto.randomBytes(6).toString('hex'));

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
      honeypotToken
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
      lastDurationMs: this.metrics.lastMutationDurationMs
    };
  }
}

module.exports = GhostDomMutator;
