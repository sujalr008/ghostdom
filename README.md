# 👻 GhostDOM v3.0 — Server-Side DOM Polymorphism & Honeypot Bot Defense

> **Live Event Presentation Kit & Production Prototype**  
> An adversarial server-side middleware for Node.js/Express that rewrites an e-commerce website's HTML/CSS structure on **every single HTTP transaction**. The storefront (**BROKART**) appears visually identical and pixel-perfect to human shoppers, while breaking automated scrapers that depend on fixed selectors (like `.product-card` and `.price`) and poisoning bot datasets with believable decoy prices.

---

## 📁 Final Project Folder Structure

```text
GHOST DOM/
├── data/
│   └── products.json              # 8 authentic electronics & hardware products
├── middleware/
│   ├── ghostdom.js                # Express middleware, token GC, bot telemetry, event stream
│   └── mutator.js                 # AST polymorphic engine (leaf-only wrappers, atomic CSS, honeypots)
├── public/
│   ├── css/
│   │   ├── dashboard.css          # DARK THEME: Command Deck, canvas sparkline, keyboard pills
│   │   └── style.css              # LIGHT THEME: BROKART storefront, entrance animations, system fonts
│   └── js/
│       └── dashboard.js           # XSS-safe telemetry, Web Audio siren, Canvas chart, hotkeys, Demo Mode
├── scraper/
│   └── scraper.py                 # Naive Python scraper demo (succeeds OFF, trapped/poisoned ON)
├── tests/
│   ├── audit_tests.js             # Automated verification suite (7 checks, zero network dependencies)
│   └── playwright_audit.spec.js   # Playwright E2E browser rendering & security spec
├── views/
│   ├── dashboard.html             # Presentation Command Deck UI (100% offline)
│   └── index.html                 # BROKART Storefront UI (100% offline)
├── package.json                   # Project manifest & npm scripts
├── README.md                      # Comprehensive stage guide, Q&A, and fallback plan
└── requirements.txt               # Python scraper dependencies (requests, beautifulsoup4)
```

---

## 🚀 One-Command Setup & Execution

### 1. Installation
```bash
# Install Node dependencies
npm install

# (Optional) Install Python scraper dependencies
pip install -r requirements.txt
```

### 2. Run the Server
```bash
npm start
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 7 automated audit checks in `tests/audit_tests.js` (DOM parity, class entropy, honeypot invisibility, scraper neutralization, and false-positive prevention).*

### 4. Application URLs
- 🛒 **BROKART Storefront (LIGHT THEME)**: [http://localhost:3000/](http://localhost:3000/)
- 🛡️ **GhostDOM Command Deck (DARK THEME)**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🎨 Dual-Theme Visual Architecture

1. **BROKART Storefront (LIGHT THEME)**:
   - Modern retail shop with a clean white/soft-slate background (`#f8fafc`).
   - Deep navy text (`#0f172a`), vibrant retail orange accent (`#ea580c`), responsive navigation, visual search bar, category chips, rating stars, and stock badges.
   - Smooth entrance animations and zero layout shift under polymorphism.
2. **GhostDOM Command Deck (DARK THEME)**:
   - Cyber-defense control room with a near-black background (`#07090f`).
   - Neon green (`#10b981`), cyan (`#06b6d4`), and alert red (`#ef4444`) telemetry.
   - Side-by-side split: **"What the Human Sees"** vs **"What the Bot Sees"**.
   - Offline real-time HTML5 `<canvas>` sparkline chart of mutation latency.
   - Terminal-style live security event stream.

---

## ⚡ Multi-Tier Defense: Normal vs Aggressive Mode

| Feature | GhostDOM OFF | Normal Mode (ON) | Aggressive Mode (Trapped) |
| :--- | :--- | :--- | :--- |
| **CSS Selectors** | Static (`.product-card`, `.price`) | Transient random hashes (`.c_8f91a`) | Regenerated on every request |
| **Tag Hierarchy** | Static standard DOM | Non-semantic leaf wrappers (`display: contents`) | Multi-depth nested leaf wrappers |
| **Honeypot Traps** | None | 1 Stealth off-screen trap (`$0.00`) | 8 Decoy traps with believable prices |
| **Data Poisoning** | None | Neutralized | Active: feeds plausible false pricing (`$9.99`, `$14.50`) |
| **Scraper Outcome**| **SUCCESS (8/8 extracted)** | **FAILED (0 extracted, IP logged)** | **POISONED (dataset polluted)** |

---

## ⌨️ Presenter Keyboard Shortcuts

Control the live stage demo directly using your keyboard:

| Key | Action | Description |
| :---: | :--- | :--- |
| **`S`** | **▶ Run Scraper** | Benchmarks naive scraper against current active defense |
| **`B`** | **⚡ Simulate Bot** | Triggers instant reaction: Flashing skull banner + Web Audio alarm |
| **`T`** | **🛡️ Toggle Shield** | Toggles GhostDOM master state (`ACTIVE` vs `BYPASSED`) |
| **`R`** | **↺ Reset Demo** | Restores clean state, resets blocklist, and clears event logs |

---

## 🎤 2-Minute Stage Walkthrough Script

### Act 1: The Vulnerability (GhostDOM OFF) — 30 Seconds
1. Open the **Command Deck** at `http://localhost:3000/dashboard`.
2. Press **`T`** (or toggle the master switch) to set GhostDOM to **BYPASSED**.
3. Press **`S`** (or click **"Run Scraper"**).
4. **Takeaway:** Terminal outputs **GREEN SUCCESS: Extracted 8 legitimate products in 18ms**.  
   *Say: "A competitor crawler scraped our entire inventory and pricing before our page even finished rendering for humans."*

### Act 2: Activate GhostDOM (Human vs Bot Contrast) — 30 Seconds
1. Press **`T`** to set GhostDOM back to **ACTIVE**.
2. Direct audience to the **Side-by-Side Comparison**:
   - **Left Panel (Human View):** BROKART is pixel-perfect, responsive, and clean.
   - **Right Panel (Bot View):** Every selector is randomized (`.g_a8f1`), tag wrappers are mutated, and classes change every reload.
   - **Average Overhead:** Point to the real-time canvas chart showing ~1.18ms latency.
3. Press **`S`** to run the scraper: It fails immediately with **0 real prices extracted**.  
   *Say: "To human shoppers, nothing changed. To scrapers, every single CSS selector is an encrypted moving target."*

### Act 3: Instant Reaction & Aggressive Data Poisoning — 45 Seconds
1. Press **`B`** (or click **"⚡ Simulate Bot"**).
2. **The Climax:**
   - Big flashing red alert banner appears: **`☠ BOT DETECTED ☠`** with pulsing skull and Web Audio siren!
   - System automatically elevates: **NORMAL MODE $\rightarrow$ AGGRESSIVE MODE**.
   - Terminal logs: `Switching client 127.0.0.1 to AGGRESSIVE MODE` & `Deploying 8 decoy pricing honeypots`.
3. Press **`S`** to run the scraper again:  
   - Terminal shows **DATA POISONING IN PROGRESS**: Crawler harvests fake clearance prices (`$9.99`, `$14.50`, `$499.00`).  
   *Say: "GhostDOM doesn't just block scrapers—it poisons their downstream price-matching models with false data, and quarantines their IP with zero CAPTCHA friction for humans."*
4. Press **`R`** to reset the demo cleanly.

---

## 📋 Pre-Event Checklist (10 Minutes Before Going on Stage)

- [ ] **No Internet Test:** Disconnect Wi-Fi and verify `http://localhost:3000/` and `http://localhost:3000/dashboard` render instantly without hanging (both pages use native system fonts, 0 CDN scripts).
- [ ] **Audio Unlock:** Click once anywhere on the dashboard so browser policies allow the Web Audio API synthesizer to fire when the bot alarm sounds.
- [ ] **Screen Resolution / Zoom:** Set browser zoom to 90% or 100% on the projector display so both panels and stat cards fit comfortably in view.
- [ ] **Terminal Window:** If demonstrating via terminal, have a PowerShell or bash window open with `py scraper/scraper.py` (or `python scraper/scraper.py`) queued up.
- [ ] **Run Sanity Audit:** Run `npm test` in the terminal to verify all 7 checks pass with green ticks.

---

## 🛟 Fallback Plan (If Anything Breaks Live on Stage)

| Failure Scenario | Fallback Action |
| :--- | :--- |
| **Port 3000 already in use** | Set `PORT=3050 node server.js` and open `http://localhost:3050/dashboard`. |
| **Python command hijacked on Windows** | Use `py scraper/scraper.py` instead of `python`, OR simply use the built-in dashboard button `Run Scraper [S]`, which simulates the exact same query in-browser. |
| **Audio siren doesn't sound** | Browser autoplay policy requires an initial click. Click anywhere on the dashboard or dismiss the alert once to unlock audio. |
| **Browser cache freezes demo state** | Click **"↺ Reset Demo [R]"** on the dashboard. The server forces `Cache-Control: no-store` on all mutated payloads. |
| **Hardware / Machine failure** | Use the pre-recorded 90-second screen capture in your backup slide deck showing the dashboard transition and terminal logs. |

---

## 🛡️ 8 Tough Questions Judges Might Ask (With Honest Technical Answers)

### Q1: Can't an attacker bypass this by using OCR or Multimodal AI (Vision LLMs) on browser screenshots?
> **Honest Answer:** Yes. An attacker can run a headless browser, take a screenshot, and use computer vision or a Multimodal LLM (e.g. GPT-4o Vision) to extract the prices.  
> **The Defense Reality:** GhostDOM's goal is **economic asymmetry**. A standard HTTP GET scraper costs \$0.00001 per request and takes 15ms. Headless browser rendering + computer vision inference costs \$0.01 to \$0.03 per page and takes 2,000ms. GhostDOM increases scraping compute and dollar costs by **over 1,000x**, rendering mass-scale, high-frequency crawling economically unviable.

### Q2: Doesn't server-side mutation destroy edge caching (Cloudflare / Fastly CDN)?
> **Honest Answer:** Individual per-request mutation does require dynamic origin responses (`Cache-Control: no-store`).  
> **Production Solution:** At scale, GhostDOM is deployed directly into Edge Workers (Cloudflare Workers / Fastly Compute@Edge). Alternatively, the edge pre-generates a pool of 50 distinct polymorphic variants with short 60-second TTLs, serving randomized cached variants to different users. This retains high CDN cache-hit ratios while maintaining unpredictable selector entropy for crawlers.

### Q3: Does tag hierarchy mutation and extra wrapper injection break accessibility (screen readers / WCAG)?
> **Honest Answer:** No. GhostDOM v3.0 only wraps leaf text nodes (`.product-title`, `.price`) using non-semantic wrapper tags styled with `display: contents !important;`, which completely dissolves the wrapper from the visual box model and accessibility tree. Furthermore, all honeypot elements strictly carry `aria-hidden="true"` and `tabindex="-1"`, guaranteeing they are never read by screen readers or focused by keyboard navigation.

### Q4: How do you prevent search engine crawlers (Googlebot, Bingbot) from being trapped and de-indexing your catalog?
> **Honest Answer:** We use two robust mechanisms:
> 1. `robots.txt` explicitly disallows `/honeypot/`, which all legitimate search crawlers strictly obey.
> 2. Verified search engine IP ranges (validated via reverse-DNS lookups on `*.googlebot.com`) are either exempt from honeypot triggers or served standardized Schema.org JSON-LD microdata, which Google uses directly for search indexing regardless of CSS class names.

### Q5: What if a bot uses relative or structural XPath (e.g. `//div[@class="container"]/div[1]`) instead of CSS classes?
> **Honest Answer:** That is precisely why GhostDOM includes Tag Hierarchy Mutation. By wrapping elements in randomized, variable-depth `<div>` and `<span>` layers and inserting decoy DOM attributes, rigid structural XPaths (like `div[1]/h3`) fail because the child index and depth change unpredictably between requests.

### Q6: What is the server CPU and latency overhead of running AST mutation on every request?
> **Honest Answer:** In our benchmarks, parsing and mutating an 8-product e-commerce DOM takes **between 1.0ms and 1.5ms** on a single Node.js thread using Cheerio. In a compiled Rust or Go edge worker (e.g., using Cloudflare's `lol-html` streaming rewriter), latency drops to **sub-0.2ms**, resulting in zero perceptible impact on Time to First Byte (TTFB).

### Q7: What stops a bot from filtering out honeypots by checking computed styles (e.g. `display: none` or off-screen position)?
> **Honest Answer:** Traditional lightweight crawlers (Python `requests`, Scrapy, BeautifulSoup) do not execute CSS engines and cannot calculate computed styles (`getComputedStyle`). For advanced headless browsers that do, GhostDOM can employ advanced zero-opacity overlays, CSS grid layer stacking, or identical z-index positioning where the honeypot element is mathematically positioned behind genuine products.

### Q8: Why feed poisoned data instead of simply returning an HTTP 403 Forbidden?
> **Honest Answer:** Returning HTTP 403 immediately alerts the bot operator that their scraper is detected, prompting them to rotate proxies, update selectors, or adapt. By silently feeding believable, false clearance prices (e.g., `$9.99`, `$14.50`), the competitor ingests corrupted data into their pricing models and automated price-matching engines without realizing they are compromised. It turns defense into counter-intelligence.
