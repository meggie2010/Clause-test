# Dashboard Setup Guide

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it something like "Clarity Finance Dashboard"

## Step 2: Add the Apps Script

1. In your new spreadsheet, go to **Extensions > Apps Script**
2. Delete any code already in the editor
3. Copy and paste the entire contents of `apps-script.js` into the editor
4. Click the **Save** icon (or Ctrl+S)
5. Close the Apps Script tab and **reload your spreadsheet**
6. A new **"Clarity Finance"** menu will appear in the menu bar

## Step 3: Initialize the Sheets

1. Click **Clarity Finance > Setup Sheets (First Time)**
2. Google will ask you to authorize the script — click through the permissions
3. This creates 4 sheets:
   - **Transactions** — where your imported data lives
   - **Budget** — your monthly budget per category (pre-filled with common categories)
   - **Monthly Summary** — auto-generated breakdown by category and month
   - **Spending Gauge** — overall monthly totals for the gauge/speedometer visual

## Step 4: Set Your Budgets

1. Go to the **Budget** sheet
2. Adjust the dollar amounts to match your actual monthly budget per category
3. Add or remove categories as needed (these should match your Rocket Money categories)

## Step 5: Import Your Rocket Money CSV

1. In Rocket Money, export your transactions as CSV
2. In the spreadsheet, click **Clarity Finance > Import CSV File**
3. Select your CSV file and click **Import**
4. The script extracts Date, Amount, and Category and adds them to the Transactions sheet
5. The Monthly Summary and Spending Gauge sheets update automatically

You can import multiple CSV files — new data is appended, not overwritten.

## Step 6: Connect Looker Studio

1. Go to [lookerstudio.google.com](https://lookerstudio.google.com)
2. Click **Create > Report**
3. Choose **Google Sheets** as your data source
4. Select your "Clarity Finance Dashboard" spreadsheet

### Data sources to add:

You'll want to add these sheets as separate data sources:

| Data Source | Sheet Name | Used For |
|---|---|---|
| Transactions | Transactions | Raw data, trend charts |
| Monthly Summary | Monthly Summary | Category breakdown, budget vs. actual |
| Spending Gauge | Spending Gauge | Gauge/speedometer visual |

### Recommended Looker Studio charts:

**Page 1: Monthly Overview**
- **Gauge chart** — Connect to "Spending Gauge" sheet. Metric: `Percent Used`. Set range 0-100, with green/yellow/red zones
- **Scorecard** — Total Spent, Budget Remaining, Projected Spending (from Spending Gauge)
- **Bar chart** — Spending by Category (from Monthly Summary: dimension = Category, metric = Total Spent)

**Page 2: Trends**
- **Time series line chart** — Monthly spending over time (from Transactions: dimension = Month-Year, metric = SUM of Amount)
- **Stacked bar chart** — Category breakdown by month (from Monthly Summary)

**Page 3: Budget vs. Actual**
- **Table** — Category, Budget, Actual, Difference, % Used (from Monthly Summary)
- **Bullet chart or combo chart** — Budget vs. Actual per category

### Gauge/Speedometer Setup in Looker Studio:

1. Add a **Gauge chart**
2. Data source: Spending Gauge sheet
3. Metric: `Percent Used`
4. Set range: Min = 0, Max = 100
5. Color ranges:
   - Green: 0–70 (under budget pace)
   - Yellow: 70–90 (approaching budget)
   - Red: 90–100+ (over budget)

### Filters:

Add a **Month-Year dropdown** filter at the top of your report so users can select which month to view. Connect it to all charts on the page.

## Sheet Descriptions

### Transactions
| Column | Description |
|---|---|
| Date | Transaction date |
| Amount | Transaction amount (always positive) |
| Category | Rocket Money category |
| Month | Month number (1-12) |
| Year | 4-digit year |
| Month-Year | "1/2026" format for filtering |

### Monthly Summary
| Column | Description |
|---|---|
| Month-Year | Period |
| Category | Spending category |
| Total Spent | Sum of transactions for that category/month |
| Monthly Budget | From the Budget sheet |
| Difference | Budget minus spent (negative = over budget) |
| Percent Used | (Spent / Budget) * 100 |
| Day of Month | Current day (for current month) or last day |
| Days in Month | Total days in that month |
| Month Progress % | How far through the month we are |
| Projected Spending | Extrapolated full-month spending based on pace |

### Spending Gauge
| Column | Description |
|---|---|
| Month-Year | Period |
| Total Budget | Sum of all category budgets |
| Total Spent | Sum of all spending |
| Percent Used | Overall budget usage |
| Day of Month | Current day or last day |
| Days in Month | Total days |
| Month Progress % | How far through the month |
| Projected Monthly Spending | On pace to spend this much |
| Budget Remaining | Budget minus spent |
