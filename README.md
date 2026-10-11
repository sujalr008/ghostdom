# 👻 GhostDOM v2.0 — Server-Side DOM Polymorphism & Bot Defense for BROKART

> **Live Event Prototype & Presentation Kit**  
> An adversarial server-side middleware for Node.js/Express that mutates the HTML/CSS structure of the **BROKART** e-commerce shop on **every single HTTP transaction**. The store appears visually identical and pixel-perfect to human shoppers, while breaking scrapers and feeding poisoned pricing data to bots.

---

## 🎨 Dual-Theme Architecture
- 🛒 **BROKART Storefront (LIGHT THEME)**: Modern retail shop with a clean white/soft-grey background (`#f8fafc`), dark text, vibrant retail orange accent (`#ea580c`), search bar, category chips, stock badges, and 8 products.
- 🛡️ **GhostDOM Command Deck (DARK THEME)**: Cyber-defense control deck with a near-black background (`#07090f`), neon green/cyan/red telemetry, side-by-side human vs bot inspector, real-time terminal event logging, and an instant-reaction flashing red alert banner with Web Audio synthesizer alarms.

---

## ⚡ Multi-Tier Defense: Normal vs Aggressive Mode
1. **NORMAL MODE**:
   - Class name aliasing (`price` $\rightarrow$ `c_8f91a`)
   - Non-semantic tag hierarchy wrappers (`display: contents;`)
   - Baseline stealth honeypot traps with `$0.00` bait.
2. **AGGRESSIVE MODE** *(Activated automatically when a bot is detected)*:
   - Re-randomizes CSS classes and tag hierarchy on **every single request**
   - **Honeypot density multiplies from 2 to 10 traps**
   - **Believable Data Poisoning**: Feeds fake, plausible prices (`$9.99`, `$14.50`, `$499.00`, `$4.99`, `$1.99`) to fixed `.price` queries, polluting and corrupting the competitor's database.

---

## 🚀 Quickstart & Run Commands

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Launch the server
npm start
```

URLs:
- **BROKART Storefront (Light Theme)**: [http://localhost:3000/](http://localhost:3000/)
- **GhostDOM Command Deck (Dark Theme)**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

To run the competitor scraper:
```bash
python scraper/scraper.py
```

---

## 🎤 2-Minute Stage Walkthrough Script (Presenter Guide)

Follow these exact steps when presenting GhostDOM live on stage:

### Act 1: The Vulnerability (GhostDOM OFF) — 30s
1. Open the **Command Deck** at `http://localhost:3000/dashboard`.
2. Flip the **GhostDOM Master Toggle** to **OFF (Bypassed)**.
3. Open a second tab to **BROKART** (`http://localhost:3000/`). Show the clean e-commerce store with 8 products. Inspect element on a price tag to show the naive selector `.price`.
4. On the Dashboard, click **"Run Scraper Test"** (or run `python scraper/scraper.py` in your terminal).
5. **Audience Takeaway:** Terminal prints **GREEN SUCCESS (8/8 real prices extracted: $79.99, $249.00...)**.
   *Say: "In under 20 milliseconds, a competitor bot extracted our entire catalog, stock numbers, and pricing."*

### Act 2: Engage GhostDOM (Human vs Bot Contrast) — 45s
1. On the Command Deck, click the **Master Toggle to ON (ACTIVE)**.
2. Direct attention to the **Side-by-Side Comparison Panel**:
   - Point to the **Left Panel ("What the Human Sees")**: The clean light-themed BROKART store renders pixel-identical.
   - Point to the **Right Panel ("What the Bot Sees")**: The raw HTML has completely randomized class aliases (highlighted in red) and extra wrappers (in blue).
   - Point to the **Avg Overhead card**: ~1.2 ms AST mutation latency.
   *Say: "To human shoppers, nothing changed. To automated crawlers, every selector is an encrypted moving target."*

### Act 3: Instant Reaction & Aggressive Mode Poisoning — 45s
1. Click the big red button: **"⚡ Simulate Bot Attack"** (or run `python scraper/scraper.py`).
2. **The Climax:**
   - The dashboard erupts with a **big flashing red alert banner**: `☠ BOT DETECTED ☠` with a pulsing skull and a Web Audio siren sound!
   - Shows: Flagged IP, timestamp, and vector: *"Accessed hidden honeypot price"*.
   - The status indicator automatically escalates: **NORMAL MODE $\rightarrow$ AGGRESSIVE MODE**.
   - The **Terminal Event Stream** prints:
     ```text
     [12:01:05] ☠ HONEYPOT TRIGGERED - bot flagged: 127.0.0.1
     [12:01:05] Switching client to AGGRESSIVE MODE
     [12:01:06] Injected 8 decoy pricing honeypots & poisoned values
     ```
3. Run the scraper again: It extracts 8 completely fabricated prices (`$9.99`, `$14.50`, `$499.00`).
   *Say: "GhostDOM doesn't just block scrapers—it poisons their data with plausible fake pricing and quarantines their IP, all without a single annoying CAPTCHA."*
4. Click **"↺ Reset Demo"** to restore initial state instantly.
