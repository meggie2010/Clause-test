# Report Generator

Automatically captures screenshots from your Looker Studio dashboard and builds a branded PowerPoint deck for fortnightly client readouts.

## Setup

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Playwright browsers

```bash
playwright install chromium
```

### 3. Make your Looker Studio report shareable

In Looker Studio:
1. Click **Share** on your report
2. Under "Link settings", set to **"Anyone with the link can view"**
3. Copy the report URL

### 4. Configure

Edit `config.json`:
- Set `looker_studio_url` to your report URL
- Set `client_name` for the default client
- Adjust `report_pages` to match your Looker Studio pages (page 0 = first page, page 1 = second, etc.)
- Customize `brand_colors` if desired

## Usage

### Full pipeline (capture screenshots + build deck):

```bash
python generate_report.py
```

### With options:

```bash
python generate_report.py --client "Sarah M." --date-range "Jan 1 - Jan 15, 2026"
```

### Skip capture (reuse existing screenshots):

```bash
python generate_report.py --skip-capture --client "James T."
```

### Individual steps:

```bash
# Just capture screenshots
python capture.py

# Just build the deck (screenshots must exist)
python build_deck.py --client "Sarah M."
```

## Output

Reports are saved to the `output/` folder:
```
output/Financial_Review_Sarah_M_2026-02-11.pptx
```

## Slide Deck Structure

1. **Title Slide** — Business branding, date range, client name
2. **Spending Overview** — Overall dashboard with gauge
3. **Category Breakdown** — Spending by category
4. **Budget vs. Actual** — Budget comparison
5. **Spending Trends** — Spending over time
6. **Key Insights & Next Steps** — Placeholder for recommendations (AI-powered in a future update)
7. **Closing Slide** — Thank you with contact info

## File Structure

```
report-generator/
├── config.json          # Report & branding settings
├── capture.py           # Screenshot capture (Playwright)
├── build_deck.py        # PowerPoint builder (python-pptx)
├── generate_report.py   # Full pipeline (capture + build)
├── requirements.txt     # Python dependencies
├── screenshots/         # Captured images (auto-created)
└── output/              # Generated PowerPoint files (auto-created)
```
