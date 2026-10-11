/**
 * GhostDOM Mutation Engine (mutator.js) - v3.0 Production Final
 * 
 * Strict QA & Security Fixes Applied:
 * 1. Safe Tag Hierarchy Mutation: Only wraps leaf/text nodes (.price, .product-title, .stock).
 *    Never wraps layout containers (.product-meta, .product-card) to guarantee zero layout shift.
 * 2. Bulletproof CSS Obfuscation: Preserves property values, pseudo-classes, and media queries.
 * 3. 100% Inaudible & Invisible Honeypots: aria-hidden="true", tabindex="-1", zero layout footprint.
 * 4. Believable Data Poisoning Engine in Aggressive Mode.
 */

const crypto = require('crypto');
const cheerio = require('cheerio');

class GhostDomMutator {
  constructor(options = {}) {
    // Definitive list of target class selectors for polymorphic aliasing
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
      'product-actions',
      'category-chip',
      'deal-circle-badge'
    ];

    this.mode = options.mode || 'NORMAL';
    this.activeHoneypotTokens = new Map();

    // Believable pricing decoys for Data Poisoning in Aggressive Mode
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

    this.metrics = {
      totalMutations: 0,
      totalDurationMs: 0,
      lastMutationDurationMs: 0
    };
  }

  setMode(mode) {
    this.mode = mode === 'AGGRESSIVE' ? 'AGGRESSIVE' : 'NORMAL';
    return this.mode;
  }

  generateHoneypotToken(mode = 'NORMAL') {
    const token = 'ghst_' + crypto.randomBytes(8).toString('hex');
    const now = Date.now();
    this.activeHoneypotTokens.set(token, {
      issuedAt: now,
      expiresAt: now + 10 * 60 * 1000,
      mode
    });

    // Prune stale tokens
    if (this.activeHoneypotTokens.size > 2000) {
      for (const [t, data] of this.activeHoneypotTokens.entries()) {
        if (data.expiresAt < now) this.activeHoneypotTokens.delete(t);
      }
    }
    return token;
  }

  verifyHoneypotToken(token) {
    if (!token) return false;
    const entry = this.activeHoneypotTokens.get(token);
    if (!entry) return false;
    return entry.expiresAt > Date.now();
  }

  generateRandomClassName() {
    const prefixes = ['g_', 'c_', 'v_', 'z_', 'k_'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const hash = crypto.randomBytes(4).toString('hex');
    return `${prefix}${hash}`;
  }

  createClassMap() {
    const map = {};
    for (const originalClass of this.targetClasses) {
      map[originalClass] = this.generateRandomClassName();
    }
    return map;
  }

  rewriteCSS(css, classMap) {
    let rewritten = css;
    const sortedClasses = Object.keys(classMap).sort((a, b) => b.length - a.length);

    for (const originalClass of sortedClasses) {
      const randomizedClass = classMap[originalClass];
      // Regex ensures we only replace selector class identifiers
      const selectorRegex = new RegExp(`\\.(${originalClass})(?![a-zA-Z0-9_-])`, 'g');
      rewritten = rewritten.replace(selectorRegex, `.${randomizedClass}`);
    }

    // Essential reset utility for wrapper injection: display: contents dissolves the box
    rewritten += `\n/* [GhostDOM Polymorphic Resets] */\n.g-wrapper, [data-ghost-wrap] { display: contents !important; }\n`;
    return rewritten;
  }

  /**
   * Mutate Tag Hierarchy: ONLY wraps leaf/content elements.
   * FIX: Never wraps layout containers (.product-meta, .product-card) to prevent flex layout collapse.
   */
  mutateHierarchy($, effectiveMode = 'NORMAL') {
    const maxDepth = effectiveMode === 'AGGRESSIVE' ? 3 : 2;
    // Strict leaf node selection
    const safeLeafSelectors = ['.product-title', '.price', '.stock', '.product-category', '.product-desc', '.price-original'];

    safeLeafSelectors.forEach(sel => {
      $(sel).each((_, el) => {
        // Skip elements inside honeypot traps
        if ($(el).closest('.ghost-honeypot-trap').length > 0) return;

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

  shuffleAndAddDecoyAttributes($, effectiveMode = 'NORMAL') {
    const probability = effectiveMode === 'AGGRESSIVE' ? 0.7 : 0.35;

    $('*').each((_, el) => {
      if (Math.random() < probability && el.type === 'tag' && !['html', 'head', 'body', 'script', 'style'].includes(el.name)) {
        const decoyKeys = ['data-item-hash', 'data-v-rendered', 'data-ghost-ref', 'data-ui-key', 'data-render-id'];
        const randomKey = decoyKeys[Math.floor(Math.random() * decoyKeys.length)];
        const randomVal = crypto.randomBytes(3).toString('hex');
        
        if (!el.attribs) el.attribs = {};
        el.attribs[randomKey] = randomVal;
      }
    });
  }

  /**
   * Injects Honeypot Traps with rigorous accessibility & invisibility guarantees:
   * - aria-hidden="true" (screen readers ignore)
   * - tabindex="-1" on interactive elements (keyboard users cannot focus)
   * - pointer-events: none, width: 0, height: 0, overflow: hidden, position: absolute (zero visual trace)
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
             style="display:none!important;visibility:hidden!important;position:absolute!important;left:-99999px!important;top:-99999px!important;width:0!important;height:0!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important;" 
             aria-hidden="true" 
             data-ghostdom-trap="true"
             data-poisoned="${effectiveMode === 'AGGRESSIVE'}">
          <div class="product-info">
            <span class="product-category">Clearance Decoy</span>
            <h3 class="product-title">${decoy.title}</h3>
            <div class="product-meta">
              <span class="price">${decoy.price}</span>
              <span class="stock in-stock">${decoy.stock}</span>
            </div>
            <a href="/honeypot/trap?token=${honeypotToken}&source=decoy_anchor&idx=${index}" class="btn-add-cart add-to-cart" tabindex="-1" rel="nofollow noopener" aria-hidden="true">
              Claim Automated Deal
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

    // Zero-pixel hidden trap for crawlers extracting all links
    const silentTrap = `
      <a href="/honeypot/trap?token=${honeypotToken}&source=silent_link" 
         style="position:absolute;width:0;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;" 
         tabindex="-1" 
         aria-hidden="true" 
         rel="nofollow noopener"></a>
    `;
    $('body').append(silentTrap);

    return {
      count: trapsToInject.length,
      poisonedPrices: injectedPrices
    };
  }

  applyClassObfuscation($, classMap) {
    $('[class]').each((_, el) => {
      // Never obfuscate classes on honeypots so they lure naive .price scrapers
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

  mutate(html, css, overrideOptions = {}) {
    const startTime = performance.now();
    const effectiveMode = overrideOptions.mode || this.mode;
    const seed = crypto.randomBytes(3).toString('hex');

    const classMap = this.createClassMap();
    const honeypotToken = this.generateHoneypotToken(effectiveMode);

    const $ = cheerio.load(html, { decodeEntities: false });

    // 1. Tag hierarchy mutation on leaf nodes
    this.mutateHierarchy($, effectiveMode);

    // 2. Inject honeypot traps (BEFORE class obfuscation so traps retain .price)
    const { count, poisonedPrices } = this.injectHoneypotTraps($, honeypotToken, effectiveMode);

    // 3. Permute and add decoy attributes
    this.shuffleAndAddDecoyAttributes($, effectiveMode);

    // 4. Obfuscate human element class attributes
    this.applyClassObfuscation($, classMap);

    // 5. Rewrite CSS to match obfuscated classes
    const mutatedCss = this.rewriteCSS(css, classMap);

    // 6. Invalidate external stylesheet and inline atomic polymorphic styles
    $('link[rel="stylesheet"][data-ghostdom-target="true"], link[rel="stylesheet"][href*="style.css"]').remove();
    $('head').append(`\n<style id="ghostdom-polymorphic-css" data-seed="${seed}">\n${mutatedCss}\n</style>\n`);

    // 7. Watermark signature
    $('body').attr('data-ghostdom-active', 'true');
    $('body').attr('data-ghostdom-mode', effectiveMode);
    $('body').attr('data-ghostdom-seed', seed);

    const endTime = performance.now();
    const durationMs = parseFloat((endTime - startTime).toFixed(2));

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
