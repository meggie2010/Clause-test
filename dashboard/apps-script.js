/**
 * Clarity Finance — Google Sheets Dashboard
 *
 * This Apps Script handles:
 * 1. Importing Rocket Money CSV exports (Date, Amount, Category)
 * 2. Maintaining a Transactions log
 * 3. Maintaining a Budget sheet for budget vs. actual comparison
 * 4. Generating monthly summary data for Looker Studio
 *
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire file into the editor (replace any existing code)
 * 4. Click Save, then reload your spreadsheet
 * 5. A "Clarity Finance" menu will appear in the menu bar
 */

// ============================================================
// MENU & INITIALIZATION
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Clarity Finance')
    .addItem('Import CSV File', 'importCSV')
    .addItem('Refresh Monthly Summary', 'refreshMonthlySummary')
    .addSeparator()
    .addItem('Setup Sheets (First Time)', 'setupSheets')
    .addToUi();
}

/**
 * Creates the required sheets with headers if they don't exist.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Transactions sheet ---
  var txSheet = ss.getSheetByName('Transactions');
  if (!txSheet) {
    txSheet = ss.insertSheet('Transactions');
  }
  var txHeaders = ['Date', 'Amount', 'Category', 'Month', 'Year', 'Month-Year'];
  txSheet.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders]);
  txSheet.getRange(1, 1, 1, txHeaders.length)
    .setFontWeight('bold')
    .setBackground('#2b6777')
    .setFontColor('#ffffff');
  txSheet.setFrozenRows(1);

  // --- Budget sheet ---
  var budgetSheet = ss.getSheetByName('Budget');
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet('Budget');
  }
  var budgetHeaders = ['Category', 'Monthly Budget'];
  budgetSheet.getRange(1, 1, 1, budgetHeaders.length).setValues([budgetHeaders]);
  budgetSheet.getRange(1, 1, 1, budgetHeaders.length)
    .setFontWeight('bold')
    .setBackground('#2b6777')
    .setFontColor('#ffffff');
  budgetSheet.setFrozenRows(1);

  // Pre-populate common Rocket Money categories
  var defaultCategories = [
    ['Food & Drink', 500],
    ['Shopping', 200],
    ['Transportation', 150],
    ['Bills & Utilities', 300],
    ['Entertainment', 100],
    ['Health & Wellness', 100],
    ['Groceries', 400],
    ['Subscriptions', 50],
    ['Travel', 200],
    ['Personal Care', 75],
    ['Education', 50],
    ['Home', 150],
    ['Other', 100]
  ];

  // Only populate if the budget sheet is empty (beyond headers)
  if (budgetSheet.getLastRow() <= 1) {
    budgetSheet.getRange(2, 1, defaultCategories.length, 2).setValues(defaultCategories);
  }

  // Format budget amount column as currency
  budgetSheet.getRange(2, 2, budgetSheet.getLastRow(), 1).setNumberFormat('$#,##0.00');

  // --- Monthly Summary sheet ---
  var summarySheet = ss.getSheetByName('Monthly Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Monthly Summary');
  }
  var summaryHeaders = [
    'Month-Year', 'Category', 'Total Spent', 'Monthly Budget',
    'Difference', 'Percent Used', 'Day of Month', 'Days in Month',
    'Month Progress %', 'Projected Spending'
  ];
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setValues([summaryHeaders]);
  summarySheet.getRange(1, 1, 1, summaryHeaders.length)
    .setFontWeight('bold')
    .setBackground('#2b6777')
    .setFontColor('#ffffff');
  summarySheet.setFrozenRows(1);

  // --- Spending Gauge sheet (for the speedometer visual) ---
  var gaugeSheet = ss.getSheetByName('Spending Gauge');
  if (!gaugeSheet) {
    gaugeSheet = ss.insertSheet('Spending Gauge');
  }
  var gaugeHeaders = [
    'Month-Year', 'Total Budget', 'Total Spent', 'Percent Used',
    'Day of Month', 'Days in Month', 'Month Progress %',
    'Projected Monthly Spending', 'Budget Remaining'
  ];
  gaugeSheet.getRange(1, 1, 1, gaugeHeaders.length).setValues([gaugeHeaders]);
  gaugeSheet.getRange(1, 1, 1, gaugeHeaders.length)
    .setFontWeight('bold')
    .setBackground('#2b6777')
    .setFontColor('#ffffff');
  gaugeSheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert(
    'Setup complete! You now have 4 sheets:\n\n' +
    '• Transactions — where imported data goes\n' +
    '• Budget — set your monthly budget per category\n' +
    '• Monthly Summary — auto-generated category breakdown\n' +
    '• Spending Gauge — overall spending data for the gauge visual\n\n' +
    'Next: Update your budgets in the Budget sheet, then import a CSV.'
  );
}

// ============================================================
// CSV IMPORT
// ============================================================

/**
 * Prompts the user to upload a Rocket Money CSV and imports
 * Date, Amount, and Category into the Transactions sheet.
 */
function importCSV() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var txSheet = ss.getSheetByName('Transactions');

  if (!txSheet) {
    SpreadsheetApp.getUi().alert(
      'Transactions sheet not found. Please run "Setup Sheets" first.'
    );
    return;
  }

  var html = HtmlService.createHtmlOutput(
    '<style>' +
    'body { font-family: Arial, sans-serif; padding: 20px; }' +
    'h3 { color: #2b6777; }' +
    'input[type="file"] { margin: 16px 0; }' +
    'button { background: #2b6777; color: white; border: none; ' +
    'padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }' +
    'button:hover { background: #1a4a56; }' +
    '#status { margin-top: 12px; color: #666; }' +
    '</style>' +
    '<h3>Import Rocket Money CSV</h3>' +
    '<p>Select your exported CSV file:</p>' +
    '<input type="file" id="csvFile" accept=".csv">' +
    '<br><button onclick="uploadFile()">Import</button>' +
    '<div id="status"></div>' +
    '<script>' +
    'function uploadFile() {' +
    '  var file = document.getElementById("csvFile").files[0];' +
    '  if (!file) { document.getElementById("status").innerText = "Please select a file."; return; }' +
    '  document.getElementById("status").innerText = "Importing...";' +
    '  var reader = new FileReader();' +
    '  reader.onload = function(e) {' +
    '    google.script.run' +
    '      .withSuccessHandler(function(msg) {' +
    '        document.getElementById("status").innerHTML = "<b style=\\"color:green\\">" + msg + "</b>";' +
    '      })' +
    '      .withFailureHandler(function(err) {' +
    '        document.getElementById("status").innerHTML = "<b style=\\"color:red\\">Error: " + err.message + "</b>";' +
    '      })' +
    '      .processCSVData(e.target.result);' +
    '  };' +
    '  reader.readAsText(file);' +
    '}' +
    '</script>'
  )
  .setWidth(420)
  .setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(html, 'Import CSV');
}

/**
 * Processes raw CSV text and appends rows to the Transactions sheet.
 * Extracts: Date, Amount, Category from the Rocket Money export.
 */
function processCSVData(csvText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var txSheet = ss.getSheetByName('Transactions');
  var rows = csvText.split('\n');

  if (rows.length < 2) {
    return 'No data found in CSV.';
  }

  // Parse header row to find column indices
  var headers = parseCSVRow(rows[0]);
  var dateIdx = findColumnIndex(headers, ['date', 'transaction date']);
  var amountIdx = findColumnIndex(headers, ['amount', 'total', 'price']);
  var categoryIdx = findColumnIndex(headers, ['category', 'type']);

  if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    throw new Error(
      'Could not find required columns. Expected: Date, Amount, Category.\n' +
      'Found headers: ' + headers.join(', ')
    );
  }

  var newRows = [];
  var skipped = 0;

  for (var i = 1; i < rows.length; i++) {
    var row = parseCSVRow(rows[i]);
    if (!row || row.length < 3 || !row[dateIdx]) {
      skipped++;
      continue;
    }

    var date = new Date(row[dateIdx].trim());
    if (isNaN(date.getTime())) {
      skipped++;
      continue;
    }

    var amount = parseFloat(row[amountIdx].replace(/[^0-9.\-]/g, ''));
    if (isNaN(amount)) {
      skipped++;
      continue;
    }

    var category = row[categoryIdx].trim();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var monthYear = month + '/' + year;

    newRows.push([date, Math.abs(amount), category, month, year, monthYear]);
  }

  if (newRows.length === 0) {
    return 'No valid rows found in CSV.';
  }

  // Append to Transactions sheet
  var lastRow = txSheet.getLastRow();
  txSheet.getRange(lastRow + 1, 1, newRows.length, 6).setValues(newRows);

  // Format date column
  txSheet.getRange(lastRow + 1, 1, newRows.length, 1).setNumberFormat('yyyy-mm-dd');
  // Format amount column as currency
  txSheet.getRange(lastRow + 1, 2, newRows.length, 1).setNumberFormat('$#,##0.00');

  // Auto-refresh the monthly summary
  refreshMonthlySummary();

  var msg = 'Imported ' + newRows.length + ' transactions.';
  if (skipped > 0) {
    msg += ' (' + skipped + ' rows skipped)';
  }
  return msg;
}

/**
 * Parses a single CSV row, handling quoted fields with commas.
 */
function parseCSVRow(rowText) {
  if (!rowText || rowText.trim() === '') return null;

  var result = [];
  var current = '';
  var inQuotes = false;

  for (var i = 0; i < rowText.length; i++) {
    var ch = rowText[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Finds a column index by checking against multiple possible header names.
 */
function findColumnIndex(headers, possibleNames) {
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toLowerCase().trim();
    for (var j = 0; j < possibleNames.length; j++) {
      if (h === possibleNames[j]) return i;
    }
  }
  return -1;
}

// ============================================================
// MONTHLY SUMMARY & GAUGE DATA
// ============================================================

/**
 * Rebuilds the Monthly Summary and Spending Gauge sheets
 * from the Transactions and Budget data.
 */
function refreshMonthlySummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var txSheet = ss.getSheetByName('Transactions');
  var budgetSheet = ss.getSheetByName('Budget');
  var summarySheet = ss.getSheetByName('Monthly Summary');
  var gaugeSheet = ss.getSheetByName('Spending Gauge');

  if (!txSheet || !budgetSheet || !summarySheet || !gaugeSheet) {
    SpreadsheetApp.getUi().alert('Missing sheets. Please run "Setup Sheets" first.');
    return;
  }

  // Read transactions
  var txData = txSheet.getDataRange().getValues();
  if (txData.length <= 1) return;

  // Read budgets into a lookup
  var budgetData = budgetSheet.getDataRange().getValues();
  var budgets = {};
  for (var b = 1; b < budgetData.length; b++) {
    budgets[budgetData[b][0]] = budgetData[b][1] || 0;
  }

  // Aggregate spending: { "1/2026": { "Food & Drink": 123.45, ... } }
  var spending = {};
  for (var t = 1; t < txData.length; t++) {
    var monthYear = txData[t][5];
    var category = txData[t][2];
    var amount = txData[t][1];

    if (!monthYear || !category) continue;

    if (!spending[monthYear]) spending[monthYear] = {};
    if (!spending[monthYear][category]) spending[monthYear][category] = 0;
    spending[monthYear][category] += amount;
  }

  // Build summary rows
  var today = new Date();
  var currentDay = today.getDate();
  var currentMonth = today.getMonth() + 1;
  var currentYear = today.getFullYear();
  var daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();

  var summaryRows = [];
  var monthYears = Object.keys(spending).sort();

  for (var m = 0; m < monthYears.length; m++) {
    var my = monthYears[m];
    var parts = my.split('/');
    var mm = parseInt(parts[0]);
    var yy = parseInt(parts[1]);
    var daysInMonth = new Date(yy, mm, 0).getDate();
    var isCurrentMonth = (mm === currentMonth && yy === currentYear);
    var dayOfMonth = isCurrentMonth ? currentDay : daysInMonth;

    var categories = Object.keys(spending[my]);
    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      var spent = spending[my][cat];
      var budget = budgets[cat] || 0;
      var diff = budget - spent;
      var pctUsed = budget > 0 ? (spent / budget) * 100 : 0;
      var monthProgress = (dayOfMonth / daysInMonth) * 100;
      var projected = isCurrentMonth && dayOfMonth > 0
        ? (spent / dayOfMonth) * daysInMonth
        : spent;

      summaryRows.push([
        my, cat, spent, budget, diff, pctUsed,
        dayOfMonth, daysInMonth, monthProgress, projected
      ]);
    }
  }

  // Write summary
  summarySheet.getRange(2, 1, summarySheet.getLastRow(), 10).clearContent();
  if (summaryRows.length > 0) {
    summarySheet.getRange(2, 1, summaryRows.length, 10).setValues(summaryRows);
    summarySheet.getRange(2, 3, summaryRows.length, 1).setNumberFormat('$#,##0.00');
    summarySheet.getRange(2, 4, summaryRows.length, 1).setNumberFormat('$#,##0.00');
    summarySheet.getRange(2, 5, summaryRows.length, 1).setNumberFormat('$#,##0.00');
    summarySheet.getRange(2, 6, summaryRows.length, 1).setNumberFormat('0.0"%"');
    summarySheet.getRange(2, 9, summaryRows.length, 1).setNumberFormat('0.0"%"');
    summarySheet.getRange(2, 10, summaryRows.length, 1).setNumberFormat('$#,##0.00');
  }

  // Build gauge data (one row per month — totals across all categories)
  var gaugeRows = [];
  for (var g = 0; g < monthYears.length; g++) {
    var gmy = monthYears[g];
    var gParts = gmy.split('/');
    var gMM = parseInt(gParts[0]);
    var gYY = parseInt(gParts[1]);
    var gDaysInMonth = new Date(gYY, gMM, 0).getDate();
    var gIsCurrentMonth = (gMM === currentMonth && gYY === currentYear);
    var gDayOfMonth = gIsCurrentMonth ? currentDay : gDaysInMonth;

    var totalSpent = 0;
    var totalBudget = 0;
    var cats = Object.keys(spending[gmy]);
    for (var gc = 0; gc < cats.length; gc++) {
      totalSpent += spending[gmy][cats[gc]];
      totalBudget += (budgets[cats[gc]] || 0);
    }

    var gPctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    var gMonthProgress = (gDayOfMonth / gDaysInMonth) * 100;
    var gProjected = gIsCurrentMonth && gDayOfMonth > 0
      ? (totalSpent / gDayOfMonth) * gDaysInMonth
      : totalSpent;
    var gRemaining = totalBudget - totalSpent;

    gaugeRows.push([
      gmy, totalBudget, totalSpent, gPctUsed,
      gDayOfMonth, gDaysInMonth, gMonthProgress,
      gProjected, gRemaining
    ]);
  }

  // Write gauge data
  gaugeSheet.getRange(2, 1, gaugeSheet.getLastRow(), 9).clearContent();
  if (gaugeRows.length > 0) {
    gaugeSheet.getRange(2, 1, gaugeRows.length, 9).setValues(gaugeRows);
    gaugeSheet.getRange(2, 2, gaugeRows.length, 1).setNumberFormat('$#,##0.00');
    gaugeSheet.getRange(2, 3, gaugeRows.length, 1).setNumberFormat('$#,##0.00');
    gaugeSheet.getRange(2, 4, gaugeRows.length, 1).setNumberFormat('0.0"%"');
    gaugeSheet.getRange(2, 7, gaugeRows.length, 1).setNumberFormat('0.0"%"');
    gaugeSheet.getRange(2, 8, gaugeRows.length, 1).setNumberFormat('$#,##0.00');
    gaugeSheet.getRange(2, 9, gaugeRows.length, 1).setNumberFormat('$#,##0.00');
  }
}
