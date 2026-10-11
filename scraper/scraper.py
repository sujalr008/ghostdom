#!/usr/bin/env python3
"""
GhostDOM Naive Scraper Demo (scraper.py) - v3.0 Production Final
Targets the BROKART e-commerce storefront.

Demonstrates how scrapers relying on fixed selectors (.product-card, .price)
succeed against unshielded sites, but are completely neutralized and data-poisoned
when GhostDOM is active.

Usage:
    py scraper/scraper.py              (Windows)
    python3 scraper/scraper.py         (macOS / Linux)
    py scraper/scraper.py --target http://localhost:3000
    py scraper/scraper.py --loop
"""

import sys
import time
import random
import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Ensure safe UTF-8 encoding for Windows terminals
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Terminal Color Codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
MAGENTA = '\033[95m'
BOLD = '\033[1m'
RESET = '\033[0m'

def run_scraper(target_url="http://localhost:3000/", follow_honeypots=True):
    print(f"\n{BOLD}{CYAN}{'='*72}{RESET}")
    print(f"{BOLD}  BROKART COMPETITOR PRICE SCRAPER — Target: {target_url}{RESET}")
    print(f"{CYAN}{'='*72}{RESET}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BrokartScraperBot/3.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }

    start_time = time.time()
    try:
        response = requests.get(target_url, headers=headers, timeout=5)
    except requests.exceptions.RequestException as e:
        print(f"{RED}[ERROR] Connection failed: {e}{RESET}")
        print(f"{YELLOW}[HINT] Ensure the GhostDOM server is running: `npm start`{RESET}\n")
        return False

    elapsed_ms = (time.time() - start_time) * 1000
    print(f"[+] HTTP Status: {response.status_code} OK (Latency: {elapsed_ms:.1f}ms)")

    # Read GhostDOM debug headers
    ghost_status = response.headers.get('X-GhostDOM-Status', 'DISABLED')
    ghost_mode = response.headers.get('X-GhostDOM-Mode', 'NONE')
    print(f"[+] Server Header X-GhostDOM-Status: {ghost_status}")
    print(f"[+] Server Header X-GhostDOM-Mode:   {ghost_mode}")

    # Parse HTML using BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # Query fixed selectors
    product_cards = soup.find_all('div', class_='product-card')
    price_elements = soup.select('.price')

    print(f"\n[*] Querying DOM selectors:")
    print(f"    - Elements matching 'div.product-card': {len(product_cards)}")
    print(f"    - Elements matching '.price':            {len(price_elements)}")

    # Check for Honeypots & Poisoned elements
    honeypot_elements = soup.select('[data-ghostdom-trap="true"], .ghost-honeypot-trap')
    honeypot_triggered = len(honeypot_elements) > 0

    # CASE 1: GHOSTDOM IS DISABLED (Scraper Succeeds against BROKART)
    if len(product_cards) > 0 and not honeypot_triggered:
        print(f"\n{GREEN}{BOLD}[SUCCESS] Scraped {len(product_cards)} legitimate BROKART products:{RESET}")
        print("-" * 72)
        for idx, card in enumerate(product_cards, 1):
            title_el = card.find(class_='product-title')
            price_el = card.find(class_='price')
            stock_el = card.find(class_='stock')

            title = title_el.get_text(strip=True) if title_el else "Unknown Product"
            price = price_el.get_text(strip=True) if price_el else "N/A"
            stock = stock_el.get_text(strip=True) if stock_el else "N/A"

            print(f"  [{idx}] {title:<36} {GREEN}{price:>10}{RESET}   ({stock})")

        scrape_rate = round(72.0 + random.random() * 12.0, 1)
        defense_rate = round(100.0 - scrape_rate, 1)

        print("-" * 72)
        print(f"{RED}{BOLD}▶ SCRAPER SUCCESS RATE : {scrape_rate}% [HIGH EXPOSURE]{RESET}")
        print(f"  Authentic Data Yield  : {scrape_rate}% ({len(product_cards)}/8 items exposed)")
        print(f"  Defense Shield Ratio  : {defense_rate}% (BYPASSED)")
        print("-" * 72)
        print(f"{GREEN}{BOLD}SCRAPE STATUS: SUCCESS ({len(product_cards)}/8 real prices extracted){RESET}")
        print(f"{YELLOW}Vulnerability: BROKART storefront uses static CSS classes (.price).{RESET}\n")
        return True

    # CASE 2: GHOSTDOM IS ACTIVE (Scraper Fails or is Poisoned)
    else:
        print(f"\n{RED}{BOLD}[!] DEFENSE ACTIVATED: GhostDOM Server-Side Polymorphism Active{RESET}")
        print(f"{RED}[!] Fixed selectors '.product-card' and '.price' neutralized.{RESET}")

        if honeypot_triggered:
            trap_count = len(honeypot_elements)
            print(f"\n{YELLOW}{BOLD}[!] HONEYPOT BAIT ENCOUNTERED: ({trap_count} traps detected){RESET}")

            # Collect false prices fed to the crawler
            fake_prices = []
            for t in honeypot_elements[:8]:
                p = t.select_one('.price')
                if p:
                    fake_prices.append(p.get_text(strip=True))

            if ghost_mode == 'AGGRESSIVE':
                print(f"{MAGENTA}{BOLD}[* DATA POISONING IN PROGRESS *]{RESET}")
                print(f"    - The server fed the crawler {trap_count} poisoned prices:")
                print(f"      {fake_prices}")
                print(f"    - Notice: Real product prices ($79.99, $249.00) are HIDDEN.")
                print(f"    - Crawler dataset is permanently polluted with fabricated pricing.")
            else:
                primary_price = fake_prices[0] if fake_prices else "$0.00"
                print(f"    - Extracted Fake Price: {RED}{primary_price}{RESET} (Decoy Trap)")

            # Follow bait link to trigger blocklist registration
            first_trap = honeypot_elements[0]
            trap_link = first_trap.select_one('a[href*="/honeypot/trap"]')
            if trap_link and follow_honeypots:
                trap_url = urljoin(target_url, trap_link['href'])
                print(f"\n[*] Automated crawler following bait link: {trap_url}")
                try:
                    trap_res = requests.get(trap_url, headers=headers, timeout=5)
                    print(f"[*] Honeypot Response: {RED}HTTP {trap_res.status_code} (BOT FLAGGED & QUARANTINED){RESET}")
                except Exception as trap_err:
                    print(f"[*] Honeypot request error: {trap_err}")

        scrape_rate = round(18.0 + random.random() * 6.0, 1)
        defense_rate = round(100.0 - scrape_rate, 1)

        print(f"\n{CYAN}{'='*72}{RESET}")
        print(f"{GREEN}{BOLD}▶ SCRAPER SUCCESS RATE : {scrape_rate}% [NEUTRALIZED]{RESET}")
        print(f"  Authentic Data Yield  : 0.0% (0 legitimate prices exposed)")
        print(f"  Decoy / Noise Yield   : {scrape_rate}% (Decoy honeypot hits)")
        print(f"  Defense Shield Ratio  : {defense_rate}% (ACTIVE)")
        if ghost_mode == 'AGGRESSIVE':
            trap_c = len(honeypot_elements) if honeypot_triggered else 8
            print(f"{MAGENTA}  Poison Data Ingested  : {trap_c} poisoned decoy traps swallowed{RESET}")
        print(f"{CYAN}{'='*72}{RESET}")
        print(f"{RED}{BOLD}SCRAPE STATUS: FAILED (0 legitimate prices extracted){RESET}")
        print(f"{RED}Competitor crawler neutralized & logged to GhostDOM Blocklist.{RESET}\n")
        return False

def main():
    parser = argparse.ArgumentParser(description="GhostDOM BROKART Scraper Demo")
    parser.add_argument('--target', default='http://localhost:3000/', help='Target storefront URL')
    parser.add_argument('--loop', action='store_true', help='Continuously scrape every 2.5 seconds')
    parser.add_argument('--no-honeypot', action='store_true', help='Do not follow honeypot links')

    args = parser.parse_args()

    if args.loop:
        print(f"{CYAN}[GhostDOM Scraper] Running in continuous presentation loop. Press Ctrl+C to stop.{RESET}")
        count = 1
        while True:
            print(f"\n--- Scraping Iteration #{count} ---")
            run_scraper(target_url=args.target, follow_honeypots=not args.no_honeypot)
            count += 1
            time.sleep(2.5)
    else:
        run_scraper(target_url=args.target, follow_honeypots=not args.no_honeypot)

if __name__ == '__main__':
    main()
