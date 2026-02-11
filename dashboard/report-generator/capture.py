"""
Looker Studio Screenshot Capture

Captures screenshots of each page in a Looker Studio report.
The report must be set to "Anyone with the link can view" for
this to work without Google authentication.

Usage:
    python capture.py
"""

import json
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright


def load_config():
    config_path = Path(__file__).parent / "config.json"
    with open(config_path) as f:
        return json.load(f)


def capture_report(config):
    """Capture screenshots of each Looker Studio report page."""
    url = config["looker_studio_url"]
    pages = config["report_pages"]
    output_dir = Path(__file__).parent / "screenshots"
    output_dir.mkdir(exist_ok=True)

    if url == "YOUR_LOOKER_STUDIO_REPORT_URL_HERE":
        print("ERROR: Please set your Looker Studio report URL in config.json")
        sys.exit(1)

    print(f"Capturing {len(pages)} pages from Looker Studio...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1400, "height": 900},
            device_scale_factor=2  # High-DPI for crisp screenshots
        )
        page = context.new_page()

        # Load the report
        print(f"Loading report: {url}")
        page.goto(url, wait_until="networkidle", timeout=60000)

        # Wait for Looker Studio to fully render
        time.sleep(5)

        # Dismiss any cookie/consent banners
        try:
            page.click('button:has-text("Accept")', timeout=3000)
            time.sleep(1)
        except Exception:
            pass

        for i, report_page in enumerate(pages):
            name = report_page["name"]
            page_index = report_page["page_index"]

            # Navigate to the specific page if multi-page report
            if page_index > 0:
                # Looker Studio appends /page/pN to the URL
                page_url = f"{url}/page/p{page_index}"
                page.goto(page_url, wait_until="networkidle", timeout=60000)
                time.sleep(4)

            # Hide the Looker Studio toolbar/header for cleaner screenshots
            page.evaluate("""
                () => {
                    // Hide the top toolbar
                    const toolbar = document.querySelector('[data-p="report-toolbar"]');
                    if (toolbar) toolbar.style.display = 'none';
                    // Hide the page navigation tabs
                    const tabs = document.querySelector('[class*="pageTabs"]');
                    if (tabs) tabs.style.display = 'none';
                }
            """)
            time.sleep(1)

            # Capture the report canvas area
            screenshot_path = output_dir / f"{name}.png"
            page.screenshot(path=str(screenshot_path), full_page=False)
            print(f"  Captured: {screenshot_path}")

        browser.close()

    print(f"\nDone! Screenshots saved to: {output_dir}")
    return output_dir


if __name__ == "__main__":
    config = load_config()
    capture_report(config)
