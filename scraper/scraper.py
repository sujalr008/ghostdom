#!/usr/bin/env python3
"""
GhostDOM Naive Scraper Demo (scraper.py)

A standard web scraper written in Python using `requests` and `BeautifulSoup4`.
Demonstrates how automated scrapers rely on fixed CSS selectors (like `.product-card`, `.price`)
and how GhostDOM breaks this mechanism while trapping the crawler using honeypots.

Usage:
    python scraper/scraper.py
    python scraper/scraper.py --target http://localhost:3000
    python scraper/scraper.py --loop
"""

import sys
import time
import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Terminal Color Codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def run_scraper(target_url="http://localhost:3000/", follow_honeypots=True):
    print(f"\n{BOLD}{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}  NAIVE WEB SCRAPER — Target: {target_url}{RESET}")
    print(f"{CYAN}{'='*70}{RESET}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NaiveScraperBot/1.0',
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

    # Inspect headers for GhostDOM debug signature
    ghost_status = response.headers.get('X-GhostDOM-Status', 'UNKNOWN')
    print(f"[+] Server Header X-GhostDOM-Status: {ghost_status}")

    # Parse HTML using BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # Attempt to locate products using standard naive selector
    product_cards = soup.find_all('div', class_='product-card')
    price_elements = soup.select('.price')

    print(f"\n[*] Querying DOM selectors:")
    print(f"    - Elements matching 'div.product-card': {len(product_cards)}")
    print(f"    - Elements matching '.price':            {len(price_elements)}")

    # Check for Honeypot presence
    honeypot_elements = soup.select('[data-ghostdom-trap="true"], .ghost-honeypot-trap')
    honeypot_triggered = len(honeypot_elements) > 0

    # CASE 1: GHOSTDOM IS DISABLED (Scraper Succeeds)
    if len(product_cards) > 0 and not honeypot_triggered:
        print(f"\n{GREEN}{BOLD}[SUCCESS] Scraped {len(product_cards)} legitimate products:{RESET}")
        print("-" * 70)
        for idx, card in enumerate(product_cards, 1):
            title_el = card.find(class_='product-title')
            price_el = card.find(class_='price')
            stock_el = card.find(class_='stock')

            title = title_el.get_text(strip=True) if title_el else "Unknown Product"
            price = price_el.get_text(strip=True) if price_el else "N/A"
            stock = stock_el.get_text(strip=True) if stock_el else "N/A"

            print(f"  [{idx}] {title:<36} {GREEN}{price:>10}{RESET}   ({stock})")

        print("-" * 70)
        print(f"{GREEN}{BOLD}SCRAPE STATUS: SUCCESS (8/8 real prices extracted){RESET}")
        print(f"{YELLOW}Vulnerability: Target site uses static CSS classes.{RESET}\n")
        return True

    # CASE 2: GHOSTDOM IS ACTIVE (Scraper Fails / Trapped)
    else:
        print(f"\n{RED}{BOLD}[!] DEFENSE ACTIVATED: GhostDOM Polymorphic Mutation Detected{RESET}")
        print(f"{RED}[!] Fixed selectors '.product-card' and '.price' neutralized.{RESET}")

        if honeypot_triggered:
            trap_node = honeypot_elements[0]
            fake_price = trap_node.select_one('.price')
            fake_title = trap_node.select_one('.product-title')
            trap_link = trap_node.select_one('a[href*="/honeypot/trap"]')

            fake_price_val = fake_price.get_text(strip=True) if fake_price else "$0.00"
            fake_title_val = fake_title.get_text(strip=True) if fake_title else "Bait Product"
            
            print(f"\n{YELLOW}[!] HONEYPOT BAIT TRIGGERED:{RESET}")
            print(f"    - Extracted Fake Bait Title: {fake_title_val}")
            print(f"    - Extracted Fake Price:      {RED}{fake_price_val}{RESET} (Decoy Trap)")

            if trap_link and follow_honeypots:
                trap_url = urljoin(target_url, trap_link['href'])
                print(f"    - Automated crawler following bait link: {trap_url}")
                try:
                    trap_res = requests.get(trap_url, headers=headers, timeout=5)
                    print(f"    - Honeypot Response: {RED}HTTP {trap_res.status_code} (BOT FLAGGED & BLOCKED){RESET}")
                except Exception as trap_err:
                    print(f"    - Honeypot connection response: {trap_err}")

        print(f"\n{RED}{BOLD}{'='*70}{RESET}")
        print(f"{RED}{BOLD}SCRAPE STATUS: FAILED (0 legitimate prices extracted){RESET}")
        print(f"{RED}Crawler neutralized and IP logged to GhostDOM Bot Blocklist.{RESET}")
        print(f"{CYAN}{'='*70}{RESET}\n")
        return False

def main():
    parser = argparse.ArgumentParser(description="GhostDOM Naive Scraper Demo")
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
